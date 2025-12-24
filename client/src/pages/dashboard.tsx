import { useState, useEffect } from 'react';
import { TradingChart } from '@/components/trading-chart';
import { SignalCard } from '@/components/signal-card';
import { MarketAnalysis } from '@/components/market-analysis';
import { AssetList } from '@/components/asset-list';
import { ConnectionModal } from '@/components/connection-modal';
import { SettingsPanel } from '@/components/settings-panel';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Settings, User, Zap, Timer, Shield, Activity } from 'lucide-react';
import bgImage from '@assets/generated_images/deep_cyber_blue_and_purple_futuristic_data_background.png';

export default function Dashboard() {
  const [selectedAsset, setSelectedAsset] = useState('EUR/USD');
  const [ssid, setSsid] = useState('');
  const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [isAutoActive, setIsAutoActive] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState<'signal' | 'assets' | 'chart' | 'analysis'>('signal');

  useEffect(() => {
    const savedSsid = localStorage.getItem('pocket_option_ssid');
    if (savedSsid) {
      setSsid(savedSsid);
    }
  }, []);

  const handleSsidChange = (newSsid: string) => {
      setSsid(newSsid);
      localStorage.setItem('pocket_option_ssid', newSsid);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      localStorage.setItem('pocket_option_ssid_expiry', expiryDate.toISOString());
  };

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
    <div className="min-h-screen bg-transparent text-foreground flex flex-col font-sans selection:bg-primary/30">
      <div className="scan-line fixed inset-0 pointer-events-none z-50"></div>
      <ConnectionModal />
      <SettingsPanel 
        open={showSettings} 
        onOpenChange={setShowSettings} 
        currentSsid={ssid}
        onSaveSsid={handleSsidChange}
      />
      
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/70 backdrop-blur-xl sticky top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-black text-background text-xl shadow-[0_0_20px_rgba(var(--primary),0.5)] glow-box-primary">P</div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-none text-white">POCKET <span className="text-primary text-neon-blue">PRO</span></h1>
            <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase flex items-center gap-1">
                <Activity className="w-3 h-3 text-primary" /> AI Trading Assistant
            </span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-6 bg-secondary/30 p-2 rounded-xl border border-white/5 backdrop-blur-md">
           
           <div className="flex items-center gap-2">
               <button 
                onClick={() => setMode('AUTO')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'AUTO' ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]' : 'text-muted-foreground hover:text-foreground'}`}
               >
                <Timer className="w-3 h-3" /> AUTO
               </button>
               <button 
                onClick={() => setMode('MANUAL')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${mode === 'MANUAL' ? 'bg-accent text-accent-foreground shadow-[0_0_15px_rgba(var(--accent),0.4)]' : 'text-muted-foreground hover:text-foreground'}`}
               >
                <Zap className="w-3 h-3" /> MANUAL
               </button>
           </div>

           {mode === 'AUTO' && (
               <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                   <Switch 
                    id="auto-active" 
                    checked={isAutoActive}
                    onCheckedChange={setIsAutoActive}
                    className="data-[state=checked]:bg-primary"
                   />
                   <Label htmlFor="auto-active" className={`text-xs font-mono font-bold ${isAutoActive ? 'text-primary text-neon-blue' : 'text-muted-foreground'}`}>
                       {isAutoActive ? 'ACTIVE' : 'PAUSED'}
                   </Label>
               </div>
           )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-muted-foreground">SSID: <span className="text-primary">{ssid ? `...${ssid.slice(-4)}` : 'N/A'}</span></span>
          </div>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full">
            <Bell className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 border border-white/10 flex items-center justify-center ring-2 ring-white/5">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full z-10 overflow-hidden flex flex-col">
        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-3 gap-4 p-6 flex-1 max-w-[1600px] mx-auto w-full">
          <div className="flex flex-col gap-4">
            <AssetList onSelect={setSelectedAsset} selected={selectedAsset} />
          </div>

          <div className="flex flex-col gap-4">
            <SignalCard mode={mode} isAutoActive={isAutoActive} selectedAsset={selectedAsset} />
            <MarketAnalysis />
          </div>

          <div className="flex flex-col gap-4">
            <TradingChart symbol={selectedAsset} />
          </div>
        </div>

        {/* Mobile Layout with Tabs */}
        <div className="lg:hidden flex flex-col h-full">
          {/* Mobile Tab Navigation */}
          <div className="flex gap-1 p-3 bg-black/40 border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => setMobileTab('signal')}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                mobileTab === 'signal' 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]' 
                  : 'text-muted-foreground hover:text-foreground bg-white/5'
              }`}
            >
              Signal
            </button>
            <button
              onClick={() => setMobileTab('assets')}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                mobileTab === 'assets' 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]' 
                  : 'text-muted-foreground hover:text-foreground bg-white/5'
              }`}
            >
              Assets
            </button>
            <button
              onClick={() => setMobileTab('chart')}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                mobileTab === 'chart' 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]' 
                  : 'text-muted-foreground hover:text-foreground bg-white/5'
              }`}
            >
              Chart
            </button>
            <button
              onClick={() => setMobileTab('analysis')}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                mobileTab === 'analysis' 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]' 
                  : 'text-muted-foreground hover:text-foreground bg-white/5'
              }`}
            >
              Analysis
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            {mobileTab === 'signal' && (
              <SignalCard mode={mode} isAutoActive={isAutoActive} selectedAsset={selectedAsset} />
            )}
            {mobileTab === 'assets' && (
              <AssetList onSelect={setSelectedAsset} selected={selectedAsset} />
            )}
            {mobileTab === 'chart' && (
              <div className="h-full">
                <TradingChart symbol={selectedAsset} />
              </div>
            )}
            {mobileTab === 'analysis' && (
              <MarketAnalysis />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}