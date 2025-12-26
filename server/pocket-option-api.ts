// Direct Pocket Option API client - bypasses browser for faster, more reliable data fetching

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class PocketOptionAPIClient {
  private ssid: string;

  constructor(ssid: string) {
    this.ssid = ssid;
  }

  async getM5Candles(symbol: string, count: number = 50): Promise<CandleData[]> {
    try {
      console.log(`🔗 [API] Direct API request for ${symbol} (${count} candles)...`);
      
      // Convert symbol format: EUR/USD -> EURUSD
      const apiSymbol = symbol.replace('/', '');
      
      // Common Pocket Option API endpoints for OTC candles
      const endpoints = [
        `https://api.pocketoption.com/api/v1/otc-instruments/${apiSymbol}/quotes?count=${count}&period=300`,
        `https://api.pocketoption.com/api/v1/quotes/${apiSymbol}?period=300&count=${count}`,
        `https://api.pocketoption.com/api/quotes/${apiSymbol}?period=300&count=${count}`,
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`   Trying: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${this.ssid}`,
              'Cookie': `POAPI_SESSION=${this.ssid}`,
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json() as any;
            const candles = this.extractCandlesFromAPIResponse(data);
            
            if (candles.length > 0) {
              console.log(`✅ [API] Got ${candles.length} candles from ${endpoint}`);
              return candles.slice(-count);
            }
          }
        } catch (e) {
          // Try next endpoint
          console.log(`   Failed: ${String(e).slice(0, 50)}`);
        }
      }

      throw new Error('All API endpoints exhausted');
    } catch (error) {
      console.error(`❌ [API] Direct API failed:`, error);
      throw error;
    }
  }

  private extractCandlesFromAPIResponse(data: any): CandleData[] {
    if (!data) return [];

    // Try various response structures
    let candleArray = 
      data?.data?.candles ||
      data?.candles ||
      data?.history ||
      data?.quotes ||
      data?.bars ||
      data?.ohlc ||
      (Array.isArray(data) ? data : null);

    if (!Array.isArray(candleArray)) {
      return [];
    }

    return candleArray
      .map((c: any) => ({
        timestamp: Math.floor((c.time || c.timestamp || c.t || Date.now()) / (c.time && c.time > 1e10 ? 1000 : 1)),
        open: parseFloat(c.open || c.o || c.Open || 0),
        high: parseFloat(c.high || c.h || c.High || 0),
        low: parseFloat(c.low || c.l || c.Low || 0),
        close: parseFloat(c.close || c.c || c.Close || 0),
        volume: parseFloat(c.volume || c.v || c.Volume || 5000),
      }))
      .filter(c => c.open > 0 && c.close > 0 && c.high > 0 && c.low > 0);
  }

  async getCurrentPrice(symbol: string): Promise<number | null> {
    try {
      const candles = await this.getM5Candles(symbol, 1);
      return candles.length > 0 ? candles[0].close : null;
    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }
}

export function createPocketOptionAPIClient(ssid: string): PocketOptionAPIClient {
  return new PocketOptionAPIClient(ssid);
}
