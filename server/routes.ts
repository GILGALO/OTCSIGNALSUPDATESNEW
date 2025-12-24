import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { createPocketOptionClient } from "./pocket-option";
import { createTelegramService } from "./telegram";
import { analyzeCandles, generateSignalFromTechnicals } from "./technical-analysis";
import { addMinutes, addSeconds } from "date-fns";
import { z } from "zod";
import { scheduleSignalSend, getSignalSendTime } from "./signal-scheduler";

// Request validation schemas
const generateSignalSchema = z.object({
  symbol: z.string().min(1),
  ssid: z.string().min(1),
  telegramToken: z.string().optional(),
  channelId: z.string().optional(),
});

const validateSSIDSchema = z.object({
  ssid: z.string().min(1),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Validate SSID and get current price
  app.post("/api/validate-ssid", async (req, res) => {
    try {
      const { ssid } = validateSSIDSchema.parse(req.body);
      const client = createPocketOptionClient(ssid);
      const isValid = await client.validateSSID();
      
      if (isValid) {
        const price = await client.getCurrentPrice("EUR/USD");
        res.json({ valid: true, price });
      } else {
        res.status(400).json({ valid: false, error: "Invalid SSID" });
      }
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Generate trading signal
  app.post("/api/generate-signal", async (req, res) => {
    try {
      const { symbol, ssid, telegramToken, channelId } = generateSignalSchema.parse(req.body);

      // Fetch M5 candles (last 50 for analysis, 2 sets: last 10 = 50 min window, another 50 before that for extended analysis)
      const client = createPocketOptionClient(ssid);
      const candles = await client.getM5Candles(symbol, 100);

      if (candles.length < 26) {
        return res.status(400).json({ error: "Insufficient candle data" });
      }

      // Store candles in database
      const candleObjects = candles.slice(-50).map(c => ({
        symbol,
        timeframe: "M5",
        openTime: new Date(c.timestamp * 1000),
        closeTime: addMinutes(new Date(c.timestamp * 1000), 5),
        open: c.open.toString(),
        high: c.high.toString(),
        low: c.low.toString(),
        close: c.close.toString(),
        volume: c.volume.toString(),
      }));

      // Insert candles (avoid duplicates by checking if exists)
      for (const candle of candleObjects) {
        try {
          await storage.createCandle(candle);
        } catch (err) {
          // Ignore duplicate errors
        }
      }

      // Analyze the last 50 candles (10-minute window for M5)
      const analysisCandles = candles.slice(-50).map(c => ({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));

      const metrics = analyzeCandles(analysisCandles);
      const currentPrice = candles[candles.length - 1].close;
      const { type, confidence } = generateSignalFromTechnicals(metrics, currentPrice);

      if (type === "WAIT") {
        return res.json({ signal: null, message: "No strong signal detected" });
      }

      // Calculate entry, SL, TP
      const slippage = 0.15;
      const profitTarget = 0.30;
      const entryPrice = currentPrice;
      const stopLoss = type === "CALL" 
        ? entryPrice - slippage 
        : entryPrice + slippage;
      const takeProfit = type === "CALL" 
        ? entryPrice + profitTarget 
        : entryPrice - profitTarget;

      const now = new Date();
      const analysisStartTime = addMinutes(now, -10);
      const analysisEndTime = now;
      const entryTime = addMinutes(now, 5);
      const expiryTime = addMinutes(entryTime, 5);

      // Create signal
      const signal = await storage.createSignal({
        symbol,
        signalType: type,
        confidence,
        entryPrice: entryPrice.toString(),
        stopLoss: stopLoss.toString(),
        takeProfit: takeProfit.toString(),
        analysisStartTime,
        analysisEndTime,
        entryTime,
        expiryTime,
        technicals: JSON.stringify(metrics),
      });

      // Schedule Telegram send for 2 minutes before next M5 candle
      let telegramResult: { success: boolean; messageId?: string; error?: string; scheduled?: boolean; scheduledSendTime?: string } = { success: false };
      let scheduledSendTime: Date | null = null;

      if (telegramToken && channelId) {
        const signalPayload = {
          symbol,
          signalType: type,
          confidence,
          entryPrice,
          stopLoss,
          takeProfit,
          startTime: analysisStartTime,
          endTime: analysisEndTime,
          technicals: {
            rsi: metrics.rsi,
            trend: metrics.trend,
            momentum: metrics.momentum,
            macdHistogram: metrics.macdHistogram,
            sma20: metrics.sma20,
            sma50: metrics.sma50,
            ema12: metrics.ema12,
            ema26: metrics.ema26,
            stochasticK: metrics.stochasticK,
            stochasticD: metrics.stochasticD,
            adx: metrics.adx,
          },
        };

        // Schedule the telegram send callback
        const sendCallback = async (signalId: string, sendTime: Date) => {
          try {
            const telegram = createTelegramService(telegramToken, channelId);
            const result = await telegram.sendSignal(signalPayload);
            if (result.success && result.messageId) {
              await storage.updateSignalTelegram(signalId, result.messageId);
              console.log(`[TELEGRAM] Signal ${signalId} sent successfully at ${sendTime.toISOString()}`);
            }
          } catch (error) {
            console.error(`[TELEGRAM ERROR] Failed to send signal ${signalId}:`, error);
          }
        };

        // Schedule the signal
        const { sendTime, isImmediate } = scheduleSignalSend(
          signal.id,
          signalPayload,
          telegramToken,
          channelId,
          sendCallback
        );

        scheduledSendTime = sendTime;
        telegramResult = {
          success: true,
          scheduled: !isImmediate,
          scheduledSendTime: sendTime.toISOString(),
        };
      }

      res.json({
        signal: {
          id: signal.id,
          type,
          confidence,
          entryPrice,
          stopLoss,
          takeProfit,
          entryTime,
          expiryTime,
          technicals: metrics,
          scheduledSendTime,
        },
        telegram: telegramResult,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // Get recent signals
  app.get("/api/signals/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      
      const signals = await storage.getRecentSignals(symbol, limit);
      
      res.json({
        signals: signals.map(s => ({
          id: s.id,
          symbol: s.symbol,
          type: s.signalType,
          confidence: s.confidence,
          entryPrice: parseFloat(s.entryPrice),
          stopLoss: parseFloat(s.stopLoss),
          takeProfit: parseFloat(s.takeProfit),
          entryTime: s.entryTime,
          expiryTime: s.expiryTime,
          technicals: s.technicals ? JSON.parse(s.technicals as string) : null,
          createdAt: s.createdAt,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch signals" });
    }
  });

  return httpServer;
}
