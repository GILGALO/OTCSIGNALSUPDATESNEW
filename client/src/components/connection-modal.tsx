
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ConnectionModal() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showModal, setShowModal] = useState(!navigator.onLine);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [ssid, setSsid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const savedSsid = localStorage.getItem('pocket_option_ssid');
    if (!savedSsid) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => setShowModal(false), 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowModal(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleConnect = async () => {
    if (!ssid && (!email || !password)) return;
    setIsConnecting(true);
    
    try {
      const response = await fetch('/api/validate-ssid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, email, password }),
      });
      
      const data = await response.json();
      
      if (data.valid) {
        localStorage.setItem('pocket_option_ssid', ssid);
        if (email) localStorage.setItem('pocket_option_email', email);
        if (password) localStorage.setItem('pocket_option_password', password);
        
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        localStorage.setItem('pocket_option_ssid_expiry', expiryDate.toISOString());
        
        setIsOpen(false);
      } else {
        alert(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOnline) {
    return (
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-red-500" />
              Connection Lost
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <p className="text-sm text-muted-foreground">
                Please check your internet connection and try again.
              </p>
              <Badge variant="destructive" className="w-fit">
                Offline
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-black text-background text-2xl shadow-[0_0_20px_rgba(var(--primary),0.5)]">P</div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight">CONNECT ACCOUNT</DialogTitle>
              <DialogDescription className="text-muted-foreground font-mono text-[10px] tracking-widest uppercase">Pocket Option Market Data Link</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase tracking-widest text-primary">Pocket Option SSID</Label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-primary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <Input
                placeholder="Enter your SSID..."
                className="bg-black/50 border-white/10 font-mono text-sm relative"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
              />
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink mx-4 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">OR CREDENTIALS</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="Account email"
                className="bg-black/50 border-white/10 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Password</Label>
              <Input
                type="password"
                placeholder="Password"
                className="bg-black/50 border-white/10 text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary tracking-tight">SECURE CONNECTION</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Your credentials are used locally to establish a browser session and are never shared with 3rd parties.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-background font-black tracking-wide py-6 text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)]"
            disabled={isConnecting}
            onClick={handleConnect}
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                LINKING...
              </div>
            ) : (
              'ESTABLISH LINK'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
