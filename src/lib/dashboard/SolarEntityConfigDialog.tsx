import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Loader2 } from "lucide-react";
import { useRoomStore } from "@/lib/rooms/roomStore";
import { entityService } from "@/lib/entities/entityService";

interface SolarEntityConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SolarEntityConfigDialog({ open, onOpenChange }: SolarEntityConfigDialogProps) {
  const { rooms, updateDeviceInRoom } = useRoomStore();
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<any[]>([]);
  const [solarDevice, setSolarDevice] = useState<any>(null);

  // Entity selections
  const [generatedEntity, setGeneratedEntity] = useState("");
  const [consumedEntity, setConsumedEntity] = useState("");
  const [exportedEntity, setExportedEntity] = useState("");
  const [chargeEntity, setChargeEntity] = useState("");
  const [chargingEntity, setChargingEntity] = useState("");

  useEffect(() => {
    if (open) {
      loadEntitiesAndDevice();
    }
  }, [open]);

  const loadEntitiesAndDevice = async () => {
    setLoading(true);
    try {
      // Find the solar device across all rooms
      let foundDevice = null;
      let foundRoomId = null;

      for (const room of rooms) {
        const device = room.devices.find(d => d.type === 'solar_system');
        if (device) {
          foundDevice = device;
          foundRoomId = room.id;
          break;
        }
      }

      if (foundDevice && foundRoomId) {
        setSolarDevice({ ...foundDevice, roomId: foundRoomId });

        // Set current values
        if (foundDevice.entityIds && foundDevice.entityIds.length === 5) {
          setGeneratedEntity(foundDevice.entityIds[0] || "");
          setConsumedEntity(foundDevice.entityIds[1] || "");
          setExportedEntity(foundDevice.entityIds[2] || "");
          setChargeEntity(foundDevice.entityIds[3] || "");
          setChargingEntity(foundDevice.entityIds[4] || "");
        }
      }

      // Fetch all entities
      const allEntities = await entityService.fetchAllEntities();
      setEntities(allEntities || []);
    } catch (error) {
      console.error("Failed to load entities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!solarDevice) return;

    const newEntityIds = [
      generatedEntity,
      consumedEntity,
      exportedEntity,
      chargeEntity,
      chargingEntity
    ];

    // Update the device in the room store
    updateDeviceInRoom(solarDevice.roomId, solarDevice.id, {
      entityIds: newEntityIds
    });

    onOpenChange(false);
  };

  const filterEntities = (filter: 'power' | 'battery' | 'binary') => {
    if (filter === 'binary') {
      return entities.filter(e => e.entity_id.startsWith('binary_sensor.'));
    }
    if (filter === 'battery') {
      return entities.filter(e =>
        e.entity_id.startsWith('sensor.') &&
        (e.entity_id.includes('battery') || e.entity_id.includes('charge'))
      );
    }
    return entities.filter(e =>
      e.entity_id.startsWith('sensor.') &&
      (e.entity_id.includes('power') || e.entity_id.includes('solar') || e.entity_id.includes('site') ||
       e.entity_id.includes('energy') || e.entity_id.includes('consumed') || e.entity_id.includes('generated') ||
       e.entity_id.includes('export'))
    );
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!solarDevice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-accent" />
              Configure Solar Entities
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            No Tesla Solar System device found. Please add a solar device first.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl [&>button]:text-accent [&>button]:hover:bg-accent/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-accent" />
            Configure Solar Entities
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Map Home Assistant entities to your Tesla Solar System. This configuration is stored locally per browser.
          </p>

          {/* Power Generated */}
          <div className="space-y-2">
            <Label htmlFor="generated" className="text-accent">Power Generated (kW)</Label>
            <Select value={generatedEntity} onValueChange={setGeneratedEntity}>
              <SelectTrigger id="generated" className="border-accent/50 focus:ring-accent">
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-accent/30">
                {filterEntities('power').map(entity => (
                  <SelectItem key={entity.entity_id} value={entity.entity_id} className="focus:bg-accent/10 focus:text-accent">
                    {entity.entity_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Power Consumed */}
          <div className="space-y-2">
            <Label htmlFor="consumed" className="text-accent">Power Consumed (kW)</Label>
            <Select value={consumedEntity} onValueChange={setConsumedEntity}>
              <SelectTrigger id="consumed" className="border-accent/50 focus:ring-accent">
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-accent/30">
                {filterEntities('power').map(entity => (
                  <SelectItem key={entity.entity_id} value={entity.entity_id} className="focus:bg-accent/10 focus:text-accent">
                    {entity.entity_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Power Exported */}
          <div className="space-y-2">
            <Label htmlFor="exported" className="text-accent">Power Exported (kW)</Label>
            <Select value={exportedEntity} onValueChange={setExportedEntity}>
              <SelectTrigger id="exported" className="border-accent/50 focus:ring-accent">
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-accent/30">
                {filterEntities('power').map(entity => (
                  <SelectItem key={entity.entity_id} value={entity.entity_id} className="focus:bg-accent/10 focus:text-accent">
                    {entity.entity_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Powerwall Charge */}
          <div className="space-y-2">
            <Label htmlFor="charge" className="text-accent">Powerwall Charge (%)</Label>
            <Select value={chargeEntity} onValueChange={setChargeEntity}>
              <SelectTrigger id="charge" className="border-accent/50 focus:ring-accent">
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-accent/30">
                {filterEntities('battery').map(entity => (
                  <SelectItem key={entity.entity_id} value={entity.entity_id} className="focus:bg-accent/10 focus:text-accent">
                    {entity.entity_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Powerwall Charging Status */}
          <div className="space-y-2">
            <Label htmlFor="charging" className="text-accent">Powerwall Charging (Binary)</Label>
            <Select value={chargingEntity} onValueChange={setChargingEntity}>
              <SelectTrigger id="charging" className="border-accent/50 focus:ring-accent">
                <SelectValue placeholder="Select entity..." />
              </SelectTrigger>
              <SelectContent className="bg-background border-accent/30">
                {filterEntities('binary').map(entity => (
                  <SelectItem key={entity.entity_id} value={entity.entity_id} className="focus:bg-accent/10 focus:text-accent">
                    {entity.entity_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-accent/50 hover:bg-accent/10 hover:text-accent">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!generatedEntity || !consumedEntity || !exportedEntity || !chargeEntity || !chargingEntity}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
