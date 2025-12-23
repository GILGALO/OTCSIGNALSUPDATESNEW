
import { type User, type InsertUser, users, candles, signals, type Candle, type InsertCandle, type Signal, type InsertSignal } from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Candles
  createCandle(candle: InsertCandle): Promise<Candle>;
  getLastCandle(symbol: string, timeframe: string): Promise<Candle | undefined>;
  getCandlesBefore(symbol: string, timeframe: string, beforeTime: Date, limit: number): Promise<Candle[]>;
  
  // Signals
  createSignal(signal: InsertSignal): Promise<Signal>;
  getSignalById(id: string): Promise<Signal | undefined>;
  getRecentSignals(symbol: string, limit: number): Promise<Signal[]>;
  updateSignalTelegram(id: string, messageId: string): Promise<Signal>;
}

class PostgresStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db
      .insert(users)
      .values(insertUser)
      .returning();
    return result[0];
  }

  async createCandle(candle: InsertCandle): Promise<Candle> {
    const result = await this.db
      .insert(candles)
      .values(candle)
      .returning();
    return result[0];
  }

  async getLastCandle(symbol: string, timeframe: string): Promise<Candle | undefined> {
    const result = await this.db
      .select()
      .from(candles)
      .where(and(eq(candles.symbol, symbol), eq(candles.timeframe, timeframe)))
      .orderBy(desc(candles.closeTime))
      .limit(1);
    return result[0];
  }

  async getCandlesBefore(symbol: string, timeframe: string, beforeTime: Date, limit: number): Promise<Candle[]> {
    const result = await this.db
      .select()
      .from(candles)
      .where(
        and(
          eq(candles.symbol, symbol),
          eq(candles.timeframe, timeframe),
          sql`${candles.closeTime} <= ${beforeTime}`
        )
      )
      .orderBy(desc(candles.closeTime))
      .limit(limit);
    return result;
  }

  async createSignal(signal: InsertSignal): Promise<Signal> {
    const result = await this.db
      .insert(signals)
      .values(signal)
      .returning();
    return result[0];
  }

  async getSignalById(id: string): Promise<Signal | undefined> {
    const result = await this.db.select().from(signals).where(eq(signals.id, id));
    return result[0];
  }

  async getRecentSignals(symbol: string, limit: number): Promise<Signal[]> {
    const result = await this.db
      .select()
      .from(signals)
      .where(eq(signals.symbol, symbol))
      .orderBy(desc(signals.createdAt))
      .limit(limit);
    return result;
  }

  async updateSignalTelegram(id: string, messageId: string): Promise<Signal> {
    const result = await this.db
      .update(signals)
      .set({ telegramMessageId: messageId, telegramSent: 1 })
      .where(eq(signals.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();

import { sql } from "drizzle-orm";
