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

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');
  private connectedClients: Map<string, { userId: string; role: string }> =
    new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'No authentication token provided' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.userId);

      if (!user) {
        this.logger.warn(`Invalid user for client ${client.id}`);
        client.emit('error', { message: 'Invalid user' });
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, {
        userId: user.id,
        role: user.role,
      });

      if (user.role === 'admin') {
        client.join('admins');
      }
      client.join(`user_${user.id}`);

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

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);

    if (clientInfo) {
      this.logger.log(
        `Client disconnected: ${client.id} (User ID: ${clientInfo.userId})`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
    this.logger.log(`Total clients: ${this.connectedClients.size}`);
  }

  broadcastSensorData(deviceId: string, data: any) {
    this.server.emit('sensorData', {
      deviceId,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Broadcasted sensor data for device ${deviceId}`);
  }

  sendSensorDataToDevice(deviceId: string, data: any) {
    this.server.to(`device_${deviceId}`).emit('sensorData', {
      deviceId,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Sent sensor data to subscribers of device ${deviceId}`);
  }

  sendAlertToAdmins(alert: any) {
    this.server.to('admins').emit('alert', {
      ...alert,
      timestamp: alert.timestamp || new Date(),
    });
    this.logger.log(`Alert sent to admins: ${alert.message}`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
    this.logger.log(`Notification sent to user ${userId}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
    return { event: 'pong', data: { timestamp: new Date() } };
  }

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

  @SubscribeMessage('unsubscribeFromDevice')
  handleUnsubscribeFromDevice(
    @MessageBody() data: { deviceId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { deviceId } = data;
    client.leave(`device_${deviceId}`);
    this.logger.log(`Client ${client.id} unsubscribed from device ${deviceId}`);
    return {
      event: 'unsubscribed',
      data: {
        deviceId,
        message: `Successfully unsubscribed from device ${deviceId}`,
      },
    };
  }

  @SubscribeMessage('getConnectedClients')
  handleGetConnectedClients(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);

    if (!clientInfo || clientInfo.role !== 'admin') {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }

    const clientsList = Array.from(this.connectedClients.entries()).map(
      ([socketId, info]) => ({
        socketId,
        userId: info.userId,
        role: info.role,
      }),
    );

    return {
      event: 'connectedClients',
      data: { count: clientsList.length, clients: clientsList },
    };
  }

  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all clients`);
  }
}
