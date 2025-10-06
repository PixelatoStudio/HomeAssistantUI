import { useState, useRef, useCallback, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Edit2, Trash2, Settings } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";

import { DeviceConfig, DeviceTemplate } from "../rooms/types";
import { getTemplateByType } from "../devices/templates";
import { entityService } from "../entities/entityService";
import { LiveCameraCard } from "../camera/LiveCameraCard";
import { CameraStreamDialog } from "../camera/CameraStreamDialog";
import { useAuthStore } from "@/stores/authStore";

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

interface UniversalDeviceCardProps {
  device: DeviceConfig;
  onToggle?: (deviceId: string) => void;
  onIntensityChange?: (deviceId: string, intensity: number) => void;
  onColorChange?: (deviceId: string, color: string) => void;
  onEdit?: (deviceId: string) => void;
  onRemove?: (deviceId: string) => void;
  entityState?: any; // Current HA entity state
  isOnline?: boolean;
}

export function UniversalDeviceCard({
  device,
  onToggle,
  onIntensityChange,
  onColorChange,
  onEdit,
  onRemove,
  entityState,
  isOnline = true
}: UniversalDeviceCardProps) {
  // Debug: Log device card rendering
  console.log('🃏 UniversalDeviceCard rendering:', {
    deviceId: device.id,
    deviceName: device.name,
    deviceType: device.type,
    entityId: device.entityId,
    hasEntityState: !!entityState,
    isOnline
  });
  // Get current intensity from entity state
  const currentIntensity = entityState?.attributes?.brightness
    ? Math.round((entityState.attributes.brightness / 255) * 100)
    : 100;

  const [isToggling, setIsToggling] = useState(false);
  const [localIntensity, setLocalIntensity] = useState(currentIntensity);
  const [showColorDialog, setShowColorDialog] = useState(false);
  const [tempColor, setTempColor] = useState(convertColorToHex(entityState?.attributes?.hs_color || entityState?.attributes?.rgb_color));
  const [showCameraModal, setShowCameraModal] = useState(false);

  const { credentials } = useAuthStore();

  // Update local intensity when entity state changes
  useEffect(() => {
    setLocalIntensity(currentIntensity);
  }, [currentIntensity]);

  // Update temp color when dialog opens
  useEffect(() => {
    if (showColorDialog) {
      setTempColor(convertColorToHex(entityState?.attributes?.hs_color || entityState?.attributes?.rgb_color));
    }
  }, [showColorDialog, entityState]);

  // Debounce timer for intensity changes
  const intensityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Debounce timer for color changes
  const colorDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const template = getTemplateByType(device.type);

  // Debug: Log template lookup
  console.log('🔍 Template lookup for device:', {
    deviceType: device.type,
    foundTemplate: !!template,
    template
  });

  if (!template) {
    console.error('❌ No template found for device type:', device.type);
    return null;
  }

  // Get device icon
  const getDeviceIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-5 w-5 text-muted-foreground" />;
    }
    return <Settings className="h-5 w-5 text-muted-foreground" />;
  };

  // Determine if device is currently active/on
  const isActive = entityState?.state === 'on' || entityState?.state === 'playing';

  // Handle toggle with loading state
  const handleToggle = async () => {
    if (!onToggle || isToggling) return;

    setIsToggling(true);
    try {
      await onToggle(device.id);
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setIsToggling(false), 300);
    }
  };

  // Handle intensity change - immediate UI update like current dashboard
  const handleIntensityChange = useCallback((intensity: number[]) => {
    const newIntensity = intensity[0];
    // Immediate UI update for smooth slider
    setLocalIntensity(newIntensity);

    // Clear existing timeout
    if (intensityTimeoutRef.current) {
      clearTimeout(intensityTimeoutRef.current);
    }

    // Debounce the API call by 300ms
    intensityTimeoutRef.current = setTimeout(() => {
      if (onIntensityChange) {
        onIntensityChange(device.id, newIntensity);
      }
    }, 300);
  }, [device.id, onIntensityChange]);

  // Determine available controls based on template
  const hasToggle = template.supportedControls.includes('toggle');
  const hasButton = template.supportedControls.includes('button');
  const hasBrightness = template.supportedControls.includes('brightness') && isActive;
  const hasReadOnlyDisplay = template.supportedControls.includes('readonly_display');

  // Detect color support from entity attributes (like current dashboard)
  const supportsColor = entityState?.attributes?.supported_color_modes?.includes('hs') ||
                       entityState?.attributes?.supported_color_modes?.includes('rgb') ||
                       entityState?.attributes?.supported_color_modes?.includes('xy');
  const hasColor = supportsColor && isActive;

  // Get current color from entity state
  const currentColor = entityState?.attributes?.hs_color || entityState?.attributes?.rgb_color;

  // Generate solid color for brightness slider
  const getBrightnessSliderColor = () => {
    if (!isActive) {
      // Off state: gray
      return 'hsl(0, 0%, 30%)';
    }

    if (!currentColor) {
      // White light or no color support: use theme accent color
      return 'hsl(var(--accent))';
    }

    // Color light: use current color
    return convertColorToHex(currentColor);
  };

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    if (onColorChange) {
      onColorChange(device.id, color);
    }
  }, [device.id, onColorChange]);

  // Immediate color selection with debouncing to prevent API spam
  const handleColorSelect = useCallback((color: string) => {
    // Update visual immediately
    setTempColor(color);

    // Clear any pending color change
    if (colorDebounceRef.current) {
      clearTimeout(colorDebounceRef.current);
    }

    // Debounce the API call by 200ms
    colorDebounceRef.current = setTimeout(() => {
      handleColorChange(color);
    }, 200);
  }, [handleColorChange]);

  // Handle click on color wheel - convert position to color using HSV
  const handleColorWheelClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = rect.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    // Calculate distance from center (for saturation)
    const distance = Math.sqrt(x * x + y * y);
    const radius = size / 2;

    // Clamp to circle boundary
    if (distance > radius) return;

    // Calculate angle (0-360 degrees) for hue
    // Math.atan2 gives us angle from right (0deg = 3 o'clock)
    // CSS conic-gradient starts from top (0deg = 12 o'clock)
    // So we need to add 90 degrees to align them
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    // Calculate saturation based on distance from center (0-100%)
    const saturation = Math.min(100, (distance / radius) * 100);

    // Use HSV color space for better color accuracy
    const hue = angle;
    const value = 100; // Full brightness

    // Convert HSV to RGB
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

  // Get display value for readonly sensors
  const getDisplayValue = () => {
    if (!entityState) return '--';

    const state = entityState.state;
    const unit = entityState.attributes?.unit_of_measurement || '';

    // Handle different sensor types
    if (device.type === 'temperature_sensor') {
      return `${Math.round(parseFloat(state) || 0)}°${unit.replace('°', '')}`;
    }
    if (device.type === 'humidity_sensor') {
      return `${Math.round(parseFloat(state) || 0)}%`;
    }
    if (device.type === 'motion_sensor' || device.type === 'door_sensor') {
      return state === 'on' || state === 'open' ? 'Active' : 'Inactive';
    }

    return `${state} ${unit}`.trim();
  };

  // Camera device - render LiveCameraCard
  if (device.type === 'camera' && credentials) {
    return (
      <>
        <LiveCameraCard
          entityId={device.entityId}
          name={device.name}
          host={credentials.url.replace(/^https?:\/\//, '')}
          token={credentials.token}
          onCardClick={() => setShowCameraModal(true)}
        />
        <CameraStreamDialog
          open={showCameraModal}
          onOpenChange={setShowCameraModal}
          entityId={device.entityId}
          host={credentials.url.replace(/^https?:\/\//, '')}
          token={credentials.token}
        />
      </>
    );
  }

  return (
    <div className={`device-card group ${!isOnline ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-3 h-full">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted transition-all duration-300 flex-shrink-0">
            {getDeviceIcon(device.icon || template.defaultIcon)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-left break-words leading-tight">{device.name}</h3>
            {hasReadOnlyDisplay ? (
              <p className="text-xs text-muted-foreground text-left mt-1 truncate">
                {getDisplayValue()}
              </p>
            ) : hasButton ? (
              <p className="text-xs text-muted-foreground text-left mt-1 truncate">
                Ready
              </p>
            ) : (
              <p className="text-xs text-muted-foreground text-left mt-1 truncate">
                {isActive ? 'On' : 'Off'}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {hasToggle && (
              <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={!isOnline || isToggling}
                className="scale-90"
              />
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(device.id)}
                className="h-6 w-6 p-0 hover:bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Button Control for Scenes */}
        {hasButton && (
          <div className="w-full">
            <Button
              onClick={handleToggle}
              disabled={!isOnline || isToggling}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              size="sm"
            >
              {isToggling ? 'Activating...' : 'Activate'}
            </Button>
          </div>
        )}

        {/* Brightness Slider for Lights */}
        {hasBrightness && (
          <div className="w-full">
            <div className="flex items-center gap-3">
              {/* Brightness Slider */}
              <div className="relative flex-1">
                <div className="flex justify-end mb-1">
                  <span className="text-xs text-muted-foreground">{localIntensity}%</span>
                </div>
                <Slider
                  value={[localIntensity]}
                  onValueChange={handleIntensityChange}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full [&_.bg-accent]:!bg-transparent"
                  disabled={!isOnline}
                />
                {/* Color overlay on slider range */}
                <div
                  className="absolute bottom-0 left-0 h-6 rounded-full pointer-events-none"
                  style={{
                    width: `${localIntensity}%`,
                    background: getBrightnessSliderColor(),
                  }}
                />
              </div>

              {/* Color Button - Thumb Friendly */}
              {hasColor && (
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
      {hasColor && (
        <Dialog open={showColorDialog} onOpenChange={setShowColorDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{device.name}</DialogTitle>
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
                  {/* White center for saturation (0% saturation at center, 100% at edge) */}
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

              {/* Close Button Only */}
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