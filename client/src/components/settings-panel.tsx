import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { ShieldCheck, Key, Clock, AlertTriangle, X, Send } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { createPortal } from 'react-dom';

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSsid: (ssid: string) => void;
  currentSsid: string;
}

export function SettingsPanel({ open, onOpenChange, onSaveSsid, currentSsid }: SettingsPanelProps) {
  const [ssid, setSsid] = useState(currentSsid);
  const [telegramToken, setTelegramToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [expiration, setExpiration] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (currentSsid) {
      setExpiration(addDays(new Date(), 30));
    }
    setSsid(currentSsid);
    
    // Load saved telegram settings
    const savedToken = localStorage.getItem('telegram_bot_token');
    const savedChannel = localStorage.getItem('telegram_channel_id');
    if (savedToken) setTelegramToken(savedToken);
    if (savedChannel) setChannelId(savedChannel);
  }, [currentSsid]);

  const handleSave = () => {
    onSaveSsid(ssid);
    
    // Save telegram settings
    if (telegramToken) localStorage.setItem('telegram_bot_token', telegramToken);
    if (channelId) localStorage.setItem('telegram_channel_id', channelId);
    
    setExpiration(addDays(new Date(), 30));
    onOpenChange(false);
  };

  if (!mounted) return null;
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0a0a0a]/95 border border-white/10 shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
              <SettingsIcon className="w-5 h-5" />
              System Configuration
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure your connection settings.
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Pocket Option Settings */}
            <div className="space-y-2">
              <Label htmlFor="ssid" className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
                <Key className="w-3 h-3" /> 
                Pocket Option SSID
              </Label>
              <div className="relative">
                <Input 
                  id="ssid" 
                  placeholder="Enter your SSID..." 
                  className="font-mono text-xs bg-secondary/50 border-white/10 h-10 pr-10 text-accent text-foreground"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                />
                <ShieldCheck className="absolute right-3 top-3 w-4 h-4 text-green-500 opacity-50" />
              </div>
            </div>

            {/* Telegram Settings */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <Label className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
                <Send className="w-3 h-3" /> 
                Telegram Integration
              </Label>
              
              <div className="space-y-2">
                <Input 
                  placeholder="Bot Token (e.g., 12345:ABC-DEF...)" 
                  className="font-mono text-xs bg-secondary/50 border-white/10 h-9 text-foreground"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                />
                <Input 
                  placeholder="Channel ID (e.g., -100123456789)" 
                  className="font-mono text-xs bg-secondary/50 border-white/10 h-9 text-foreground"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                />
              </div>
            </div>

            {expiration && ssid && (
              <div className="p-3 rounded bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-primary">Session Active</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Expires on: <span className="text-foreground">{format(expiration, 'PPP p')}</span>
                  </p>
                </div>
              </div>
            )}
            
            {!ssid && (
               <div className="p-3 rounded bg-destructive/5 border border-destructive/20 flex items-start gap-3">
               <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
               <div className="space-y-1">
                 <h4 className="text-xs font-bold text-destructive">Disconnected</h4>
                 <p className="text-[10px] text-muted-foreground font-mono">
                   Please enter a valid SSID to enable signal generation.
                 </p>
               </div>
             </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-white/10 hover:bg-white/5 text-xs">Cancel</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold tracking-wide">
              SAVE CONFIGURATION
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.09a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.09a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}