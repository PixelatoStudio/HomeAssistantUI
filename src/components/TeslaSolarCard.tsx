import { Zap, Sun, Home, TrendingUp } from "lucide-react";

interface TeslaSolarCardProps {
  powerGenerated: number;
  powerConsumed: number;
  powerExported: number;
  status: "generating" | "storing" | "exporting";
}

export function TeslaSolarCard({ 
  powerGenerated, 
  powerConsumed, 
  powerExported, 
  status 
}: TeslaSolarCardProps) {
  const netPower = powerGenerated - powerConsumed;
  
  return (
    <div className="device-card col-span-2">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-muted">
          <Sun className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Tesla Solar</h3>
          <p className="text-xs text-muted-foreground capitalize">{status}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Sun className="h-4 w-4 text-accent" />
            <span className="text-xs text-muted-foreground">Generated</span>
          </div>
          <div className="flex items-end justify-center gap-1">
            <span className="text-xl font-bold text-accent">{powerGenerated}</span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Consumed</span>
          </div>
          <div className="flex items-end justify-center gap-1">
            <span className="text-xl font-bold">{powerConsumed}</span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Exported</span>
          </div>
          <div className="flex items-end justify-center gap-1">
            <span className="text-xl font-bold text-green-500">{powerExported}</span>
            <span className="text-xs text-muted-foreground">kW</span>
          </div>
        </div>
      </div>
      
      <div className="pt-3 mt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Net Power</span>
          <div className="flex items-center gap-1">
            <span className={`font-medium ${netPower > 0 ? 'text-green-500' : 'text-orange-500'}`}>
              {netPower > 0 ? '+' : ''}{netPower} kW
            </span>
            <Zap className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {netPower > 0 ? 'Exporting to grid' : 'Drawing from grid'}
        </p>
      </div>
    </div>
  );
}