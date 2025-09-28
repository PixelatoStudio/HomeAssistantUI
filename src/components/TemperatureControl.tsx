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
    <div className="device-card col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Thermometer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{location} Climate</h3>
            <p className="text-xs text-muted-foreground">Current: {currentTemp}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isOn} onCheckedChange={setIsOn} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode(mode === 'heat' ? 'cool' : 'heat')}
            className={`p-1 rounded-md ${mode === 'heat' ? 'text-orange-500' : 'text-blue-500'}`}
          >
            {mode === 'heat' ? <Flame className="h-4 w-4" /> : <Snowflake className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          {/* Circular temperature display */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="hsl(var(--muted))"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={isOn ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${(target / 30) * 251.32} 251.32`}
              className={`transition-all duration-300 ${!isOn ? 'opacity-40' : ''}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${isOn ? 'gradient-text' : 'text-muted-foreground'}`}>{target}</span>
            <span className="text-xs text-muted-foreground">°C</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => adjustTemp(-1)}
          disabled={!isOn}
          className="glass-card h-8 w-8 disabled:opacity-50"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => adjustTemp(1)}
          disabled={!isOn}
          className="glass-card h-8 w-8 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}