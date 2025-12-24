// Telegram Bot Service

interface TelegramFormatOptions {
  symbol: string;
  signalType: 'CALL' | 'PUT';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  startTime: Date;
  endTime: Date;
  technicals: {
    rsi: number;
    trend: string;
    momentum: string;
    macdHistogram: number;
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
    stochasticK: number;
    stochasticD: number;
    adx: number;
  };
}

export class TelegramService {
  private botToken: string;
  private channelId: string;
  private baseUrl = 'https://api.telegram.org';

  constructor(botToken: string, channelId: string) {
    this.botToken = botToken;
    this.channelId = channelId;
  }

  formatSignalMessage(options: TelegramFormatOptions): string {
    const timeFormat = (date: Date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    const emoji = options.signalType === 'CALL' ? '🟢 BUY/CALL' : '🔴 SELL/PUT';
    const analysisText = this.getAnalysisText(options.technicals);
    
    return `🚀 NEW SIGNAL ALERT (AUTO) 🚀

📊 Pair: ${options.symbol}
⚡ Type: ${emoji}
⏱ Timeframe: M5
⏰ Start Time: ${timeFormat(options.startTime)}
🏁 End Time: ${timeFormat(options.endTime)}

🎯 Entry: ${options.entryPrice.toFixed(5)}
🛑 Stop Loss: ${options.stopLoss.toFixed(5)}
💰 Take Profit: ${options.takeProfit.toFixed(5)}

💪 Confidence: ${options.confidence}%

📊 Technicals:
• RSI: ${options.technicals.rsi.toFixed(1)}
• Trend: ${options.technicals.trend}
• Momentum: ${options.technicals.momentum}

${analysisText}`;
  }

  private getAnalysisText(technicals: TelegramFormatOptions['technicals']): string {
    const insights: string[] = [];

    if (technicals.rsi > 70) {
      insights.push(`• RSI extremely overbought at ${technicals.rsi.toFixed(1)} - strong reversal signal`);
    } else if (technicals.rsi < 30) {
      insights.push(`• RSI extremely oversold at ${technicals.rsi.toFixed(1)} - strong bounce signal`);
    }

    if (technicals.macdHistogram > 0) {
      insights.push(`• MACD bullish crossover with positive histogram`);
    } else {
      insights.push(`• MACD bearish signal with negative histogram`);
    }

    if (technicals.sma20 > 0 && technicals.sma50 > 0) {
      if (technicals.sma20 > technicals.sma50) {
        insights.push(`• Price above SMA20 and SMA50 - uptrend confirmed`);
      } else {
        insights.push(`• Price below SMA20 and SMA50 - downtrend confirmed`);
      }
    }

    if (technicals.ema12 > technicals.ema26) {
      insights.push(`• EMA12 > EMA26 - short-term bullish momentum (${technicals.momentum})`);
    } else {
      insights.push(`• EMA26 > EMA12 - short-term bearish momentum (${technicals.momentum})`);
    }

    if (technicals.stochasticK > 80) {
      insights.push(`• Stochastic overbought (K:${technicals.stochasticK.toFixed(1)}, D:${technicals.stochasticD.toFixed(1)})`);
    } else if (technicals.stochasticK < 20) {
      insights.push(`• Stochastic oversold (K:${technicals.stochasticK.toFixed(1)}, D:${technicals.stochasticD.toFixed(1)})`);
    }

    if (technicals.adx > 40) {
      insights.push(`• Very strong trend (ADX: ${technicals.adx.toFixed(1)}) - high conviction`);
    } else if (technicals.adx > 25) {
      insights.push(`• Strong trend (ADX: ${technicals.adx.toFixed(1)}) - moderate conviction`);
    }

    return insights.length > 0 ? `📈 Analysis:\n${insights.join('\n')}` : '📈 Analysis: Mixed signals detected';
  }

  async sendSignal(options: TelegramFormatOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message = this.formatSignalMessage(options);
      
      // Add 30-second timeout to Telegram API calls
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${this.baseUrl}/bot${this.botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.channelId,
            text: message,
            parse_mode: 'HTML',
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const data = await response.json();

        if (data.ok) {
          return {
            success: true,
            messageId: String(data.result.message_id),
          };
        } else {
          return {
            success: false,
            error: data.description || 'Unknown error',
          };
        }
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Telegram API timeout (30s)');
        }
        throw fetchError;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/bot${this.botToken}/getMe`);
      const data = await response.json();
      return data.ok === true;
    } catch (error) {
      return false;
    }
  }
}

export function createTelegramService(botToken: string, channelId: string): TelegramService {
  return new TelegramService(botToken, channelId);
}
