// Signal Scheduler - Schedules Telegram sends 2 minutes before M5 candle starts

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
 * Calculate the next M5 candle start time
 * M5 candles start at: 00:00, 00:05, 00:10, 00:15, etc.
 */
export function getNextM5CandleStartTime(): Date {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  // Calculate how many minutes past the hour
  const minutesPastHour = minutes % 5;
  
  // Calculate minutes until next 5-minute boundary
  let minutesUntilNextBoundary = 5 - minutesPastHour;
  
  if (minutesPastHour === 0 && seconds === 0 && milliseconds === 0) {
    // Already at exact boundary, next is 5 minutes away
    minutesUntilNextBoundary = 5;
  }

  const nextCandle = new Date(now);
  nextCandle.setMinutes(nextCandle.getMinutes() + minutesUntilNextBoundary);
  nextCandle.setSeconds(0);
  nextCandle.setMilliseconds(0);

  return nextCandle;
}

/**
 * Calculate entry time aligned to M5 candle with 2-minute preparation requirement
 * 
 * Rules:
 * 1. Entry time MUST be at exact open of a 5-minute candle
 * 2. MINIMUM 2 FULL MINUTES between signal send and entry time
 * 3. If time to next candle < 2 minutes: SKIP and use following candle
 */
export function calculateM5CandleEntryTime(): Date {
  const now = new Date();
  const nextCandleStart = getNextM5CandleStartTime();
  
  // Calculate time remaining until next candle
  const timeUntilNextCandle = nextCandleStart.getTime() - now.getTime();
  const minutesRemaining = timeUntilNextCandle / (1000 * 60);
  
  // If less than 2 minutes to next candle, skip it and use the following candle
  if (minutesRemaining < 2) {
    const skipCandle = new Date(nextCandleStart);
    skipCandle.setMinutes(skipCandle.getMinutes() + 5);
    return skipCandle;
  }
  
  // Otherwise use the next candle
  return nextCandleStart;
}

/**
 * Calculate send time: 2 minutes before entry time
 */
export function getSignalSendTime(): Date {
  const entryTime = calculateM5CandleEntryTime();
  const sendTime = new Date(entryTime);
  sendTime.setMinutes(sendTime.getMinutes() - 2);
  return sendTime;
}

/**
 * Schedule a signal to be sent to Telegram at the calculated time
 * For MANUAL signals, send immediately. For AUTO signals, schedule appropriately.
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

  // For manual signals (or any signal where current time is past send time), send immediately
  const isImmediate = sendTime.getTime() <= now.getTime();

  if (isImmediate) {
    // Send immediately without delay
    console.log(`[SIGNAL SCHEDULER] Signal ${signalId} sending IMMEDIATELY (source: MANUAL)`);
    
    // Fire and forget with error handling
    (async () => {
      try {
        await sendCallback(signalId, now);
        console.log(`[SIGNAL SCHEDULER] Signal ${signalId} sent successfully`);
      } catch (err) {
        console.error(`[SIGNAL SCHEDULER] Error sending signal immediately: ${err}`);
        // Retry after 1 second
        setTimeout(async () => {
          try {
            await sendCallback(signalId, now);
            console.log(`[SIGNAL SCHEDULER] Signal ${signalId} sent on retry`);
          } catch (retryErr) {
            console.error(`[SIGNAL SCHEDULER] Retry failed for signal ${signalId}: ${retryErr}`);
          }
        }, 1000);
      }
    })();
  } else {
    // Schedule for future time
    const delayMs = sendTime.getTime() - now.getTime();
    
    console.log(`[SIGNAL SCHEDULER] Signal ${signalId} scheduled to send in ${Math.round(delayMs / 1000)}s at ${sendTime.toISOString()}`);

    const timeout = setTimeout(() => {
      (async () => {
        try {
          await sendCallback(signalId, sendTime);
        } catch (err) {
          console.error(`[SIGNAL SCHEDULER] Error sending scheduled signal: ${err}`);
          // Retry after 1 second
          setTimeout(async () => {
            try {
              await sendCallback(signalId, sendTime);
              console.log(`[SIGNAL SCHEDULER] Scheduled signal ${signalId} sent on retry`);
            } catch (retryErr) {
              console.error(`[SIGNAL SCHEDULER] Retry failed for scheduled signal ${signalId}: ${retryErr}`);
            }
          }, 1000);
        }
      })();
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
