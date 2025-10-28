import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '../auth/jwt.service';
import { UsersService } from '../users/users.service';

// Clase para gestionar websockets
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
// Clase para gestionar websockets
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
    // Mapa de clientes conectados
  private logger: Logger = new Logger('EventsGateway');
  private connectedClients: Map<string, { userId: string; role: string }> =
    new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}
  // Cuando se conecta un cliente
  async handleConnection(client: Socket) {
    try {
      const token =
      // Obtener token de autenticación
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
        // Verificar que el token esté presente
      if (!token) {
        // Si no hay token, notificar al cliente
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'No authentication token provided' });
        client.disconnect();
        return;
      }
      // Verificar que el token es válido
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.userId);
      // Verificar que el usuario existe
      if (!user) {
        this.logger.warn(`Invalid user for client ${client.id}`);
        client.emit('error', { message: 'Invalid user' });
        client.disconnect();
        return;
      }
      // Guardar cliente conectado
      this.connectedClients.set(client.id, {
        userId: user.id,
        role: user.role,
      });
      // Si el usuario es admin, agregar a la sala de admins
      if (user.role === 'admin') {
        client.join('admins');
      }
      // Agregar a la sala del usuario
      client.join(`user_${user.id}`);
      // Notificar al cliente
      this.logger.log(`Client connected: ${client.id} (User: ${user.email})`);
      this.logger.log(`Total clients: ${this.connectedClients.size}`);

      client.emit('connected', {
        message: 'Successfully connected to WebSocket server',
        userId: user.id,
        role: user.role,
      });
    } catch (error) {
      this.logger.error(
        `Connection error for client ${client.id}:`,
        error.message,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }
  // Cuando se desconecta un cliente
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);
    // Verificar que el cliente esté conectado
    if (clientInfo) {
      this.logger.log(
        `Client disconnected: ${client.id} (User ID: ${clientInfo.userId})`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
    this.logger.log(`Total clients: ${this.connectedClients.size}`);
  }
  // Enviar datos de sensores a todos los clientes
  broadcastSensorData(deviceId: string, data: any) {
    this.server.emit('sensorData', {
      deviceId,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasted sensor data for device ${deviceId}`);
  }
  // Enviar datos de sensores a los clientes que se suscribieron al dispositivo
  sendSensorDataToDevice(deviceId: string, data: any) {
    this.server.to(`device_${deviceId}`).emit('sensorData', {
      deviceId,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Sent sensor data to subscribers of device ${deviceId}`);
  }
  // Enviar alerta a los admins
  sendAlertToAdmins(alert: any) {
    this.server.to('admins').emit('alert', {
      ...alert,
      timestamp: alert.timestamp || new Date(),
    });
    this.logger.log(`Alert sent to admins: ${alert.message}`);
  }
  // Enviar notificación a un usuario
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
    this.logger.log(`Notification sent to user ${userId}`);
  }
  // Ping
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
    return { event: 'pong', data: { timestamp: new Date() } };
  }
  // Suscribirse al dispositivo
  @SubscribeMessage('subscribeToDevice')
  handleSubscribeToDevice(
    @MessageBody() data: { deviceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { deviceId } = data;
    client.join(`device_${deviceId}`);
    this.logger.log(`Client ${client.id} subscribed to device ${deviceId}`);
    return {
      event: 'subscribed',
      data: {
        deviceId,
        message: `Successfully subscribed to device ${deviceId}`,
      },
    };
  }
  // Cancelar suscripción al dispositivo
  @SubscribeMessage('unsubscribeFromDevice')
  handleUnsubscribeFromDevice(
    @MessageBody() data: { deviceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { deviceId } = data;
    client.leave(`device_${deviceId}`);
    this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);
    return {
        // Evento de cancelación de suscripción
      event: 'unsubscribed',
      data: {
        deviceId,
        message: `Successfully unsubscribed from device ${deviceId}`,
      },
    };
  }
  // Obtener lista de clientes conectados
  @SubscribeMessage('getConnectedClients')
  handleGetConnectedClients(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);

    if (!clientInfo || clientInfo.role !== 'admin') {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    // Obtener lista de clientes conectados
    const clientsList = Array.from(this.connectedClients.entries()).map(
      ([socketId, info]) => ({
        socketId,
        userId: info.userId,
        role: info.role,
      }),
    );
    // Enviar lista de clientes conectados
    return {
      event: 'connectedClients',
      data: { count: clientsList.length, clients: clientsList },
    };
  }
  // Enviar mensaje a todos los clientes
  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all clients`);
  }
}
