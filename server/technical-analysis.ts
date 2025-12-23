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
  
  // Determine trend
  const currentClose = closes[closes.length - 1];
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  
  if (currentClose > sma20 && currentClose > sma50 && ema12 > ema26) {
    trend = 'BULLISH';
  } else if (currentClose < sma20 && currentClose < sma50 && ema12 < ema26) {
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
  };
}

// Generate signal based on technicals
export function generateSignalFromTechnicals(metrics: TechnicalMetrics, currentPrice: number): { type: 'CALL' | 'PUT' | 'WAIT'; confidence: number } {
  let score = 0;
  let maxScore = 0;
  
  // RSI analysis
  if (metrics.rsi > 70) {
    score -= 20; // Overbought, bearish
  } else if (metrics.rsi < 30) {
    score += 20; // Oversold, bullish
  }
  maxScore += 20;
  
  // MACD analysis
  if (metrics.macdHistogram > 0) {
    score += 15;
  } else {
    score -= 15;
  }
  maxScore += 15;
  
  // Trend analysis
  if (metrics.trend === 'BULLISH') {
    score += 25;
  } else if (metrics.trend === 'BEARISH') {
    score -= 25;
  }
  maxScore += 25;
  
  // Momentum
  if (metrics.momentum === 'STRONG') {
    score += 20;
  } else if (metrics.momentum === 'MODERATE') {
    score += 10;
  }
  maxScore += 20;
  
  // Price position
  if (currentPrice > metrics.sma20 && currentPrice > metrics.sma50) {
    score += 10;
  } else if (currentPrice < metrics.sma20 && currentPrice < metrics.sma50) {
    score -= 10;
  }
  maxScore += 10;
  
  const normalizedScore = (score / maxScore) * 100;
  const confidence = Math.max(0, Math.min(100, 50 + normalizedScore / 2));
  
  let type: 'CALL' | 'PUT' | 'WAIT' = 'WAIT';
  if (confidence > 60) {
    type = score > 0 ? 'CALL' : 'PUT';
  }
  
  return { type, confidence: Math.round(confidence) };
}
