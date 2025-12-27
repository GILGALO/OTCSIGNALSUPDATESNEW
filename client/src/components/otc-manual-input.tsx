import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OTCManualInputProps {
  selectedAsset?: string;
  onSignalGenerated?: (signal: any) => void;
}

export function OTCManualInput({ selectedAsset = 'EUR/USD', onSignalGenerated }: OTCManualInputProps) {
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signal, setSignal] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || isNaN(parseFloat(price))) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSignal(null);

    try {
      const response = await fetch('/api/generate-signal-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedAsset,
          price: parseFloat(price),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate signal');
        toast.error(data.error || 'Failed to generate signal');
        return;
      }

      if (data.signal) {
        setSignal(data.signal);
        onSignalGenerated?.(data.signal);
        toast.success(`${data.signal.signalType} Signal Generated!`);
      } else {
        setError(data.message || 'No signal generated');
        toast.info(data.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-black/40 border-accent/20">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-accent mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Manual OTC Price Input
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Enter the current Pocket Option OTC price to get an instant trading signal
            </p>
          </div>

          <form onSubmit={handleGenerateSignal} className="space-y-4">
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">
                Trading Pair
              </Label>
              <div className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm font-mono">
                {selectedAsset}
              </div>
            </div>

            <div>
              <Label htmlFor="price" className="text-xs font-bold text-muted-foreground mb-2 block">
                Current OTC Price
              </Label>
              <Input
                id="price"
                type="number"
                placeholder="1.0750"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.0001"
                min="0"
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-foreground"
                data-testid="input-otc-price"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Copy the price directly from Pocket Option OTC chart
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !price}
              className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-bold"
              data-testid="button-generate-signal"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Signal
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-mono">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {signal && (
        <Card className="p-4 bg-black/40 border-primary/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">SIGNAL</span>
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                signal.signalType === 'CALL'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
              data-testid={`badge-signal-${signal.signalType.toLowerCase()}`}
            >
              {signal.signalType}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Confidence</span>
              <p className="font-bold text-primary text-sm">{signal.confidence}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Entry Price</span>
              <p className="font-mono text-sm">{parseFloat(signal.entryPrice).toFixed(5)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Stop Loss</span>
              <p className="font-mono text-sm text-red-400">{parseFloat(signal.stopLoss).toFixed(5)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Take Profit</span>
              <p className="font-mono text-sm text-green-400">{parseFloat(signal.takeProfit).toFixed(5)}</p>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t border-white/10">
            <p>Entry: {new Date(signal.entryTime).toLocaleTimeString()}</p>
            <p>Expiry: {new Date(signal.expiryTime).toLocaleTimeString()}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
