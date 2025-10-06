import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Activity } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { DeviceTemplate } from "../rooms/types";
import { entityService, FilteredEntity } from "../entities/entityService";

interface EntityConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DeviceTemplate | null;
  onConfirm: (config: {
    template: DeviceTemplate;
    entity: FilteredEntity;
    entities?: FilteredEntity[]; // For multi-entity devices
    deviceName: string;
    customIcon?: string;
  }) => void;
}

export function EntityConfigDialog({ open, onOpenChange, template, onConfirm }: EntityConfigDialogProps) {
  const [entities, setEntities] = useState<FilteredEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]); // For multi-entity
  const [deviceName, setDeviceName] = useState("");
  const [customIcon, setCustomIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMultiEntity = template?.isMultiEntity || false;

  // Load entities when template changes
  useEffect(() => {
    if (template && open) {
      loadCompatibleEntities();
    }
  }, [template, open]);

  // Auto-fill device name when entity is selected
  useEffect(() => {
    if (selectedEntityId) {
      const entity = entities.find(e => e.entity_id === selectedEntityId);
      if (entity && !deviceName) {
        setDeviceName(entity.friendly_name);
      }
    }
  }, [selectedEntityId, entities, deviceName]);

  const loadCompatibleEntities = async () => {
    if (!template) return;

    setLoading(true);
    setError(null);

    try {
      const domain = template.entityDomain || template.requiredEntityDomain;

      // For sensor domain, also load binary_sensor entities
      const domains = domain === 'sensor' ? ['sensor', 'binary_sensor'] : [domain];

      const allEntities = await Promise.all(
        domains.map(d => entityService.getEntitiesByDomain(d))
      );

      let compatibleEntities = allEntities.flat();

      // Apply custom entity filter if specified
      if (template.entityFilter) {
        compatibleEntities = compatibleEntities.filter(entity =>
          template.entityFilter!(entity.entity_id)
        );
      }

      // Filter by required features if specified
      const filteredEntities = template.requiredEntityFeatures
        ? compatibleEntities.filter(entity => {
            // For now, just return all entities of the correct domain
            // TODO: Implement feature checking in entityService
            return true;
          })
        : compatibleEntities;

      setEntities(filteredEntities);

      // Auto-select if only one compatible entity
      if (filteredEntities.length === 1) {
        setSelectedEntityId(filteredEntities[0].entity_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!template || !deviceName.trim()) {
      return;
    }

    if (isMultiEntity) {
      // Preserve the order of selection by mapping selectedEntityIds to entities
      const selectedEntities = selectedEntityIds
        .map(id => entities.find(e => e.entity_id === id))
        .filter((e): e is FilteredEntity => e !== undefined);

      if (selectedEntities.length === 0) return;

      onConfirm({
        template,
        entity: selectedEntities[0], // Primary entity for compatibility
        entities: selectedEntities,
        deviceName: deviceName.trim(),
        customIcon: customIcon || undefined,
      });
    } else {
      const selectedEntity = entities.find(e => e.entity_id === selectedEntityId);
      if (!selectedEntity) return;

      onConfirm({
        template,
        entity: selectedEntity,
        deviceName: deviceName.trim(),
        customIcon: customIcon || undefined,
      });
    }

    // Reset form
    setSelectedEntityId("");
    setSelectedEntityIds([]);
    setDeviceName("");
    setCustomIcon("");
    onOpenChange(false);
  };

  const toggleEntitySelection = (entityId: string) => {
    setSelectedEntityIds(prev =>
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const selectedEntity = entities.find(e => e.entity_id === selectedEntityId);
  const canConfirm = template && deviceName.trim() && (isMultiEntity ? selectedEntityIds.length > 0 : selectedEntityId);

  const getTemplateIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-5 w-5 text-muted-foreground" />;
    }
    return <Activity className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Device</DialogTitle>
        </DialogHeader>

        {template && (
          <div className="space-y-6">
            {/* Template Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-lg bg-muted">
                {getTemplateIcon(template.icon)}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
            </div>

            {/* Entity Selection */}
            <div className="space-y-2">
              <Label htmlFor="entity-select">
                {isMultiEntity ? 'Home Assistant Entities (select multiple)' : 'Home Assistant Entity'}
              </Label>
              {loading ? (
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading {template.requiredEntityDomain} entities...</span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 p-3 border border-destructive rounded-lg">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              ) : entities.length === 0 ? (
                <div className="p-3 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    No {template.requiredEntityDomain} entities found in Home Assistant.
                  </p>
                  <p className="text-xs text-amber-500 mt-1">
                    Make sure you have {template.requiredEntityDomain} entities configured in HA.
                  </p>
                </div>
              ) : isMultiEntity ? (
                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {entities.map((entity) => {
                    const isSelected = selectedEntityIds.includes(entity.entity_id);
                    return (
                      <div
                        key={entity.entity_id}
                        onClick={() => toggleEntitySelection(entity.entity_id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '16px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid hsl(var(--accent))' : '1px solid hsl(var(--border))',
                          backgroundColor: isSelected ? 'hsl(var(--accent) / 0.1)' : 'hsl(var(--muted))',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          style={{ width: '18px', height: '18px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{entity.friendly_name}</div>
                          <div style={{ fontSize: '12px', opacity: 0.6, fontFamily: 'monospace', wordBreak: 'break-all', overflowWrap: 'break-word' }}>{entity.entity_id}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose a ${template.requiredEntityDomain} entity`} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {entities.map((entity) => (
                      <SelectItem key={entity.entity_id} value={entity.entity_id} className="bg-popover hover:bg-accent">
                        <div className="flex items-center justify-between w-full">
                          <span>{entity.friendly_name}</span>
                          <div className="flex gap-1 ml-2">
                            {entity.features.slice(0, 2).map(feature => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!isMultiEntity && selectedEntity && (
                <div className="text-xs text-muted-foreground">
                  <span>Entity ID: {selectedEntity.entity_id}</span>
                  <span className="ml-2">State: {selectedEntity.state}</span>
                </div>
              )}

              {isMultiEntity && selectedEntityIds.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {selectedEntityIds.length} {selectedEntityIds.length === 1 ? 'entity' : 'entities'} selected
                </div>
              )}
            </div>

            {/* Device Name */}
            <div className="space-y-2">
              <Label htmlFor="device-name">Device Name</Label>
              <Input
                id="device-name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g., Living Room Light"
              />
            </div>

            {/* Custom Icon (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="custom-icon">Custom Icon (optional)</Label>
              <Input
                id="custom-icon"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                placeholder={`Default: ${template.defaultIcon}`}
              />
              <p className="text-xs text-muted-foreground">
                Use emoji or icon name. Leave empty to use default.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!canConfirm}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}