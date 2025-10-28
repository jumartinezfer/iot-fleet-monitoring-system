import api from './api';
import type { Device, CreateDeviceData } from '../type';

export const devicesService = {
  async getAll(): Promise<Device[]> {
    const response = await api.get<{ devices: Device[] }>('/devices');
    return response.data.devices;
  },

  async getById(id: string): Promise<Device> {
    const response = await api.get<{ device: Device }>(`/devices/${id}`);
    return response.data.device;
  },

  async create(data: CreateDeviceData): Promise<Device> {
    const response = await api.post<{ device: Device }>('/devices', data);
    return response.data.device;
  },
};
