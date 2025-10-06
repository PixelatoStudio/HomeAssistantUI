import { DeviceTemplate } from '../rooms/types';

// Device template library - these define what device types are available
export const deviceTemplates: DeviceTemplate[] = [
  // LIGHTING CATEGORY
  {
    type: 'light',
    name: 'Basic Light',
    icon: 'Lightbulb',
    category: 'lighting',
    description: 'Simple on/off light with brightness control',
    requiredEntityDomain: 'light',
    defaultIcon: 'Lightbulb',
    supportedControls: ['toggle', 'brightness'],
  },
  {
    type: 'rgb_light',
    name: 'RGB Light',
    icon: 'Lightbulb',
    category: 'lighting',
    description: 'Color-changing light with full RGB control',
    requiredEntityDomain: 'light',
    requiredEntityFeatures: ['brightness', 'color'],
    defaultIcon: 'Lightbulb',
    supportedControls: ['toggle', 'brightness', 'color'],
  },
  {
    type: 'light_strip',
    name: 'Light Strip',
    icon: 'Lightbulb',
    category: 'lighting',
    description: 'LED strip with effects and color control',
    requiredEntityDomain: 'light',
    requiredEntityFeatures: ['brightness', 'color'],
    defaultIcon: 'Lightbulb',
    supportedControls: ['toggle', 'brightness', 'color'],
  },
  {
    type: 'smart_bulb',
    name: 'Smart Bulb',
    icon: 'Lightbulb',
    category: 'lighting',
    description: 'Smart bulb with brightness and color temperature',
    requiredEntityDomain: 'light',
    requiredEntityFeatures: ['brightness'],
    defaultIcon: 'Lightbulb',
    supportedControls: ['toggle', 'brightness', 'temperature'],
  },

  // SWITCHES CATEGORY
  {
    type: 'switch',
    name: 'Basic Switch',
    icon: 'Zap',
    category: 'switches',
    description: 'Simple on/off switch control',
    requiredEntityDomain: 'switch',
    defaultIcon: 'Zap',
    supportedControls: ['toggle'],
  },
  {
    type: 'smart_outlet',
    name: 'Smart Outlet',
    icon: 'Zap',
    category: 'switches',
    description: 'Smart outlet with power monitoring',
    requiredEntityDomain: 'switch',
    defaultIcon: 'Zap',
    supportedControls: ['toggle', 'readonly_display'], // Display power usage
  },
  {
    type: 'dimmer_switch',
    name: 'Dimmer Switch',
    icon: 'Zap',
    category: 'switches',
    description: 'Switch with dimming capability',
    requiredEntityDomain: 'switch',
    requiredEntityFeatures: ['brightness'],
    defaultIcon: 'Zap',
    supportedControls: ['toggle', 'brightness'],
  },

  // SENSORS CATEGORY
  {
    type: 'temperature_sensor',
    name: 'Temperature Sensor',
    icon: 'Thermometer',
    category: 'sensors',
    description: 'Displays current temperature reading',
    requiredEntityDomain: 'sensor',
    requiredEntityFeatures: ['temperature'],
    defaultIcon: 'Thermometer',
    supportedControls: ['readonly_display'],
  },
  {
    type: 'motion_sensor',
    name: 'Motion Sensor',
    icon: 'Shield',
    category: 'sensors',
    description: 'Motion detection with last triggered time',
    requiredEntityDomain: 'binary_sensor',
    requiredEntityFeatures: ['motion'],
    defaultIcon: 'Shield',
    supportedControls: ['readonly_display'],
  },
  {
    type: 'door_sensor',
    name: 'Door Sensor',
    icon: 'Lock',
    category: 'sensors',
    description: 'Door/window open/closed status',
    requiredEntityDomain: 'binary_sensor',
    requiredEntityFeatures: ['door'],
    defaultIcon: 'Lock',
    supportedControls: ['readonly_display'],
  },
  {
    type: 'humidity_sensor',
    name: 'Humidity Sensor',
    icon: 'Activity',
    category: 'sensors',
    description: 'Displays current humidity percentage',
    requiredEntityDomain: 'sensor',
    requiredEntityFeatures: ['humidity'],
    defaultIcon: 'Activity',
    supportedControls: ['readonly_display'],
  },

  // CLIMATE CATEGORY
  {
    type: 'thermostat',
    name: 'Thermostat',
    icon: 'Thermometer',
    category: 'climate',
    description: 'Climate control with temperature settings',
    requiredEntityDomain: 'climate',
    defaultIcon: 'Thermometer',
    supportedControls: ['toggle', 'target_temperature'],
  },
  {
    type: 'fan',
    name: 'Fan',
    icon: 'Fan',
    category: 'climate',
    description: 'Fan with speed control',
    requiredEntityDomain: 'fan',
    defaultIcon: 'Fan',
    supportedControls: ['toggle', 'speed'],
  },
  {
    type: 'ac_unit',
    name: 'AC Unit',
    icon: 'Thermometer',
    category: 'climate',
    description: 'Air conditioning unit controls',
    requiredEntityDomain: 'climate',
    defaultIcon: 'Thermometer',
    supportedControls: ['toggle', 'target_temperature'],
  },

  // ENERGY CATEGORY
  {
    type: 'solar_system',
    name: 'Tesla Solar System',
    icon: 'Sun',
    category: 'energy',
    description: 'Complete solar system with generation, consumption, and powerwall data',
    requiredEntityDomain: 'sensor',
    defaultIcon: 'Sun',
    supportedControls: ['readonly_display'],
    isMultiEntity: true,
  },

  // SCENES CATEGORY
  {
    type: 'scene',
    name: 'Scene',
    icon: 'Sparkles',
    category: 'scenes',
    description: 'Activate a pre-configured Home Assistant scene with a button',
    requiredEntityDomain: 'scene',
    defaultIcon: 'Sparkles',
    supportedControls: ['button'],
  },

  // ENTERTAINMENT CATEGORY
  {
    type: 'tv',
    name: 'TV',
    icon: 'Tv',
    category: 'entertainment',
    description: 'TV control with source and volume',
    requiredEntityDomain: 'media_player',
    defaultIcon: 'Tv',
    supportedControls: ['toggle', 'volume', 'source'],
  },
  {
    type: 'speaker',
    name: 'Speaker',
    icon: 'Speaker',
    category: 'entertainment',
    description: 'Speaker with volume and playback control',
    requiredEntityDomain: 'media_player',
    defaultIcon: 'Speaker',
    supportedControls: ['toggle', 'volume'],
  },
  {
    type: 'media_player',
    name: 'Media Player',
    icon: 'Volume2',
    category: 'entertainment',
    description: 'Full media player with all controls',
    requiredEntityDomain: 'media_player',
    defaultIcon: 'Volume2',
    supportedControls: ['toggle', 'volume', 'source'],
  },

  // SECURITY CATEGORY
  {
    type: 'camera',
    name: 'Camera',
    icon: 'Video',
    category: 'security',
    description: 'Live camera feed display',
    requiredEntityDomain: 'camera',
    defaultIcon: 'Video',
    supportedControls: ['camera_stream'],
    entityFilter: (entityId: string) => entityId.includes('camera'), // Filter entities containing 'camera'
  },
];

// Helper functions
export const getTemplatesByCategory = (category: DeviceTemplate['category']) => {
  return deviceTemplates.filter(template => template.category === category);
};

export const getTemplateByType = (type: string) => {
  return deviceTemplates.find(template => template.type === type);
};

export const getAllCategories = () => {
  return Array.from(new Set(deviceTemplates.map(template => template.category)));
};

// Check if an entity is compatible with a device template
export const isEntityCompatible = (entityId: string, entityAttributes: any, template: DeviceTemplate) => {
  // Check domain match
  const entityDomain = entityId.split('.')[0];
  if (entityDomain !== template.requiredEntityDomain) {
    return false;
  }

  // Check required features if specified
  if (template.requiredEntityFeatures) {
    return template.requiredEntityFeatures.every(feature => {
      switch (feature) {
        case 'brightness':
          return entityAttributes.supported_features && (entityAttributes.supported_features & 1); // SUPPORT_BRIGHTNESS = 1
        case 'color':
          return entityAttributes.supported_color_modes?.includes('hs') ||
                 entityAttributes.supported_color_modes?.includes('rgb') ||
                 entityAttributes.supported_color_modes?.includes('xy');
        case 'temperature':
          return entityAttributes.device_class === 'temperature';
        case 'motion':
          return entityAttributes.device_class === 'motion';
        case 'door':
          return entityAttributes.device_class === 'door' || entityAttributes.device_class === 'window';
        case 'humidity':
          return entityAttributes.device_class === 'humidity';
        default:
          return true;
      }
    });
  }

  return true;
};