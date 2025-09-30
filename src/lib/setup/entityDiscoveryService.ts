import { entityService } from "../entities/entityService";

export interface DiscoveredEntity {
  entity_id: string;
  domain: string;
  friendly_name: string;
  state: string;
  attributes: Record<string, any>;
  device_class?: string;
  unit_of_measurement?: string;
  supported_features?: number;
  supported_color_modes?: string[];
}

export interface EntityGroup {
  domain: string;
  entities: DiscoveredEntity[];
  capabilities: string[];
  deviceClasses: string[];
  count: number;
}

export interface DiscoveryResults {
  groups: EntityGroup[];
  totalEntities: number;
  discoveredAt: Date;
}

class EntityDiscoveryService {
  async discoverEntities(): Promise<DiscoveryResults> {
    try {
      // Fetch all entities from Home Assistant
      const allEntities = await entityService.fetchAllEntities();

      // Filter out internal/system entities we don't want to show
      const filteredEntities = allEntities.filter(entity => {
        const entityId = entity.entity_id;

        // Skip system entities
        if (entityId.startsWith('sun.') ||
            entityId.startsWith('zone.') ||
            entityId.startsWith('person.') ||
            entityId.startsWith('device_tracker.') ||
            entityId.startsWith('automation.') ||
            entityId.startsWith('script.') ||
            entityId.startsWith('input_') ||
            entityId.startsWith('timer.') ||
            entityId.startsWith('counter.') ||
            entityId.startsWith('calendar.') ||
            entityId.includes('_battery') ||
            entityId.includes('_signal_strength') ||
            entityId.includes('_linkquality')) {
          return false;
        }

        return true;
      });

      // Group entities by domain
      const entityGroups = new Map<string, DiscoveredEntity[]>();

      filteredEntities.forEach(entity => {
        const domain = entity.entity_id.split('.')[0];
        const discoveredEntity: DiscoveredEntity = {
          entity_id: entity.entity_id,
          domain,
          friendly_name: entity.attributes?.friendly_name || entity.entity_id,
          state: entity.state,
          attributes: entity.attributes || {},
          device_class: entity.attributes?.device_class,
          unit_of_measurement: entity.attributes?.unit_of_measurement,
          supported_features: entity.attributes?.supported_features,
          supported_color_modes: entity.attributes?.supported_color_modes,
        };

        if (!entityGroups.has(domain)) {
          entityGroups.set(domain, []);
        }
        entityGroups.get(domain)!.push(discoveredEntity);
      });

      // Create grouped results with capabilities analysis
      const groups: EntityGroup[] = Array.from(entityGroups.entries()).map(([domain, entities]) => {
        const capabilities = this.analyzeCapabilities(domain, entities);
        const deviceClasses = this.extractDeviceClasses(entities);

        return {
          domain,
          entities: entities.sort((a, b) => a.friendly_name.localeCompare(b.friendly_name)),
          capabilities,
          deviceClasses,
          count: entities.length
        };
      }).sort((a, b) => b.count - a.count); // Sort by count descending

      return {
        groups,
        totalEntities: filteredEntities.length,
        discoveredAt: new Date()
      };
    } catch (error) {
      console.error('Failed to discover entities:', error);
      throw error;
    }
  }

  private analyzeCapabilities(domain: string, entities: DiscoveredEntity[]): string[] {
    const capabilities = new Set<string>();

    entities.forEach(entity => {
      const attrs = entity.attributes;

      // Domain-specific capability detection
      switch (domain) {
        case 'light':
          if (attrs.supported_color_modes?.includes('brightness') || attrs.brightness != null) {
            capabilities.add('brightness');
          }
          if (attrs.supported_color_modes?.includes('hs') ||
              attrs.supported_color_modes?.includes('rgb') ||
              attrs.supported_color_modes?.includes('xy')) {
            capabilities.add('color');
          }
          if (attrs.supported_color_modes?.includes('color_temp')) {
            capabilities.add('color_temp');
          }
          break;

        case 'switch':
          if (attrs.current_power_w != null || attrs.current_power != null) {
            capabilities.add('power_monitoring');
          }
          break;

        case 'sensor':
          if (entity.device_class) {
            capabilities.add(entity.device_class);
          }
          if (entity.unit_of_measurement) {
            capabilities.add('measurement');
          }
          break;

        case 'binary_sensor':
          if (entity.device_class) {
            capabilities.add(entity.device_class);
          }
          break;

        case 'climate':
          if (attrs.temperature != null) capabilities.add('temperature');
          if (attrs.target_temperature != null) capabilities.add('target_temperature');
          if (attrs.current_humidity != null) capabilities.add('humidity');
          if (attrs.hvac_modes) capabilities.add('hvac_modes');
          break;

        case 'cover':
          if (attrs.current_position != null) capabilities.add('position');
          if (attrs.current_tilt_position != null) capabilities.add('tilt');
          break;

        case 'fan':
          if (attrs.percentage != null) capabilities.add('speed');
          if (attrs.oscillating != null) capabilities.add('oscillation');
          break;

        case 'media_player':
          if (attrs.volume_level != null) capabilities.add('volume');
          if (attrs.source_list) capabilities.add('source_selection');
          break;
      }
    });

    return Array.from(capabilities).sort();
  }

  private extractDeviceClasses(entities: DiscoveredEntity[]): string[] {
    const deviceClasses = new Set<string>();

    entities.forEach(entity => {
      if (entity.device_class) {
        deviceClasses.add(entity.device_class);
      }
    });

    return Array.from(deviceClasses).sort();
  }

  // Method to check for new entities since last discovery
  async findNewEntities(lastDiscovery: DiscoveryResults): Promise<DiscoveredEntity[]> {
    const currentResults = await this.discoverEntities();
    const lastEntityIds = new Set();

    lastDiscovery.groups.forEach(group => {
      group.entities.forEach(entity => {
        lastEntityIds.add(entity.entity_id);
      });
    });

    const newEntities: DiscoveredEntity[] = [];
    currentResults.groups.forEach(group => {
      group.entities.forEach(entity => {
        if (!lastEntityIds.has(entity.entity_id)) {
          newEntities.push(entity);
        }
      });
    });

    return newEntities;
  }
}

export const entityDiscoveryService = new EntityDiscoveryService();