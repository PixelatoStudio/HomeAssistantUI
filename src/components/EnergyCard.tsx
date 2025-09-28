import { Zap, TrendingDown, TrendingUp } from "lucide-react";

interface EnergyCardProps {
  currentUsage: number;
  dailyUsage: number;
  weeklyTrend: "up" | "down";
  cost: number;
}

export function EnergyCard({ currentUsage, dailyUsage, weeklyTrend, cost }: EnergyCardProps) {
  return (
    <div className="device-card">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-muted">
          <Zap className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Energy Usage</h3>
          <p className="text-xs text-muted-foreground">Real-time monitoring</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-accent">{currentUsage}</span>
            <span className="text-sm text-muted-foreground">kW</span>
          </div>
          <p className="text-xs text-muted-foreground">Current consumption</p>
        </div>
        
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Daily</span>
            <span className="font-medium">{dailyUsage} kWh</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Cost</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">${cost}</span>
              {weeklyTrend === "up" ? (
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <TrendingDown className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}