import { DeviceTemplate, DeviceType } from "../rooms/types";
import { DiscoveredEntity } from "./entityDiscoveryService";

export interface GeneratedTemplate extends DeviceTemplate {
  sourceEntityIds: string[];
  generatedAt: Date;
}

class TemplateGenerationService {
  generateTemplatesFromEntities(selectedEntities: DiscoveredEntity[]): GeneratedTemplate[] {
    const templates = new Map<string, GeneratedTemplate>();

    selectedEntities.forEach(entity => {
      const template = this.createTemplateForEntity(entity);
      if (template) {
        const key = `${template.type}_${template.category}`;

        if (templates.has(key)) {
          // Add entity to existing template
          const existing = templates.get(key)!;
          existing.sourceEntityIds.push(entity.entity_id);
        } else {
          // Create new template
          templates.set(key, {
            ...template,
            sourceEntityIds: [entity.entity_id],
            generatedAt: new Date()
          });
        }
      }
    });

    return Array.from(templates.values());
  }

  private createTemplateForEntity(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> | null {
    const { domain, attributes, device_class } = entity;

    switch (domain) {
      case 'light':
        return this.createLightTemplate(entity);

      case 'switch':
        return this.createSwitchTemplate(entity);

      case 'sensor':
        return this.createSensorTemplate(entity);

      case 'binary_sensor':
        return this.createBinarySensorTemplate(entity);

      case 'climate':
        return this.createClimateTemplate(entity);

      case 'cover':
        return this.createCoverTemplate(entity);

      case 'fan':
        return this.createFanTemplate(entity);

      case 'media_player':
        return this.createMediaPlayerTemplate(entity);

      default:
        return null;
    }
  }

  private createLightTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> {
    const supportsBrightness = entity.attributes.supported_color_modes?.includes('brightness') ||
                              entity.attributes.brightness != null;
    const supportsColor = entity.attributes.supported_color_modes?.includes('hs') ||
                         entity.attributes.supported_color_modes?.includes('rgb') ||
                         entity.attributes.supported_color_modes?.includes('xy');

    let type: DeviceType = 'light';
    let name = 'Basic Light';
    let controls = ['toggle'];

    if (supportsColor) {
      type = 'rgb_light';
      name = 'RGB Light';
      controls = ['toggle', 'brightness', 'color'];
    } else if (supportsBrightness) {
      type = 'light';
      name = 'Dimmable Light';
      controls = ['toggle', 'brightness'];
    }

    return {
      id: type,
      name,
      type,
      category: 'lighting',
      description: `Auto-generated ${name.toLowerCase()} template`,
      defaultIcon: 'Lightbulb',
      supportedControls: controls as any[],
      requiredFeatures: [],
      requiredEntityDomain: 'light'
    };
  }

  private createSwitchTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> {
    const supportsPowerMonitoring = entity.attributes.current_power_w != null ||
                                   entity.attributes.current_power != null;

    return {
      id: supportsPowerMonitoring ? 'smart_outlet' : 'switch',
      name: supportsPowerMonitoring ? 'Smart Outlet' : 'Basic Switch',
      type: supportsPowerMonitoring ? 'smart_outlet' : 'switch',
      category: 'switches',
      description: `Auto-generated ${supportsPowerMonitoring ? 'smart outlet' : 'switch'} template`,
      defaultIcon: supportsPowerMonitoring ? 'Zap' : 'ToggleLeft',
      supportedControls: ['toggle'],
      requiredFeatures: [],
      requiredEntityDomain: 'switch'
    };
  }

  private createSensorTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> | null {
    const deviceClass = entity.device_class;
    const unit = entity.unit_of_measurement;

    switch (deviceClass) {
      case 'temperature':
        return {
          id: 'temperature_sensor',
          name: 'Temperature Sensor',
          type: 'temperature_sensor',
          category: 'sensors',
          description: 'Auto-generated temperature sensor template',
          defaultIcon: 'Thermometer',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'sensor'
        };

      case 'humidity':
        return {
          id: 'humidity_sensor',
          name: 'Humidity Sensor',
          type: 'humidity_sensor',
          category: 'sensors',
          description: 'Auto-generated humidity sensor template',
          defaultIcon: 'Droplets',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'sensor'
        };

      case 'illuminance':
        return {
          id: 'temperature_sensor',
          name: 'Light Sensor',
          type: 'temperature_sensor',
          category: 'sensors',
          description: 'Auto-generated light sensor template',
          defaultIcon: 'Sun',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'sensor'
        };

      case 'energy':
      case 'power':
        return {
          id: 'temperature_sensor',
          name: 'Energy Monitor',
          type: 'temperature_sensor',
          category: 'sensors',
          description: 'Auto-generated energy monitor template',
          defaultIcon: 'Zap',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'sensor'
        };

      default:
        // Generic sensor for unknown types
        return {
          id: 'temperature_sensor',
          name: 'Generic Sensor',
          type: 'temperature_sensor',
          category: 'sensors',
          description: `Auto-generated sensor template (${deviceClass || 'unknown type'})`,
          defaultIcon: 'Activity',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'sensor'
        };
    }
  }

  private createBinarySensorTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> | null {
    const deviceClass = entity.device_class;

    switch (deviceClass) {
      case 'motion':
        return {
          id: 'motion_sensor',
          name: 'Motion Sensor',
          type: 'motion_sensor',
          category: 'sensors',
          description: 'Auto-generated motion sensor template',
          defaultIcon: 'Eye',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'binary_sensor'
        };

      case 'door':
      case 'window':
        return {
          id: 'door_sensor',
          name: 'Door/Window Sensor',
          type: 'door_sensor',
          category: 'sensors',
          description: 'Auto-generated door/window sensor template',
          defaultIcon: 'DoorOpen',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'binary_sensor'
        };

      default:
        return {
          id: 'motion_sensor',
          name: 'Binary Sensor',
          type: 'motion_sensor',
          category: 'sensors',
          description: `Auto-generated binary sensor template (${deviceClass || 'unknown type'})`,
          defaultIcon: 'ToggleLeft',
          supportedControls: ['readonly_display'],
          requiredFeatures: [],
          requiredEntityDomain: 'binary_sensor'
        };
    }
  }

  private createClimateTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> {
    return {
      id: 'thermostat',
      name: 'Thermostat',
      type: 'thermostat',
      category: 'climate',
      description: 'Auto-generated thermostat template',
      defaultIcon: 'Thermometer',
      supportedControls: ['temperature_control'],
      requiredFeatures: [],
      requiredEntityDomain: 'climate'
    };
  }

  private createCoverTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> {
    const supportsPosition = entity.attributes.current_position != null;

    return {
      id: 'switch',
      name: supportsPosition ? 'Smart Blinds' : 'Basic Cover',
      type: 'switch',
      category: 'switches',
      description: `Auto-generated ${supportsPosition ? 'smart blinds' : 'cover'} template`,
      defaultIcon: 'Blinds',
      supportedControls: supportsPosition ? ['toggle', 'position'] : ['toggle'],
      requiredFeatures: [],
      requiredEntityDomain: 'cover'
    };
  }

  private createFanTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> {
    const supportsSpeed = entity.attributes.percentage != null;

    return {
      id: 'fan',
      name: supportsSpeed ? 'Smart Fan' : 'Basic Fan',
      type: 'fan',
      category: 'climate',
      description: `Auto-generated ${supportsSpeed ? 'smart fan' : 'fan'} template`,
      defaultIcon: 'Fan',
      supportedControls: supportsSpeed ? ['toggle', 'speed'] : ['toggle'],
      requiredFeatures: [],
      requiredEntityDomain: 'fan'
    };
  }

  private createMediaPlayerTemplate(entity: DiscoveredEntity): Omit<GeneratedTemplate, 'sourceEntityIds' | 'generatedAt'> {
    return {
      id: 'media_player',
      name: 'Media Player',
      type: 'media_player',
      category: 'entertainment',
      description: 'Auto-generated media player template',
      defaultIcon: 'Play',
      supportedControls: ['toggle', 'volume'],
      requiredFeatures: [],
      requiredEntityDomain: 'media_player'
    };
  }
}

export const templateGenerationService = new TemplateGenerationService();