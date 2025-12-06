import { useState } from 'react';
import { TradingChart } from '@/components/trading-chart';
import { SignalCard } from '@/components/signal-card';
import { MarketAnalysis } from '@/components/market-analysis';
import { AssetList } from '@/components/asset-list';
import { ConnectionModal } from '@/components/connection-modal';
import { RecentSignals } from '@/components/recent-signals';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Bell, Settings, User } from 'lucide-react';

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [isConnected, setIsConnected] = useState(true);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <ConnectionModal />
      
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-black text-background text-xl">P</div>
          <h1 className="font-bold text-xl tracking-tight hidden sm:block">POCKET <span className="text-primary">PRO</span> SIGNALS</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
            <span className="text-xs font-mono text-muted-foreground">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
          </div>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Asset List */}
        <div className="lg:col-span-3 h-[500px] lg:h-auto">
          <AssetList onSelect={setSelectedAsset} selected={selectedAsset} />
        </div>

        {/* Center - Chart & Signals */}
        <div className="lg:col-span-6 space-y-6">
          {/* Chart Section */}
          <TradingChart symbol={selectedAsset} />
          
          {/* Signal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 glass-panel rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
              <span className="text-muted-foreground text-xs font-mono uppercase">Win Rate (24h)</span>
              <div className="text-3xl font-bold text-primary">87.4%</div>
              <div className="w-full h-1 bg-secondary rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary w-[87.4%] shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
              </div>
            </div>

            <div className="p-4 glass-panel rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-all" />
              <span className="text-muted-foreground text-xs font-mono uppercase">Total Signals</span>
              <div className="text-3xl font-bold text-foreground">142</div>
              <div className="flex gap-2 text-xs mt-1">
                <span className="text-primary">124 W</span>
                <span className="text-destructive">18 L</span>
              </div>
            </div>
          </div>

          <RecentSignals />
        </div>

        {/* Right Sidebar - Signal & Analysis */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          <SignalCard />
          <div className="flex-1">
            <MarketAnalysis />
          </div>
        </div>
      </main>
    </div>
  );
}