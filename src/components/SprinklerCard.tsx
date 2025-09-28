import { Droplets, Clock, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SprinklerZone {
  id: number;
  name: string;
  isActive: boolean;
  duration: number; // minutes
}

interface SprinklerCardProps {
  zones: SprinklerZone[];
  onZoneToggle: (zoneId: number) => void;
}

export function SprinklerCard({ zones, onZoneToggle }: SprinklerCardProps) {
  const activeZones = zones.filter(zone => zone.isActive).length;

  return (
    <div className="device-card col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500 text-white">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Sprinkler System</h3>
            <p className="text-xs text-muted-foreground">{activeZones} of {zones.length} zones active</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {zones.map((zone) => (
          <div key={zone.id} className="glass-card p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{zone.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onZoneToggle(zone.id)}
                className={`h-6 w-6 ${zone.isActive ? "text-blue-500" : "text-muted-foreground"}`}
              >
                {zone.isActive ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
            </div>
            {zone.isActive && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{zone.duration} min</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}