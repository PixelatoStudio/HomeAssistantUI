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
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${isActive ? "status-active" : "bg-muted"} transition-all duration-300 flex-shrink-0`}>
            <Icon className={`${size === "large" ? "h-6 w-6" : "h-5 w-5"} ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${size === "large" ? "text-lg" : "text-sm"} truncate`}>{name}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
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