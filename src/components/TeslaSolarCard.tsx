import { useState } from "react";
import { Zap, Sun, Home, TrendingUp, ArrowLeft, Battery } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";

interface TeslaSolarCardProps {
  powerGenerated: number;
  powerConsumed: number;
  powerExported: number;
  status: "generating" | "storing" | "exporting" | "unavailable";
  powerwallCharging: boolean;
  powerwallCharge: number;
}

const weekData = {
  generated: [
    { name: 'Mon', value: 12.4 },
    { name: 'Tue', value: 15.2 },
    { name: 'Wed', value: 8.1 },
    { name: 'Thu', value: 18.7 },
    { name: 'Fri', value: 16.3 },
    { name: 'Sat', value: 21.5 },
    { name: 'Sun', value: 19.8 }
  ],
  consumed: [
    { name: 'Mon', value: 8.2 },
    { name: 'Tue', value: 9.1 },
    { name: 'Wed', value: 7.8 },
    { name: 'Thu', value: 10.3 },
    { name: 'Fri', value: 11.2 },
    { name: 'Sat', value: 13.4 },
    { name: 'Sun', value: 12.1 }
  ],
  exported: [
    { name: 'Mon', value: 4.2 },
    { name: 'Tue', value: 6.1 },
    { name: 'Wed', value: 0.3 },
    { name: 'Thu', value: 8.4 },
    { name: 'Fri', value: 5.1 },
    { name: 'Sat', value: 8.1 },
    { name: 'Sun', value: 7.7 }
  ]
};

const monthData = {
  generated: [
    { name: 'Week 1', value: 98.5 },
    { name: 'Week 2', value: 112.3 },
    { name: 'Week 3', value: 87.2 },
    { name: 'Week 4', value: 125.8 }
  ],
  consumed: [
    { name: 'Week 1', value: 62.1 },
    { name: 'Week 2', value: 68.4 },
    { name: 'Week 3', value: 59.7 },
    { name: 'Week 4', value: 71.2 }
  ],
  exported: [
    { name: 'Week 1', value: 36.4 },
    { name: 'Week 2', value: 43.9 },
    { name: 'Week 3', value: 27.5 },
    { name: 'Week 4', value: 54.6 }
  ]
};

export function TeslaSolarCard({
  powerGenerated,
  powerConsumed,
  powerExported,
  status,
  powerwallCharging,
  powerwallCharge
}: TeslaSolarCardProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'chart'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'generated' | 'consumed' | 'exported'>('generated');
  const [timePeriod, setTimePeriod] = useState<'week' | 'month'>('week');

  const handleMetricClick = (metric: 'generated' | 'consumed' | 'exported') => {
    setSelectedMetric(metric);
    setViewMode('chart');
  };

  const getChartData = () => {
    return timePeriod === 'week' ? weekData[selectedMetric] : monthData[selectedMetric];
  };

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'generated': return 'hsl(var(--accent))';
      case 'consumed': return 'hsl(var(--muted-foreground))';
      case 'exported': return '#10b981';
      default: return 'hsl(var(--accent))';
    }
  };

  if (viewMode === 'chart') {
    return (
      <div className="device-card col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewMode('overview')}
              className="p-1 h-auto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h3 className="font-semibold capitalize">Power {selectedMetric}</h3>
              <p className="text-xs text-muted-foreground">Historical data</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timePeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('week')}
            >
              Week
            </Button>
            <Button
              variant={timePeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('month')}
            >
              Month
            </Button>
          </div>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number) => [`${value} kWh`, 'Energy']}
              />
              <Bar 
                dataKey="value" 
                fill={getMetricColor()} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  
  return (
    <div className="device-card col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-muted">
          <Sun className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Tesla Solar</h3>
          <p className="text-xs text-muted-foreground capitalize">{status}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <button 
          onClick={() => handleMetricClick('generated')}
          className="text-center hover:bg-muted/50 rounded-lg p-2 transition-colors"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sun className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Generated</span>
          </div>
          <div className="flex items-end justify-center gap-1">
            <span className="text-xl font-bold text-accent">{powerGenerated.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
        </button>

        <button
          onClick={() => handleMetricClick('consumed')}
          className="text-center hover:bg-muted/50 rounded-lg p-2 transition-colors"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Home className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Consumed</span>
          </div>
          <div className="flex items-end justify-center gap-1">
            <span className="text-xl font-bold text-accent">{powerConsumed.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
        </button>

        <button
          onClick={() => handleMetricClick('exported')}
          className="text-center hover:bg-muted/50 rounded-lg p-2 transition-colors"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Exported</span>
          </div>
          <div className="flex items-end justify-center gap-1">
            <span className="text-xl font-bold text-accent">{powerExported.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
        </button>
      </div>
      
      <div className="pt-3 mt-4 border-t border-border ml-2 pl-2">
        <div className="flex items-center gap-2 text-sm mb-1">
          <span className="text-muted-foreground">Powerwall Status:</span>
          <span className={`font-medium ${powerwallCharging ? 'text-accent' : 'text-muted-foreground'}`}>
            {powerwallCharging ? 'Charging' : 'Not Charging'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Current Charge:</span>
          <span className="font-medium text-accent">{powerwallCharge}%</span>
        </div>
      </div>
    </div>
  );
}