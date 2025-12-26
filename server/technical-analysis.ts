// Technical Analysis Indicators for M5 Candles

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalMetrics {
  rsi: number;
  macdLine: number;
  macdSignal: number;
  macdHistogram: number;
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  stochasticK: number;
  stochasticD: number;
  adx: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  momentum: 'STRONG' | 'MODERATE' | 'WEAK';
  volumeSignal: 'STRONG' | 'WEAK';
  volatility: number;
  priceLevel: 'SUPPORT' | 'RESISTANCE' | 'NEUTRAL';
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate MACD (Moving Average Convergence Divergence)
export function calculateMACD(closes: number[]): { line: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const line = ema12 - ema26;
  
  const signalLine = calculateEMA([line], 9);
  
  return {
    line,
    signal: signalLine,
    histogram: line - signalLine,
  };
}

// Calculate EMA (Exponential Moving Average)
export function calculateEMA(values: number[], period: number): number {
  if (values.length === 0) return 0;
  
  const k = 2 / (period + 1);
  let ema = values[0];
  
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  
  return ema;
}

// Calculate SMA (Simple Moving Average)
export function calculateSMA(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1];
  
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Calculate Stochastic Oscillator
export function calculateStochastic(
  candles: Candle[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): { k: number; d: number } {
  if (candles.length < period) {
    return { k: 50, d: 50 };
  }
  
  const recentCandles = candles.slice(-period);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  
  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);
  
  const currentClose = candles[candles.length - 1].close;
  const range = highestHigh - lowestLow;
  
  let k = range === 0 ? 50 : ((currentClose - lowestLow) / range) * 100;
  let d = k; // Simplified smoothing
  
  return { k: Math.min(100, Math.max(0, k)), d: Math.min(100, Math.max(0, d)) };
}

// Calculate ADX (Average Directional Index)
export function calculateADX(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 20;
  
  let plusDI = 0, minusDI = 0, trueRange = 0;
  
  for (let i = candles.length - period; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    
    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;
    
    if (upMove > downMove && upMove > 0) plusDI += upMove;
    if (downMove > upMove && downMove > 0) minusDI += downMove;
    
    trueRange += Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
  }
  
  const avgTR = trueRange / period;
  const plusDIVal = (plusDI / (avgTR * period)) * 100;
  const minusDIVal = (minusDI / (avgTR * period)) * 100;
  
  const di = Math.abs(plusDIVal - minusDIVal) / (plusDIVal + minusDIVal || 1);
  return Math.min(100, di * 100);
}

// Calculate Volume Signal - detect volume spikes (conviction)
export function analyzeVolumeSignal(candles: Candle[]): 'STRONG' | 'WEAK' {
  if (candles.length < 10) return 'WEAK';
  
  const recentVolumes = candles.slice(-5).map(c => c.volume);
  const historicalVolumes = candles.slice(-20, -5).map(c => c.volume);
  
  const avgRecent = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const avgHistorical = historicalVolumes.reduce((a, b) => a + b, 0) / historicalVolumes.length;
  
  // Volume spike = 1.3x above average = strong conviction (lowered from 1.5x)
  return avgRecent > avgHistorical * 1.3 ? 'STRONG' : 'WEAK';
}

// Calculate Volatility - ATR (Average True Range)
export function calculateVolatility(candles: Candle[]): number {
  if (candles.length < 14) return 0;
  
  let trueRange = 0;
  const period = Math.min(14, candles.length);
  
  for (let i = candles.length - period; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    
    const tr = Math.max(
      curr.high - curr.low,
      Math.abs(curr.high - prev.close),
      Math.abs(curr.low - prev.close)
    );
    trueRange += tr;
  }
  
  return trueRange / period;
}

// Detect Support/Resistance levels - bounce points
export function detectPriceLevel(candles: Candle[], currentPrice: number): 'SUPPORT' | 'RESISTANCE' | 'NEUTRAL' {
  if (candles.length < 20) return 'NEUTRAL';
  
  const recent = candles.slice(-20);
  const lows = recent.map(c => c.low);
  const highs = recent.map(c => c.high);
  
  const minLow = Math.min(...lows);
  const maxHigh = Math.max(...highs);
  const range = maxHigh - minLow;
  
  // Near support (bottom 30% of range) = likely bounce up
  if (currentPrice < minLow + range * 0.35) return 'SUPPORT';
  // Near resistance (top 30% of range) = likely bounce down
  if (currentPrice > maxHigh - range * 0.35) return 'RESISTANCE';
  
  return 'NEUTRAL';
}

// Main analysis function
export function analyzeCandles(candles: Candle[]): TechnicalMetrics {
  if (candles.length < 26) {
    return {
      rsi: 50,
      macdLine: 0,
      macdSignal: 0,
      macdHistogram: 0,
      sma20: candles[candles.length - 1]?.close || 0,
      sma50: candles[candles.length - 1]?.close || 0,
      ema12: candles[candles.length - 1]?.close || 0,
      ema26: candles[candles.length - 1]?.close || 0,
      stochasticK: 50,
      stochasticD: 50,
      adx: 20,
      trend: 'NEUTRAL',
      momentum: 'WEAK',
    };
  }

  const closes = candles.map(c => c.close);
  
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const stoch = calculateStochastic(candles);
  const adx = calculateADX(candles);
  const volumeSignal = analyzeVolumeSignal(candles);
  const volatility = calculateVolatility(candles);
  const currentClose = closes[closes.length - 1];
  const priceLevel = detectPriceLevel(candles, currentClose);
  
  // Determine trend - Refined for OTC
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  
  const isSmaBullish = currentClose > sma20 && sma20 > sma50;
  const isEmaBullish = ema12 > ema26 && currentClose > ema12;
  
  if (isSmaBullish && isEmaBullish) {
    trend = 'BULLISH';
  } else if (currentClose < sma20 && sma20 < sma50 && ema12 < ema26 && currentClose < ema12) {
    trend = 'BEARISH';
  }
  
  // Determine momentum
  let momentum: 'STRONG' | 'MODERATE' | 'WEAK' = 'WEAK';
  if (adx > 40) {
    momentum = 'STRONG';
  } else if (adx > 25) {
    momentum = 'MODERATE';
  }
  
  return {
    rsi,
    macdLine: macd.line,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    sma20,
    sma50,
    ema12,
    ema26,
    stochasticK: stoch.k,
    stochasticD: stoch.d,
    adx,
    trend,
    momentum,
    volumeSignal,
    volatility,
    priceLevel,
  };
}

// Generate signal based on technicals - WINNING TRADES APPROACH
export function generateSignalFromTechnicals(metrics: TechnicalMetrics, currentPrice: number): { type: 'CALL' | 'PUT' | 'WAIT'; confidence: number } {
  let bullishScore = 0;
  let bearishScore = 0;

  // 1. MACD - Trend direction (Weighted 3)
  if (metrics.macdHistogram > 0.001 && metrics.macdLine > metrics.macdSignal) {
    bullishScore += 3;
  } else if (metrics.macdHistogram < -0.001 && metrics.macdLine < metrics.macdSignal) {
    bearishScore += 3;
  }

  // 2. Trend Alignment - SMA & EMA (Weighted 4) - CORE SIGNAL
  if (metrics.trend === 'BULLISH') {
    bullishScore += 4;
  } else if (metrics.trend === 'BEARISH') {
    bearishScore += 4;
  }

  // 3. RSI - Momentum validation (Weighted 3)
  if (metrics.rsi > 55 && metrics.rsi < 75) {
    bullishScore += 3;
  } else if (metrics.rsi < 45 && metrics.rsi > 25) {
    bearishScore += 3;
  }

  // 4. ADX - Trend Strength (bonus points, not mandatory)
  // Lower ADX = less confident, higher ADX = more confident
  if (metrics.adx > 35) {
    if (metrics.trend === 'BULLISH') bullishScore += 3;
    if (metrics.trend === 'BEARISH') bearishScore += 3;
  } else if (metrics.adx > 25) {
    if (metrics.trend === 'BULLISH') bullishScore += 2;
    if (metrics.trend === 'BEARISH') bearishScore += 2;
  } else if (metrics.adx > 20) {
    // Still allow signals with weak trend, but less confidence
    if (metrics.trend === 'BULLISH') bullishScore += 1;
    if (metrics.trend === 'BEARISH') bearishScore += 1;
  }

  // 5. Support/Resistance bounce (Weighted 3) - WINNING ZONE
  // Trading bounces off key levels has highest win rate
  if (metrics.trend === 'BULLISH' && metrics.priceLevel === 'SUPPORT') {
    bullishScore += 3;
  } else if (metrics.trend === 'BEARISH' && metrics.priceLevel === 'RESISTANCE') {
    bearishScore += 3;
  }

  // 6. Stochastic confirmation (Weighted 2)
  if (metrics.trend === 'BULLISH' && metrics.stochasticK > 55) {
    bullishScore += 2;
  } else if (metrics.trend === 'BEARISH' && metrics.stochasticK < 45) {
    bearishScore += 2;
  }

  // 7. Volume bonus (Weighted 2) - NOT MANDATORY
  // Strong volume adds confidence but missing volume doesn't block the signal
  if (metrics.volumeSignal === 'STRONG') {
    if (metrics.trend === 'BULLISH') bullishScore += 2;
    if (metrics.trend === 'BEARISH') bearishScore += 2;
  }

  let type: 'CALL' | 'PUT' | 'WAIT' = 'WAIT';
  let confidence = 0;

  // RELAXED SCORING - Allow signals with trend + MACD confirmation
  // Min score 4 = trend + MACD (can generate signals)
  // Score 7+ = trend + MACD + other confirmations (high confidence)
  const MIN_SCORE = 4;

  if (bullishScore >= MIN_SCORE && bullishScore > bearishScore) {
    type = 'CALL';
    // Score 4-18 to confidence 70-99
    confidence = 70 + Math.round(((bullishScore - MIN_SCORE) / (18 - MIN_SCORE)) * 29);
  } else if (bearishScore >= MIN_SCORE && bearishScore > bullishScore) {
    type = 'PUT';
    confidence = 70 + Math.round(((bearishScore - MIN_SCORE) / (18 - MIN_SCORE)) * 29);
  }

  return { type, confidence };
}
