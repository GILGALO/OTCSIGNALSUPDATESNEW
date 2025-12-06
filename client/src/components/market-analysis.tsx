import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function MarketAnalysis() {
  return (
    <Card className="p-4 glass-panel space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Technical Analysis</h3>
        <Badge variant="outline" className="font-mono text-xs border-accent text-accent bg-accent/10">ACTIVE</Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Indicator name="RSI (14)" value="68.5" status="BUY" color="text-primary" />
        <Indicator name="Stoch (5,3,3)" value="82.1" status="SELL" color="text-destructive" />
        <Indicator name="CCI (20)" value="105.4" status="BUY" color="text-primary" />
        <Indicator name="Bollinger" value="UPPER" status="SELL" color="text-destructive" />
        <Indicator name="MACD" value="0.0045" status="BUY" color="text-primary" />
        <Indicator name="Momentum" value="100.2" status="NEUTRAL" color="text-muted-foreground" />
      </div>

      <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Trend Strength</span>
          <span className="text-xs font-bold text-accent">STRONG</span>
        </div>
        <div className="flex gap-1 h-1.5">
          <div className="flex-1 bg-primary rounded-l-full opacity-80"></div>
          <div className="flex-1 bg-primary opacity-60"></div>
          <div className="flex-1 bg-primary opacity-40"></div>
          <div className="flex-1 bg-secondary opacity-20"></div>
          <div className="flex-1 bg-secondary rounded-r-full opacity-20"></div>
        </div>
      </div>
    </Card>
  );
}

function Indicator({ name, value, status, color }: { name: string, value: string, status: string, color: string }) {
  return (
    <div className="flex flex-col gap-1 p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
      <span className="text-xs text-muted-foreground font-mono">{name}</span>
      <div className="flex justify-between items-end">
        <span className="font-mono font-bold text-sm">{value}</span>
        <span className={`text-xs font-bold ${color}`}>{status}</span>
      </div>
    </div>
  );
}