import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Zap, Activity, Crosshair, Timer, PlayCircle, Radio } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SignalCardProps {
  mode: 'AUTO' | 'MANUAL';
  isAnalyzing?: boolean;
}

export function SignalCard({ mode }: SignalCardProps) {
  const [signal, setSignal] = useState<'CALL' | 'PUT' | 'WAIT'>('WAIT');
  const [confidence, setConfidence] = useState(0);
  const [expiryTime, setExpiryTime] = useState(0);
  const [autoTimer, setAutoTimer] = useState(7 * 60); // 7 minutes in seconds
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Auto Mode Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (mode === 'AUTO') {
      interval = setInterval(() => {
        setAutoTimer((prev) => {
          if (prev <= 1) {
             // Trigger auto generation
             generateSignal();
             return 7 * 60; // Reset to 7 mins
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoTimer(7 * 60); // Reset if switched out
    }

    return () => clearInterval(interval);
  }, [mode]);

  // Signal Expiry Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (expiryTime > 0) {
      interval = setInterval(() => setExpiryTime(t => t - 1), 1000);
    } else if (expiryTime === 0 && signal !== 'WAIT') {
      setSignal('WAIT'); // Expire signal
    }
    return () => clearInterval(interval);
  }, [expiryTime, signal]);

  const generateSignal = async () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scanning animation
    for(let i = 0; i <= 100; i+=5) {
      setScanProgress(i);
      await new Promise(r => setTimeout(r, 50)); // Quick scan
    }

    const newSignal = Math.random() > 0.5 ? 'CALL' : 'PUT';
    const newConfidence = Math.floor(Math.random() * (99 - 88) + 88); // High confidence only
    
    setSignal(newSignal);
    setConfidence(newConfidence);
    setExpiryTime(60); // 60s signal validity
    setIsScanning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="relative p-6 glass-panel border-t-2 border-t-white/10 overflow-hidden flex flex-col items-center justify-center min-h-[350px]">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />
      
      {/* Header Status */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Badge variant="outline" className={`font-mono text-[10px] border-white/10 ${mode === 'AUTO' ? 'text-accent bg-accent/10' : 'text-orange-400 bg-orange-400/10'}`}>
          {mode} MODE
        </Badge>
        {mode === 'AUTO' && (
           <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
             <Timer className="w-3 h-3" />
             NEXT SCAN: <span className="text-foreground font-bold">{formatTime(autoTimer)}</span>
           </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-8 w-full flex flex-col items-center">
        
        {isScanning ? (
           <div className="flex flex-col items-center gap-4 w-full max-w-[200px]">
             <div className="relative w-20 h-20 flex items-center justify-center">
               <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin-slow" />
               <div className="absolute inset-2 border-4 border-t-primary rounded-full animate-spin" />
               <Radio className="w-8 h-8 text-primary animate-pulse" />
             </div>
             <div className="space-y-2 text-center w-full">
               <span className="text-sm font-bold animate-pulse text-primary">SCANNING MARKETS...</span>
               <Progress value={scanProgress} className="h-1 bg-secondary" />
             </div>
           </div>
        ) : signal === 'WAIT' ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-secondary/30 border border-white/5 flex items-center justify-center relative group">
              <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-20" />
              <Crosshair className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors duration-500" />
            </div>
            
            {mode === 'MANUAL' ? (
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-background font-black tracking-wide px-8 py-6 text-lg shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                onClick={generateSignal}
              >
                <Zap className="w-5 h-5 mr-2" />
                GENERATE SIGNAL
              </Button>
            ) : (
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-muted-foreground">WAITING FOR SIGNAL</h3>
                <p className="text-xs text-muted-foreground/60 font-mono">AI ANALYZING PRICE ACTION...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 z-10 w-full animate-in zoom-in duration-300">
            <div className={`relative flex items-center justify-center w-40 h-40 rounded-full border-8 ${signal === 'CALL' ? 'border-primary bg-primary/10 shadow-[0_0_50px_rgba(0,255,157,0.4)]' : 'border-destructive bg-destructive/10 shadow-[0_0_50px_rgba(255,0,85,0.4)]'}`}>
              {signal === 'CALL' ? (
                <ArrowUp className="w-20 h-20 text-primary drop-shadow-[0_0_15px_rgba(0,255,157,0.8)]" />
              ) : (
                <ArrowDown className="w-20 h-20 text-destructive drop-shadow-[0_0_15px_rgba(255,0,85,0.8)]" />
              )}
              <div className="absolute -bottom-3 bg-background px-3 py-1 rounded-full border border-white/10 text-xs font-black tracking-widest">
                M1
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className={`text-6xl font-black tracking-tighter ${signal === 'CALL' ? 'text-primary text-neon-green' : 'text-destructive text-neon-red'}`}>
                {signal}
              </h1>
              <div className="flex items-center justify-center gap-2 text-sm font-mono text-muted-foreground bg-black/40 px-3 py-1 rounded-lg border border-white/5">
                <Timer className="w-3 h-3" />
                <span>EXPIRES IN {expiryTime}s</span>
              </div>
            </div>

            <div className="w-full space-y-2 px-4">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span className="text-muted-foreground">PROBABILITY</span>
                <span className={signal === 'CALL' ? 'text-primary' : 'text-destructive'}>{confidence}%</span>
              </div>
              <Progress value={confidence} className="h-3 bg-secondary" indicatorClassName={signal === 'CALL' ? 'bg-primary shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'bg-destructive shadow-[0_0_10px_rgba(255,0,85,0.5)]'} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}