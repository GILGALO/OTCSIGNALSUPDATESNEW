// Signal Scheduler - Sends signals at precise times (2-3 minutes before M5 candle entry)

interface ScheduledSignal {
  id: string;
  sendTime: Date;
  telegram: { token: string; channelId: string };
  signal: {
    symbol: string;
    signalType: string;
    confidence: number;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    startTime: Date;
    endTime: Date;
    technicals: any;
  };
  timeout?: NodeJS.Timeout;
}

// Map to track scheduled signals
const scheduledSignals = new Map<string, ScheduledSignal>();

/**
 * Get the current M5 candle start time
 * M5 candles start at: 00:00, 00:05, 00:10, 00:15, etc.
 */
export function getCurrentM5CandleStartTime(): Date {
  const now = new Date();
  const minutes = now.getMinutes();
  const minutesPastHour = minutes % 5;
  
  const currentCandle = new Date(now);
  currentCandle.setMinutes(currentCandle.getMinutes() - minutesPastHour);
  currentCandle.setSeconds(0);
  currentCandle.setMilliseconds(0);
  
  return currentCandle;
}

/**
 * Get the next M5 candle start time
 */
export function getNextM5CandleStartTime(): Date {
  const currentCandle = getCurrentM5CandleStartTime();
  const nextCandle = new Date(currentCandle);
  nextCandle.setMinutes(nextCandle.getMinutes() + 5);
  return nextCandle;
}

/**
 * Calculate entry time: the next M5 candle that is at least 2 minutes away
 * If less than 2 minutes to next candle, use the candle after that
 */
export function calculateM5CandleEntryTime(): Date {
  const now = new Date();
  const nextCandleStart = getNextM5CandleStartTime();
  
  // Time remaining until next candle (in milliseconds)
  const timeUntilNextCandle = nextCandleStart.getTime() - now.getTime();
  const minutesRemaining = timeUntilNextCandle / (1000 * 60);
  
  // If less than 2 minutes to next candle, use the candle after that
  if (minutesRemaining < 2) {
    const followingCandle = new Date(nextCandleStart);
    followingCandle.setMinutes(followingCandle.getMinutes() + 5);
    return followingCandle;
  }
  
  return nextCandleStart;
}

/**
 * Calculate send time: exactly 2 minutes before entry time (for predictable delivery)
 */
export function getSignalSendTime(): Date {
  const entryTime = calculateM5CandleEntryTime();
  const sendTime = new Date(entryTime);
  sendTime.setMinutes(sendTime.getMinutes() - 2);
  return sendTime;
}

/**
 * Schedule a signal to be sent to Telegram at the calculated time
 * Includes automatic retry on failure (up to 3 attempts)
 */
export function scheduleSignalSend(
  signalId: string,
  signal: any,
  telegramToken: string,
  channelId: string,
  sendCallback: (signalId: string, sendTime: Date) => Promise<void>
): { sendTime: Date; isImmediate: boolean } {
  const sendTime = getSignalSendTime();
  const now = new Date();
  const isImmediate = sendTime.getTime() <= now.getTime();

  const attemptSend = async (attempt: number = 1) => {
    try {
      console.log(`[SIGNAL SCHEDULER] Attempt ${attempt}/3: Sending signal ${signalId} at ${new Date().toISOString()}`);
      await sendCallback(signalId, sendTime);
      console.log(`[SIGNAL SCHEDULER] ✅ Signal ${signalId} sent successfully on attempt ${attempt}`);
    } catch (err) {
      console.error(`[SIGNAL SCHEDULER] ❌ Attempt ${attempt} failed for signal ${signalId}: ${err}`);
      
      if (attempt < 3) {
        // Retry after 2 seconds
        const retryDelay = 2000;
        console.log(`[SIGNAL SCHEDULER] Retrying in ${retryDelay}ms...`);
        setTimeout(() => attemptSend(attempt + 1), retryDelay);
      } else {
        console.error(`[SIGNAL SCHEDULER] 🚨 FAILED: Signal ${signalId} failed after 3 attempts`);
      }
    }
  };

  if (isImmediate) {
    // Send immediately with retries
    console.log(`[SIGNAL SCHEDULER] Signal ${signalId} scheduled to send IMMEDIATELY`);
    attemptSend();
  } else {
    // Schedule for future time with retries
    const delayMs = sendTime.getTime() - now.getTime();
    
    console.log(`[SIGNAL SCHEDULER] Signal ${signalId} scheduled to send in ${Math.round(delayMs / 1000)}s at ${sendTime.toISOString()}`);

    const timeout = setTimeout(() => {
      attemptSend();
      scheduledSignals.delete(signalId);
    }, delayMs);

    scheduledSignals.set(signalId, {
      id: signalId,
      sendTime,
      telegram: { token: telegramToken, channelId },
      signal,
      timeout,
    });
  }

  return { sendTime, isImmediate };
}

/**
 * Cancel a scheduled signal
 */
export function cancelScheduledSignal(signalId: string): boolean {
  const scheduled = scheduledSignals.get(signalId);
  if (scheduled && scheduled.timeout) {
    clearTimeout(scheduled.timeout);
    scheduledSignals.delete(signalId);
    console.log(`[SIGNAL SCHEDULER] Cancelled signal ${signalId}`);
    return true;
  }
  return false;
}

/**
 * Get all scheduled signals
 */
export function getScheduledSignals(): ScheduledSignal[] {
  return Array.from(scheduledSignals.values());
}

/**
 * Get a specific scheduled signal
 */
export function getScheduledSignal(signalId: string): ScheduledSignal | undefined {
  return scheduledSignals.get(signalId);
}
