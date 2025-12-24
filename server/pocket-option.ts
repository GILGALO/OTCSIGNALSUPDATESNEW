// Pocket Option API Client - Real Live Market Data via Browser Automation

import { getPocketOptionBrowserClient } from './pocket-option-browser';

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PocketOptionClient {
  private ssid: string;

  constructor(ssid: string) {
    this.ssid = ssid;
  }

  async getM5Candles(symbol: string, count: number = 50): Promise<CandleData[]> {
    try {
      console.log(`🔄 Fetching real market data for ${symbol}...`);
      const client = await getPocketOptionBrowserClient(this.ssid);
      const candles = await client.getM5Candles(symbol, count);
      
      if (candles.length > 0) {
        console.log(`✅ Got ${candles.length} real candles for ${symbol}`);
      }
      
      return candles;
    } catch (error) {
      console.error(`Error fetching candles: ${error}`);
      return [];
    }
  }

  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const candles = await this.getM5Candles(symbol, 1);
      return candles.length > 0 ? candles[0].close : null;
    } catch {
      return null;
    }
  }

  async validateSSID(): Promise<boolean> {
    return !!(this.ssid && this.ssid.length > 5);
  }

  close() {
    // Browser client is global and persists
  }
}

export function createPocketOptionClient(ssid: string): PocketOptionClient {
  return new PocketOptionClient(ssid);
}
