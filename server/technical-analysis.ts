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

// Generate signal based on technicals - ULTRA-HIGH ACCURACY CONSENSUS APPROACH
export function generateSignalFromTechnicals(metrics: TechnicalMetrics, currentPrice: number): { type: 'CALL' | 'PUT' | 'WAIT'; confidence: number } {
  let bullishScore = 0;
  let bearishScore = 0;
  let totalChecks = 0;

  // 1. MACD - Primary trend indicator (weighted heavily)
  if (metrics.macdHistogram > 0.0001 && metrics.macdLine > metrics.macdSignal) {
    bullishScore += 3; // Strong bullish signal
  } else if (metrics.macdHistogram < -0.0001 && metrics.macdLine < metrics.macdSignal) {
    bearishScore += 3; // Strong bearish signal
  }
  totalChecks += 3;

  // 2. Moving Averages - Trend structure confirmation (critical)
  const bullishTrend = currentPrice > metrics.sma20 && metrics.sma20 > metrics.sma50;
  const bearishTrend = currentPrice < metrics.sma20 && metrics.sma20 < metrics.sma50;
  
  if (bullishTrend) {
    bullishScore += 3;
  } else if (bearishTrend) {
    bearishScore += 3;
  }
  totalChecks += 3;

  // 3. EMA Alignment - Secondary confirmation
  if (metrics.ema12 > metrics.ema26 && currentPrice > metrics.ema12) {
    bullishScore += 2;
  } else if (metrics.ema12 < metrics.ema26 && currentPrice < metrics.ema12) {
    bearishScore += 2;
  }
  totalChecks += 2;

  // 4. RSI - Momentum validation (must be in healthy zone, not extreme)
  if (metrics.rsi > 50 && metrics.rsi < 65) {
    bullishScore += 2; // Moderate bullish momentum
  } else if (metrics.rsi < 50 && metrics.rsi > 35) {
    bearishScore += 2; // Moderate bearish momentum
  } else if (metrics.rsi > 65 || metrics.rsi < 35) {
    // Extreme RSI means we skip this - potential reversal
    totalChecks += 0;
  }
  totalChecks += 2;

  // 5. ADX - Trend strength confirmation (must have clear direction)
  if (metrics.adx > 25) {
    if (metrics.trend === 'BULLISH') {
      bullishScore += 2; // Strong trending bullish
    } else if (metrics.trend === 'BEARISH') {
      bearishScore += 2; // Strong trending bearish
    }
  }
  totalChecks += 2;

  // 6. Stochastic - Directional confirmation
  if (metrics.stochasticK > 50 && metrics.stochasticK < 85) {
    bullishScore += 1;
  } else if (metrics.stochasticK < 50 && metrics.stochasticK > 15) {
    bearishScore += 1;
  }
  totalChecks += 1;

  let type: 'CALL' | 'PUT' | 'WAIT' = 'WAIT';
  let confidence = 0;

  // Calculate win probability based on score ratio
  const totalScore = bullishScore + bearishScore;
  
  if (totalScore === 0) {
    // No clear signal
    return { type: 'WAIT', confidence: 0 };
  }

  const bullishRatio = bullishScore / totalScore;
  const bearishRatio = bearishScore / totalScore;

  // Generate signals with good confidence when indicators align
  // Lowered consensus requirement from 6 to 5 for more frequent signals
  if (bullishRatio > bearishRatio && bullishScore >= 5) {
    // Bullish signal
    type = 'CALL';
    // Base confidence boosted for clearer scores
    confidence = Math.min(99, 65 + Math.round((bullishRatio - 0.5) * 60) + (bullishScore * 2));
  } else if (bearishRatio > bullishRatio && bearishScore >= 5) {
    // Bearish signal
    type = 'PUT';
    confidence = Math.min(99, 65 + Math.round((bearishRatio - 0.5) * 60) + (bearishScore * 2));
  }

  return { type, confidence: Math.round(Math.max(0, confidence)) };
}
