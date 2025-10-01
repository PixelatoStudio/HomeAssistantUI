import { useState, useRef, useCallback, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  const [showColorDialog, setShowColorDialog] = useState(false);
  const [tempColor, setTempColor] = useState(convertColorToHex(currentColor));
  const colorDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update temp color when dialog opens
  useEffect(() => {
    if (showColorDialog) {
      setTempColor(convertColorToHex(currentColor));
    }
  }, [showColorDialog, currentColor]);

  // Generate solid color for brightness slider
  const getBrightnessSliderColor = () => {
    if (!isActive) {
      return 'hsl(0, 0%, 30%)';
    }

    if (!currentColor) {
      return 'hsl(var(--accent))';
    }

    return convertColorToHex(currentColor);
  };

  // Immediate color selection with debouncing
  const handleColorSelect = useCallback((color: string) => {
    setTempColor(color);

    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }

    colorDebounceRef.current = setTimeout(() => {
      if (onColorChange) {
        onColorChange(color);
      }
    }, 200);
  }, [onColorChange]);

  // Handle click on color wheel
  const handleColorWheelClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = rect.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const distance = Math.sqrt(x * x + y * y);
    const radius = size / 2;

    if (distance > radius) return;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const saturation = Math.min(100, (distance / radius) * 100);

    const hue = angle;
    const value = 100;

    const h = hue / 60;
    const s = saturation / 100;
    const v = value / 100;

    const c = v * s;
    const x1 = c * (1 - Math.abs((h % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 1) { r = c; g = x1; b = 0; }
    else if (h >= 1 && h < 2) { r = x1; g = c; b = 0; }
    else if (h >= 2 && h < 3) { r = 0; g = c; b = x1; }
    else if (h >= 3 && h < 4) { r = 0; g = x1; b = c; }
    else if (h >= 4 && h < 5) { r = x1; g = 0; b = c; }
    else { r = c; g = 0; b = x1; }

    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);

    const hexColor = `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`;

    handleColorSelect(hexColor);
  }, [handleColorSelect]);

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

          {/* Toggle in top right */}
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            className="scale-90"
          />
        </div>

        {/* Intensity Slider for Light devices */}
        {type === "light" && isActive && onIntensityChange && (
          <div className="w-full">
            <div className="flex items-center gap-3">
              {/* Brightness Slider */}
              <div className="relative flex-1">
                <div className="flex justify-end mb-1">
                  <span className="text-xs text-muted-foreground">{intensity}%</span>
                </div>
                <Slider
                  value={[intensity]}
                  onValueChange={onIntensityChange}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full [&_.bg-accent]:!bg-transparent"
                />
                {/* Color overlay on slider range */}
                <div
                  className="absolute bottom-0 left-0 h-6 rounded-full pointer-events-none"
                  style={{
                    width: `${intensity}%`,
                    background: getBrightnessSliderColor(),
                  }}
                />
              </div>

              {/* Color Button */}
              {supportsColor && onColorChange && (
                <button
                  onClick={() => setShowColorDialog(true)}
                  className="w-6 h-6 flex-shrink-0 rounded-full shadow-lg transition-transform active:scale-90 self-end opacity-60"
                  style={{
                    background: `conic-gradient(from 0deg, red, yellow, lime, cyan, blue, magenta, red)`,
                  }}
                  title="Tap to change color"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Color Picker Dialog */}
      {supportsColor && onColorChange && (
        <Dialog open={showColorDialog} onOpenChange={setShowColorDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Circular Color Picker */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Tap anywhere on the wheel</Label>
                <div className="relative aspect-square max-w-[300px] mx-auto">
                  {/* Color wheel with proper HSV representation */}
                  <div
                    onClick={handleColorWheelClick}
                    className="absolute inset-0 rounded-full cursor-pointer"
                    style={{
                      background: `
                        conic-gradient(from 0deg,
                          rgb(255, 0, 0),
                          rgb(255, 255, 0),
                          rgb(0, 255, 0),
                          rgb(0, 255, 255),
                          rgb(0, 0, 255),
                          rgb(255, 0, 255),
                          rgb(255, 0, 0)
                        )
                      `,
                    }}
                  />
                  {/* White center for saturation */}
                  <div
                    onClick={handleColorWheelClick}
                    className="absolute inset-0 rounded-full cursor-pointer"
                    style={{
                      background: `radial-gradient(circle, white 0%, transparent 100%)`,
                    }}
                  />
                </div>
              </div>

              {/* Quick Color Presets */}
              <div>
                <Label className="text-sm font-semibold mb-3 block">Quick Colors</Label>
                <div className="grid grid-cols-6 gap-3">
                  {['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF', '#FF1493', '#00CED1', '#FFD700', '#FF4500', '#32CD32', '#FFFFFF'].map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className="w-full aspect-square rounded-lg border-2 border-white dark:border-gray-700 shadow-md transition-transform active:scale-90"
                      style={{ background: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="outline"
                onClick={() => setShowColorDialog(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}