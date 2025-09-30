// Room management types
export interface Room {
  id: string;
  name: string;
  icon?: string;
  devices: DeviceConfig[];
  createdAt: Date;
  updatedAt: Date;
}

// Device configuration that lives within a room
export interface DeviceConfig {
  id: string;
  name: string;
  type: DeviceType;
  entityId: string; // Primary entity ID (for single entity devices)
  entityIds?: string[]; // Multiple entity IDs (for multi-entity cards)
  icon?: string;
  customSettings?: Record<string, any>;
  position?: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

// Device template types
export type DeviceType =
  | 'light'
  | 'rgb_light'
  | 'light_strip'
  | 'smart_bulb'
  | 'switch'
  | 'smart_outlet'
  | 'dimmer_switch'
  | 'temperature_sensor'
  | 'motion_sensor'
  | 'door_sensor'
  | 'humidity_sensor'
  | 'thermostat'
  | 'fan'
  | 'ac_unit'
  | 'tv'
  | 'speaker'
  | 'media_player'
  | 'multi_entity' // New type for multi-entity cards
  | 'solar_system'; // Tesla Solar System

// Device template definition
export interface DeviceTemplate {
  type: DeviceType;
  name: string;
  icon: string;
  category: 'lighting' | 'switches' | 'sensors' | 'climate' | 'entertainment' | 'energy';
  description: string;
  requiredEntityDomain: string; // e.g., 'light', 'switch', 'sensor'
  requiredEntityFeatures?: string[]; // e.g., ['brightness', 'color']
  defaultIcon: string;
  supportedControls: DeviceControl[];
  isMultiEntity?: boolean; // Indicates this device uses multiple entities
}

// UI controls that a device supports
export type DeviceControl =
  | 'toggle'
  | 'brightness'
  | 'color'
  | 'temperature'
  | 'volume'
  | 'source'
  | 'speed'
  | 'target_temperature'
  | 'readonly_display';

// Room dashboard configuration
export interface RoomDashboard {
  roomId: string;
  layout: 'grid' | 'list';
  columns: number;
  showRoomImage: boolean;
  customBackground?: string;
}