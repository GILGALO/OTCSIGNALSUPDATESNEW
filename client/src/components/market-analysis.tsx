import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart2, TrendingUp, Gauge } from 'lucide-react';

export function MarketAnalysis() {
  return (
    <Card className="p-4 glass-panel space-y-5 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg tracking-tight">AI Analysis</h3>
        </div>
        <Badge variant="outline" className="font-mono text-[10px] border-accent text-accent bg-accent/10 animate-pulse">LIVE DATA</Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Oscillators */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-2">
            <BarChart2 className="w-3 h-3" /> Oscillators
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Indicator name="RSI (14)" value="68.5" status="BUY" color="text-primary" score={85} />
            <Indicator name="Stoch (5,3,3)" value="82.1" status="SELL" color="text-destructive" score={70} />
            <Indicator name="CCI (20)" value="105.4" status="STRONG BUY" color="text-primary" score={95} />
            <Indicator name="MACD" value="0.004" status="BUY" color="text-primary" score={60} />
          </div>
        </div>

        {/* Moving Averages */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Moving Averages
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Indicator name="EMA (10)" value="1.0845" status="BUY" color="text-primary" score={80} />
            <Indicator name="SMA (20)" value="1.0840" status="BUY" color="text-primary" score={75} />
            <Indicator name="EMA (50)" value="1.0830" status="BUY" color="text-primary" score={65} />
            <Indicator name="SMA (200)" value="1.0810" status="STRONG BUY" color="text-primary" score={90} />
          </div>
        </div>

        {/* Volatility & Sentiment */}
        <div className="p-3 rounded-lg bg-gradient-to-br from-secondary/50 to-transparent border border-white/5 space-y-3">
           <div className="flex justify-between items-center">
             <span className="text-xs font-mono text-muted-foreground">MARKET SENTIMENT</span>
             <span className="text-xs font-bold text-primary">BULLISH (82%)</span>
           </div>
           <div className="w-full bg-secondary/50 h-1.5 rounded-full overflow-hidden flex">
             <div className="h-full bg-primary w-[82%] shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
             <div className="h-full bg-destructive w-[18%]" />
           </div>
           
           <div className="grid grid-cols-2 gap-4 pt-2">
             <div className="bg-black/20 p-2 rounded border border-white/5 text-center">
               <div className="text-[10px] text-muted-foreground uppercase">Volatility</div>
               <div className="text-sm font-bold text-accent">HIGH</div>
             </div>
             <div className="bg-black/20 p-2 rounded border border-white/5 text-center">
               <div className="text-[10px] text-muted-foreground uppercase">Order Flow</div>
               <div className="text-sm font-bold text-primary">+1.2M VOL</div>
             </div>
           </div>
        </div>
      </div>
    </Card>
  );
}

function Indicator({ name, value, status, color, score }: { name: string, value: string, status: string, color: string, score: number }) {
  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded bg-card/50 border border-white/5 hover:bg-white/10 transition-all group">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground font-mono group-hover:text-white transition-colors">{name}</span>
        <span className={`text-[10px] font-black ${color} bg-white/5 px-1.5 py-0.5 rounded`}>{status}</span>
      </div>
      <div className="flex justify-between items-end">
        <span className="font-mono font-bold text-sm tracking-tight">{value}</span>
        {/* Mini Score Bar */}
        <div className="w-8 h-1 bg-secondary rounded-full">
          <div className={`h-full rounded-full ${status.includes('BUY') ? 'bg-primary' : status.includes('SELL') ? 'bg-destructive' : 'bg-gray-500'}`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}