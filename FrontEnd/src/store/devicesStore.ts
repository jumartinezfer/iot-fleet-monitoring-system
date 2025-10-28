import { create } from 'zustand';
import type { Device } from '../type';

interface DevicesState {
  devices: Device[];
  selectedDevice: Device | null;
  loading: boolean;
  error: string | null;
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  selectDevice: (device: Device | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDevicesStore = create<DevicesState>((set) => ({
  devices: [],
  selectedDevice: null,
  loading: false,
  error: null,
  setDevices: (devices) => set({ devices }),
  addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })),
  selectDevice: (device) => set({ selectedDevice: device }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
