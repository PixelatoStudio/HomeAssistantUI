import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, CheckCircle, Cog, RefreshCw, X } from "lucide-react";
import { entityDiscoveryService, DiscoveryResults, DiscoveredEntity } from "./entityDiscoveryService";
import { templateGenerationService } from "./templateGenerationService";
import { useGeneratedTemplateStore } from "./generatedTemplateStore";
import { useRoomStore } from "../rooms/roomStore";

interface SetupWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = 'welcome' | 'scanning' | 'selection' | 'templates' | 'complete';

export function SetupWizardDialog({ open, onOpenChange }: SetupWizardDialogProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [progress, setProgress] = useState(0);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResults | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [useAutoGeneration, setUseAutoGeneration] = useState<boolean>(true);
  const [customTemplateName, setCustomTemplateName] = useState<string>("");
  const [customTemplateIcon, setCustomTemplateIcon] = useState<string>("Lightbulb");
  const [customTemplateCategory, setCustomTemplateCategory] = useState<string>("lighting");

  const { addTemplates, updateLastDiscovery } = useGeneratedTemplateStore();
  const { selectedRoomId, addDeviceToRoom } = useRoomStore();

  const steps = [
    { id: 'welcome', label: 'Welcome', progress: 0 },
    { id: 'scanning', label: 'Scanning', progress: 25 },
    { id: 'selection', label: 'Selection', progress: 50 },
    { id: 'templates', label: 'Templates', progress: 75 },
    { id: 'complete', label: 'Complete', progress: 100 },
  ];

  const handleStartScan = async () => {
    setCurrentStep('scanning');
    setIsScanning(true);
    setProgress(25);
    setError(null);

    try {
      const results = await entityDiscoveryService.discoverEntities();
      setDiscoveryResults(results);
      setCurrentStep('selection');
      setProgress(50);
    } catch (error) {
      console.error('Failed to scan entities:', error);
      setError('Failed to discover entities. Please check your Home Assistant connection.');
      setCurrentStep('welcome');
      setProgress(0);
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

  const handleSelectAllInGroup = (entities: DiscoveredEntity[], select: boolean) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev);
      entities.forEach(entity => {
        if (select) {
          newSet.add(entity.entity_id);
        } else {
          newSet.delete(entity.entity_id);
        }
      });
      return newSet;
    });
  };

  const handleContinueToTemplates = () => {
    if (!discoveryResults) return;

    // Get selected entities
    const selectedEntityList: DiscoveredEntity[] = [];
    discoveryResults.groups.forEach(group => {
      group.entities.forEach(entity => {
        if (selectedEntities.has(entity.entity_id)) {
          selectedEntityList.push(entity);
        }
      });
    });

    if (useAutoGeneration) {
      // Auto-generate templates from selected entities
      const generatedTemplates = templateGenerationService.generateTemplatesFromEntities(selectedEntityList);
      addTemplates(generatedTemplates);
      updateLastDiscovery(discoveryResults);
    } else {
      // User wants to create custom template - will be handled in templates step
      updateLastDiscovery(discoveryResults);
    }

    setCurrentStep('templates');
    setProgress(75);
  };

  const handleComplete = () => {
    setCurrentStep('complete');
    setProgress(100);

    // Auto-close after completion
    setTimeout(() => {
      onOpenChange(false);
      setCurrentStep('welcome');
      setProgress(0);
      setSelectedEntities(new Set());
      setDiscoveryResults(null);
      setError(null);
    }, 2000);
  };

  const handleRescan = () => {
    setSelectedEntities(new Set());
    setDiscoveryResults(null);
    setError(null);
    handleStartScan();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-full bg-accent/20 w-16 h-16 mx-auto flex items-center justify-center">
              <Cog className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Welcome to Setup Wizard</h3>
              <p className="text-muted-foreground">
                Let's scan your Home Assistant setup to discover entities and create device templates for the ones you want to control.
              </p>
            </div>
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <Button onClick={handleStartScan} className="w-full" disabled={isScanning}>
              <Search className="h-4 w-4 mr-2" />
              Start Entity Discovery
            </Button>
          </div>
        );

      case 'scanning':
        return (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-full bg-accent/20 w-16 h-16 mx-auto flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Scanning Your Home Assistant</h3>
              <p className="text-muted-foreground">
                Discovering entities and analyzing their capabilities...
              </p>
            </div>
          </div>
        );

      case 'selection':
        if (!discoveryResults) return null;

        // Filter groups based on search query
        const filteredGroups = discoveryResults.groups.map(group => {
          if (!searchQuery.trim()) {
            return group;
          }

          const query = searchQuery.toLowerCase();
          const filteredEntities = group.entities.filter(entity =>
            entity.friendly_name.toLowerCase().includes(query) ||
            entity.entity_id.toLowerCase().includes(query) ||
            entity.domain.toLowerCase().includes(query)
          );

          return {
            ...group,
            entities: filteredEntities,
            count: filteredEntities.length
          };
        }).filter(group => group.count > 0);

        const totalFiltered = filteredGroups.reduce((sum, group) => sum + group.count, 0);

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Select Entities</h3>
                <p className="text-sm text-muted-foreground">
                  Found {discoveryResults.totalEntities} entities. Choose which ones to add to your dashboard.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRescan}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Rescan
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search entities by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Showing {totalFiltered} of {discoveryResults.totalEntities} entities
              </p>
            )}

            <ScrollArea className="h-80">
              <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No entities found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  filteredGroups.map((group) => {
                    const groupSelected = group.entities.filter(e => selectedEntities.has(e.entity_id)).length;
                    const allSelected = groupSelected === group.entities.length;
                    const someSelected = groupSelected > 0 && groupSelected < group.entities.length;

                    return (
                      <div key={group.domain} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={allSelected}
                              ref={(ref) => {
                                if (ref) ref.indeterminate = someSelected;
                              }}
                              onCheckedChange={(checked) =>
                                handleSelectAllInGroup(group.entities, checked === true)
                              }
                            />
                            <div>
                              <h4 className="font-semibold capitalize">{group.domain}s</h4>
                              <p className="text-xs text-muted-foreground">
                                {groupSelected}/{group.count} selected
                                {group.capabilities.length > 0 && (
                                  <span> • {group.capabilities.join(', ')}</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 ml-6">
                          {group.entities.map((entity) => (
                            <div key={entity.entity_id} className="flex items-center space-x-2">
                              <Checkbox
                                checked={selectedEntities.has(entity.entity_id)}
                                onCheckedChange={() => handleEntityToggle(entity.entity_id)}
                              />
                              <span className="text-sm">{entity.friendly_name}</span>
                              <span className="text-xs text-muted-foreground">({entity.entity_id})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="auto-generate"
                    checked={useAutoGeneration}
                    onCheckedChange={(checked) => setUseAutoGeneration(checked === true)}
                  />
                  <div>
                    <label htmlFor="auto-generate" className="text-sm font-medium cursor-pointer">
                      Auto-generate templates
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {useAutoGeneration
                        ? "Create separate templates for each entity type"
                        : "Create custom template from selected entities"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {selectedEntities.size} entities selected
                </p>
                <Button
                  onClick={handleContinueToTemplates}
                  disabled={selectedEntities.size === 0}
                >
                  {useAutoGeneration ? 'Generate Templates' : 'Create Custom Template'} ({selectedEntities.size})
                </Button>
              </div>
            </div>
          </div>
        );

      case 'templates':
        if (!discoveryResults) return null;

        const selectedEntitiesByDomain = new Map<string, DiscoveredEntity[]>();
        const selectedEntityList: DiscoveredEntity[] = [];
        discoveryResults.groups.forEach(group => {
          const selectedInGroup = group.entities.filter(e => selectedEntities.has(e.entity_id));
          if (selectedInGroup.length > 0) {
            selectedEntitiesByDomain.set(group.domain, selectedInGroup);
            selectedEntityList.push(...selectedInGroup);
          }
        });

        const handleCreateMultiEntityCard = () => {
          if (!customTemplateName.trim()) {
            setError("Please enter a card name");
            return;
          }

          if (!selectedRoomId) {
            setError("Please select a room first");
            return;
          }

          // Create multi-entity card directly in the selected room
          const multiEntityCard = {
            name: customTemplateName,
            type: 'multi_entity' as any,
            entityId: selectedEntityList[0]?.entity_id || '', // Primary entity
            entityIds: selectedEntityList.map(e => e.entity_id), // All entities
            icon: customTemplateIcon,
            customSettings: {
              category: customTemplateCategory,
              entities: selectedEntityList.map(e => ({
                entity_id: e.entity_id,
                friendly_name: e.friendly_name,
                domain: e.domain,
                device_class: e.device_class,
              }))
            }
          };

          addDeviceToRoom(selectedRoomId, multiEntityCard);
          handleComplete();
        };

        if (!useAutoGeneration) {
          // Multi-entity card builder
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Create Multi-Entity Card</h3>
                <p className="text-muted-foreground">
                  Create a single card that controls {selectedEntities.size} entities together.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-4 text-left">
                <div>
                  <label className="text-sm font-medium mb-2 block">Card Name</label>
                  <Input
                    placeholder="e.g., Living Room Lights"
                    value={customTemplateName}
                    onChange={(e) => setCustomTemplateName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    value={customTemplateCategory}
                    onChange={(e) => setCustomTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                  >
                    <option value="lighting">Lighting</option>
                    <option value="switches">Switches</option>
                    <option value="sensors">Sensors</option>
                    <option value="climate">Climate</option>
                    <option value="entertainment">Entertainment</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Icon</label>
                  <Input
                    placeholder="e.g., Lightbulb, Fan, Thermometer"
                    value={customTemplateIcon}
                    onChange={(e) => setCustomTemplateIcon(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use Lucide icon names (e.g., Lightbulb, Fan, Tv)
                  </p>
                </div>

                <div className="border rounded-lg p-3 bg-muted/20">
                  <p className="text-sm font-medium mb-2">Included Entities ({selectedEntities.size}):</p>
                  <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                    {selectedEntityList.map(entity => (
                      <div key={entity.entity_id} className="flex justify-between items-center">
                        <span>• {entity.friendly_name}</span>
                        <span className="text-xs opacity-60">{entity.domain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUseAutoGeneration(true);
                    setCurrentStep('selection');
                    setProgress(50);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateMultiEntityCard}
                  disabled={!customTemplateName.trim()}
                  className="flex-1"
                >
                  Create Card
                </Button>
              </div>
            </div>
          );
        }

        // Auto-generated templates summary
        return (
          <div className="text-center space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Templates Created</h3>
              <p className="text-muted-foreground">
                Successfully created device templates for {selectedEntities.size} selected entities across {selectedEntitiesByDomain.size} domains.
              </p>
            </div>

            <div className="space-y-2">
              {Array.from(selectedEntitiesByDomain.entries()).map(([domain, entities]) => (
                <div key={domain} className="text-sm text-left p-3 bg-muted/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">✓ {domain} templates</span>
                    <span className="text-muted-foreground">{entities.length} entities</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {entities.slice(0, 3).map(e => e.friendly_name).join(', ')}
                    {entities.length > 3 && ` +${entities.length - 3} more`}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleComplete} className="w-full">
              Complete Setup
            </Button>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="p-4 rounded-full bg-green-500/20 w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your device templates have been configured. You can now add devices that match your Home Assistant setup.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Device Template Setup</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Step Content */}
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}