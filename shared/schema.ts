import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Candles table for storing M5 price data
export const candles = pgTable("candles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(), // e.g., AUD/JPY
  timeframe: varchar("timeframe").notNull(), // M5
  openTime: timestamp("open_time").notNull(),
  closeTime: timestamp("close_time").notNull(),
  open: numeric("open", { precision: 20, scale: 8 }).notNull(),
  high: numeric("high", { precision: 20, scale: 8 }).notNull(),
  low: numeric("low", { precision: 20, scale: 8 }).notNull(),
  close: numeric("close", { precision: 20, scale: 8 }).notNull(),
  volume: numeric("volume", { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Signals table for storing generated trading signals
export const signals = pgTable("signals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull(),
  signalType: varchar("signal_type").notNull(), // CALL or PUT
  source: varchar("source").notNull().default("AUTO"), // AUTO or MANUAL
  confidence: integer("confidence").notNull(), // 0-100
  entryPrice: numeric("entry_price", { precision: 20, scale: 8 }).notNull(),
  stopLoss: numeric("stop_loss", { precision: 20, scale: 8 }).notNull(),
  takeProfit: numeric("take_profit", { precision: 20, scale: 8 }).notNull(),
  analysisStartTime: timestamp("analysis_start_time").notNull(),
  analysisEndTime: timestamp("analysis_end_time").notNull(),
  entryTime: timestamp("entry_time").notNull(),
  expiryTime: timestamp("expiry_time").notNull(),
  technicals: jsonb("technicals").notNull(), // RSI, MACD, SMA, EMA, Stochastic, ADX
  telegramMessageId: varchar("telegram_message_id"),
  telegramSent: integer("telegram_sent").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCandleSchema = createInsertSchema(candles).omit({
  id: true,
  createdAt: true,
});

export const insertSignalSchema = createInsertSchema(signals).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Candle = typeof candles.$inferSelect;
export type Signal = typeof signals.$inferSelect;
export type InsertCandle = z.infer<typeof insertCandleSchema>;
export type InsertSignal = z.infer<typeof insertSignalSchema>;

// Manual OTC Price Input Schema
export const manualOTCSignalSchema = z.object({
  symbol: z.string().min(1),
  price: z.number().positive(),
});
