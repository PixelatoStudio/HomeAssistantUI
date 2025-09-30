import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cog, RefreshCw, Shield, Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { useRoomStore } from "@/lib/rooms/roomStore";
import { useSettingsStore } from "@/stores/settingsStore";

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetupWizard: () => void;
  onScanNew: () => void;
}

export function AdminDialog({
  open,
  onOpenChange,
  onSetupWizard,
  onScanNew,
}: AdminDialogProps) {
  const { clearAllDevices, resetDashboard } = useRoomStore();
  const { resetSettings } = useSettingsStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSetupWizard = () => {
    onOpenChange(false);
    onSetupWizard();
  };

  const handleScanNew = () => {
    onOpenChange(false);
    onScanNew();
  };

  const handleClearDevices = () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    clearAllDevices();
    setShowConfirm(false);
    onOpenChange(false);
  };

  const handleResetDashboard = () => {
    if (window.confirm('Are you sure you want to reset the entire dashboard? This will remove all rooms and devices and restore defaults.')) {
      resetDashboard();
      onOpenChange(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings? This will restore default theme, colors, and background settings.')) {
      resetSettings();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            Admin Tools
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">
              Administrative tools for system configuration and maintenance.
            </p>
          </div>

          {/* Setup Wizard */}
          <Button
            variant="outline"
            onClick={handleSetupWizard}
            className="w-full flex items-center justify-start gap-3 h-auto py-4"
          >
            <div className="p-2 rounded-lg bg-accent/10">
              <Cog className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">Setup Wizard</div>
              <div className="text-xs text-muted-foreground">
                Configure rooms and devices from scratch
              </div>
            </div>
          </Button>

          {/* Scan New Entities */}
          <Button
            variant="outline"
            onClick={handleScanNew}
            className="w-full flex items-center justify-start gap-3 h-auto py-4"
          >
            <div className="p-2 rounded-lg bg-accent/10">
              <RefreshCw className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">Scan New Entities</div>
              <div className="text-xs text-muted-foreground">
                Discover and configure new Home Assistant entities
              </div>
            </div>
          </Button>

          {/* Divider */}
          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              Danger Zone
            </p>
          </div>

          {/* Clear All Devices */}
          <Button
            variant={showConfirm ? "destructive" : "outline"}
            onClick={handleClearDevices}
            className="w-full flex items-center justify-start gap-3 h-auto py-4"
          >
            <div className={`p-2 rounded-lg ${showConfirm ? 'bg-destructive-foreground/10' : 'bg-destructive/10'}`}>
              <Trash2 className={`h-5 w-5 ${showConfirm ? 'text-destructive-foreground' : 'text-destructive'}`} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">
                {showConfirm ? 'Click Again to Confirm' : 'Clear All Devices'}
              </div>
              <div className={`text-xs ${showConfirm ? 'text-destructive-foreground/80' : 'text-muted-foreground'}`}>
                {showConfirm ? 'This will remove all devices from all rooms' : 'Remove all devices but keep rooms'}
              </div>
            </div>
          </Button>

          {showConfirm && (
            <Button
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              className="w-full"
            >
              Cancel
            </Button>
          )}

          {/* Reset Dashboard */}
          <Button
            variant="outline"
            onClick={handleResetDashboard}
            className="w-full flex items-center justify-start gap-3 h-auto py-4 border-destructive/50 hover:bg-destructive/10"
          >
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-destructive">Reset Dashboard</div>
              <div className="text-xs text-muted-foreground">
                Restore all rooms and remove all devices to defaults
              </div>
            </div>
          </Button>

          {/* Reset Settings */}
          <Button
            variant="outline"
            onClick={handleResetSettings}
            className="w-full flex items-center justify-start gap-3 h-auto py-4 border-destructive/50 hover:bg-destructive/10"
          >
            <div className="p-2 rounded-lg bg-destructive/10">
              <RotateCcw className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-destructive">Reset Settings</div>
              <div className="text-xs text-muted-foreground">
                Restore default theme, colors, and background settings
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}