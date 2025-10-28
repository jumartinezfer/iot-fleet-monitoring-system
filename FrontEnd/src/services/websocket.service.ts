import { io, Socket } from 'socket.io-client';
import type { SensorData, Alert } from '../type';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

// Clase para gestionar websockets
class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Conectar al servidor WebSocket
  connect(token: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }
    // Conectar al servidor WebSocket
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });
    // Evento de conexión
    this.socket.on('connect', () => {
      console.log(' WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });
    // Evento de confirmación de conexión
    this.socket.on('connected', (data) => {
      console.log('Server confirmed connection:', data);
    });
    // Evento de desconexión
    this.socket.on('disconnect', (reason) => {
      console.log(' WebSocket disconnected:', reason);
    });
    // Evento de error
    this.socket.on('error', (error) => {
      console.error(' WebSocket error:', error);
    });
    // Evento de error de conexión
    this.socket.on('connect_error', (error) => {
      console.error(' Connection error:', error);
      this.reconnectAttempts++;
        // Si se alcanza el número máximo de intentos de reconexión, desconectar
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }
  // Desconectar del servidor WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected manually');
    }
  }
  // Evento de nuevos datos de sensores
  onSensorData(callback: (data: SensorData & { deviceId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('sensorData', callback);
  }
  // Evento de nueva alerta
  onAlert(callback: (alert: Alert) => void) {
    if (!this.socket) return;
    this.socket.on('alert', callback);
  }
  // Evento de notificación
  onNotification(callback: (notification: any) => void) {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }
  // Suscribirse al dispositivo
  subscribeToDevice(deviceId: string) {
    if (!this.socket) return;
    this.socket.emit('subscribeToDevice', { deviceId });
  }
  // Cancelar suscripción al dispositivo
  unsubscribeFromDevice(deviceId: string) {
    if (!this.socket) return;
    this.socket.emit('unsubscribeFromDevice', { deviceId });
  }
  // Enviar ping
  ping() {
    if (!this.socket) return;  // Verificar si está conectado
    this.socket.emit('ping');
  }
  // Verificar si está conectado
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
