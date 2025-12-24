// Real Market Data Fetcher - Uses public APIs to get REAL forex prices
// Then generates realistic M5 candles from those prices

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Map symbols to currency pairs for price fetching
const pairMap: Record<string, { base: string; quote: string }> = {
  'EUR/USD': { base: 'EUR', quote: 'USD' },
  'GBP/USD': { base: 'GBP', quote: 'USD' },
  'USD/JPY': { base: 'USD', quote: 'JPY' },
  'EUR/JPY': { base: 'EUR', quote: 'JPY' },
  'AUD/USD': { base: 'AUD', quote: 'USD' },
  'USD/CHF': { base: 'USD', quote: 'CHF' },
  'NZD/USD': { base: 'NZD', quote: 'USD' },
  'GBP/JPY': { base: 'GBP', quote: 'JPY' },
  'CAD/JPY': { base: 'CAD', quote: 'JPY' },
  'AUD/JPY': { base: 'AUD', quote: 'JPY' },
};

async function getCurrentRealPrice(symbol: string): Promise<number | null> {
  const pair = pairMap[symbol];
  if (!pair) return null;

  try {
    // Use exchangerate-api.com free tier (1500 requests/month free)
    const response = await fetch(
      `https://api.exchangerate.host/latest?base=${pair.base}&symbols=${pair.quote}`,
      { timeout: 5000 }
    );
    
    if (!response.ok) throw new Error('API error');
    
    const data: any = await response.json();
    const rate = data?.rates?.[pair.quote];
    
    if (rate && typeof rate === 'number') {
      console.log(`✅ REAL PRICE ${symbol}: ${rate}`);
      return rate;
    }
  } catch (error) {
    console.warn(`Could not fetch real price for ${symbol}: ${error}`);
  }
  
  return null;
}

export async function getM5CandlesWithRealData(symbol: string, count: number = 26): Promise<CandleData[]> {
  console.log(`🌍 Fetching REAL market data for ${symbol}...`);
  
  // Try to get current real price
  let basePrice = await getCurrentRealPrice(symbol);
  
  // Fallback to known recent prices if API fails
  if (!basePrice) {
    const fallbackPrices: Record<string, number> = {
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2630,
      'USD/JPY': 151.20,
      'EUR/JPY': 163.82,
      'AUD/USD': 0.6490,
      'USD/CHF': 0.8750,
      'NZD/USD': 0.5950,
      'GBP/JPY': 191.50,
      'CAD/JPY': 113.20,
      'AUD/JPY': 98.45,
    };
    basePrice = fallbackPrices[symbol] || 100;
    console.log(`⚠️ Using fallback price for ${symbol}: ${basePrice}`);
  }

  const candles: CandleData[] = [];
  let currentPrice = basePrice;
  const now = Date.now();

  // Generate realistic M5 candles with clear market structure
  // Alternate between uptrends and downtrends to create market volatility
  const cycleLength = 8; // 8 candles per cycle (40 minutes)
  const overallTrend = Math.random() > 0.5 ? 1 : -1; // Global trend
  
  for (let i = count; i > 0; i--) {
    const timestamp = Math.floor((now - i * 5 * 60 * 1000) / 1000);
    
    // Local trend: alternates every 4 candles for wave structure
    const localTrendPhase = Math.floor((count - i) / 4);
    const localTrend = (localTrendPhase % 2) === 0 ? 1 : -1;
    
    // Combined trend strength
    const trendStrength = 0.0004 * overallTrend + 0.0003 * localTrend;
    const volatility = 0.0005;

    // Directional movement
    const directionMove = trendStrength * currentPrice;
    const randomNoise = (Math.random() - 0.5) * volatility * currentPrice;
    const change = directionMove + randomNoise;

    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.abs(change) * 0.8;
    const low = Math.min(open, close) - Math.abs(change) * 0.5;

    candles.push({
      timestamp,
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume: Math.floor(Math.random() * 2000 + 800),
    });

    currentPrice = close;
  }

  console.log(`✅ Generated ${candles.length} realistic M5 candles for ${symbol}`);
  return candles;
}
