import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Zap, Crosshair, Timer, Radio, PauseCircle, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format, addMinutes } from 'date-fns';

interface SignalCardProps {
  mode: 'AUTO' | 'MANUAL';
  isAutoActive?: boolean;
  selectedAsset?: string;
}

interface GeneratedSignal {
  id: string;
  type: 'CALL' | 'PUT';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  entryTime: string;
  expiryTime: string;
  technicals: any;
}

// Expanded OTC liquid pairs for maximum market coverage
const ASSETS_FOR_AUTO_SCAN = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'EUR/JPY',
  'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP', 'GBP/JPY',
  'AUD/JPY', 'CHF/JPY', 'CAD/JPY', 'EUR/AUD', 'GBP/AUD'
];

export function SignalCard({ mode, isAutoActive = true, selectedAsset = 'EUR/USD' }: SignalCardProps) {
  const [signal, setSignal] = useState<'CALL' | 'PUT' | 'WAIT'>('WAIT');
  const [confidence, setConfidence] = useState(0);
  const [expiryTime, setExpiryTime] = useState(0);
  const [autoTimer, setAutoTimer] = useState(10 * 60);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastSignalSent, setLastSignalSent] = useState<string | null>(null);
  const [signalData, setSignalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannedAsset, setScannedAsset] = useState<string>('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (mode === 'AUTO' && isAutoActive) {
      interval = setInterval(() => {
        setAutoTimer((prev) => {
          if (prev <= 1) {
            generateSignal();
            return 10 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [mode, isAutoActive, selectedAsset]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (expiryTime > 0) {
      interval = setInterval(() => setExpiryTime(t => t - 1), 1000);
    } else if (expiryTime === 0 && signal !== 'WAIT') {
      setSignal('WAIT');
      setLastSignalSent(null);
    }
    return () => clearInterval(interval);
  }, [expiryTime, signal]);

  const generateSignal = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setError(null);
    setLastSignalSent(null);
    setScannedAsset('');

    // In AUTO mode, scan ALL assets; in MANUAL mode, scan only selected asset
    const assetsToScan = mode === 'AUTO' ? ASSETS_FOR_AUTO_SCAN : [selectedAsset];
    
    try {
      const ssid = localStorage.getItem('pocket_option_ssid');
      if (!ssid) {
        setError('SSID not configured');
        setIsScanning(false);
        return;
      }

      const telegramToken = localStorage.getItem('telegram_bot_token');
      const channelId = localStorage.getItem('telegram_channel_id');

      // Scan each asset for a strong signal
      let validScans = 0;
      let errorDetails: string[] = [];
      
      for (let idx = 0; idx < assetsToScan.length; idx++) {
        const asset = assetsToScan[idx];
        const progressPercent = Math.floor((idx / assetsToScan.length) * 100);
        setScanProgress(progressPercent);

        try {
          const response = await fetch('/api/generate-signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: asset,
              ssid,
              source: mode,
              telegramToken: telegramToken || undefined,
              channelId: channelId || undefined,
            }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            console.warn(`Scan ${asset}: HTTP ${response.status}`, data);
            errorDetails.push(`${asset}: ${data.error || data.message || 'Failed'}`);
            continue;
          }

          validScans++;

          // Check if we found a strong signal
          if (data.signal && data.signal.type !== 'WAIT') {
            setSignal(data.signal.type);
            setConfidence(data.signal.confidence);
            setSignalData(data.signal);
            setScannedAsset(asset);
            setExpiryTime(300);
            setScanProgress(100);
            if (data.telegram?.success) {
              setLastSignalSent(format(new Date(), 'HH:mm:ss'));
            }
            return;
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Network error';
          console.warn(`Scan ${asset}: ${errMsg}`);
          errorDetails.push(`${asset}: ${errMsg}`);
          continue;
        }
      }

      // No strong signal found in any asset
      setScanProgress(100);
      if (validScans === 0) {
        const firstError = errorDetails[0] || 'Market data unavailable';
        setError(`${firstError}. Verify your SSID is correct.`);
      } else {
        setError(`No strong signals across ${assetsToScan.length} pairs (checked ${validScans})`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating signal');
    } finally {
      setIsScanning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="relative p-4 lg:p-6 glass-panel border-t-2 border-t-white/10 overflow-hidden flex flex-col items-center justify-center min-h-[350px] lg:min-h-[400px]">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Badge variant="outline" className={`font-mono text-[10px] border-white/10 ${mode === 'AUTO' ? 'text-primary bg-primary/10' : 'text-accent bg-accent/10'}`}>
          {mode} MODE (M5)
        </Badge>
        {mode === 'AUTO' && (
           <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
             <Timer className={`w-3 h-3 ${isAutoActive ? 'animate-pulse text-primary' : ''}`} />
             {isAutoActive ? (
                 <>NEXT: <span className="text-foreground font-bold text-neon-blue">{formatTime(autoTimer)}</span></>
             ) : (
                 <span className="text-destructive font-bold">PAUSED</span>
             )}
           </div>
        )}
      </div>

      <div className="mt-4 lg:mt-8 w-full flex flex-col items-center">
        
        {isScanning ? (
           <div className="flex flex-col items-center gap-3 lg:gap-4 w-full max-w-[200px]">
             <div className="relative w-20 lg:w-24 h-20 lg:h-24 flex items-center justify-center">
               <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-spin-slow" />
               <div className="absolute inset-2 border-4 border-t-primary rounded-full animate-spin" />
               <Radio className="w-8 lg:w-10 h-8 lg:h-10 text-primary animate-pulse" />
             </div>
             <div className="space-y-2 text-center w-full">
               <span className="text-xs lg:text-sm font-bold animate-pulse text-primary text-neon-blue">ANALYZING {selectedAsset}...</span>
               <Progress value={scanProgress} className="h-1 bg-secondary" indicatorClassName="bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
             </div>
           </div>
        ) : signal === 'WAIT' ? (
          <div className="flex flex-col items-center gap-4 lg:gap-6">
            <div className="w-32 lg:w-40 h-32 lg:h-40 rounded-full bg-secondary/30 border border-white/5 flex items-center justify-center relative group backdrop-blur-sm">
              
              {mode === 'AUTO' && !isAutoActive ? (
                  <>
                    <PauseCircle className="w-12 lg:w-16 h-12 lg:h-16 text-muted-foreground opacity-50" />
                    <div className="absolute bottom-6 lg:bottom-8 text-[10px] text-muted-foreground font-mono tracking-widest">SYSTEM PAUSED</div>
                  </>
              ) : (
                  <>
                    <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping opacity-20" />
                    <div className="absolute inset-2 rounded-full border border-primary/20 animate-spin-slow opacity-50 border-t-transparent border-b-transparent" />
                    <Crosshair className="w-12 lg:w-16 h-12 lg:h-16 text-primary/50 group-hover:text-primary transition-colors duration-500" />
                  </>
              )}
            </div>
            
            {error && (
              <div className="text-center text-destructive text-sm">
                <p className="font-bold">{error}</p>
              </div>
            )}
            
            {mode === 'MANUAL' ? (
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-background font-black tracking-wide px-6 lg:px-8 py-4 lg:py-6 text-sm lg:text-lg shadow-[0_0_30px_rgba(var(--primary),0.4)] transition-all hover:scale-105 active:scale-95"
                onClick={generateSignal}
              >
                <Zap className="w-5 h-5 mr-2" />
                GENERATE SIGNAL
              </Button>
            ) : (
              <div className="text-center space-y-1">
                <h3 className="text-base lg:text-lg font-bold text-muted-foreground">
                    {isAutoActive ? 'WAITING FOR SIGNAL' : 'AUTO-TRADING PAUSED'}
                </h3>
                <p className="text-[10px] lg:text-xs text-muted-foreground/60 font-mono">
                    {isAutoActive ? 'AI ANALYZING PRICE ACTION...' : 'RESUME TO START SCANNING'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 lg:gap-4 z-10 w-full animate-in zoom-in duration-300">
            <div className={`relative flex items-center justify-center w-32 lg:w-40 h-32 lg:h-40 rounded-full border-8 ${signal === 'CALL' ? 'border-primary bg-primary/10 shadow-[0_0_60px_rgba(var(--primary),0.4)]' : 'border-destructive bg-destructive/10 shadow-[0_0_60px_rgba(var(--destructive),0.4)]'}`}>
              <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-ping opacity-20"></div>
              {signal === 'CALL' ? (
                <ArrowUp className="w-16 lg:w-20 h-16 lg:h-20 text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.8)] animate-bounce" />
              ) : (
                <ArrowDown className="w-16 lg:w-20 h-16 lg:h-20 text-destructive drop-shadow-[0_0_20px_rgba(var(--destructive),0.8)] animate-bounce" />
              )}
            </div>

            <div className="text-center space-y-0.5 lg:space-y-1 w-full">
              <h1 className={`text-3xl lg:text-5xl font-black tracking-tighter ${signal === 'CALL' ? 'text-primary' : 'text-destructive'}`}>
                {signal === 'CALL' ? 'BUY' : 'SELL'}
              </h1>
              <p className="text-xs lg:text-sm font-mono text-muted-foreground">({signal})</p>
              <p className="text-sm lg:text-lg font-bold text-foreground">{scannedAsset || selectedAsset}</p>
              <div className="flex items-center justify-center gap-2 text-xs lg:text-sm font-mono text-muted-foreground">
                <Timer className="w-3 h-3" />
                <span>EXPIRES IN <span className="text-white font-bold">{formatTime(expiryTime)}</span></span>
              </div>
            </div>

            <div className="w-full space-y-3 px-2 lg:px-3">
              <div className="bg-black/40 border border-white/10 rounded-lg p-3 lg:p-4 space-y-3 font-mono">
                <div className="space-y-2 text-sm lg:text-base">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">📊 Pair:</span>
                    <span className="font-bold text-foreground">{scannedAsset || selectedAsset}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">⚡ Type:</span>
                    <span className={`font-bold flex items-center gap-1 ${signal === 'CALL' ? 'text-primary' : 'text-destructive'}`}>
                      {signal === 'CALL' ? '🟢 BUY/CALL' : '🔴 SELL/PUT'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">⏱ Timeframe:</span>
                    <span className="font-bold text-foreground">M5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">⏰ Start Time:</span>
                    <span className="font-bold text-foreground">
                      {signalData?.entryTime ? format(new Date(signalData.entryTime), 'HH:mm') : '--:--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">🏁 End Time:</span>
                    <span className="font-bold text-foreground">
                      {signalData?.expiryTime ? format(new Date(signalData.expiryTime), 'HH:mm') : '--:--'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] lg:text-xs">
                  <div className="bg-white/5 p-1.5 rounded">
                    <p className="text-muted-foreground text-[9px]">ENTRY</p>
                    <p className="font-bold">{signalData?.entryPrice.toFixed(5)}</p>
                  </div>
                  <div className="bg-white/5 p-1.5 rounded">
                    <p className="text-muted-foreground text-[9px]">CONFIDENCE</p>
                    <p className="font-bold">{confidence}%</p>
                  </div>
                </div>
              </div>

              {lastSignalSent && (
                  <div className="flex items-center gap-2 text-[11px] text-green-400 bg-green-500/10 px-3 py-2 rounded border border-green-500/20 animate-in fade-in">
                     <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                     <span>✅ SIGNAL SENT TO TELEGRAM</span>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}