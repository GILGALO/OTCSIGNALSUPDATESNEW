import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

export function ConnectionModal() {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [ssid, setSsid] = useState('');

  const handleConnect = () => {
    setLoading(true);
    // Simulate connection delay
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border border-white/10 bg-[#0a0a0a] backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-primary w-5 h-5" />
            Connect to Pocket Option
          </DialogTitle>
          <DialogDescription>
            Enter your SSID to sync real-time market data and enable auto-trading.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ssid" className="text-xs uppercase text-muted-foreground">Pocket Option SSID</Label>
            <Input 
              id="ssid" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..." 
              className="font-mono text-xs bg-secondary/50 border-white/10 h-12"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
            />
          </div>
          <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
            Note: Your SSID is processed locally. We do not store your credentials.
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleConnect} disabled={loading || !ssid} className="w-full font-bold tracking-wide">
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