import { Switch } from "@/components/ui/switch";
import { LucideIcon } from "lucide-react";

interface DeviceCardProps {
  name: string;
  subtitle?: string;
  icon: LucideIcon;
  isActive: boolean;
  onToggle: () => void;
  size?: "default" | "large";
}

export function DeviceCard({ name, subtitle, icon: Icon, isActive, onToggle, size = "default" }: DeviceCardProps) {
  return (
    <div className={`device-card group ${size === "large" ? "col-span-2" : ""}`}>
      <div className="flex flex-col items-start gap-3 h-full">
        {/* Icon Row */}
        <div className={`p-2 rounded-lg ${isActive ? "status-active" : "bg-muted"} transition-all duration-300`}>
          <Icon className={`${size === "large" ? "h-6 w-6" : "h-5 w-5"} ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`} />
        </div>
        
        {/* Description Row */}
        <div className="flex-1 w-full">
          <h3 className={`font-semibold ${size === "large" ? "text-lg" : "text-sm"} text-left`}>{name}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground text-left mt-1">{subtitle}</p>
          )}
        </div>
        
        {/* Toggle Row */}
        <div className="w-full flex justify-start">
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            className="scale-90"
          />
        </div>
      </div>
    </div>
  );
}