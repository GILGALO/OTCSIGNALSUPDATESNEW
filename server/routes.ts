import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { createPocketOptionClient } from "./pocket-option";
import { createTelegramService } from "./telegram";
import { analyzeCandles, generateSignalFromTechnicals } from "./technical-analysis";
import { addMinutes, addSeconds } from "date-fns";
import { z } from "zod";
import { scheduleSignalSend, getSignalSendTime, calculateM5CandleEntryTime } from "./signal-scheduler";

// Request validation schemas
const generateSignalSchema = z.object({
  symbol: z.string().min(1),
  ssid: z.string().min(1),
  source: z.enum(["AUTO", "MANUAL"]).default("AUTO"),
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
      const { symbol, ssid, source, telegramToken, channelId } = generateSignalSchema.parse(req.body);

      // Fetch minimal M5 candles for fast analysis (only 30 for speed)
      const client = createPocketOptionClient(ssid);
      const candles = await client.getM5Candles(symbol, 30);

      if (candles.length < 26) {
        return res.status(400).json({ error: "Insufficient candle data" });
      }

      // Store candles in database (skip storage for speed - data already in Pocket Option)
      const candleObjects = candles.slice(-20).map(c => ({
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

      // Insert candles (skip to save time)
      for (const candle of candleObjects) {
        try {
          await storage.createCandle(candle);
        } catch (err) {
          // Ignore duplicate errors
        }
      }

      // Analyze only the last 30 candles for faster processing
      const analysisCandles = candles.slice(-30).map(c => ({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));

      const metrics = analyzeCandles(analysisCandles);
      const currentPrice = candles[candles.length - 1].close;
      const { type, confidence } = generateSignalFromTechnicals(metrics, currentPrice);

      // Minimum accuracy threshold - no signals below 75% confidence
      const MINIMUM_CONFIDENCE_THRESHOLD = 75;
      
      if (type === "WAIT" || confidence < MINIMUM_CONFIDENCE_THRESHOLD) {
        return res.json({ 
          signal: null, 
          message: `No strong signal detected (confidence: ${confidence}%, minimum required: ${MINIMUM_CONFIDENCE_THRESHOLD}%)`,
          confidence,
          minimumRequired: MINIMUM_CONFIDENCE_THRESHOLD
        });
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
      
      // Entry time: next M5 candle (guaranteed 2+ minutes away)
      const entryTime = calculateM5CandleEntryTime();
      const expiryTime = addMinutes(entryTime, 5);

      // Create signal
      const signal = await storage.createSignal({
        symbol,
        signalType: type,
        source,
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

      // Schedule Telegram send: exactly 2 minutes before entry
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
          startTime: entryTime,
          endTime: expiryTime,
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
            console.log(`[TELEGRAM] Sending signal ${signalId} at ${sendTime.toISOString()}`);
            const result = await telegram.sendSignal(signalPayload);
            if (result.success && result.messageId) {
              await storage.updateSignalTelegram(signalId, result.messageId);
              console.log(`[TELEGRAM] ✅ Signal ${signalId} sent (msg: ${result.messageId})`);
            } else {
              console.error(`[TELEGRAM] Signal ${signalId} failed: ${result.error}`);
            }
          } catch (error) {
            console.error(`[TELEGRAM] Error on ${signalId}:`, error);
            throw error;
          }
        };

        // Send signal IMMEDIATELY when generated, regardless of time to entry
        try {
          const telegram = createTelegramService(telegramToken, channelId);
          console.log(`[TELEGRAM] Sending signal ${signal.id} IMMEDIATELY (generated just now)`);
          const result = await telegram.sendSignal(signalPayload);
          if (result.success && result.messageId) {
            await storage.updateSignalTelegram(signal.id, result.messageId);
            console.log(`[TELEGRAM] ✅ Signal ${signal.id} sent immediately (msg: ${result.messageId})`);
            telegramResult = {
              success: true,
              messageId: result.messageId,
              scheduled: false,
            };
          } else {
            console.error(`[TELEGRAM] Signal ${signal.id} failed: ${result.error}`);
            telegramResult = {
              success: false,
              error: result.error,
            };
          }
        } catch (error) {
          console.error(`[TELEGRAM] Exception sending signal ${signal.id}:`, error);
          telegramResult = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
        
        scheduledSendTime = new Date();
      }

      res.json({
        signal: {
          id: signal.id,
          type,
          source,
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
          source: s.source,
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
