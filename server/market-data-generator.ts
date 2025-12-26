// Realistic market data generator for demo mode
// Generates OHLC candles with real market behavior patterns

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const SYMBOL_PRICES: Record<string, { base: number; volatility: number }> = {
  "EUR/USD": { base: 1.0850, volatility: 0.0015 },
  "GBP/USD": { base: 1.2650, volatility: 0.0018 },
  "USD/JPY": { base: 149.50, volatility: 0.35 },
  "USD/CHF": { base: 0.8950, volatility: 0.0012 },
  "AUD/USD": { base: 0.6680, volatility: 0.0016 },
  "BTC/USD": { base: 42500, volatility: 850 },
  "GOLD": { base: 2050, volatility: 15 },
  "OIL": { base: 78, volatility: 1.2 },
};

export function generateRealisticCandles(
  symbol: string,
  count: number = 26
): CandleData[] {
  const symbolConfig = SYMBOL_PRICES[symbol] || { base: 1.0, volatility: 0.01 };
  const basePrice = symbolConfig.base;
  const volatility = symbolConfig.volatility;

  const candles: CandleData[] = [];
  let currentPrice = basePrice;
  
  const now = Date.now();
  const fiveMinutesMs = 5 * 60 * 1000;

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = Math.floor((now - i * fiveMinutesMs) / 1000);

    // Realistic price movement with trend and random walk
    const trendBias = Math.sin(i / 10) * 0.0005;
    const randomMove = (Math.random() - 0.5) * volatility;
    const priceChange = trendBias + randomMove;

    const open = currentPrice;
    const close = open * (1 + priceChange);
    
    // High and low with realistic range (typically 0.5-1.5x the move)
    const range = Math.abs(close - open) * (1 + Math.random() * 0.5);
    const high = Math.max(open, close) + range * 0.3;
    const low = Math.min(open, close) - range * 0.3;

    // Volume with realistic patterns (higher during trending moves)
    const volume = Math.floor(5000 + Math.abs(priceChange) * 50000);

    candles.push({
      timestamp,
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export function generateDemoM5Candles(
  symbol: string,
  count: number = 26
): CandleData[] {
  console.log(`📊 [DEMO MODE] Generating ${count} realistic demo candles for ${symbol}...`);
  return generateRealisticCandles(symbol, count);
}
