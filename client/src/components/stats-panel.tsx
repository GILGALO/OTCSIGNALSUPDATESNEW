import { Card } from '@/components/ui/card';
import { TrendingUp, Award, Activity, Layers } from 'lucide-react';

export function StatsPanel() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard 
        icon={<Award className="w-5 h-5 text-primary" />}
        label="Win Rate"
        value="87.4%"
        subValue="+2.4% today"
        color="primary"
      />
      <StatCard 
        icon={<TrendingUp className="w-5 h-5 text-accent" />}
        label="Total Profit"
        value="$4,293"
        subValue="Live Account"
        color="accent"
      />
      <StatCard 
        icon={<Activity className="w-5 h-5 text-orange-400" />}
        label="Signals Generated"
        value="142"
        subValue="24h Period"
        color="orange"
      />
      <StatCard 
        icon={<Layers className="w-5 h-5 text-purple-400" />}
        label="Active Assets"
        value="12"
        subValue="OTC Markets"
        color="purple"
      />
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color }: any) {
  return (
    <Card className="p-4 glass-panel border-none relative overflow-hidden group hover:bg-white/5 transition-colors">
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
        {icon}
      </div>
      <div className="space-y-2 relative z-10">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
        </div>
        <div>
          <div className="text-2xl font-black tracking-tight">{value}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{subValue}</div>
        </div>
      </div>
    </Card>
  );
}