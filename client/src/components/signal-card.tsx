import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Zap, Activity, Crosshair } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function SignalCard() {
  const [signal, setSignal] = useState<'CALL' | 'PUT' | 'WAIT'>('WAIT');
  const [confidence, setConfidence] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // Simulate signal generation
    const interval = setInterval(() => {
      if (timer > 0) {
        setTimer(t => t - 1);
      } else {
        // Generate new signal
        const newSignal = Math.random() > 0.5 ? 'CALL' : 'PUT';
        setSignal(newSignal);
        setConfidence(Math.floor(Math.random() * (98 - 85) + 85)); // 85-98%
        setTimer(Math.floor(Math.random() * 30 + 30)); // 30-60s duration
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <Card className="relative p-6 glass-panel border-t-2 border-t-white/10 overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-xs font-mono text-primary/80">LIVE SIGNAL</span>
      </div>

      <div className="mb-6 text-center space-y-1 z-10">
        <h2 className="text-sm font-medium text-muted-foreground tracking-widest uppercase">AI Prediction</h2>
        <div className="flex items-center gap-2 justify-center opacity-50">
          <Crosshair className="w-3 h-3" />
          <span className="text-xs font-mono">M1 TIME FRAME</span>
        </div>
      </div>

      {signal === 'WAIT' ? (
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Activity className="w-16 h-16 text-muted-foreground/50" />
          <span className="text-xl font-bold text-muted-foreground">ANALYZING MARKET...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 z-10 w-full">
          <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${signal === 'CALL' ? 'border-primary bg-primary/10 shadow-[0_0_30px_rgba(0,255,157,0.3)]' : 'border-destructive bg-destructive/10 shadow-[0_0_30px_rgba(255,0,85,0.3)]'}`}>
            {signal === 'CALL' ? (
              <ArrowUp className="w-16 h-16 text-primary drop-shadow-[0_0_10px_rgba(0,255,157,0.8)]" />
            ) : (
              <ArrowDown className="w-16 h-16 text-destructive drop-shadow-[0_0_10px_rgba(255,0,85,0.8)]" />
            )}
          </div>

          <div className="text-center">
            <h1 className={`text-5xl font-black tracking-tighter ${signal === 'CALL' ? 'text-primary text-neon-green' : 'text-destructive text-neon-red'}`}>
              {signal}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-mono">EXPIRES IN {timer}s</p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">CONFIDENCE</span>
              <span className={signal === 'CALL' ? 'text-primary' : 'text-destructive'}>{confidence}%</span>
            </div>
            <Progress value={confidence} className="h-2 bg-secondary" indicatorClassName={signal === 'CALL' ? 'bg-primary shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'bg-destructive shadow-[0_0_10px_rgba(255,0,85,0.5)]'} />
          </div>
        </div>
      )}
    </Card>
  );
}