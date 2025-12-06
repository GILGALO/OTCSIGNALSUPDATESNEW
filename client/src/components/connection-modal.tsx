import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// Key for localStorage
const SSID_STORAGE_KEY = 'pocket_option_ssid';
const SSID_EXPIRY_KEY = 'pocket_option_ssid_expiry';

export function ConnectionModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssid, setSsid] = useState('');
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      // Force reload to update app state if needed
      window.location.reload(); 
    }, 1500);
  };

  if (!mounted) return null;
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a0a0a]/95 border border-white/10 shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5" />
              Connect to Pocket Option
            </h2>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Enter your SSID to sync real-time market data.
          </p>

          <div className="flex flex-col gap-4 py-2">
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
          
          <div className="flex justify-end pt-2">
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
        </div>
      </div>
    </div>,
    document.body
  );
}