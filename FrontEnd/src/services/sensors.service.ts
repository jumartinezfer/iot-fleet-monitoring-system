import api from './api';
import type { SensorData, Alert, IngestSensorData } from '../type';

export const sensorsService = {
  async ingestData(data: IngestSensorData): Promise<{ alert: string | null }> {
    const response = await api.post('/sensors/ingest', data);
    return response.data;
  },

  async getLatestData(deviceId: string, limit: number = 10): Promise<SensorData[]> {
    const response = await api.get<{ data: SensorData[] }>(
      `/sensors/latest/${deviceId}`,
      { params: { limit } }
    );
    return response.data.data;
  },

  async getHistoricalData(
    deviceId: string,
    startDate?: string,
    endDate?: string
  ): Promise<SensorData[]> {
    const response = await api.get<{ data: SensorData[] }>(
      `/sensors/historical/${deviceId}`,
      { params: { startDate, endDate } }
    );
    return response.data.data;
  },

  async getActiveAlerts(): Promise<Alert[]> {
    const response = await api.get<{ alerts: Alert[] }>('/sensors/alerts');
    return response.data.alerts;
  },
};
