import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRoomStore } from "@/lib/rooms/roomStore";
import { DeviceTemplate } from "@/lib/rooms/types";
import { DeviceLibraryDialog } from "@/lib/dashboard/DeviceLibraryDialog";
import { EntityConfigDialog } from "@/lib/dashboard/EntityConfigDialog";
import { SetupWizardDialog } from "@/lib/setup/SetupWizardDialog";
import { NewEntityScanDialog } from "@/lib/setup/NewEntityScanDialog";
import { SettingsDialog } from "@/lib/dashboard/SettingsDialog";
import { AdminDialog } from "@/lib/dashboard/AdminDialog";
import { DeviceManager } from "@/lib/dashboard/DeviceManager";
import { UniversalDeviceCard } from "@/lib/dashboard/UniversalDeviceCard";
import { MultiEntityCard } from "@/lib/dashboard/MultiEntityCard";
import { TemperatureControl } from "@/components/TemperatureControl";
import { TeslaSolarCard } from "@/components/TeslaSolarCard";
import { SortableDeviceCard } from "@/lib/dashboard/SortableDeviceCard";
import { LoginScreen } from "@/components/LoginScreen";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Image, Plus, Settings, Home, Edit, Trash2, Sofa, Bed, Activity, Cog, RefreshCw, Shield, Video } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import room images (reuse existing)
import livingRoomImg from "@/assets/living-room.jpg";

// TEST DASHBOARD ONLY - Camera Stream Experiment
import { CameraStreamDialog } from "@/lib/camera/CameraStreamDialog";
import { LiveCameraCard } from "@/lib/camera/LiveCameraCard";

const TestDashboard = () => {
  const { isAuthenticated, logout, credentials } = useAuthStore();
  const { rooms, selectedRoomId, selectRoom, addRoom, removeRoom, getSelectedRoom, addDeviceToRoom, removeDeviceFromRoom, reorderDevicesInRoom } = useRoomStore();

  // Configure drag sensors for tablet/touch optimization
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms long press for touch
        tolerance: 5, // 5px of movement tolerance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist needs time to hydrate from localStorage
    setIsHydrated(true);
  }, []);

  const [showBackgroundImage, setShowBackgroundImage] = useState<boolean>(true);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>("");
  const [newRoomName, setNewRoomName] = useState("");
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [showDeviceLibrary, setShowDeviceLibrary] = useState(false);
  const [showEntityConfig, setShowEntityConfig] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DeviceTemplate | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showNewEntityScan, setShowNewEntityScan] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // TEST DASHBOARD ONLY - Camera Stream State
  const [showCameraStream, setShowCameraStream] = useState(false);

  // Show loading during hydration to prevent flash
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => {}} />;
  }

  const selectedRoom = getSelectedRoom();


  // Ensure we have a selected room if rooms exist
  if (!selectedRoom && rooms.length > 0) {
    selectRoom(rooms[0].id);
  }

  const getRoomIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4 text-muted-foreground" />;
    }
    return <Home className="h-4 w-4 text-muted-foreground" />;
  };

  const getDeviceIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className="h-4 w-4 text-muted-foreground" />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const handleAddRoom = () => {
    if (newRoomName.trim()) {
      addRoom(newRoomName.trim());
      setNewRoomName("");
      setShowAddRoomDialog(false);
    }
  };

  const handleRemoveRoom = (roomId: string) => {
    if (rooms.length > 1) { // Don't allow removing the last room
      removeRoom(roomId);
    }
  };

  const handleTemplateSelect = (template: DeviceTemplate) => {
    setSelectedTemplate(template);
    setShowDeviceLibrary(false);
    setShowEntityConfig(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || !selectedRoom) return;

    if (active.id !== over.id) {
      const oldIndex = selectedRoom.devices.findIndex(d => d.id === active.id);
      const newIndex = selectedRoom.devices.findIndex(d => d.id === over.id);

      const newOrder = arrayMove(selectedRoom.devices, oldIndex, newIndex);
      const newDeviceIds = newOrder.map(d => d.id);

      reorderDevicesInRoom(selectedRoom.id, newDeviceIds);
    }
  };

  const handleDeviceConfirm = (config: {
    template: DeviceTemplate;
    entity: any;
    entities?: any[]; // For multi-entity devices
    deviceName: string;
    customIcon?: string;
  }) => {
    console.log('🔧 handleDeviceConfirm called with:', {
      selectedRoomId,
      config,
      template: config.template,
      entity: config.entity,
      entities: config.entities
    });

    if (!selectedRoomId) {
      console.error('❌ No selectedRoomId available');
      return;
    }

    const deviceData = {
      name: config.deviceName,
      type: config.template.type,
      entityId: config.entity.entity_id,
      entityIds: config.entities?.map(e => e.entity_id), // Multi-entity support
      icon: config.customIcon || config.template.defaultIcon,
      customSettings: {},
    };

    console.log('📱 Adding device to room:', { selectedRoomId, deviceData });

    try {
      addDeviceToRoom(selectedRoomId, deviceData);
      console.log('✅ Device added successfully');
    } catch (error) {
      console.error('❌ Error adding device:', error);
    }

    setShowEntityConfig(false);
    setSelectedTemplate(null);
  };

  const backgroundImageUrl = customBackgroundUrl || livingRoomImg;

  return (
    <div
      className="min-h-screen bg-background p-6 animate-fade-in relative"
      style={showBackgroundImage ? {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
      {showBackgroundImage && <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-montserrat font-normal text-foreground">
              linx home automation
              <span className="text-sm text-muted-foreground ml-3 font-normal">TEST DASHBOARD</span>
            </h1>
            <p className="text-muted-foreground">Building the new card system - Welcome back, Reed!</p>
          </div>
          <div className="flex items-center gap-6">
            {/* TEST DASHBOARD ONLY - Camera Test Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCameraStream(true)}
              className="flex items-center gap-2 border-accent/50"
            >
              <Video className="h-4 w-4" />
              Test Camera
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/"}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Main Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdmin(true)}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Progress Banner */}
        <div className="mb-6 p-4 bg-muted/50 rounded-xl backdrop-blur-lg border border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-accent">✨ Test Dashboard - New Card System</h3>
              <p className="text-sm text-muted-foreground">
                Ready to test: Add rooms → Select device templates → Configure entities → Control devices
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">System Active</span>
            </div>
          </div>
        </div>

        {/* Room Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl backdrop-blur-lg overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              {rooms.map((room) => {
                const isSelected = selectedRoomId === room.id;

                return (
                  <div key={room.id} className="flex items-center gap-1">
                    <button
                      onClick={() => selectRoom(room.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                        isSelected
                          ? 'bg-accent text-accent-foreground shadow-lg'
                          : 'hover:bg-white/50 dark:hover:bg-white/10'
                      }`}
                    >
                      {getRoomIcon(room.icon)}
                      <span className="font-medium text-sm">{room.name}</span>
                    </button>

                    {/* Remove room button - only show if more than 1 room */}
                    {rooms.length > 1 && (
                      <button
                        onClick={() => handleRemoveRoom(room.id)}
                        className="p-1 rounded hover:bg-destructive/20 text-destructive/60 hover:text-destructive transition-colors"
                        title="Remove room"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add Room Button */}
              <Dialog open={showAddRoomDialog} onOpenChange={setShowAddRoomDialog}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap border-2 border-dashed border-muted-foreground/30 hover:border-accent/50 hover:bg-accent/10">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-muted-foreground">Add Room</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="room-name">Room Name</Label>
                      <Input
                        id="room-name"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        placeholder="e.g., Kitchen, Office, Garage"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowAddRoomDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddRoom} disabled={!newRoomName.trim()}>
                        Add Room
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Current Room Content */}
          <div className="col-span-full">
            <div className="glass-card p-8 text-center">
              {!selectedRoom ? (
                <>
                  <p className="text-muted-foreground mb-6">
                    No rooms available. Add a room to get started!
                  </p>
                </>
              ) : selectedRoom.devices.length === 0 ? (
                <>
                  <p className="text-muted-foreground mb-6">
                    No devices configured yet. Add your first device to get started!
                  </p>

                  {/* Add Device Button */}
                  <button
                    onClick={() => setShowDeviceLibrary(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Device
                  </button>
                </>
              ) : (
                <>
                  {/* Device Cards - Live Controls with Drag & Drop */}
                  {selectedRoom.devices.length > 0 ? (
                    <DeviceManager roomId={selectedRoom.id}>
                      {({ devices, entityStates, isOnline, toggleDevice, setDeviceBrightness, setDeviceColor, setHvacMode, setTemperature, removeDevice }) => (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={devices.map(d => d.id)}
                            strategy={rectSortingStrategy}
                          >
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                              {devices.map((device) => {
                                // Render multi-entity card for multi_entity type
                                if (device.type === 'multi_entity') {
                                  return (
                                    <SortableDeviceCard key={device.id} id={device.id}>
                                      <MultiEntityCard
                                        device={device}
                                        entityStates={entityStates}
                                        isOnline={isOnline}
                                        onToggle={toggleDevice}
                                        onIntensityChange={setDeviceBrightness}
                                        onHvacModeChange={setHvacMode}
                                        onTemperatureChange={setTemperature}
                                        onRemove={removeDevice}
                                      />
                                    </SortableDeviceCard>
                                  );
                                }

                                // Render TemperatureControl for thermostat/climate devices
                                if (device.type === 'thermostat' || device.type === 'ac_unit') {
                                  const entity = entityStates[device.entityId];
                                  if (!entity) return null;

                                  return (
                                    <SortableDeviceCard key={device.id} id={device.id}>
                                      <TemperatureControl
                                        entity={entity}
                                        onEntityUpdate={() => {
                                          // Refresh entity state after changes
                                        }}
                                      />
                                    </SortableDeviceCard>
                                  );
                                }

                                // Render TeslaSolarCard for solar_system devices
                                if (device.type === 'solar_system') {
                                  const solarEntities = device.entityIds || [];

                                  // Extract power values from entities
                                  const powerGenerated = parseFloat(entityStates[solarEntities[0]]?.state || '0');
                                  const powerConsumed = parseFloat(entityStates[solarEntities[1]]?.state || '0');
                                  const powerExported = parseFloat(entityStates[solarEntities[2]]?.state || '0');
                                  const powerwallCharge = parseFloat(entityStates[solarEntities[3]]?.state || '0');
                                  const powerwallCharging = entityStates[solarEntities[4]]?.state === 'on';

                                  const status = powerGenerated > 0 ? (powerGenerated > powerConsumed ? 'exporting' : 'generating') : 'unavailable';

                                  return (
                                    <SortableDeviceCard key={device.id} id={device.id} className="col-span-2">
                                      <TeslaSolarCard
                                        powerGenerated={powerGenerated}
                                        powerConsumed={powerConsumed}
                                        powerExported={powerExported}
                                        status={status}
                                        powerwallCharging={powerwallCharging}
                                        powerwallCharge={powerwallCharge}
                                      />
                                    </SortableDeviceCard>
                                  );
                                }

                                // Render normal device card
                                return (
                                  <SortableDeviceCard key={device.id} id={device.id}>
                                    <UniversalDeviceCard
                                      device={device}
                                      entityState={entityStates[device.entityId]}
                                      isOnline={isOnline}
                                      onToggle={toggleDevice}
                                      onIntensityChange={setDeviceBrightness}
                                      onColorChange={setDeviceColor}
                                      onRemove={removeDevice}
                                    />
                                  </SortableDeviceCard>
                                );
                              })}

                              {/* Add Device Card */}
                              <button
                                onClick={() => setShowDeviceLibrary(true)}
                                className="flex flex-col items-center justify-center min-h-[180px] rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-accent/50 hover:bg-accent/5 transition-all duration-300 group"
                              >
                                <Plus className="h-8 w-8 text-muted-foreground group-hover:text-accent transition-colors mb-2" />
                                <span className="text-muted-foreground group-hover:text-accent transition-colors font-medium">
                                  Add Device
                                </span>
                              </button>
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </DeviceManager>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Development Status */}
        <footer className="mt-8 p-4 bg-muted/30 rounded-lg backdrop-blur-sm">
          <div className="text-center text-sm text-muted-foreground">
            <p>Test Dashboard Active • Room Management ✅ • Device Templates ✅ • Entity Configuration ✅ • Live Device Controls ✅</p>
          </div>
        </footer>

        {/* Dialogs */}
        <DeviceLibraryDialog
          open={showDeviceLibrary}
          onOpenChange={setShowDeviceLibrary}
          onSelectTemplate={handleTemplateSelect}
        />

        <EntityConfigDialog
          open={showEntityConfig}
          onOpenChange={setShowEntityConfig}
          template={selectedTemplate}
          onConfirm={handleDeviceConfirm}
        />

        <SetupWizardDialog
          open={showSetupWizard}
          onOpenChange={setShowSetupWizard}
        />

        <NewEntityScanDialog
          open={showNewEntityScan}
          onOpenChange={setShowNewEntityScan}
        />

        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          showBackgroundImage={showBackgroundImage}
          onBackgroundImageChange={setShowBackgroundImage}
          customBackgroundUrl={customBackgroundUrl}
          onCustomBackgroundChange={setCustomBackgroundUrl}
        />

        <AdminDialog
          open={showAdmin}
          onOpenChange={setShowAdmin}
          onSetupWizard={() => setShowSetupWizard(true)}
          onScanNew={() => setShowNewEntityScan(true)}
        />

        {/* TEST DASHBOARD ONLY - Camera Stream Dialog */}
        {credentials && (
          <CameraStreamDialog
            open={showCameraStream}
            onOpenChange={setShowCameraStream}
            entityId="camera.front_door_sub"
            snapshotEntity="camera.front_door_snapshots_sub"
            entityName="Front Door Camera"
            host={credentials.url.replace(/^https?:\/\//, '')}
            token={credentials.token}
          />
        )}
      </div>
    </div>
  );
};

export default TestDashboard;