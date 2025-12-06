import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

// Key for localStorage
const SSID_STORAGE_KEY = 'pocket_option_ssid';
const SSID_EXPIRY_KEY = 'pocket_option_ssid_expiry';

export function ConnectionModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssid, setSsid] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check for saved SSID
    const savedSsid = localStorage.getItem(SSID_STORAGE_KEY);
    const expiry = localStorage.getItem(SSID_EXPIRY_KEY);

    if (!savedSsid || !expiry) {
      setOpen(true);
      return;
    }

    const expiryDate = new Date(expiry);
    if (new Date() > expiryDate) {
      // Expired
      localStorage.removeItem(SSID_STORAGE_KEY);
      localStorage.removeItem(SSID_EXPIRY_KEY);
      setError('Session expired. Please reconnect.');
      setOpen(true);
    } else {
      // Valid session
      setSsid(savedSsid);
      setOpen(false);
    }
  }, []);

  const handleConnect = () => {
    if (!ssid) {
      setError('Please enter a valid SSID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // Simulate connection validation
    setTimeout(() => {
      setLoading(false);
      
      // Save to localStorage with 30 day expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      localStorage.setItem(SSID_STORAGE_KEY, ssid);
      localStorage.setItem(SSID_EXPIRY_KEY, expiryDate.toISOString());
      
      setOpen(false);
      // Force reload to update app state if needed, or better, use a context/global state
      window.location.reload(); 
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
        // Prevent closing if no valid SSID
        if (!val && localStorage.getItem(SSID_STORAGE_KEY)) {
            setOpen(val);
        }
    }}>
      <DialogContent className="sm:max-w-md border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
            <ShieldCheck className="w-5 h-5" />
            Connect to Pocket Option
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your SSID to sync real-time market data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ssid" className="text-xs uppercase text-muted-foreground">Pocket Option SSID</Label>
            <Input 
              id="ssid" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..." 
              className="font-mono text-xs bg-secondary/50 border-white/10 h-12 text-foreground"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
            />
            {error && (
                <div className="flex items-center gap-2 text-destructive text-xs mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                </div>
            )}
          </div>
          <div className="p-3 rounded bg-primary/10 border border-primary/20 text-xs text-primary/80">
            Note: Your SSID is saved locally and will auto-connect until expiration.
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleConnect} disabled={loading || !ssid} className="w-full font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              'CONNECT ACCOUNT'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}