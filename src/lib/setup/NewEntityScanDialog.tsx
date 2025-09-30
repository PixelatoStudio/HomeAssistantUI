import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { entityDiscoveryService, DiscoveredEntity } from "./entityDiscoveryService";
import { templateGenerationService } from "./templateGenerationService";
import { useGeneratedTemplateStore } from "./generatedTemplateStore";

interface NewEntityScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ScanStep = 'scan' | 'results' | 'selection' | 'complete';

export function NewEntityScanDialog({ open, onOpenChange }: NewEntityScanDialogProps) {
  const [currentStep, setCurrentStep] = useState<ScanStep>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [newEntities, setNewEntities] = useState<DiscoveredEntity[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { lastDiscovery, addTemplates, updateLastDiscovery } = useGeneratedTemplateStore();

  const handleStartScan = async () => {
    if (!lastDiscovery) {
      setError('No previous discovery found. Please run the setup wizard first.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const newEntitiesFound = await entityDiscoveryService.findNewEntities(lastDiscovery);
      setNewEntities(newEntitiesFound);

      if (newEntitiesFound.length === 0) {
        setCurrentStep('results');
      } else {
        setCurrentStep('selection');
      }
    } catch (error) {
      console.error('Failed to scan for new entities:', error);
      setError('Failed to scan for new entities. Please check your Home Assistant connection.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (select: boolean) => {
    setSelectedEntities(select ? new Set(newEntities.map(e => e.entity_id)) : new Set());
  };

  const handleCreateTemplates = async () => {
    const selectedEntityList = newEntities.filter(e => selectedEntities.has(e.entity_id));

    if (selectedEntityList.length === 0) return;

    // Generate templates from selected entities
    const generatedTemplates = templateGenerationService.generateTemplatesFromEntities(selectedEntityList);

    // Store the generated templates
    addTemplates(generatedTemplates);

    // Update last discovery with current results
    try {
      const currentResults = await entityDiscoveryService.discoverEntities();
      updateLastDiscovery(currentResults);
    } catch (error) {
      console.error('Failed to update discovery results:', error);
    }

    setCurrentStep('complete');
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep('scan');
    setNewEntities([]);
    setSelectedEntities(new Set());
    setError(null);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'scan':
        return (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-full bg-accent/20 w-16 h-16 mx-auto flex items-center justify-center">
              {isScanning ? (
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
              ) : (
                <Search className="h-8 w-8 text-accent" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Scan for New Entities</h3>
              <p className="text-muted-foreground">
                {lastDiscovery
                  ? `Check for new entities added since ${new Date(lastDiscovery.discoveredAt).toLocaleDateString()}`
                  : 'No previous scan found. Please run the setup wizard first.'
                }
              </p>
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <Button
              onClick={handleStartScan}
              disabled={!lastDiscovery || isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan for New Entities
                </>
              )}
            </Button>
          </div>
        );

      case 'results':
        return (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Scan Complete</h3>
              <p className="text-muted-foreground">
                No new entities found since your last scan. Your dashboard is up to date!
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        );

      case 'selection':
        const groupedEntities = new Map<string, DiscoveredEntity[]>();
        newEntities.forEach(entity => {
          const domain = entity.domain;
          if (!groupedEntities.has(domain)) {
            groupedEntities.set(domain, []);
          }
          groupedEntities.get(domain)!.push(entity);
        });

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">New Entities Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Found {newEntities.length} new entities. Select which ones to add to your dashboard.
              </p>

              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  checked={selectedEntities.size === newEntities.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Select all entities</span>
              </div>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-4">
                {Array.from(groupedEntities.entries()).map(([domain, entities]) => (
                  <div key={domain} className="border rounded-lg p-4">
                    <h4 className="font-semibold capitalize mb-3">{domain}s ({entities.length})</h4>
                    <div className="space-y-2">
                      {entities.map(entity => (
                        <div key={entity.entity_id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedEntities.has(entity.entity_id)}
                            onCheckedChange={() => handleEntityToggle(entity.entity_id)}
                          />
                          <span className="text-sm">{entity.friendly_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {entity.entity_id}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {selectedEntities.size} entities selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplates}
                  disabled={selectedEntities.size === 0}
                >
                  Add Templates ({selectedEntities.size})
                </Button>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Templates Added!</h3>
              <p className="text-muted-foreground">
                Successfully created device templates for {selectedEntities.size} new entities.
                You can now add these devices to your rooms.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Scan for New Entities</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}