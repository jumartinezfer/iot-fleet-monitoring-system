import { io, Socket } from 'socket.io-client';
import type { SensorData, Alert } from '../type';

// Clase para manejar WebSockets
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
// Conectar WebSocket
  connect(token: string) {
    if (this.socket?.connected) {
      console.log('WebSocket connected');
      return;
    }

    // Conectar WebSocket
    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts, // Máximo de intentos de reconexión
    });

    this.socket.on('connect', () => {
      // Cuando se conecta
      this.reconnectAttempts = 0;
    });
    
    this.socket.on('connected', (data) => {
      console.log('Server confirmed connection:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(' WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      this.reconnectAttempts++;
    });

    // Log de eventos recibidos
    this.socket.onAny((eventName, ...args) => {
      console.log('WebSocket event received:', eventName, args);
    });
  }
  // Manejar eventos de sensorData
  onSensorData(callback: (data: SensorData) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    // Manejar eventos de sensorData
    this.socket.on('sensorData', (data: SensorData) => {
      console.log('sensorData event received:', data);
      callback(data);
    });
  }

  // Manejar eventos de alert
  onAlert(callback: (alert: Alert) => void) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }

    // Manejar eventos de alert
    this.socket.on('alert', (alert: Alert) => {
      console.log('alert event received:', alert);
      callback(alert);
    });
  }
  // Desconectar WebSocket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }
  // Verificar si WebSocket está conectado
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
