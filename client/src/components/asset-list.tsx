import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

const ASSETS = [
  { pair: 'EUR/USD', payout: '92%', status: 'up' },
  { pair: 'GBP/USD', payout: '88%', status: 'down' },
  { pair: 'USD/JPY', payout: '85%', status: 'up' },
  { pair: 'AUD/CAD', payout: '82%', status: 'down' },
  { pair: 'EUR/JPY', payout: '90%', status: 'up' },
  { pair: 'USD/CHF', payout: '78%', status: 'up' },
  { pair: 'NZD/USD', payout: '80%', status: 'down' },
  { pair: 'EUR/GBP', payout: '85%', status: 'up' },
];

export function AssetList({ onSelect, selected }: { onSelect: (pair: string) => void, selected: string }) {
  return (
    <Card className="h-full glass-panel flex flex-col">
      <div className="p-3 lg:p-4 border-b border-white/10">
        <h3 className="font-bold text-lg">Assets OTC</h3>
        <p className="text-xs text-muted-foreground">Real-time Payouts</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1 lg:space-y-2">
          {ASSETS.map((asset) => (
            <button
              key={asset.pair}
              onClick={() => onSelect(asset.pair)}
              className={`w-full flex items-center justify-between p-2 lg:p-3 rounded-lg transition-all border text-sm lg:text-base ${
                selected === asset.pair 
                  ? 'bg-sidebar-primary/20 border-sidebar-primary' 
                  : 'hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Star className={`w-4 h-4 ${selected === asset.pair ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                <div className="flex flex-col items-start">
                  <span className="font-bold font-mono">{asset.pair}</span>
                  <span className="text-xs text-muted-foreground">OTC Market</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-primary">{asset.payout}</span>
                {asset.status === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-primary" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}