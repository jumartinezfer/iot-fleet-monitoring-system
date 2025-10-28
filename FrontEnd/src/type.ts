// Tipos de datos
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}
// Tipos de respuesta de autenticación
export interface AuthResponse {
  access_token: string;
  user: User;
}
// Tipos de datos de dispositivo
export interface Device {
  id: string;
  deviceId: string;
  name: string;
  model?: string;
  licensePlate?: string;
  isActive: boolean;
  createdAt: string;
}
// Tipos de datos de sensores
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
// Tipos de datos de alerta
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
// Tipos de datos de inicio de sesión
export interface LoginCredentials {
  email: string;
  password: string;
}
// Tipos de datos de registro
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'user';
}
// Tipos de datos de creación de dispositivo
export interface CreateDeviceData {
  deviceId: string;
  name: string;
  model?: string;
  licensePlate?: string;
}
// Tipos de datos de ingesta de sensores
export interface IngestSensorData {
  deviceId: string;
  latitude: number;
  longitude: number;
  fuelLevel: number;
  temperature: number;
  speed?: number;
  fuelConsumptionRate?: number;
}
