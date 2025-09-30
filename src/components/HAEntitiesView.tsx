import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lightbulb,
  Thermometer,
  Fan,
  Shield,
  Lock,
  Camera,
  Tv,
  Speaker,
  Wifi,
  Home,
  Zap,
  Activity
} from "lucide-react";
import { DeviceCard } from "./DeviceCard";
import { TemperatureControl } from "./TemperatureControl";
import { useAuthStore } from "@/stores/authStore";

interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    device_class?: string;
    unit_of_measurement?: string;
    brightness?: number;
    temperature?: number;
    current_temperature?: number;
    target_temp_low?: number;
    target_temp_high?: number;
    [key: string]: any;
  };
}

interface HADevice {
  id: string;
  name: string;
  subtitle?: string;
  icon: any;
  isActive: boolean;
  type: string;
  intensity?: number;
  entity_id: string;
}

interface TemperatureEntity {
  entity_id: string;
  current: number;
  target: number;
  name: string;
  isOn: boolean;
}

export function HAEntitiesView() {
  const { credentials } = useAuthStore();
  const [entities, setEntities] = useState<HADevice[]>([]);
  const [temperatureEntities, setTemperatureEntities] = useState<TemperatureEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer for intensity changes
  const intensityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Temperature conversion functions
  const celsiusToFahrenheit = (celsius: number) => Math.round((celsius * 9/5) + 32);
  const fahrenheitToCelsius = (fahrenheit: number) => Math.round((fahrenheit - 32) * 5/9);

  // Map entity domain to icon and type
  const getEntityIcon = (entityId: string, deviceClass?: string) => {
    const domain = entityId.split('.')[0];

    switch (domain) {
      case 'light':
        return { icon: Lightbulb, type: 'light' };
      case 'switch':
        return { icon: Zap, type: 'switch' };
      case 'fan':
        return { icon: Fan, type: 'climate' };
      case 'sensor':
        if (deviceClass === 'temperature') return { icon: Thermometer, type: 'sensor' };
        if (deviceClass === 'motion') return { icon: Shield, type: 'security' };
        return { icon: Activity, type: 'sensor' };
      case 'binary_sensor':
        if (deviceClass === 'door') return { icon: Lock, type: 'security' };
        if (deviceClass === 'motion') return { icon: Shield, type: 'security' };
        return { icon: Shield, type: 'security' };
      case 'camera':
        return { icon: Camera, type: 'security' };
      case 'media_player':
        return { icon: Tv, type: 'entertainment' };
      case 'climate':
        return { icon: Thermometer, type: 'climate' };
      default:
        return { icon: Home, type: 'other' };
    }
  };

  const fetchHAEntities = async () => {
    if (!credentials) {
      setError('No Home Assistant credentials found. Please login first.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${credentials.url}/api/states`, {
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const haEntities: HAEntity[] = await response.json();

      // Show all light entities (this was working correctly)
      const targetLightEntities = haEntities
        .filter(entity => entity.entity_id.startsWith('light.'))
        .map(entity => entity.entity_id);

      const targetClimateEntities = [
        'climate.upstairs',
        'climate.downstairs'
      ];

      // Filter and transform light entities using dynamically found targets
      // Exclude entities that should only appear in bedroom tab
      const lightEntities = haEntities
        .filter(entity => {
          if (!targetLightEntities.includes(entity.entity_id)) return false;

          const friendlyName = entity.attributes.friendly_name || '';
          const entityId = entity.entity_id;

          // Exclude "Bedroom Lights" entity (moved to bedroom tab)
          if (friendlyName.toLowerCase() === 'bedroom lights') return false;

          // Exclude bed lights entities (moved to bedroom tab)
          if (friendlyName.toLowerCase().includes('bed lights') || entityId.includes('bed_lights')) return false;

          // Exclude specific bed lights (moved to bedroom tab)
          if (entityId.includes('bed_light_left') || entityId.includes('bed_light_right')) return false;

          return true;
        })
        .map(entity => {
          const { icon, type } = getEntityIcon(entity.entity_id, entity.attributes.device_class);

          return {
            id: entity.entity_id,
            name: entity.attributes.friendly_name || entity.entity_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            subtitle: entity.state === 'on' ? 'On' : 'Off',
            icon,
            isActive: entity.state === 'on',
            type,
            intensity: entity.attributes.brightness ? Math.round((entity.attributes.brightness / 255) * 100) : undefined,
            entity_id: entity.entity_id
          };
        });

      // Filter and transform climate entities for temperature controls
      const climateEntities = haEntities
        .filter(entity => targetClimateEntities.includes(entity.entity_id))
        .map(entity => {
          // Since HA is configured for Fahrenheit, use temperatures directly
          const currentTemp = entity.attributes.current_temperature || parseFloat(entity.state) || 70;
          const targetTemp = entity.attributes.temperature || entity.attributes.target_temp_low || 72;

          // Determine if climate entity is on based on state and hvac_action
          const isOn = entity.state !== 'off' && entity.state !== 'unavailable';

          return {
            entity_id: entity.entity_id,
            current: currentTemp,
            target: targetTemp,
            name: entity.attributes.friendly_name || entity.entity_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            isOn
          };
        });

      setEntities(lightEntities);
      setTemperatureEntities(climateEntities);

    } catch (err) {
      console.error('Failed to fetch HA entities:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Home Assistant');
    } finally {
      setLoading(false);
    }
  };

  const toggleEntity = async (entityId: string) => {
    if (!credentials) return;

    try {
      const entity = entities.find(e => e.entity_id === entityId);
      if (!entity) return;

      const domain = entityId.split('.')[0];
      const service = entity.isActive ? 'turn_off' : 'turn_on';

      const response = await fetch(`${credentials.url}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          entity_id: entityId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle entity: ${response.statusText}`);
      }

      // Update local state immediately for responsive UI
      setEntities(prev =>
        prev.map(entity =>
          entity.entity_id === entityId
            ? { ...entity, isActive: !entity.isActive }
            : entity
        )
      );

    } catch (err) {
      console.error('Failed to toggle entity:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle entity');
    }
  };

  // Debounced API call for intensity changes
  const performIntensityChange = useCallback(async (entityId: string, intensity: number) => {
    if (!credentials) return;

    try {
      const response = await fetch(`${credentials.url}/api/services/light/turn_on`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          entity_id: entityId,
          brightness_pct: intensity
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to adjust brightness: ${response.statusText}`);
      }

    } catch (err) {
      console.error('Failed to adjust intensity:', err);
      setError(err instanceof Error ? err.message : 'Failed to adjust brightness');
    }
  }, [credentials]);

  const handleIntensityChange = useCallback((entityId: string, intensity: number[]) => {
    // Update local state immediately for responsive UI
    setEntities(prev =>
      prev.map(entity =>
        entity.entity_id === entityId
          ? { ...entity, intensity: intensity[0] }
          : entity
      )
    );

    // Clear existing timeout
    if (intensityTimeoutRef.current) {
      clearTimeout(intensityTimeoutRef.current);
    }

    // Debounce the API call by 300ms
    intensityTimeoutRef.current = setTimeout(() => {
      performIntensityChange(entityId, intensity[0]);
    }, 300);
  }, [performIntensityChange]);

  const handleTempChange = async (entityId: string, tempF: number) => {
    if (!credentials) return;

    try {
      // Update local state immediately (keep in Fahrenheit for UI)
      setTemperatureEntities(prev =>
        prev.map(entity =>
          entity.entity_id === entityId
            ? { ...entity, target: tempF }
            : entity
        )
      );

      // Since HA is configured for Fahrenheit, send the temperature value directly
      const response = await fetch(`${credentials.url}/api/services/climate/set_temperature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          entity_id: entityId,
          temperature: tempF
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to set temperature: ${response.statusText}`);
      }

      // Refresh entities after a short delay to get the updated current temperature
      setTimeout(() => fetchHAEntities(), 500);

    } catch (err) {
      console.error('Failed to set temperature:', err);
      setError(err instanceof Error ? err.message : 'Failed to set temperature');
    }
  };

  const toggleClimateEntity = async (entityId: string) => {
    if (!credentials) return;

    try {
      const entity = temperatureEntities.find(e => e.entity_id === entityId);
      if (!entity) return;

      const service = entity.isOn ? 'turn_off' : 'turn_on';

      const response = await fetch(`${credentials.url}/api/services/climate/${service}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          entity_id: entityId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle climate entity: ${response.statusText}`);
      }

      // Update local state immediately for responsive UI
      setTemperatureEntities(prev =>
        prev.map(entity =>
          entity.entity_id === entityId
            ? { ...entity, isOn: !entity.isOn }
            : entity
        )
      );

    } catch (err) {
      console.error('Failed to toggle climate entity:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle climate entity');
    }
  };

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (!credentials) return;

    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = credentials.url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://') + '/api/websocket';

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected to Home Assistant');

        // Authenticate with HA
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            access_token: credentials.token
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'auth_ok') {
          console.log('WebSocket authenticated');
          // Subscribe to state changes
          if (wsRef.current) {
            wsRef.current.send(JSON.stringify({
              id: 1,
              type: 'subscribe_events',
              event_type: 'state_changed'
            }));
          }
        } else if (message.type === 'event' && message.event?.event_type === 'state_changed') {
          // Handle real-time state changes
          handleRealtimeStateChange(message.event.data);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        // Attempt to reconnect after 5 seconds
        wsReconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [credentials]);

  // Handle real-time state changes from WebSocket
  const handleRealtimeStateChange = useCallback((data: any) => {
    const entityId = data.entity_id;
    const newState = data.new_state;

    if (!newState) return;

    // Update light entities
    if (entityId.startsWith('light.')) {
      setEntities(prev =>
        prev.map(entity =>
          entity.entity_id === entityId
            ? {
                ...entity,
                isActive: newState.state === 'on',
                intensity: newState.attributes?.brightness
                  ? Math.round((newState.attributes.brightness / 255) * 100)
                  : entity.intensity
              }
            : entity
        )
      );
    }

    // Update climate entities
    if (entityId.startsWith('climate.')) {
      setTemperatureEntities(prev =>
        prev.map(entity =>
          entity.entity_id === entityId
            ? {
                ...entity,
                current: newState.attributes?.current_temperature || entity.current,
                target: newState.attributes?.temperature || entity.target,
                isOn: newState.state !== 'off' && newState.state !== 'unavailable'
              }
            : entity
        )
      );
    }
  }, []);

  useEffect(() => {
    fetchHAEntities();

    // Start WebSocket connection for real-time updates
    connectWebSocket();

    // Fallback periodic refresh (less frequent since we have WebSocket)
    const interval = setInterval(() => {
      fetchHAEntities();
    }, 300000); // Refresh every 5 minutes as fallback

    return () => {
      clearInterval(interval);

      // Clean up WebSocket
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Clean up timeouts
      if (intensityTimeoutRef.current) {
        clearTimeout(intensityTimeoutRef.current);
      }
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Home Assistant entities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-destructive mb-4">
          <Activity className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Connection Error</h3>
        </div>
        <p className="text-muted-foreground mb-4">{error}</p>
        <p className="text-sm text-muted-foreground">
          Make sure Home Assistant is running and accessible at the configured URL.
          <br />
          Check that CORS is properly configured in your configuration.yaml.
        </p>
        <button
          onClick={fetchHAEntities}
          className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (entities.length === 0 && temperatureEntities.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Target Entities Found</h3>
        <p className="text-muted-foreground mb-4">
          Looking for specific entities:
        </p>
        <div className="text-sm text-muted-foreground text-left max-w-md mx-auto">
          <p className="font-medium mb-2">Lights:</p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>light.bedroom_lights</li>
            <li>light.bed_light_left</li>
            <li>light.bed_light_right</li>
          </ul>
          <p className="font-medium mb-2">Climate:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>climate.upstairs</li>
            <li>climate.downstairs</li>
          </ul>
        </div>
        <button
          onClick={fetchHAEntities}
          className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold mb-2">Home Assistant Entities</h2>
        <p className="text-muted-foreground">
          {entities.length} lights • {temperatureEntities.length} climate controls •
          <span className="text-accent"> {entities.filter(e => e.isActive).length} lights active</span>
        </p>
      </div>

      {/* Temperature Controls */}
      {temperatureEntities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Temperature Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {temperatureEntities.map((tempEntity) => (
              <TemperatureControl
                key={tempEntity.entity_id}
                location={tempEntity.name}
                currentTemp={tempEntity.current}
                targetTemp={tempEntity.target}
                onTempChange={(temp) => handleTempChange(tempEntity.entity_id, temp)}
                isOn={tempEntity.isOn}
                onToggle={() => toggleClimateEntity(tempEntity.entity_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Light Controls */}
      {entities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Lights</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {entities.map((entity) => (
              <DeviceCard
                key={entity.entity_id}
                name={entity.name}
                subtitle={entity.subtitle}
                icon={entity.icon}
                isActive={entity.isActive}
                onToggle={() => toggleEntity(entity.entity_id)}
                type={entity.type}
                intensity={entity.intensity}
                onIntensityChange={(intensity) => handleIntensityChange(entity.entity_id, intensity)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}