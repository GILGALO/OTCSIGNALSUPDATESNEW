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
  ssid: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  source: z.enum(["AUTO", "MANUAL"]).default("AUTO"),
  telegramToken: z.string().optional(),
  channelId: z.string().optional(),
});

const validateSSIDSchema = z.object({
  ssid: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
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
      const { ssid, email, password } = validateSSIDSchema.parse(req.body);
      const displaySSID = ssid ? `${ssid.substring(0, 3)}...${ssid.substring(ssid.length - 3)}` : "None";
      console.log(`🔐 Validating Access (SSID: ${displaySSID}, Email: ${email || "None"})`);
      
      const client = createPocketOptionClient(ssid, email, password);
      const isValid = await client.validateSSID();
      
      if (isValid) {
        console.log(`✅ SSID format is valid`);
        try {
          const price = await client.getCurrentPrice("EUR/USD");
          if (price) {
            res.json({ valid: true, price, message: "SSID validated successfully" });
          } else {
            res.json({ valid: true, price: null, message: "SSID format is valid. Market data temporarily unavailable." });
          }
        } catch (priceError) {
          console.log(`⚠️ Could not fetch price: ${priceError}`);
          res.json({ valid: true, price: null, message: "SSID format is valid. Could not fetch current price." });
        }
      } else {
        console.log(`❌ SSID validation failed - invalid format`);
        res.status(400).json({ 
          valid: false, 
          error: "Invalid SSID format. SSID must be alphanumeric, 10-50 characters long." 
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Invalid request";
      res.status(400).json({ error: errorMsg });
    }
  });

  // Track last signal time per symbol for M5 cycle debouncing
  const lastSignalTime = new Map<string, Date>();

  // Generate trading signal
  app.post("/api/generate-signal", async (req, res) => {
    try {
      const { symbol, ssid, email, password, source, telegramToken, channelId } = generateSignalSchema.parse(req.body);
      
      // PREVENT RECURSIVE LOOPS: If this is an AUTO request, ensure we don't trigger another one immediately
      console.log(`🔍 [SIGNAL] Starting scan for ${symbol} (Source: ${source})`);

      // M5 CYCLE DEBOUNCING: Only one signal per M5 candle cycle
      const lastSignal = lastSignalTime.get(symbol);
      const nowMs = Date.now();
      
      if (lastSignal) {
        const timeSinceLastSignal = nowMs - lastSignal.getTime();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        
        if (timeSinceLastSignal < FIVE_MINUTES_MS) {
          const timeRemaining = Math.ceil((FIVE_MINUTES_MS - timeSinceLastSignal) / 1000);
          console.log(`[DEBOUNCE] Skipping signal for ${symbol} - cycle still in cooldown (${timeRemaining}s)`);
          return res.json({ 
            signal: null, 
            message: `Already sent signal for ${symbol} this M5 cycle. Wait ${timeRemaining}s for next cycle.`,
            cooldown: timeRemaining
          });
        }
      }

      // Fetch REAL market data - 26+ candles required
      const client = createPocketOptionClient(ssid, email, password);
      let candles;
      
      try {
        candles = await client.getM5Candles(symbol, 26);
      } catch (dataError) {
        const errorMsg = dataError instanceof Error ? dataError.message : String(dataError);
        console.error(`🚨 REAL DATA FETCH FAILED: ${errorMsg}`);
        return res.status(400).json({ 
          error: "Real market data unavailable",
          details: errorMsg,
          message: "Unable to fetch real market data. Please verify your SSID is valid and Pocket Option is accessible."
        });
      }

      if (candles.length < 26) {
        return res.status(400).json({ 
          error: "Insufficient real market data",
          details: `Only ${candles.length} candles available (need 26+)`,
          message: "Not enough historical data to generate signal. Try again in a few moments."
        });
      }

      // Store last 5 candles for database record (minimal storage)
      const candleObjects = candles.slice(-5).map(c => ({
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

      // Insert candles with error handling
      for (const candle of candleObjects) {
        try {
          await storage.createCandle(candle);
        } catch (err) {
          // Ignore duplicate errors
        }
      }

      // Analyze all 26 candles for maximum accuracy
      const analysisCandles = candles.map(c => ({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));

      const metrics = analyzeCandles(analysisCandles);
      const currentPrice = candles[candles.length - 1].close;
      const { type, confidence } = generateSignalFromTechnicals(metrics, currentPrice);
      console.log(`📊 [SIGNAL] ${symbol}: type=${type}, confidence=${confidence}%, trend=${metrics.trend}, adx=${metrics.adx.toFixed(1)}`);

      // Balanced accuracy threshold - Refined for OTC
      const MINIMUM_CONFIDENCE_THRESHOLD = 70;
      
      if (type === "WAIT") {
        return res.json({ 
          signal: null, 
          message: "No clear directional signal detected. Market is neutral.",
          confidence,
          minimumRequired: MINIMUM_CONFIDENCE_THRESHOLD
        });
      }
      
      if (confidence < MINIMUM_CONFIDENCE_THRESHOLD) {
        return res.json({ 
          signal: null, 
          message: `Signal too weak (${confidence}% < ${MINIMUM_CONFIDENCE_THRESHOLD}% required) - waiting for stronger setup`,
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

      // RECORD THIS SIGNAL TIME FOR M5 CYCLE TRACKING (one signal per cycle)
      lastSignalTime.set(symbol, new Date());

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
              try {
                await storage.updateSignalTelegram(signalId, result.messageId);
                console.log(`[TELEGRAM] ✅ Signal ${signalId} sent (msg: ${result.messageId})`);
              } catch (dbErr) {
                console.warn(`[TELEGRAM] Signal sent but failed to update DB: ${dbErr}`);
              }
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
            try {
              await storage.updateSignalTelegram(signal.id, result.messageId);
              console.log(`[TELEGRAM] ✅ Signal ${signal.id} sent immediately (msg: ${result.messageId})`);
            } catch (dbErr) {
              console.warn(`[TELEGRAM] Signal sent immediately but failed to update DB: ${dbErr}`);
            }
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
