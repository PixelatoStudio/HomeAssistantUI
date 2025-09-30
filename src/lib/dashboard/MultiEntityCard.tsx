import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DeviceConfig } from "../rooms/types";
import { Power, ChevronDown, ChevronUp, Lightbulb, Trash2, Thermometer, Droplets, Wind, Zap, Activity, Radio, Flame, Snowflake, Edit2, Plus, Minus } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface MultiEntityCardProps {
  device: DeviceConfig;
  entityStates: Record<string, any>;
  isOnline: boolean;
  onToggle: (deviceId: string, entityId: string) => void;
  onIntensityChange: (deviceId: string, entityId: string, brightness: number) => void;
  onRemove: (deviceId: string) => void;
  onHvacModeChange?: (deviceId: string, entityId: string, mode: string) => void;
  onTemperatureChange?: (deviceId: string, entityId: string, temperature: number, isLow?: boolean) => void;
}

// Detect entity capabilities and control type
function detectEntityCapability(domain: string, entityState: any) {
  const state = entityState?.state;
  const attributes = entityState?.attributes || {};

  // Sensors - read-only values
  if (domain === 'sensor' || domain === 'binary_sensor') {
    return {
      type: 'readonly',
      icon: getSensorIcon(attributes.device_class),
      showValue: true,
      unit: attributes.unit_of_measurement || '',
      deviceClass: attributes.device_class,
    };
  }

  // Buttons - single press action
  if (domain === 'button') {
    return {
      type: 'button',
      icon: Radio,
      showValue: false,
    };
  }

  // Input select / select entities - dropdown
  if (domain === 'input_select' || domain === 'select') {
    return {
      type: 'select',
      icon: Activity,
      showValue: true,
      options: attributes.options || [],
    };
  }

  // Lights - toggle + brightness + color
  if (domain === 'light') {
    return {
      type: 'toggle',
      icon: Lightbulb,
      showValue: false,
      hasBrightness: attributes.brightness !== undefined,
      hasColor: attributes.supported_color_modes?.length > 0,
    };
  }

  // Switches - simple toggle
  if (domain === 'switch') {
    return {
      type: 'toggle',
      icon: Power,
      showValue: false,
    };
  }

  // Climate - has target temperature and HVAC modes
  if (domain === 'climate') {
    return {
      type: 'climate',
      icon: Thermometer,
      showValue: true,
      unit: attributes.temperature_unit || '°F',
      hvacModes: attributes.hvac_modes || [],
      currentHvacMode: state,
      targetTemp: attributes.temperature,
      targetTempLow: attributes.target_temp_low,
      targetTempHigh: attributes.target_temp_high,
      currentTemp: attributes.current_temperature,
    };
  }

  // Fans - toggle + speed
  if (domain === 'fan') {
    return {
      type: 'toggle',
      icon: Wind,
      showValue: false,
      hasSpeed: attributes.percentage !== undefined,
    };
  }

  // Covers - open/close
  if (domain === 'cover') {
    return {
      type: 'toggle',
      icon: Activity,
      showValue: false,
    };
  }

  // Default - treat as toggle
  return {
    type: 'toggle',
    icon: Power,
    showValue: false,
  };
}

function getSensorIcon(deviceClass: string | undefined) {
  switch (deviceClass) {
    case 'temperature':
      return Thermometer;
    case 'humidity':
      return Droplets;
    case 'power':
    case 'energy':
      return Zap;
    default:
      return Activity;
  }
}

export function MultiEntityCard({
  device,
  entityStates,
  isOnline,
  onToggle,
  onIntensityChange,
  onRemove,
  onHvacModeChange,
  onTemperatureChange,
}: MultiEntityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const entityIds = device.entityIds || [];
  const entities = device.customSettings?.entities || [];

  // Calculate master state (only for toggleable entities)
  const toggleableEntities = entityIds.filter((id, index) => {
    const entity = entities[index];
    const capability = detectEntityCapability(entity?.domain, entityStates[id]);
    return capability.type === 'toggle' || capability.type === 'button';
  });

  const entityStatuses = toggleableEntities.map(id => {
    const state = entityStates[id];
    return state?.state === 'on';
  });

  const allOn = entityStatuses.length > 0 && entityStatuses.every(status => status);
  const someOn = entityStatuses.some(status => status);

  // Get icon component
  const IconComponent = device.icon
    ? (LucideIcons as any)[device.icon] || Lightbulb
    : Lightbulb;

  // Master toggle - only toggles toggleable entities
  const handleMasterToggle = () => {
    if (toggleableEntities.length === 0) return;

    const targetState = !allOn;
    toggleableEntities.forEach(entityId => {
      const currentState = entityStates[entityId]?.state === 'on';
      if (currentState !== targetState) {
        onToggle(device.id, entityId);
      }
    });
  };

  // Group entities by domain
  const groupedEntities = entities.reduce((acc: any, entity: any, index: number) => {
    const domain = entity.domain || 'unknown';
    if (!acc[domain]) {
      acc[domain] = [];
    }
    acc[domain].push({ ...entity, entityId: entityIds[index] });
    return acc;
  }, {});

  const hasToggleableEntities = toggleableEntities.length > 0;

  return (
    <div className={`device-card group ${!isOnline ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-3 h-full">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-all duration-300 flex-shrink-0 ${
            someOn ? 'bg-accent/20' : 'bg-muted'
          }`}>
            <IconComponent className={`h-4 w-4 ${someOn ? 'text-accent' : 'text-muted-foreground'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-left truncate">{device.name}</h3>
            <p className="text-xs text-muted-foreground text-left mt-1 truncate">
              {entityIds.length} {entityIds.length === 1 ? 'entity' : 'entities'}
              {hasToggleableEntities && (
                <> • {allOn ? 'All On' : someOn ? 'Mixed' : 'All Off'}</>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 hover:bg-accent/20"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
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

        {/* Master Toggle for toggleable entities */}
        {hasToggleableEntities && (
          <div className="w-full flex justify-start">
            <Switch
              checked={someOn}
              onCheckedChange={handleMasterToggle}
              disabled={!isOnline}
              className="scale-90"
            />
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t">
            {Object.entries(groupedEntities).map(([domain, domainEntities]: [string, any]) => (
              <div key={domain} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {domain}s ({domainEntities.length})
                </p>

                {domainEntities.map((entity: any) => {
                  const entityState = entityStates[entity.entityId];
                  const capability = detectEntityCapability(domain, entityState);
                  const EntityIcon = capability.icon;

                  // Read-only sensor display
                  if (capability.type === 'readonly') {
                    return (
                      <div
                        key={entity.entityId}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <EntityIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{entity.friendly_name}</p>
                        </div>
                        <div className="text-sm font-semibold">
                          {entityState?.state} {capability.unit}
                        </div>
                      </div>
                    );
                  }

                  // Button (single press)
                  if (capability.type === 'button') {
                    return (
                      <div
                        key={entity.entityId}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <EntityIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{entity.friendly_name}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onToggle(device.id, entity.entityId)}
                          disabled={!isOnline}
                        >
                          Press
                        </Button>
                      </div>
                    );
                  }

                  // Select dropdown
                  if (capability.type === 'select') {
                    return (
                      <div
                        key={entity.entityId}
                        className="flex flex-col gap-2 p-2 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <EntityIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{entity.friendly_name}</p>
                        </div>
                        <select
                          value={entityState?.state || ''}
                          onChange={(e) => {
                            // TODO: Implement select option change
                            console.log('Select changed:', e.target.value);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded bg-background"
                          disabled={!isOnline}
                        >
                          {capability.options?.map((option: string) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  // Climate controls (thermostat)
                  if (capability.type === 'climate') {
                    const hvacMode = capability.currentHvacMode || 'off';
                    const isOff = hvacMode === 'off';
                    const isHeat = hvacMode === 'heat';
                    const isCool = hvacMode === 'cool';
                    const isHeatCool = hvacMode === 'heat_cool';

                    return (
                      <div
                        key={entity.entityId}
                        className="flex flex-col gap-3 p-3 rounded-lg bg-muted/30"
                      >
                        {/* Climate Header with Mode Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{entity.friendly_name}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={!isOff}
                              onCheckedChange={() => onHvacModeChange && onHvacModeChange(device.id, entity.entityId, isOff ? 'heat' : 'off')}
                              disabled={!isOnline}
                              className="scale-75"
                            />
                            {!isOff && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onHvacModeChange && onHvacModeChange(device.id, entity.entityId, isHeat ? 'cool' : 'heat')}
                                className="p-1 rounded-md h-6 w-6 text-muted-foreground"
                                disabled={!isOnline}
                              >
                                {isHeat ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Temperature Ring Display */}
                        {!isOff && onTemperatureChange && (
                          <>
                            <div className="flex items-center justify-center">
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
                                    stroke="hsl(var(--accent))"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={`${((capability.targetTemp || capability.targetTempLow || 70) / 90) * 219.9} 219.9`}
                                    className="transition-all duration-300"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-lg font-bold text-accent">{capability.currentTemp}</span>
                                  <span className="text-xs text-muted-foreground">°F</span>
                                </div>
                              </div>
                            </div>

                            {/* +/- Temperature Buttons */}
                            {capability.targetTemp !== undefined && !isHeatCool && (
                              <div className="flex flex-col items-center gap-2">
                                <div className="text-xs text-muted-foreground">
                                  Target: <span className="font-semibold">{capability.targetTemp}°F</span>
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onTemperatureChange(device.id, entity.entityId, Math.max(50, capability.targetTemp - 1))}
                                    disabled={!isOnline}
                                    className="glass-card h-7 w-7"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onTemperatureChange(device.id, entity.entityId, Math.min(90, capability.targetTemp + 1))}
                                    disabled={!isOnline}
                                    className="glass-card h-7 w-7"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Dual temperature range (heat_cool mode) */}
                            {isHeatCool && capability.targetTempLow !== undefined && capability.targetTempHigh !== undefined && (
                              <div className="space-y-3">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="text-xs text-muted-foreground">
                                    Heat to: <span className="font-semibold">{capability.targetTempLow}°F</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-3">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onTemperatureChange(device.id, entity.entityId, Math.max(50, capability.targetTempLow - 1), true)}
                                      disabled={!isOnline}
                                      className="glass-card h-7 w-7"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onTemperatureChange(device.id, entity.entityId, Math.min(capability.targetTempHigh - 1, capability.targetTempLow + 1), true)}
                                      disabled={!isOnline}
                                      className="glass-card h-7 w-7"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                  <div className="text-xs text-muted-foreground">
                                    Cool to: <span className="font-semibold">{capability.targetTempHigh}°F</span>
                                  </div>
                                  <div className="flex items-center justify-center gap-3">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onTemperatureChange(device.id, entity.entityId, Math.max(capability.targetTempLow + 1, capability.targetTempHigh - 1), false)}
                                      disabled={!isOnline}
                                      className="glass-card h-7 w-7"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => onTemperatureChange(device.id, entity.entityId, Math.min(90, capability.targetTempHigh + 1), false)}
                                      disabled={!isOnline}
                                      className="glass-card h-7 w-7"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }

                  // Toggle controls (lights, switches, etc.)
                  const isOn = entityState?.state === 'on';
                  const brightness = entityState?.attributes?.brightness;
                  const supportsBrightness = capability.hasBrightness && brightness !== undefined;

                  return (
                    <div
                      key={entity.entityId}
                      className="flex flex-col gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <EntityIcon className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{entity.friendly_name}</p>
                        </div>
                        <Switch
                          checked={isOn}
                          onCheckedChange={() => onToggle(device.id, entity.entityId)}
                          disabled={!isOnline}
                          className="scale-75"
                        />
                      </div>

                      {/* Brightness slider for lights */}
                      {supportsBrightness && isOn && (
                        <div className="w-full space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Brightness</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((brightness / 255) * 100)}%
                            </span>
                          </div>
                          <Slider
                            value={[Math.round((brightness / 255) * 100)]}
                            onValueChange={(value) =>
                              onIntensityChange(device.id, entity.entityId, value[0])
                            }
                            max={100}
                            step={1}
                            className="w-full"
                            disabled={!isOnline || !isOn}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}