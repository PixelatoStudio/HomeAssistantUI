import { useState } from "react";
import { 
  Home, 
  Bed, 
  ChefHat, 
  Bath, 
  Sofa, 
  Car,
  Lightbulb,
  Wifi,
  Tv,
  Volume2,
  Shield,
  Camera,
  Thermometer,
  Lock,
  Fan,
  Speaker
} from "lucide-react";

// Import room images
import livingRoomImg from "@/assets/living-room.jpg";
import bedroomImg from "@/assets/bedroom.jpg";
import kitchenImg from "@/assets/kitchen.jpg";
import bathroomImg from "@/assets/bathroom.jpg";
import officeImg from "@/assets/office.jpg";
import garageImg from "@/assets/garage.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoomCard } from "@/components/RoomCard";
import { DeviceCard } from "@/components/DeviceCard";
import { TemperatureControl } from "@/components/TemperatureControl";
import { WeatherCard } from "@/components/WeatherCard";
import { EnergyCard } from "@/components/EnergyCard";
import { SprinklerCard } from "@/components/SprinklerCard";

// Types
interface Room {
  id: string;
  name: string;
  icon: any;
  deviceCount: number;
  devices: Device[];
  imageUrl?: string;
}

interface Device {
  id: string;
  name: string;
  subtitle?: string;
  icon: any;
  isActive: boolean;
  type: string;
}

interface SprinklerZone {
  id: number;
  name: string;
  isActive: boolean;
  duration: number;
}

const Index = () => {
  // State management
  const [selectedRoom, setSelectedRoom] = useState<string>("living");
  const [devices, setDevices] = useState<Record<string, Device[]>>({
    living: [
      { id: "1", name: "Main Light", icon: Lightbulb, isActive: true, type: "light" },
      { id: "2", name: "Smart TV", subtitle: "Samsung 65\"", icon: Tv, isActive: false, type: "entertainment" },
      { id: "3", name: "Sound System", subtitle: "Sonos Beam", icon: Speaker, isActive: true, type: "entertainment" },
      { id: "4", name: "Ceiling Fan", icon: Fan, isActive: false, type: "climate" }
    ],
    bedroom: [
      { id: "5", name: "Bedside Lamp", icon: Lightbulb, isActive: false, type: "light" },
      { id: "6", name: "Smart Lock", subtitle: "Front Door", icon: Lock, isActive: true, type: "security" },
      { id: "7", name: "Air Purifier", icon: Fan, isActive: true, type: "climate" }
    ],
    kitchen: [
      { id: "8", name: "Under Cabinet", icon: Lightbulb, isActive: true, type: "light" },
      { id: "9", name: "Smart Speaker", subtitle: "Alexa Echo", icon: Volume2, isActive: false, type: "entertainment" },
      { id: "10", name: "Security Camera", icon: Camera, isActive: true, type: "security" }
    ],
    bathroom: [
      { id: "11", name: "Mirror Light", icon: Lightbulb, isActive: false, type: "light" },
      { id: "12", name: "Exhaust Fan", icon: Fan, isActive: false, type: "climate" },
      { id: "13", name: "Motion Sensor", icon: Shield, isActive: true, type: "security" }
    ],
    office: [
      { id: "14", name: "Desk Lamp", icon: Lightbulb, isActive: true, type: "light" },
      { id: "15", name: "WiFi Router", subtitle: "Mesh Pro", icon: Wifi, isActive: true, type: "network" },
      { id: "16", name: "Smart Display", icon: Tv, isActive: false, type: "entertainment" }
    ],
    garage: [
      { id: "17", name: "Garage Light", icon: Lightbulb, isActive: false, type: "light" },
      { id: "18", name: "Door Sensor", icon: Shield, isActive: true, type: "security" },
      { id: "19", name: "Garage Door", subtitle: "MyQ", icon: Car, isActive: false, type: "access" }
    ]
  });

  const [temperatures, setTemperatures] = useState({
    upstairs: { current: 22, target: 24 },
    downstairs: { current: 21, target: 22 }
  });

  const [sprinklerZones, setSprinklerZones] = useState<SprinklerZone[]>([
    { id: 1, name: "Front Lawn", isActive: false, duration: 15 },
    { id: 2, name: "Back Yard", isActive: true, duration: 20 },
    { id: 3, name: "Garden Beds", isActive: false, duration: 10 },
    { id: 4, name: "Side Yard", isActive: false, duration: 12 },
    { id: 5, name: "Driveway", isActive: false, duration: 8 },
    { id: 6, name: "Pool Area", isActive: true, duration: 25 }
  ]);

  // Room definitions with images
  const rooms: Room[] = [
    { id: "living", name: "Living Room", icon: Sofa, deviceCount: devices.living?.length || 0, devices: devices.living || [], imageUrl: livingRoomImg },
    { id: "bedroom", name: "Bedroom", icon: Bed, deviceCount: devices.bedroom?.length || 0, devices: devices.bedroom || [], imageUrl: bedroomImg },
    { id: "kitchen", name: "Kitchen", icon: ChefHat, deviceCount: devices.kitchen?.length || 0, devices: devices.kitchen || [], imageUrl: kitchenImg },
    { id: "bathroom", name: "Bathroom", icon: Bath, deviceCount: devices.bathroom?.length || 0, devices: devices.bathroom || [], imageUrl: bathroomImg },
    { id: "office", name: "Office", icon: Home, deviceCount: devices.office?.length || 0, devices: devices.office || [], imageUrl: officeImg },
    { id: "garage", name: "Garage", icon: Car, deviceCount: devices.garage?.length || 0, devices: devices.garage || [], imageUrl: garageImg }
  ];

  // Event handlers
  const toggleDevice = (deviceId: string) => {
    setDevices(prev => {
      const newDevices = { ...prev };
      Object.keys(newDevices).forEach(roomId => {
        newDevices[roomId] = newDevices[roomId].map(device => 
          device.id === deviceId 
            ? { ...device, isActive: !device.isActive }
            : device
        );
      });
      return newDevices;
    });
  };

  const handleTempChange = (location: 'upstairs' | 'downstairs', temp: number) => {
    setTemperatures(prev => ({
      ...prev,
      [location]: { ...prev[location], target: temp }
    }));
  };

  const toggleSprinklerZone = (zoneId: number) => {
    setSprinklerZones(prev => 
      prev.map(zone => 
        zone.id === zoneId 
          ? { ...zone, isActive: !zone.isActive }
          : zone
      )
    );
  };

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);
  const currentDevices = devices[selectedRoom] || [];

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Smart Home</h1>
            <p className="text-muted-foreground">Welcome back! Manage your connected devices</p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Rooms */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Rooms</h2>
            <div className="space-y-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  name={room.name}
                  deviceCount={room.deviceCount}
                  icon={room.icon}
                  isSelected={selectedRoom === room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  imageUrl={room.imageUrl}
                />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Global Controls - Moved to Top */}
              <h2 className="text-lg font-semibold mb-4 md:col-span-2 lg:col-span-3">
                Home Controls
              </h2>

              {/* Temperature Controls */}
              <TemperatureControl
                location="Upstairs"
                currentTemp={temperatures.upstairs.current}
                targetTemp={temperatures.upstairs.target}
                onTempChange={(temp) => handleTempChange('upstairs', temp)}
              />

              <TemperatureControl
                location="Downstairs" 
                currentTemp={temperatures.downstairs.current}
                targetTemp={temperatures.downstairs.target}
                onTempChange={(temp) => handleTempChange('downstairs', temp)}
              />

              {/* Weather */}
              <WeatherCard
                location="New York, NY"
                temperature={28}
                condition="sunny"
                humidity={65}
                windSpeed={12}
              />

              {/* Energy Monitoring */}
              <EnergyCard
                currentUsage={2.4}
                dailyUsage={24.8}
                weeklyTrend="down"
                cost={3.42}
              />

              {/* Sprinkler System */}
              <SprinklerCard
                zones={sprinklerZones}
                onZoneToggle={toggleSprinklerZone}
              />

              {/* Room Devices - Moved Below Controls */}
              <div className="md:col-span-2 lg:col-span-3 mt-8">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedRoomData?.name} Devices
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {currentDevices.map((device) => (
                    <DeviceCard
                      key={device.id}
                      name={device.name}
                      subtitle={device.subtitle}
                      icon={device.icon}
                      isActive={device.isActive}
                      onToggle={() => toggleDevice(device.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;