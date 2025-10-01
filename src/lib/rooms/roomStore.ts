import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Room, DeviceConfig, DeviceType } from './types';

interface RoomState {
  rooms: Room[];
  selectedRoomId: string | null;

  // Room actions
  addRoom: (name: string, icon?: string) => Room;
  removeRoom: (roomId: string) => void;
  updateRoom: (roomId: string, updates: Partial<Omit<Room, 'id' | 'createdAt'>>) => void;
  selectRoom: (roomId: string) => void;

  // Device actions
  addDeviceToRoom: (roomId: string, device: Omit<DeviceConfig, 'id' | 'createdAt' | 'updatedAt'>) => DeviceConfig;
  removeDeviceFromRoom: (roomId: string, deviceId: string) => void;
  updateDeviceInRoom: (roomId: string, deviceId: string, updates: Partial<Omit<DeviceConfig, 'id' | 'createdAt'>>) => void;
  reorderDevicesInRoom: (roomId: string, deviceIds: string[]) => void;

  // Admin actions
  clearAllDevices: () => void;
  resetDashboard: () => void;

  // Utility functions
  getRoom: (roomId: string) => Room | undefined;
  getSelectedRoom: () => Room | undefined;
  getRoomDevices: (roomId: string) => DeviceConfig[];
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      rooms: [
        // Default rooms
        {
          id: 'my-home',
          name: 'My Home',
          icon: 'Home',
          devices: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'living',
          name: 'Living Room',
          icon: 'Sofa',
          devices: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'bedroom',
          name: 'Bedroom',
          icon: 'Bed',
          devices: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      selectedRoomId: 'my-home',

      addRoom: (name: string, icon?: string) => {
        const newRoom: Room = {
          id: `room_${Date.now()}`,
          name,
          icon: icon || 'Home',
          devices: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set(state => ({
          rooms: [...state.rooms, newRoom],
        }));

        return newRoom;
      },

      removeRoom: (roomId: string) => {
        set(state => {
          const remainingRooms = state.rooms.filter(room => room.id !== roomId);
          return {
            rooms: remainingRooms,
            selectedRoomId: state.selectedRoomId === roomId ? remainingRooms[0]?.id || null : state.selectedRoomId,
          };
        });
      },

      updateRoom: (roomId: string, updates: Partial<Omit<Room, 'id' | 'createdAt'>>) => {
        set(state => ({
          rooms: state.rooms.map(room =>
            room.id === roomId
              ? { ...room, ...updates, updatedAt: new Date() }
              : room
          ),
        }));
      },

      selectRoom: (roomId: string) => {
        set({ selectedRoomId: roomId });
      },

      addDeviceToRoom: (roomId: string, deviceData: Omit<DeviceConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newDevice: DeviceConfig = {
          ...deviceData,
          id: `device_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set(state => ({
          rooms: state.rooms.map(room =>
            room.id === roomId
              ? {
                  ...room,
                  devices: [...room.devices, newDevice],
                  updatedAt: new Date(),
                }
              : room
          ),
        }));

        return newDevice;
      },

      removeDeviceFromRoom: (roomId: string, deviceId: string) => {
        set(state => ({
          rooms: state.rooms.map(room =>
            room.id === roomId
              ? {
                  ...room,
                  devices: room.devices.filter(device => device.id !== deviceId),
                  updatedAt: new Date(),
                }
              : room
          ),
        }));
      },

      updateDeviceInRoom: (roomId: string, deviceId: string, updates: Partial<Omit<DeviceConfig, 'id' | 'createdAt'>>) => {
        set(state => ({
          rooms: state.rooms.map(room =>
            room.id === roomId
              ? {
                  ...room,
                  devices: room.devices.map(device =>
                    device.id === deviceId
                      ? { ...device, ...updates, updatedAt: new Date() }
                      : device
                  ),
                  updatedAt: new Date(),
                }
              : room
          ),
        }));
      },

      reorderDevicesInRoom: (roomId: string, deviceIds: string[]) => {
        set(state => ({
          rooms: state.rooms.map(room =>
            room.id === roomId
              ? {
                  ...room,
                  devices: deviceIds.map(id => room.devices.find(d => d.id === id)!).filter(Boolean),
                  updatedAt: new Date(),
                }
              : room
          ),
        }));
      },

      // Utility functions
      getRoom: (roomId: string) => {
        return get().rooms.find(room => room.id === roomId);
      },

      getSelectedRoom: () => {
        const { rooms, selectedRoomId } = get();
        return selectedRoomId ? rooms.find(room => room.id === selectedRoomId) : undefined;
      },

      getRoomDevices: (roomId: string) => {
        const room = get().getRoom(roomId);
        return room?.devices || [];
      },

      // Admin actions
      clearAllDevices: () => {
        set(state => ({
          rooms: state.rooms.map(room => ({
            ...room,
            devices: [],
            updatedAt: new Date(),
          })),
        }));
      },

      resetDashboard: () => {
        set({
          rooms: [
            {
              id: 'my-home',
              name: 'My Home',
              icon: 'Home',
              devices: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          selectedRoomId: 'my-home',
        });
      },
    }),
    {
      name: 'room-dashboard-storage',
      // Only persist the essential data, not the functions
      partialize: (state) => ({
        rooms: state.rooms,
        selectedRoomId: state.selectedRoomId,
      }),
    }
  )
);