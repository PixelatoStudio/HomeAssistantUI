import { LucideIcon } from "lucide-react";

interface RoomCardProps {
  name: string;
  deviceCount: number;
  icon: LucideIcon;
  isSelected: boolean;
  onClick: () => void;
  imageUrl?: string;
}

export function RoomCard({ name, deviceCount, icon: Icon, isSelected, onClick, imageUrl }: RoomCardProps) {
  return (
    <div 
      className={`device-card cursor-pointer group ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <div className="room-thumbnail mb-3 relative">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-lg" />
        <div className="absolute bottom-2 left-2 text-white">
          <h3 className="font-semibold text-sm">{name}</h3>
          <p className="text-xs opacity-80">{deviceCount} devices</p>
        </div>
      </div>
    </div>
  );
}