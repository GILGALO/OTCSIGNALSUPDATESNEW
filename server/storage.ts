
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
  private db: any;
  private isConnected: boolean = false;

  constructor() {
    if (process.env.DATABASE_URL) {
      try {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
        
        pool.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
          this.isConnected = false;
        });

        this.db = drizzle(pool);
        this.isConnected = true;
        console.log("✅ Database connected and initialized");
      } catch (error) {
        console.error("❌ Database connection failed:", error);
        this.isConnected = false;
      }
    } else {
      console.warn("⚠️ DATABASE_URL not set, using in-memory storage");
      this.isConnected = false;
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!this.isConnected) return undefined;
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch {
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.isConnected) return undefined;
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return result[0];
    } catch {
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.isConnected) throw new Error("Database not available");
    try {
      const result = await this.db
        .insert(users)
        .values(insertUser)
        .returning();
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async createCandle(candle: InsertCandle): Promise<Candle> {
    if (!this.isConnected) {
      return { ...candle, id: "", createdAt: new Date() } as Candle;
    }
    try {
      const result = await this.db
        .insert(candles)
        .values(candle)
        .returning();
      return result[0];
    } catch (error) {
      console.error("❌ Error creating candle:", error);
      return { ...candle, id: "", createdAt: new Date() } as Candle;
    }
  }

  async getLastCandle(symbol: string, timeframe: string): Promise<Candle | undefined> {
    if (!this.isConnected) return undefined;
    try {
      const result = await this.db
        .select()
        .from(candles)
        .where(and(eq(candles.symbol, symbol), eq(candles.timeframe, timeframe)))
        .orderBy(desc(candles.closeTime))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("❌ Error getting last candle:", error);
      return undefined;
    }
  }

  async getCandlesBefore(symbol: string, timeframe: string, beforeTime: Date, limit: number): Promise<Candle[]> {
    if (!this.isConnected) return [];
    try {
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
    } catch (error) {
      console.error("❌ Error getting candles before:", error);
      return [];
    }
  }

  async createSignal(signal: InsertSignal): Promise<Signal> {
    if (!this.isConnected) {
      return { ...signal, id: "demo-" + Math.random().toString(36).substr(2, 9), createdAt: new Date() } as Signal;
    }
    try {
      const result = await this.db
        .insert(signals)
        .values(signal)
        .returning();
      return result[0];
    } catch (error) {
      console.error("❌ Error creating signal:", error);
      return { ...signal, id: "demo-" + Math.random().toString(36).substr(2, 9), createdAt: new Date() } as Signal;
    }
  }

  async getSignalById(id: string): Promise<Signal | undefined> {
    if (!this.isConnected) return undefined;
    try {
      const result = await this.db.select().from(signals).where(eq(signals.id, id));
      return result[0];
    } catch (error) {
      console.error("❌ Error getting signal by id:", error);
      return undefined;
    }
  }

  async getRecentSignals(symbol: string, limit: number): Promise<Signal[]> {
    if (!this.isConnected) return [];
    try {
      const result = await this.db
        .select()
        .from(signals)
        .where(eq(signals.symbol, symbol))
        .orderBy(desc(signals.createdAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error("❌ Error getting recent signals:", error);
      return [];
    }
  }

  async updateSignalTelegram(id: string, messageId: string): Promise<Signal> {
    if (!this.isConnected) {
      throw new Error("Database not available");
    }
    try {
      const result = await this.db
        .update(signals)
        .set({ telegramMessageId: messageId, telegramSent: 1 })
        .where(eq(signals.id, id))
        .returning();
      return result[0];
    } catch (error) {
      throw error;
    }
  }
}

export const storage = new PostgresStorage();

import { sql } from "drizzle-orm";
