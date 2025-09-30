import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRoomStore } from "../rooms/roomStore";
import { DeviceConfig } from "../rooms/types";
import { entityService } from "../entities/entityService";

interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

interface DeviceManagerProps {
  roomId: string;
  children: (props: {
    devices: DeviceConfig[];
    entityStates: Record<string, EntityState>;
    isOnline: boolean;
    toggleDevice: (deviceId: string, entityId?: string) => Promise<void>;
    setDeviceBrightness: (deviceId: string, entityIdOrBrightness: string | number, brightness?: number) => Promise<void>;
    setDeviceColor: (deviceId: string, color: string) => Promise<void>;
    setHvacMode: (deviceId: string, entityId: string, mode: string) => Promise<void>;
    setTemperature: (deviceId: string, entityId: string, temperature: number, isLow?: boolean) => Promise<void>;
    removeDevice: (deviceId: string) => void;
  }) => React.ReactNode;
}

export function DeviceManager({ roomId, children }: DeviceManagerProps) {
  const { credentials } = useAuthStore();
  const { getRoomDevices, removeDeviceFromRoom } = useRoomStore();
  const [entityStates, setEntityStates] = useState<Record<string, EntityState>>({});
  const [isOnline, setIsOnline] = useState(false);

  // WebSocket connection - keep it simple like main dashboard
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const devices = getRoomDevices(roomId);
  // Collect all entity IDs from both single and multi-entity devices
  const deviceEntityIds = devices.flatMap(d =>
    d.entityIds && d.entityIds.length > 0 ? d.entityIds : [d.entityId]
  );


  // Fetch initial entity states
  const fetchEntityStates = useCallback(async () => {
    if (!credentials || deviceEntityIds.length === 0) {
      setIsOnline(false);
      return;
    }

    try {
      const allEntities = await entityService.fetchAllEntities();
      const relevantEntities = allEntities.filter(entity =>
        deviceEntityIds.includes(entity.entity_id)
      );

      const stateMap = relevantEntities.reduce((acc, entity) => {
        acc[entity.entity_id] = {
          entity_id: entity.entity_id,
          state: entity.state,
          attributes: entity.attributes,
          last_changed: '',
          last_updated: '',
        };
        return acc;
      }, {} as Record<string, EntityState>);

      setEntityStates(stateMap);
      setIsOnline(true);
    } catch (error) {
      console.error('DeviceManager: Failed to fetch entity states:', error);
      setIsOnline(false);
    }
  }, [credentials, deviceEntityIds]);

  // WebSocket connection - simple like main dashboard
  const connectWebSocket = useCallback(() => {
    if (!credentials || deviceEntityIds.length === 0) return;

    try {
      const wsUrl = credentials.url.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://') + '/api/websocket';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('DeviceManager: WebSocket connected');
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          access_token: credentials.token
        }));
        setIsOnline(true);
      };

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'auth_ok') {
          wsRef.current?.send(JSON.stringify({
            id: 1,
            type: 'subscribe_events',
            event_type: 'state_changed'
          }));
        } else if (message.type === 'event' && message.event?.event_type === 'state_changed') {
          const { entity_id, new_state } = message.event.data;

          if (deviceEntityIds.includes(entity_id) && new_state) {
            setEntityStates(prev => ({
              ...prev,
              [entity_id]: {
                entity_id,
                state: new_state.state,
                attributes: new_state.attributes || {},
                last_changed: new_state.last_changed || '',
                last_updated: new_state.last_updated || '',
              }
            }));
          }
        }
      };

      wsRef.current.onclose = () => {
        console.log('DeviceManager: WebSocket disconnected, attempting to reconnect...');
        setIsOnline(false);
        wsReconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('DeviceManager: WebSocket error:', error);
        setIsOnline(false);
      };

    } catch (error) {
      console.error('DeviceManager: Failed to connect WebSocket:', error);
      setIsOnline(false);
    }
  }, [credentials, deviceEntityIds]);

  // Device control functions
  const toggleDevice = useCallback(async (deviceId: string, specificEntityId?: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !credentials) return;

    // For multi-entity cards, use the specific entity ID if provided
    const targetEntityId = specificEntityId || device.entityId;
    const currentState = entityStates[targetEntityId];
    const isCurrentlyOn = currentState?.state === 'on' || currentState?.state === 'playing';

    try {
      // Optimistic update
      setEntityStates(prev => ({
        ...prev,
        [targetEntityId]: {
          ...prev[targetEntityId],
          state: isCurrentlyOn ? 'off' : 'on'
        }
      }));

      const service = isCurrentlyOn ? 'turn_off' : 'turn_on';
      const success = await entityService.controlEntity(targetEntityId, service);

      if (!success) {
        // Revert optimistic update on failure
        setEntityStates(prev => ({
          ...prev,
          [targetEntityId]: {
            ...prev[targetEntityId],
            state: currentState?.state || 'unknown'
          }
        }));
      }
    } catch (error) {
      console.error('Failed to toggle device:', error);
    }
  }, [devices, entityStates, credentials]);

  const setDeviceBrightness = useCallback(async (deviceId: string, entityIdOrBrightness: string | number, brightness?: number) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !credentials) return;

    // Handle both signatures: (deviceId, brightness) and (deviceId, entityId, brightness)
    const targetEntityId = typeof entityIdOrBrightness === 'string' ? entityIdOrBrightness : device.entityId;
    const targetBrightness = typeof entityIdOrBrightness === 'number' ? entityIdOrBrightness : brightness!;

    try {
      const brightnessValue = Math.round((targetBrightness / 100) * 255);

      // Optimistic update
      setEntityStates(prev => ({
        ...prev,
        [targetEntityId]: {
          ...prev[targetEntityId],
          attributes: {
            ...prev[targetEntityId]?.attributes,
            brightness: brightnessValue
          }
        }
      }));

      const success = await entityService.controlEntity(targetEntityId, 'turn_on', {
        brightness_pct: targetBrightness
      });

      if (!success) {
        throw new Error('Failed to set brightness');
      }
    } catch (error) {
      console.error('Failed to set device brightness:', error);
    }
  }, [devices, credentials]);

  const setDeviceColor = useCallback(async (deviceId: string, color: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || !credentials) return;

    try {
      // Convert hex color to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // Optimistic update
      setEntityStates(prev => ({
        ...prev,
        [device.entityId]: {
          ...prev[device.entityId],
          attributes: {
            ...prev[device.entityId]?.attributes,
            rgb_color: [r, g, b]
          }
        }
      }));

      const success = await entityService.controlEntity(device.entityId, 'turn_on', {
        rgb_color: [r, g, b]
      });

      if (!success) {
        throw new Error('Failed to set color');
      }
    } catch (error) {
      console.error('Failed to set device color:', error);
    }
  }, [devices, credentials]);

  const setHvacMode = useCallback(async (deviceId: string, entityId: string, mode: string) => {
    if (!credentials) return;

    try {
      // Optimistic update
      setEntityStates(prev => ({
        ...prev,
        [entityId]: {
          ...prev[entityId],
          state: mode
        }
      }));

      const success = await entityService.controlEntity(entityId, 'set_hvac_mode', {
        hvac_mode: mode
      });

      if (!success) {
        throw new Error('Failed to set HVAC mode');
      }
    } catch (error) {
      console.error('Failed to set HVAC mode:', error);
    }
  }, [credentials]);

  const setTemperature = useCallback(async (deviceId: string, entityId: string, temperature: number, isLow?: boolean) => {
    if (!credentials) return;

    try {
      const currentState = entityStates[entityId];
      const currentMode = currentState?.state;

      // Optimistic update
      setEntityStates(prev => ({
        ...prev,
        [entityId]: {
          ...prev[entityId],
          attributes: {
            ...prev[entityId]?.attributes,
            ...(isLow !== undefined
              ? isLow
                ? { target_temp_low: temperature }
                : { target_temp_high: temperature }
              : { temperature: temperature }
            )
          }
        }
      }));

      // Determine which service to call
      let serviceParams: Record<string, any>;

      if (currentMode === 'heat_cool' && isLow !== undefined) {
        // For heat_cool mode, we need to set both temps
        const currentLow = currentState?.attributes?.target_temp_low || 65;
        const currentHigh = currentState?.attributes?.target_temp_high || 75;

        serviceParams = {
          target_temp_low: isLow ? temperature : currentLow,
          target_temp_high: isLow ? currentHigh : temperature,
        };
      } else {
        // For single temp modes (heat, cool, auto)
        serviceParams = {
          temperature: temperature,
        };
      }

      const success = await entityService.controlEntity(entityId, 'set_temperature', serviceParams);

      if (!success) {
        throw new Error('Failed to set temperature');
      }
    } catch (error) {
      console.error('Failed to set temperature:', error);
    }
  }, [credentials, entityStates]);

  const removeDevice = useCallback((deviceId: string) => {
    removeDeviceFromRoom(roomId, deviceId);
  }, [roomId, removeDeviceFromRoom]);

  // Effects
  useEffect(() => {
    if (devices.length > 0 && credentials) {
      fetchEntityStates();

      // Delay WebSocket connection to avoid conflicts
      const wsTimeout = setTimeout(() => {
        connectWebSocket();
      }, 1000);

      return () => {
        clearTimeout(wsTimeout);
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (wsReconnectTimeoutRef.current) {
          clearTimeout(wsReconnectTimeoutRef.current);
        }
      };
    } else {
      setIsOnline(false);
      setEntityStates({});
    }
  }, [credentials, fetchEntityStates, connectWebSocket, devices.length]);

  return (
    <>
      {children({
        devices,
        entityStates,
        isOnline,
        toggleDevice,
        setDeviceBrightness,
        setDeviceColor,
        setHvacMode,
        setTemperature,
        removeDevice,
      })}
    </>
  );
}