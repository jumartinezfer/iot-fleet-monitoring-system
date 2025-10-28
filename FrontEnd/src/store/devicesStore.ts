import { create } from 'zustand';
import type { Device } from '../type';

// Store de dispositivos
interface DevicesState {
  devices: Device[];
  selectedDevice: Device | null;
  loading: boolean;
  error: string | null;
  setDevices: (devices: Device[]) => void; // Actualizar lista de dispositivos
  addDevice: (device: Device) => void;
  selectDevice: (device: Device | null) => void; // Seleccionar dispositivo
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}
// Crear store de dispositivos
export const useDevicesStore = create<DevicesState>((set) => ({
  devices: [],
  selectedDevice: null,
  loading: false,
  error: null,
  setDevices: (devices) => set({ devices }),
  addDevice: (device) => set((state) => ({ devices: [...state.devices, device] })), // Agregar dispositivo al store
  selectDevice: (device) => set({ selectedDevice: device }),
  setLoading: (loading) => set({ loading }), // Establecer cargando
  setError: (error) => set({ error }),
}));
