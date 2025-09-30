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
  supportsColor?: boolean;
  currentColor?: number[] | string;
  onColorChange?: (color: string) => void;
}

// Helper function to convert Home Assistant color to hex
const convertColorToHex = (color?: number[] | string): string => {
  if (!color) return "#ffffff";

  if (Array.isArray(color)) {
    // If it's RGB array [r, g, b]
    if (color.length === 3) {
      const [r, g, b] = color;
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    }
    // If it's HS array [hue, saturation], convert to RGB
    if (color.length === 2) {
      const [h, s] = color;
      const hue = h / 360;
      const sat = s / 100;
      const val = 1; // Assume full brightness for color picker

      const i = Math.floor(hue * 6);
      const f = hue * 6 - i;
      const p = val * (1 - sat);
      const q = val * (1 - f * sat);
      const t = val * (1 - (1 - f) * sat);

      let r, g, b;
      switch (i % 6) {
        case 0: r = val; g = t; b = p; break;
        case 1: r = q; g = val; b = p; break;
        case 2: r = p; g = val; b = t; break;
        case 3: r = p; g = q; b = val; break;
        case 4: r = t; g = p; b = val; break;
        case 5: r = val; g = p; b = q; break;
        default: r = g = b = 0;
      }

      return `#${Math.round(r * 255).toString(16).padStart(2, '0')}${Math.round(g * 255).toString(16).padStart(2, '0')}${Math.round(b * 255).toString(16).padStart(2, '0')}`;
    }
  }

  return "#ffffff";
};

export function DeviceCard({ name, subtitle, icon: Icon, isActive, onToggle, size = "default", type, intensity = 100, onIntensityChange, supportsColor = false, currentColor, onColorChange }: DeviceCardProps) {
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

        {/* Color Picker for Hue lights */}
        {type === "light" && isActive && supportsColor && onColorChange && (
          <div className="w-full space-y-2">
            <span className="text-xs text-muted-foreground">Color</span>
            <div className="relative">
              <input
                type="color"
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-2 rounded-lg cursor-pointer opacity-0 absolute inset-0"
                value={convertColorToHex(currentColor)}
              />
              <div
                className="w-full h-2 rounded-lg border border-border"
                style={{
                  backgroundColor: convertColorToHex(currentColor)
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}