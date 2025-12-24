import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';

// Mock data generator
const generateData = (count: number) => {
  const data = [];
  let price = 1.0850;
  for (let i = 0; i < count; i++) {
    price = price + (Math.random() - 0.5) * 0.0010;
    data.push({
      time: new Date(Date.now() - (count - i) * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: Number(price.toFixed(5)),
    });
  }
  return data;
};

export function TradingChart({ symbol = "EUR/USD" }: { symbol?: string }) {
  const [data, setData] = useState(generateData(60));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const lastPrice = prev[prev.length - 1].price;
        const newPrice = lastPrice + (Math.random() - 0.5) * 0.0005;
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          price: Number(newPrice.toFixed(5))
        };
        return [...prev.slice(1), newPoint];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentPrice = data[data.length - 1].price;
  const isUp = data[data.length - 1].price > data[data.length - 2].price;

  return (
    <Card className="w-full h-[300px] lg:h-[400px] p-4 glass-panel border-none bg-black/40 relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-baseline gap-3">
        <h3 className="text-2xl font-bold tracking-tight text-white">{symbol} OTC</h3>
        <span className={`text-lg font-mono font-bold ${isUp ? 'text-primary drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]' : 'text-destructive drop-shadow-[0_0_8px_rgba(255,0,85,0.5)]'}`}>
          {currentPrice.toFixed(5)}
        </span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Live Market Data</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            tickLine={false}
            axisLine={false}
            interval={10}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right"
            stroke="rgba(255,255,255,0.2)" 
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val.toFixed(5)}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff', fontFamily: 'JetBrains Mono' }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}