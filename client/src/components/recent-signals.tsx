import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const HISTORY = [
  { time: '14:32:05', pair: 'EUR/USD', type: 'CALL', price: 1.0845, result: 'WIN', profit: '+$184' },
  { time: '14:30:12', pair: 'GBP/USD', type: 'PUT', price: 1.2630, result: 'WIN', profit: '+$176' },
  { time: '14:28:45', pair: 'USD/JPY', type: 'CALL', price: 151.20, result: 'LOSS', profit: '-$200' },
  { time: '14:25:30', pair: 'EUR/USD', type: 'PUT', price: 1.0855, result: 'WIN', profit: '+$184' },
  { time: '14:22:15', pair: 'AUD/CAD', type: 'CALL', price: 0.8940, result: 'WIN', profit: '+$164' },
];

export function RecentSignals() {
  return (
    <Card className="glass-panel overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-bold text-lg">Signal History</h3>
        <Badge variant="outline" className="text-xs font-mono">LAST 5 TRADES</Badge>
      </div>
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-xs uppercase">Time</TableHead>
            <TableHead className="text-xs uppercase">Pair</TableHead>
            <TableHead className="text-xs uppercase">Type</TableHead>
            <TableHead className="text-xs uppercase">Price</TableHead>
            <TableHead className="text-xs uppercase text-right">Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {HISTORY.map((trade, i) => (
            <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
              <TableCell className="font-mono text-xs text-muted-foreground">{trade.time}</TableCell>
              <TableCell className="font-bold text-xs">{trade.pair}</TableCell>
              <TableCell>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${trade.type === 'CALL' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                  {trade.type}
                </span>
              </TableCell>
              <TableCell className="font-mono text-xs">{trade.price.toFixed(4)}</TableCell>
              <TableCell className="text-right">
                <span className={`text-xs font-bold ${trade.result === 'WIN' ? 'text-primary' : 'text-destructive'}`}>
                  {trade.profit}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}