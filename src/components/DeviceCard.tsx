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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? "status-active" : "bg-muted"} transition-all duration-300`}>
            <Icon className={`${size === "large" ? "h-6 w-6" : "h-5 w-5"} ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${size === "large" ? "text-lg" : "text-sm"}`}>{name}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          className="scale-90"
        />
      </div>
    </div>
  );
}