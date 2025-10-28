import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SensorData, Alert } from '../type';
// Interface para el store de sensores
interface SensorsState {
  sensorData: SensorData[]; // Historial completo (para tabla y gráficas)
  latestByDevice: Record<string, SensorData>; // Último dato por device (para mapa)
  alerts: Alert[];
  latestData: SensorData | null;
  addSensorData: (data: SensorData) => void;
  setSensorData: (data: SensorData[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  setLatestData: (data: SensorData) => void;
  getMapData: () => SensorData[]; // Helper para obtener datos del mapa
}
// Crear store de sensores
export const useSensorsStore = create<SensorsState>()(
  persist(
    (set, get) => ({
      sensorData: [],
      latestByDevice: {},
      alerts: [],
      latestData: null,
      // Agregar datos de sensores al store
      addSensorData: (data) => {
        console.log('📊 Agregando sensor data al store:', data);
        set((state) => {
          // Agregar al historial completo (al principio) - NUNCA reemplazar
          const newSensorData = [data, ...state.sensorData].slice(0, 100); // Mantener últimos 100

          // Actualizar el último dato por dispositivo (para el mapa)
          const newLatestByDevice = {
            ...state.latestByDevice,
            [data.deviceId]: data,
          };

          console.log('Total en historial:', newSensorData.length);
          console.log('Dispositivos en mapa:', Object.keys(newLatestByDevice).length);

          return {
            sensorData: newSensorData,
            latestByDevice: newLatestByDevice,
          };
        });
      },

      setSensorData: (data) => {
        // Establecer datos de sensores completos

        // También actualizar latestByDevice con estos datos
        const latestByDevice: Record<string, SensorData> = {};
        data.forEach((item) => {
          if (
            !latestByDevice[item.deviceId] ||
            new Date(item.timestamp) > new Date(latestByDevice[item.deviceId].timestamp) // Si es más reciente
          ) {
            latestByDevice[item.deviceId] = item; // Agregar datos al último dispositivo
          }
        });
        // Actualizar store
        set({
          sensorData: data,
          latestByDevice,
        });
      },
      // Establecer alertas
      setAlerts: (alerts) => {
        console.log('Estableciendo alertas:', alerts.length, 'items');
        set({ alerts });
      },
      // Agregar alerta al store
      addAlert: (alert) => {
        console.log('Agregando alerta al store:', alert);
        set((state) => ({
          alerts: [alert, ...state.alerts].slice(0, 50),
        }));
      },
      // Establecer datos de sensores más recientes
      setLatestData: (data) => set({ latestData: data }),

      // Helper: Obtener array de datos para el mapa (último por dispositivo)
      getMapData: () => {
        const state = get();
        return Object.values(state.latestByDevice); // Devolver datos del mapa
      },
    }),
    {
      name: 'sensors-storage',
      partialize: (state) => ({ // Parcializar store
        sensorData: state.sensorData,
        latestByDevice: state.latestByDevice,
        alerts: state.alerts,
      }),
    },
  ),
);
