import { useState, useEffect, useCallback, useRef } from "react";
import {
  Lightbulb,
  Tv,
  Activity
} from "lucide-react";
import { DeviceCard } from "./DeviceCard";
import { useAuthStore } from "@/stores/authStore";

interface HAEntity {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    device_class?: string;
    unit_of_measurement?: string;
    brightness?: number;
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
  supportsColor?: boolean;
  currentColor?: number[] | string;
}

export function BedroomEntitiesView() {
  const { credentials } = useAuthStore();
  const [entities, setEntities] = useState<HADevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce timer for intensity changes
  const intensityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map entity domain to icon and type
  const getEntityIcon = (entityId: string, deviceClass?: string) => {
    const domain = entityId.split('.')[0];

    switch (domain) {
      case 'light':
        return { icon: Lightbulb, type: 'light' };
      case 'switch':
        return { icon: Tv, type: 'switch' };
      default:
        return { icon: Activity, type: 'other' };
    }
  };

  const fetchBedroomEntities = async () => {
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

      // Target only 3 specific widgets: bed lights, bedroom lights, monitor light
      const bedroomEntities = haEntities
        .filter(entity => {
          const friendlyName = entity.attributes.friendly_name || '';
          const entityId = entity.entity_id;

          // 1. Bed lights
          if (friendlyName.toLowerCase() === 'bed lights') {
            return true;
          }

          // 2. Bedroom lights
          if (friendlyName.toLowerCase() === 'bedroom lights') {
            return true;
          }

          // 3. Monitor light (specific entity ID)
          if (entityId === 'light.monitor_huelight') {
            return true;
          }

          return false;
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
            entity_id: entity.entity_id,
            // Check if entity supports color (Hue lights)
            supportsColor: entity.attributes.supported_color_modes?.includes('hs') ||
                          entity.attributes.supported_color_modes?.includes('rgb') ||
                          entity.attributes.supported_color_modes?.includes('xy'),
            currentColor: entity.attributes.hs_color || entity.attributes.rgb_color
          };
        });

      setEntities(bedroomEntities);

    } catch (err) {
      console.error('Failed to fetch bedroom entities:', err);
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

      // Immediately update UI for responsive feel
      const newState = !entity.isActive;
      setEntities(prev => prev.map(e =>
        e.entity_id === entityId
          ? { ...e, isActive: newState, subtitle: newState ? 'On' : 'Off' }
          : e
      ));

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
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update if API call failed
        setEntities(prev => prev.map(e =>
          e.entity_id === entityId
            ? { ...e, isActive: entity.isActive, subtitle: entity.isActive ? 'On' : 'Off' }
            : e
        ));
        throw new Error(`Failed to toggle entity: ${response.status}`);
      }

    } catch (err) {
      console.error('Failed to toggle entity:', err);
    }
  };

  // Debounced intensity change function
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to change intensity: ${response.status}`);
      }

    } catch (err) {
      console.error('Failed to change intensity:', err);
    }
  }, [credentials]);

  const handleIntensityChange = useCallback((entityId: string, intensity: number[]) => {
    // Update local state immediately for responsive UI
    setEntities(prev => prev.map(e =>
      e.entity_id === entityId
        ? { ...e, intensity: intensity[0] }
        : e
    ));

    // Clear existing timeout
    if (intensityTimeoutRef.current) {
      clearTimeout(intensityTimeoutRef.current);
    }

    // Set new timeout to debounce API calls
    intensityTimeoutRef.current = setTimeout(() => {
      performIntensityChange(entityId, intensity[0]);
    }, 300);
  }, [performIntensityChange]);

  // Color change function for Hue lights
  const handleColorChange = useCallback(async (entityId: string, color: string) => {
    if (!credentials) return;

    try {
      // Convert hex color to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      // Update local state immediately for responsive UI
      setEntities(prev => prev.map(e =>
        e.entity_id === entityId
          ? { ...e, currentColor: [r, g, b] }
          : e
      ));

      const response = await fetch(`${credentials.url}/api/services/light/turn_on`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          entity_id: entityId,
          rgb_color: [r, g, b]
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to change color: ${response.status}`);
      }

    } catch (err) {
      console.error('Failed to change color:', err);
    }
  }, [credentials]);

  // WebSocket connection setup
  const connectWebSocket = useCallback(() => {
    if (!credentials) return;

    try {
      const wsUrl = credentials.url.replace(/^https?:\/\//, 'ws://').replace(/\/$/, '') + '/api/websocket';
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        // Send auth message
        ws.send(JSON.stringify({
          type: 'auth',
          access_token: credentials.token
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'auth_ok') {
          // Subscribe to state changes
          ws.send(JSON.stringify({
            id: 1,
            type: 'subscribe_events',
            event_type: 'state_changed'
          }));
        } else if (message.type === 'event' && message.event?.event_type === 'state_changed') {
          const { entity_id, new_state } = message.event.data;

          // Add a small delay to avoid conflicts with optimistic updates
          setTimeout(() => {
            setEntities(prev => prev.map(entity => {
              if (entity.entity_id === entity_id && new_state) {
                return {
                  ...entity,
                  isActive: new_state.state === 'on',
                  subtitle: new_state.state === 'on' ? 'On' : 'Off',
                  intensity: new_state.attributes?.brightness ? Math.round((new_state.attributes.brightness / 255) * 100) : entity.intensity
                };
              }
              return entity;
            }));
          }, 100);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        wsReconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [credentials]);

  useEffect(() => {
    if (credentials) {
      fetchBedroomEntities();
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (wsReconnectTimeoutRef.current) {
        clearTimeout(wsReconnectTimeoutRef.current);
      }
      if (intensityTimeoutRef.current) {
        clearTimeout(intensityTimeoutRef.current);
      }
    };
  }, [credentials, connectWebSocket]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="device-card animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full text-center p-8">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={fetchBedroomEntities}
          className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (entities.length === 0) {
    return (
      <div className="col-span-full text-center p-8">
        <p className="text-muted-foreground">No bedroom entities found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {entities.map((entity) => (
        <DeviceCard
          key={entity.id}
          name={entity.name}
          subtitle={entity.subtitle}
          icon={entity.icon}
          isActive={entity.isActive}
          onToggle={() => toggleEntity(entity.entity_id)}
          type={entity.type}
          intensity={entity.intensity}
          onIntensityChange={(intensity) => handleIntensityChange(entity.entity_id, intensity)}
          supportsColor={entity.supportsColor}
          currentColor={entity.currentColor}
          onColorChange={(color) => handleColorChange(entity.entity_id, color)}
        />
      ))}
    </div>
  );
}