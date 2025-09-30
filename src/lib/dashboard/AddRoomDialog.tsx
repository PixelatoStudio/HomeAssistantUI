import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Bed, Coffee, Car, Music, Briefcase, Heart, Shirt, Baby, Gamepad2, Dumbbell, CloudSun, Trees, Sofa } from "lucide-react";

interface AddRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRoom: (name: string, icon: string) => void;
}

const roomIcons = [
  { name: 'Home', icon: Home },
  { name: 'Bed', icon: Bed },
  { name: 'Coffee', icon: Coffee },
  { name: 'Car', icon: Car },
  { name: 'Sofa', icon: Sofa },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'CloudSun', icon: CloudSun },
  { name: 'Trees', icon: Trees },
  { name: 'Music', icon: Music },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Heart', icon: Heart },
  { name: 'Shirt', icon: Shirt },
  { name: 'Baby', icon: Baby },
  { name: 'Dumbbell', icon: Dumbbell },
];

export function AddRoomDialog({ open, onOpenChange, onAddRoom }: AddRoomDialogProps) {
  const [roomName, setRoomName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Home");

  const handleSubmit = () => {
    if (roomName.trim()) {
      onAddRoom(roomName.trim(), selectedIcon);
      setRoomName("");
      setSelectedIcon("Home");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setRoomName("");
    setSelectedIcon("Home");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Room</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Room Name Input */}
          <div className="space-y-2">
            <Label htmlFor="room-name" className="text-base">Room Name</Label>
            <Input
              id="room-name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="h-12 text-base"
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <Label className="text-base">Choose Icon</Label>
            <div className="grid grid-cols-4 gap-2">
              {roomIcons.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedIcon === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => setSelectedIcon(item.name)}
                    className={`flex items-center justify-center h-14 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-accent text-accent-foreground shadow-lg scale-105'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-8 h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!roomName.trim()}
              className="px-8 h-11 bg-accent hover:bg-accent/90"
            >
              Add Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}