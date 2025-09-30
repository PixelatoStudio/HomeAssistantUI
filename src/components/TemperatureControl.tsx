import { Minus, Plus, Thermometer, Power, Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { entityService, HAEntity } from "@/lib/entities/entityService";

interface TemperatureControlProps {
  entity: HAEntity;
  onEntityUpdate?: () => void;
}

export function TemperatureControl({
  entity,
  onEntityUpdate
}: TemperatureControlProps) {
  const currentTemp = entity.attributes.current_temperature || 0;
  const targetTemp = entity.attributes.temperature || 0;
  const isOn = entity.state !== 'off';
  const currentMode = entity.state as 'heat' | 'cool' | 'off';

  const [target, setTarget] = useState(targetTemp);
  const [mode, setMode] = useState<'heat' | 'cool'>(currentMode === 'off' ? 'heat' : currentMode);

  useEffect(() => {
    setTarget(targetTemp);
    if (currentMode !== 'off') {
      setMode(currentMode);
    }
  }, [targetTemp, currentMode]);

  const adjustTemp = async (delta: number) => {
    const newTemp = Math.max(10, Math.min(30, target + delta));
    setTarget(newTemp);

    await entityService.controlEntity(entity.entity_id, 'set_temperature', {
      temperature: newTemp
    });

    onEntityUpdate?.();
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // Turn on with cool mode by default
      const modeToUse = 'cool';
      setMode(modeToUse);
      await entityService.controlEntity(entity.entity_id, 'set_hvac_mode', {
        hvac_mode: modeToUse
      });
    } else {
      // Turn off
      await entityService.controlEntity(entity.entity_id, 'turn_off', {});
    }

    onEntityUpdate?.();
  };

  const handleModeChange = async (newMode: 'heat' | 'cool') => {
    setMode(newMode);

    // Turn on with the selected mode if currently off, or just change mode if on
    await entityService.controlEntity(entity.entity_id, 'set_hvac_mode', {
      hvac_mode: newMode
    });

    onEntityUpdate?.();
  };

  return (
    <div className="device-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-muted">
            <Thermometer className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{entity.attributes.friendly_name || entity.entity_id}</h3>
            <p className="text-xs text-muted-foreground">Target: {target}°F</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={isOn} onCheckedChange={handleToggle} className="scale-75" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange('heat')}
            className={`p-1 rounded-md h-6 w-6 ${mode === 'heat' && isOn ? 'text-orange-500' : 'text-muted-foreground'}`}
          >
            <Flame className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleModeChange('cool')}
            className={`p-1 rounded-md h-6 w-6 ${mode === 'cool' && isOn ? 'text-blue-500' : 'text-muted-foreground'}`}
          >
            <Snowflake className="h-3 w-3" />
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
              stroke={isOn ? "hsl(var(--accent))" : "rgb(209, 213, 219)"}
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={`${(target / 30) * 219.9} 219.9`}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${isOn ? 'text-accent' : 'text-gray-300'}`}>{currentTemp}</span>
            <span className="text-xs text-gray-300">°F</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => adjustTemp(-1)}
          disabled={!isOn}
          className="glass-card h-7 w-7 disabled:!opacity-100 disabled:!text-gray-300"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => adjustTemp(1)}
          disabled={!isOn}
          className="glass-card h-7 w-7 disabled:!opacity-100 disabled:!text-gray-300"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}