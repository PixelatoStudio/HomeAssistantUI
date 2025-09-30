import { useState, useRef, useCallback, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Settings } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { DeviceConfig, DeviceTemplate } from "../rooms/types";
import { getTemplateByType } from "../devices/templates";
import { entityService } from "../entities/entityService";

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

  // Update local intensity when entity state changes
  useEffect(() => {
    setLocalIntensity(currentIntensity);
  }, [currentIntensity]);

  // Debounce timer for intensity changes
  const intensityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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


  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    if (onColorChange) {
      onColorChange(device.id, color);
    }
  }, [device.id, onColorChange]);

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

  return (
    <div className={`device-card group ${!isOnline ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-3 h-full">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted transition-all duration-300 flex-shrink-0">
            {getDeviceIcon(device.icon || template.defaultIcon)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-left truncate">{device.name}</h3>
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
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(device.id)}
                className="h-6 w-6 p-0 hover:bg-accent/20"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(device.id)}
                className="h-6 w-6 p-0 hover:bg-destructive/20 text-destructive/60 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Controls Row */}
        {hasToggle && (
          <div className="w-full flex justify-start">
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={!isOnline || isToggling}
              className="scale-90"
            />
          </div>
        )}

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
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Brightness</span>
              <span className="text-xs text-muted-foreground">{localIntensity}%</span>
            </div>
            <Slider
              value={[localIntensity]}
              onValueChange={handleIntensityChange}
              max={100}
              min={1}
              step={1}
              className="w-full"
              disabled={!isOnline}
            />
          </div>
        )}

        {/* Color Picker for RGB/Color lights */}
        {hasColor && onColorChange && (
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Color</span>
            </div>
            <div className="relative h-2">
              <input
                type="color"
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-full rounded-lg cursor-pointer opacity-0 absolute inset-0"
                value={convertColorToHex(currentColor)}
                disabled={!isOnline}
              />
              <div
                className="w-full h-full rounded-lg pointer-events-none"
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