import { Minus, Plus, Thermometer, Power, Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface TemperatureControlProps {
  location: string;
  currentTemp: number;
  targetTemp: number;
  onTempChange: (temp: number) => void;
}

export function TemperatureControl({ location, currentTemp, targetTemp, onTempChange }: TemperatureControlProps) {
  const [target, setTarget] = useState(targetTemp);
  const [isOn, setIsOn] = useState(true);
  const [mode, setMode] = useState<'heat' | 'cool'>('heat');

  const adjustTemp = (delta: number) => {
    const newTemp = Math.max(10, Math.min(30, target + delta));
    setTarget(newTemp);
    onTempChange(newTemp);
  };

  return (
    <div className="device-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted">
            <Thermometer className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{location}</h3>
            <p className="text-xs text-muted-foreground">Current: {currentTemp}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={isOn} onCheckedChange={setIsOn} className="scale-75" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === 'heat' ? 'cool' : 'heat')}
            className="p-1 rounded-md h-6 w-6 text-muted-foreground"
          >
            {mode === 'heat' ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-center mb-3">
        <div className="relative w-20 h-20">
          {/* Circular temperature display */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="35"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="35"
              stroke={isOn ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={`${(target / 30) * 219.9} 219.9`}
              className={`transition-all duration-300 ${!isOn ? 'opacity-40' : ''}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${isOn ? 'text-accent' : 'text-muted-foreground'}`}>{target}</span>
            <span className="text-xs text-muted-foreground">°C</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => adjustTemp(-1)}
          disabled={!isOn}
          className="glass-card h-7 w-7 disabled:opacity-50"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => adjustTemp(1)}
          disabled={!isOn}
          className="glass-card h-7 w-7 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}