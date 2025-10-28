import { io, Socket } from 'socket.io-client';
import type { SensorData, Alert } from '../type';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log(' WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('connected', (data) => {
      console.log('Server confirmed connection:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(' WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error(' WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error(' Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected manually');
    }
  }

  onSensorData(callback: (data: SensorData & { deviceId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('sensorData', callback);
  }

  onAlert(callback: (alert: Alert) => void) {
    if (!this.socket) return;
    this.socket.on('alert', callback);
  }

  onNotification(callback: (notification: any) => void) {
    if (!this.socket) return;
    this.socket.on('notification', callback);
  }

  subscribeToDevice(deviceId: string) {
    if (!this.socket) return;
    this.socket.emit('subscribeToDevice', { deviceId });
  }

  unsubscribeFromDevice(deviceId: string) {
    if (!this.socket) return;
    this.socket.emit('unsubscribeFromDevice', { deviceId });
  }

  ping() {
    if (!this.socket) return;
    this.socket.emit('ping');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
