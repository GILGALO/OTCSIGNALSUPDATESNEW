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
    console.log(`🔄 Fetching REAL market data for ${symbol}...`);
    const client = await getPocketOptionBrowserClient(this.ssid);
    const candles = await client.getM5Candles(symbol, count);
    
    if (candles.length > 0) {
      console.log(`✅ Got ${candles.length} REAL candles for ${symbol}`);
      return candles;
    }
    
    throw new Error(`Failed to fetch market data for ${symbol}`);
  }

  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const candles = await this.getM5Candles(symbol, 1);
      return candles.length > 0 ? candles[0].close : null;
    } catch (error) {
      throw error;
    }
  }

  async validateSSID(): Promise<boolean> {
    if (!this.ssid || this.ssid.length < 5) {
      console.log('❌ SSID too short');
      return false;
    }
    
    // Validate SSID format
    const ssidRegex = /^[a-zA-Z0-9_-]{10,50}$/;
    if (!ssidRegex.test(this.ssid)) {
      console.log('❌ SSID format invalid');
      return false;
    }
    
    try {
      console.log('🔐 Validating SSID by fetching real market data...');
      const price = await this.getCurrentPrice('EUR/USD');
      if (price && price > 0) {
        console.log(`✅ SSID Valid! Current price: ${price}`);
        return true;
      }
      console.log('❌ SSID validation failed - no price data');
      return false;
    } catch (error) {
      console.error(`❌ SSID validation error: ${error}`);
      return false;
    }
  }

  close() {
    // Browser client is global and persists
  }
}

export function createPocketOptionClient(ssid: string): PocketOptionClient {
  return new PocketOptionClient(ssid);
}
