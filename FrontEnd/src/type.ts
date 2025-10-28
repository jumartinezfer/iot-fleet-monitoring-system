export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Device {
  id: string;
  deviceId: string;
  name: string;
  model?: string;
  licensePlate?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SensorData {
  id: string;
  latitude: number;
  longitude: number;
  fuelLevel: number;
  temperature: number;
  speed: number;
  fuelConsumptionRate: number;
  alert: string | null;
  timestamp: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName?: string;
  message: string;
  fuelLevel: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
}

export interface CreateDeviceData {
  deviceId: string;
  name: string;
  model?: string;
  licensePlate?: string;
}

export interface IngestSensorData {
  deviceId: string;
  latitude: number;
  longitude: number;
  fuelLevel: number;
  temperature: number;
  speed?: number;
  fuelConsumptionRate?: number;
}
