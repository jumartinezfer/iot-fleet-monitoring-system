import { create } from 'zustand';
import type { SensorData, Alert } from '../type';

interface SensorsState {
  sensorData: SensorData[];
  alerts: Alert[];
  latestData: SensorData | null;
  addSensorData: (data: SensorData) => void;
  setSensorData: (data: SensorData[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setLatestData: (data: SensorData) => void;
}

export const useSensorsStore = create<SensorsState>((set) => ({
  sensorData: [],
  alerts: [],
  latestData: null,
  addSensorData: (data) => set((state) => ({ 
    sensorData: [data, ...state.sensorData].slice(0, 100) // Mantener últimos 100
  })),
  setSensorData: (data) => set({ sensorData: data }),
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts].slice(0, 50) // Mantener últimas 50
  })),
  setLatestData: (data) => set({ latestData: data }),
}));
