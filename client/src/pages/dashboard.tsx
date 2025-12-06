import { useState, useEffect } from 'react';
import { TradingChart } from '@/components/trading-chart';
import { SignalCard } from '@/components/signal-card';
import { MarketAnalysis } from '@/components/market-analysis';
import { AssetList } from '@/components/asset-list';
import { ConnectionModal } from '@/components/connection-modal';
import { RecentSignals } from '@/components/recent-signals';
import { SettingsPanel } from '@/components/settings-panel';
import { StatsPanel } from '@/components/stats-panel';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Bell, Settings, User, Zap, Timer, Shield } from 'lucide-react';
import bgImage from '@assets/generated_images/dark_futuristic_fintech_trading_background.png';

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [isConnected, setIsConnected] = useState(true);
  const [ssid, setSsid] = useState('ArmnzVp0xR-_NrLWs');
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [showSettings, setShowSettings] = useState(false);

  // Apply background image to body
  useEffect(() => {
    document.body.style.backgroundImage = `url(${bgImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundAttachment = 'fixed';
    return () => {
      document.body.style.backgroundImage = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-black/80 backdrop-blur-[2px] text-foreground flex flex-col font-sans selection:bg-primary/30">
      <ConnectionModal />
      <SettingsPanel 
        open={showSettings} 
        onOpenChange={setShowSettings} 
        currentSsid={ssid}
        onSaveSsid={setSsid}
      />
      
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-green-700 flex items-center justify-center font-black text-background text-xl shadow-[0_0_15px_rgba(0,255,157,0.3)]">P</div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none">POCKET <span className="text-primary">PRO</span></h1>
            <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">AI Trading Assistant</span>
          </div>
        </div>
        
        {/* Mode Switcher */}
        <div className="hidden md:flex items-center bg-secondary/50 p-1 rounded-lg border border-white/5">
          <button 
            onClick={() => setMode('AUTO')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${mode === 'AUTO' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Timer className="w-3 h-3" /> AUTO
          </button>
          <button 
             onClick={() => setMode('MANUAL')}
             className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${mode === 'MANUAL' ? 'bg-accent text-accent-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Zap className="w-3 h-3" /> MANUAL
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-muted-foreground">SSID: <span className="text-primary">...{ssid.slice(-4)}</span></span>
          </div>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/5">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/5" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Left Sidebar - Asset List */}
        <div className="lg:col-span-3 h-full flex flex-col gap-4">
          <div className="flex-1 min-h-[400px]">
             <AssetList onSelect={setSelectedAsset} selected={selectedAsset} />
          </div>
        </div>

        {/* Center - Chart & Stats */}
        <div className="lg:col-span-6 space-y-6">
          <StatsPanel />
          
          {/* Chart Section */}
          <TradingChart symbol={selectedAsset} />
          
          <RecentSignals />
        </div>

        {/* Right Sidebar - Signal & Analysis */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          <SignalCard mode={mode} />
          <div className="flex-1">
            <MarketAnalysis />
          </div>
        </div>
      </main>
    </div>
  );
}