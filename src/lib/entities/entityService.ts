import { useAuthStore } from '@/stores/authStore';

// Home Assistant Entity Interface
export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    device_class?: string;
    unit_of_measurement?: string;
    supported_features?: number;
    supported_color_modes?: string[];
    brightness?: number;
    hs_color?: number[];
    rgb_color?: number[];
    temperature?: number;
    current_temperature?: number;
    [key: string]: any;
  };
}

// Filtered entity result for device configuration
export interface FilteredEntity {
  entity_id: string;
  friendly_name: string;
  domain: string;
  state: string;
  isCompatible: boolean;
  features: string[];
}

// Entity service class
export class EntityService {
  private credentials: { url: string; token: string } | null = null;

  constructor() {
    // Initialize credentials - will be updated when needed
    this.updateCredentials();
  }

  private updateCredentials() {
    try {
      const authStore = useAuthStore.getState();
      this.credentials = authStore.credentials;
    } catch (error) {
      console.warn('Failed to get auth credentials:', error);
      this.credentials = null;
    }
  }

  // Fetch all entities from Home Assistant
  async fetchAllEntities(): Promise<HAEntity[]> {
    // Update credentials before making request
    this.updateCredentials();

    if (!this.credentials) {
      throw new Error('No Home Assistant credentials available');
    }

    try {
      const response = await fetch(`${this.credentials.url}/api/states`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch entities:', error);
      throw error;
    }
  }

  // Get entities filtered by domain (e.g., 'light', 'switch', 'sensor')
  async getEntitiesByDomain(domain: string): Promise<FilteredEntity[]> {
    try {
      const allEntities = await this.fetchAllEntities();

      return allEntities
        .filter(entity => entity.entity_id.startsWith(`${domain}.`))
        .map(entity => this.transformToFilteredEntity(entity));
    } catch (error) {
      console.error(`Failed to fetch ${domain} entities:`, error);
      return [];
    }
  }

  // Get entities compatible with a specific device template
  async getCompatibleEntities(domain: string, requiredFeatures?: string[]): Promise<FilteredEntity[]> {
    try {
      const domainEntities = await this.getEntitiesByDomain(domain);

      if (!requiredFeatures || requiredFeatures.length === 0) {
        return domainEntities;
      }

      // Get all entities for feature checking
      const allEntities = await this.fetchAllEntities();

      // Filter by required features
      return domainEntities.filter(entity => {
        return requiredFeatures.every(feature =>
          this.entityHasFeature(entity.entity_id, feature, allEntities)
        );
      });
    } catch (error) {
      console.error('Failed to get compatible entities:', error);
      return [];
    }
  }

  // Check if entity has a specific feature
  private entityHasFeature(entityId: string, feature: string, entities: HAEntity[]): boolean {
    const targetEntity = entities.find(e => e.entity_id === entityId);

    if (!targetEntity) return false;

    switch (feature) {
      case 'brightness':
        return !!(targetEntity.attributes.supported_features && (targetEntity.attributes.supported_features & 1));
      case 'color':
        return !!(targetEntity.attributes.supported_color_modes?.includes('hs') ||
                 targetEntity.attributes.supported_color_modes?.includes('rgb') ||
                 targetEntity.attributes.supported_color_modes?.includes('xy'));
      case 'temperature':
        return targetEntity.attributes.device_class === 'temperature';
      case 'motion':
        return targetEntity.attributes.device_class === 'motion';
      case 'door':
        return targetEntity.attributes.device_class === 'door' || targetEntity.attributes.device_class === 'window';
      case 'humidity':
        return targetEntity.attributes.device_class === 'humidity';
      default:
        return true;
    }
  }

  // Transform HA entity to our filtered format
  private transformToFilteredEntity(entity: HAEntity): FilteredEntity {
    const domain = entity.entity_id.split('.')[0];
    const features: string[] = [];

    // Detect features
    if (entity.attributes.supported_features && (entity.attributes.supported_features & 1)) {
      features.push('brightness');
    }
    if (entity.attributes.supported_color_modes?.some(mode => ['hs', 'rgb', 'xy'].includes(mode))) {
      features.push('color');
    }
    if (entity.attributes.device_class) {
      features.push(entity.attributes.device_class);
    }

    return {
      entity_id: entity.entity_id,
      friendly_name: entity.attributes.friendly_name || entity.entity_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      domain,
      state: entity.state,
      isCompatible: true, // Will be determined by template matching
      features,
    };
  }

  // Control entity (turn on/off, set brightness, etc.)
  async controlEntity(entityId: string, action: string, parameters?: Record<string, any>): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('No Home Assistant credentials available');
    }

    try {
      const domain = entityId.split('.')[0];
      const response = await fetch(`${this.credentials.url}/api/services/${domain}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          entity_id: entityId,
          ...parameters,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to control entity:', error);
      return false;
    }
  }
}

// Create singleton instance
export const entityService = new EntityService();