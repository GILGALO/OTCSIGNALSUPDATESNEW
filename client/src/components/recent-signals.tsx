import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Signal {
  id: string;
  symbol: string;
  type: 'CALL' | 'PUT';
  source: 'AUTO' | 'MANUAL';
  entryPrice: number;
  createdAt: string;
}

export function RecentSignals({ selectedAsset = 'EUR/USD' }: { selectedAsset?: string }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch(`/api/signals/${selectedAsset}?limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSignals(data.signals);
        }
      } catch (err) {
        console.error('Failed to fetch signals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
  }, [selectedAsset]);

  return (
    <Card className="glass-panel overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-bold text-lg">Signal History</h3>
        <Badge variant="outline" className="text-xs font-mono">LAST 5 SIGNALS</Badge>
      </div>
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-xs uppercase">Time</TableHead>
            <TableHead className="text-xs uppercase">Pair</TableHead>
            <TableHead className="text-xs uppercase">Type</TableHead>
            <TableHead className="text-xs uppercase">Source</TableHead>
            <TableHead className="text-xs uppercase">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="border-white/5">
              <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                Loading signals...
              </TableCell>
            </TableRow>
          ) : signals.length === 0 ? (
            <TableRow className="border-white/5">
              <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-4">
                No signals yet
              </TableCell>
            </TableRow>
          ) : (
            signals.map((signal) => (
              <TableRow key={signal.id} className="border-white/5 hover:bg-white/5 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {format(new Date(signal.createdAt), 'HH:mm:ss')}
                </TableCell>
                <TableCell className="font-bold text-xs">{signal.symbol}</TableCell>
                <TableCell>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${signal.type === 'CALL' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                    {signal.type}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] font-mono ${signal.source === 'AUTO' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-accent/10 text-accent border-accent/20'}`}>
                    {signal.source}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{signal.entryPrice.toFixed(5)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}