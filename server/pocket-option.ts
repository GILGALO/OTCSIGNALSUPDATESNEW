// Pocket Option API Client with Mock Data Generator

interface PocketOptionCandle {
  t: number; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
}

// Generate realistic market data for testing
function generateRealisticCandles(symbol: string, count: number = 50): PocketOptionCandle[] {
  const basePrices: Record<string, number> = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2630,
    'USD/JPY': 151.20,
    'AUD/JPY': 98.45,
    'EUR/JPY': 163.82,
    'AUD/USD': 0.6490,
    'NZD/USD': 0.5985,
  };

  const basePrice = basePrices[symbol] || 100;
  const candles: PocketOptionCandle[] = [];
  let currentPrice = basePrice;
  const now = Date.now();

  for (let i = count; i > 0; i--) {
    const timestamp = Math.floor((now - i * 5 * 60 * 1000) / 1000); // 5-minute candles
    
    // Generate realistic OHLC data
    const volatility = 0.0005; // 0.05% volatility per candle
    const randomChange = (Math.random() - 0.5) * volatility * currentPrice;
    
    const open = currentPrice;
    const close = open + randomChange;
    const high = Math.max(open, close) + Math.abs(randomChange) * 0.5;
    const low = Math.min(open, close) - Math.abs(randomChange) * 0.3;
    const volume = Math.floor(Math.random() * 1000 + 500);

    candles.push({
      t: timestamp,
      o: parseFloat(open.toFixed(5)),
      h: parseFloat(high.toFixed(5)),
      l: parseFloat(low.toFixed(5)),
      c: parseFloat(close.toFixed(5)),
      v: volume,
    });

    currentPrice = close;
  }

  return candles;
}

export class PocketOptionClient {
  private ssid: string;

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
      // For now, generate realistic mock data
      // In production, replace this with actual API call
      const candles = generateRealisticCandles(symbol, count);
      
      return candles.map((c: PocketOptionCandle) => ({
        timestamp: c.t,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
        volume: c.v,
      }));
    } catch (error) {
      console.error('Error fetching candles from Pocket Option:', error);
      // Return fallback data
      return generateRealisticCandles(symbol, count).map((c: PocketOptionCandle) => ({
        timestamp: c.t,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
        volume: c.v,
      }));
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

  // Validate SSID by checking if it's not empty
  async validateSSID(): Promise<boolean> {
    return !!(this.ssid && this.ssid.length > 5);
  }
}

export function createPocketOptionClient(ssid: string): PocketOptionClient {
  return new PocketOptionClient(ssid);
}
