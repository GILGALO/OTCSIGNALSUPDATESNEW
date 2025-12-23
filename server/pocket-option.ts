// Pocket Option API Client

interface PocketOptionCandle {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

interface PocketOptionResponse {
  status: number;
  data?: {
    candles?: PocketOptionCandle[];
  };
}

export class PocketOptionClient {
  private ssid: string;
  private baseUrl = 'https://api.pocket-option.com';

  constructor(ssid: string) {
    this.ssid = ssid;
  }

  async getM5Candles(symbol: string, count: number = 50): Promise<Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/candles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.ssid}`,
        },
        body: JSON.stringify({
          asset: symbol,
          timeframe: 300, // M5 = 300 seconds
          count: count,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = (await response.json()) as PocketOptionResponse;
      
      if (!data.data?.candles) {
        return [];
      }

      return data.data.candles.map((c: PocketOptionCandle) => ({
        timestamp: c.t,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
        volume: c.v,
      }));
    } catch (error) {
      console.error('Error fetching candles from Pocket Option:', error);
      return [];
    }
  }

  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const candles = await this.getM5Candles(symbol, 1);
      if (candles.length > 0) {
        return candles[0].close;
      }
      return null;
    } catch (error) {
      console.error('Error fetching current price:', error);
      return null;
    }
  }

  // Validate SSID by attempting a simple API call
  async validateSSID(): Promise<boolean> {
    try {
      const candles = await this.getM5Candles('EUR/USD', 1);
      return candles.length > 0;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance factory
export function createPocketOptionClient(ssid: string): PocketOptionClient {
  return new PocketOptionClient(ssid);
}
