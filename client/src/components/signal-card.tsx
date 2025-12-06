import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Zap, Activity, Crosshair, Timer, Radio, PauseCircle, Send, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format, addMinutes } from 'date-fns';

interface SignalCardProps {
  mode: 'AUTO' | 'MANUAL';
  isAutoActive?: boolean;
}

export function SignalCard({ mode, isAutoActive = true }: SignalCardProps) {
  const [signal, setSignal] = useState<'CALL' | 'PUT' | 'WAIT'>('WAIT');
  const [confidence, setConfidence] = useState(0);
  const [expiryTime, setExpiryTime] = useState(0);
  const [autoTimer, setAutoTimer] = useState(10 * 60); // 10 minutes analysis window
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastSignalSent, setLastSignalSent] = useState<string | null>(null);

  // Auto Mode Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (mode === 'AUTO' && isAutoActive) {
      interval = setInterval(() => {
        setAutoTimer((prev) => {
          if (prev <= 1) {
             // Trigger auto generation
             generateSignal();
             return 10 * 60; // Reset to 10 mins analysis window
          }
          return prev - 1;
        });
      }, 1000);
    } else {
        // If paused or switched out, maintain state but stop countdown
    }

    return () => clearInterval(interval);
  }, [mode, isAutoActive]);

  // Signal Expiry Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (expiryTime > 0) {
      interval = setInterval(() => setExpiryTime(t => t - 1), 1000);
    } else if (expiryTime === 0 && signal !== 'WAIT') {
      setSignal('WAIT'); // Expire signal
      setLastSignalSent(null);
    }
    return () => clearInterval(interval);
  }, [expiryTime, signal]);

  const generateSignal = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setLastSignalSent(null);
    
    // Simulate deep scanning animation (longer for "10 min analysis" feel)
    for(let i = 0; i <= 100; i+=2) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 40)); 
    }

    const newSignal = Math.random() > 0.5 ? 'CALL' : 'PUT';
    const newConfidence = Math.floor(Math.random() * (99 - 78) + 78); // min 78% as per request example
    
    // Prepare signal details
    const startTime = new Date();
    const endTime = addMinutes(startTime, 5);
    const entryPrice = (Math.random() * 100 + 100).toFixed(5);
    const sl = (Number(entryPrice) - 0.15000).toFixed(5);
    const tp = (Number(entryPrice) + 0.30000).toFixed(5);
    
    // Simulate sending to Telegram (Mock)
    const telegramMsg = `🚀 NEW SIGNAL ALERT (AUTO) 🚀

📊 Pair: AUD/JPY
⚡ Type: ${newSignal === 'CALL' ? '🟢 BUY/CALL' : '🔴 SELL/PUT'}
⏱ Timeframe: M5
⏰ Start Time: ${format(startTime, 'HH:mm')}
🏁 End Time: ${format(endTime, 'HH:mm')}

🎯 Entry: ${entryPrice}
🛑 Stop Loss: ${sl}
💰 Take Profit: ${tp}

💪 Confidence: ${newConfidence}%

📊 Technicals:
• RSI: 95.1
• Trend: NEUTRAL
• Momentum: STRONG

📈 Analysis:
• RSI extremely overbought at 95.1 - strong reversal signal
• MACD bullish crossover with positive histogram
• Price above SMA20 and SMA50 - uptrend confirmed`;

    console.log("Sending to Telegram:", telegramMsg);
    setLastSignalSent(format(new Date(), 'HH:mm:ss'));

    setSignal(newSignal);
    setConfidence(newConfidence);
    setExpiryTime(300); // 5 minutes (M5)
    setIsScanning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="relative p-6 glass-panel border-t-2 border-t-white/10 overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      {/* Header Status */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Badge variant="outline" className={`font-mono text-[10px] border-white/10 ${mode === 'AUTO' ? 'text-primary bg-primary/10' : 'text-accent bg-accent/10'}`}>
          {mode} MODE (M5)
        </Badge>
        {mode === 'AUTO' && (
           <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
             <Timer className={`w-3 h-3 ${isAutoActive ? 'animate-pulse text-primary' : ''}`} />
             {isAutoActive ? (
                 <>NEXT ENTRY: <span className="text-foreground font-bold text-neon-blue">{formatTime(autoTimer)}</span></>
             ) : (
                 <span className="text-destructive font-bold">PAUSED</span>
             )}
           </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-8 w-full flex flex-col items-center">
        
        {isScanning ? (
           <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
             <div className="relative w-24 h-24 flex items-center justify-center">
               <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin-slow" />
               <div className="absolute inset-2 border-4 border-t-primary rounded-full animate-spin" />
               <Radio className="w-10 h-10 text-primary animate-pulse" />
             </div>
             <div className="space-y-2 text-center w-full">
               <span className="text-sm font-bold animate-pulse text-primary text-neon-blue">ANALYZING 10m WINDOW...</span>
               <Progress value={scanProgress} className="h-1 bg-secondary" indicatorClassName="bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
               <p className="text-[10px] text-muted-foreground font-mono">Calculating Entry Points...</p>
             </div>
           </div>
        ) : signal === 'WAIT' ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-40 h-40 rounded-full bg-secondary/30 border border-white/5 flex items-center justify-center relative group backdrop-blur-sm">
              
              {mode === 'AUTO' && !isAutoActive ? (
                  <>
                    <PauseCircle className="w-16 h-16 text-muted-foreground opacity-50" />
                    <div className="absolute bottom-8 text-[10px] text-muted-foreground font-mono tracking-widest">SYSTEM PAUSED</div>
                  </>
              ) : (
                  <>
                    <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-20" />
                    <div className="absolute inset-2 rounded-full border border-primary/20 animate-spin-slow opacity-50 border-t-transparent border-b-transparent" />
                    <Crosshair className="w-16 h-16 text-primary/50 group-hover:text-primary transition-colors duration-500" />
                  </>
              )}
            </div>
            
            {mode === 'MANUAL' ? (
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-background font-black tracking-wide px-8 py-6 text-lg shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all hover:scale-105 active:scale-95"
                onClick={generateSignal}
              >
                <Zap className="w-5 h-5 mr-2" />
                ANALYZE M5 ENTRY
              </Button>
            ) : (
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-muted-foreground">
                    {isAutoActive ? 'WAITING FOR ENTRY' : 'AUTO-TRADING PAUSED'}
                </h3>
                <p className="text-xs text-muted-foreground/60 font-mono">
                    {isAutoActive ? 'AI SCANNING 10m PRICE ACTION...' : 'RESUME TO START SCANNING'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 z-10 w-full animate-in zoom-in duration-300">
            <div className={`relative flex items-center justify-center w-48 h-48 rounded-full border-8 ${signal === 'CALL' ? 'border-primary bg-primary/10 shadow-[0_0_60px_rgba(var(--primary),0.4)]' : 'border-destructive bg-destructive/10 shadow-[0_0_60px_rgba(var(--destructive),0.4)]'}`}>
              <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping opacity-20"></div>
              {signal === 'CALL' ? (
                <ArrowUp className="w-24 h-24 text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-bounce" />
              ) : (
                <ArrowDown className="w-24 h-24 text-destructive drop-shadow-[0_0_20px_rgba(var(--destructive),0.8)] animate-bounce" />
              )}
              <div className="absolute -bottom-4 bg-background px-4 py-1 rounded-full border border-white/10 text-xs font-black tracking-widest uppercase shadow-lg">
                M5 Expiry
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className={`text-7xl font-black tracking-tighter ${signal === 'CALL' ? 'text-primary text-neon-blue' : 'text-destructive text-neon-pink'}`}>
                {signal}
              </h1>
              <div className="flex flex-col items-center gap-2">
                 <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground bg-black/40 px-4 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                   <Timer className="w-4 h-4 text-primary" />
                   <span>CLOSE IN <span className="text-white font-bold">{formatTime(expiryTime)}</span></span>
                 </div>
                 
                 {lastSignalSent && (
                     <div className="flex items-center gap-2 text-[10px] text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span>Signal sent to Telegram at {lastSignalSent}</span>
                     </div>
                 )}
              </div>
            </div>

            <div className="w-full space-y-3 px-4">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-muted-foreground">CONFIDENCE SCORE</span>
                <span className={signal === 'CALL' ? 'text-primary' : 'text-destructive'}>{confidence}%</span>
              </div>
              <Progress value={confidence} className="h-4 bg-secondary" indicatorClassName={signal === 'CALL' ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]' : 'bg-destructive shadow-[0_0_15px_rgba(var(--destructive),0.6)]'} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}