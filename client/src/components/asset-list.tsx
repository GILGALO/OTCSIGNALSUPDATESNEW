import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Star } from 'lucide-react';

const ASSETS = [
  // Major Pairs
  { pair: 'EUR/USD', payout: '92%', status: 'up' },
  { pair: 'GBP/USD', payout: '88%', status: 'down' },
  { pair: 'USD/JPY', payout: '85%', status: 'up' },
  { pair: 'USD/CHF', payout: '78%', status: 'up' },
  { pair: 'AUD/USD', payout: '89%', status: 'up' },
  { pair: 'NZD/USD', payout: '80%', status: 'down' },
  { pair: 'CAD/USD', payout: '81%', status: 'down' },
  { pair: 'USD/CAD', payout: '86%', status: 'up' },
  
  // USD Crosses
  { pair: 'USD/CNY', payout: '84%', status: 'up' },
  { pair: 'USD/HKD', payout: '83%', status: 'down' },
  { pair: 'USD/SGD', payout: '82%', status: 'up' },
  { pair: 'USD/INR', payout: '79%', status: 'down' },
  { pair: 'USD/MXN', payout: '81%', status: 'up' },
  { pair: 'USD/ZAR', payout: '77%', status: 'down' },
  { pair: 'USD/TRY', payout: '76%', status: 'up' },
  { pair: 'USD/BRL', payout: '75%', status: 'down' },
  
  // EUR Crosses
  { pair: 'EUR/GBP', payout: '85%', status: 'up' },
  { pair: 'EUR/JPY', payout: '90%', status: 'up' },
  { pair: 'EUR/CHF', payout: '83%', status: 'down' },
  { pair: 'EUR/CAD', payout: '88%', status: 'up' },
  { pair: 'EUR/AUD', payout: '87%', status: 'up' },
  { pair: 'EUR/NZD', payout: '84%', status: 'down' },
  { pair: 'EUR/SEK', payout: '82%', status: 'up' },
  { pair: 'EUR/NOK', payout: '81%', status: 'down' },
  { pair: 'EUR/GHS', payout: '80%', status: 'up' },
  
  // GBP Crosses
  { pair: 'GBP/JPY', payout: '87%', status: 'up' },
  { pair: 'GBP/CHF', payout: '79%', status: 'down' },
  { pair: 'GBP/CAD', payout: '85%', status: 'down' },
  { pair: 'GBP/AUD', payout: '86%', status: 'up' },
  { pair: 'GBP/NZD', payout: '83%', status: 'down' },
  { pair: 'GBP/SEK', payout: '81%', status: 'up' },
  
  // JPY Crosses
  { pair: 'AUD/JPY', payout: '82%', status: 'down' },
  { pair: 'CAD/JPY', payout: '83%', status: 'down' },
  { pair: 'CHF/JPY', payout: '80%', status: 'up' },
  { pair: 'NZD/JPY', payout: '84%', status: 'up' },
  { pair: 'SGD/JPY', payout: '81%', status: 'down' },
  { pair: 'HKD/JPY', payout: '79%', status: 'up' },
  
  // AUD Crosses
  { pair: 'AUD/CAD', payout: '82%', status: 'down' },
  { pair: 'AUD/CHF', payout: '80%', status: 'up' },
  { pair: 'AUD/NZD', payout: '84%', status: 'down' },
  { pair: 'AUD/SGD', payout: '83%', status: 'up' },
  { pair: 'AUD/HKD', payout: '82%', status: 'down' },
  
  // CAD Crosses
  { pair: 'CAD/CHF', payout: '79%', status: 'up' },
  { pair: 'CAD/AUD', payout: '81%', status: 'down' },
  { pair: 'CAD/NZD', payout: '80%', status: 'up' },
  
  // NZD Crosses
  { pair: 'NZD/CAD', payout: '83%', status: 'down' },
  { pair: 'NZD/CHF', payout: '81%', status: 'up' },
  { pair: 'NZD/SGD', payout: '82%', status: 'down' },
  
  // CHF Crosses
  { pair: 'CHF/CAD', payout: '78%', status: 'up' },
  { pair: 'CHF/SGD', payout: '79%', status: 'down' },
  
  // Other Exotic Pairs
  { pair: 'SGD/CAD', payout: '80%', status: 'up' },
  { pair: 'HKD/CAD', payout: '79%', status: 'down' },
  { pair: 'SEK/USD', payout: '83%', status: 'up' },
  { pair: 'NOK/USD', payout: '82%', status: 'down' },
  { pair: 'ZAR/USD', payout: '80%', status: 'up' },
  { pair: 'MXN/USD', payout: '81%', status: 'down' },
  { pair: 'TRY/USD', payout: '78%', status: 'up' },
  { pair: 'BRL/USD', payout: '77%', status: 'down' },
  { pair: 'INR/USD', payout: '81%', status: 'up' },
  { pair: 'CNY/USD', payout: '83%', status: 'down' },
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