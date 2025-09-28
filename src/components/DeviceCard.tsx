import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { LucideIcon } from "lucide-react";

interface DeviceCardProps {
  name: string;
  subtitle?: string;
  icon: LucideIcon;
  isActive: boolean;
  onToggle: () => void;
  size?: "default" | "large";
  type?: string;
  intensity?: number;
  onIntensityChange?: (value: number[]) => void;
}

export function DeviceCard({ name, subtitle, icon: Icon, isActive, onToggle, size = "default", type, intensity = 100, onIntensityChange }: DeviceCardProps) {
  return (
    <div className={`device-card group ${size === "large" ? "col-span-2" : ""}`}>
      <div className="flex flex-col gap-3 h-full">
        {/* Icon and Title Row */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted transition-all duration-300 flex-shrink-0">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${size === "large" ? "text-lg" : "text-sm"} text-left truncate`}>{name}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground text-left mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Toggle Row */}
        <div className="w-full flex justify-start">
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            className="scale-90"
          />
        </div>
        
        {/* Intensity Slider for Light devices */}
        {type === "light" && isActive && onIntensityChange && (
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Intensity</span>
              <span className="text-xs text-muted-foreground">{intensity}%</span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={onIntensityChange}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}