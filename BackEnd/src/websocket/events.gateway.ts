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
import { DevicesService } from '../devices/devices.service';

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
  private connectedClients: Map<string, { userId: string; role: string }> = new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private devicesService: DevicesService, // ✅ NUEVO: Inyectar DevicesService
  ) {}
  //Cuando se conecta el cliente
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      //Si no hay token, se desconecta el cliente
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'No authentication token provided' });
        client.disconnect();
        return;
      }
      //Validar token
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.userId);
      //Si el usuario no existe, se desconecta el cliente
      if (!user) {
        this.logger.warn(`Invalid user for client ${client.id}`);
        client.emit('error', { message: 'Invalid user' });
        client.disconnect();
        return;
      }
      //Guardar el cliente en la lista de clientes conectados
      this.connectedClients.set(client.id, {
        userId: user.id,
        role: user.role,
      });
      //Si el usuario es admin, se agrega al canal admins
      if (user.role === 'admin') {
        client.join('admins');
      }
      //Se agrega al canal del usuario
      client.join(`user_${user.id}`);
      //Registro de eventos
      this.logger.log(`Client connected: ${client.id} (User: ${user.email})`);
      this.logger.log(`Total clients: ${this.connectedClients.size}`);
        //Enviar evento de conexión
      client.emit('connected', {
        message: 'Successfully connected to WebSocket server',
        userId: user.id,
        role: user.role,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.message);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }
  //Cuando se desconecta el cliente
  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);

    if (clientInfo) {
      this.logger.log(`Client disconnected: ${client.id} (User ID: ${clientInfo.userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
    //Registro de eventos
    this.logger.log(`Total clients: ${this.connectedClients.size}`);
  }

  //Enviar datos solo al dueño del dispositivo y a admins
  async broadcastSensorData(deviceId: string, data: any) {
    try {
      // Obtener el dispositivo para saber a quién pertenece
      const device = await this.devicesService.findByDeviceId(deviceId);

      if (!device) {
        this.logger.warn(`Device ${deviceId} not found for broadcast`);
        return;
      }
      //Obtener el id del dueño del dispositivo
      const deviceOwnerId = device.user.id;

      // Emitir a cada cliente conectado verificando permisos
      this.server.sockets.sockets.forEach((socket: any) => {
        const clientInfo = this.connectedClients.get(socket.id);

        if (!clientInfo) return;

        // Admin ve todos los dispositivos
        if (clientInfo.role === 'admin') {
          socket.emit('sensorData', {
            deviceId,
            ...data,
            timestamp: data.timestamp || new Date(),
          });
          return;
        }

        // Usuario normal solo ve sus propios dispositivos
        if (clientInfo.userId === deviceOwnerId) {
          socket.emit('sensorData', {
            deviceId,
            ...data,
            timestamp: data.timestamp || new Date(),
          });
        }
      });
      //Registro de eventos
      this.logger.log(
        `Broadcasted sensor data for device ${deviceId} to owner ${deviceOwnerId} and admins`,
      );
    } catch (error) {
      this.logger.error(`Error broadcasting sensor data: ${error.message}`);
    }
  }
  //Enviar datos al dispositivo
  sendSensorDataToDevice(deviceId: string, data: any) {
    this.server.to(`device_${deviceId}`).emit('sensorData', {
      deviceId,
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Sent sensor data to subscribers of device ${deviceId}`);
  }
  //Enviar alerta a los admins
  sendAlertToAdmins(alert: any) {
    this.server.to('admins').emit('alert', {
      ...alert,
      timestamp: alert.timestamp || new Date(),
    });
    this.logger.log(`Alert sent to admins: ${alert.message}`);
  }
  //Enviar notificación a un usuario
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
    this.logger.log(`Notification sent to user ${userId}`);
  }
  //Ping
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: new Date() });
    return { event: 'pong', data: { timestamp: new Date() } };
  }
  //Suscribirse al dispositivo
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
  //Dejar de suscribirse al dispositivo
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
  //Obtener los clientes conectados
  @SubscribeMessage('getConnectedClients')
  handleGetConnectedClients(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo || clientInfo.role !== 'admin') {
      return { event: 'error', data: { message: 'Unauthorized' } };
    }
    //Obtener los clientes conectados
    const clientsList = Array.from(this.connectedClients.entries()).map(
      ([socketId, info]) => ({
        socketId,
        userId: info.userId,
        role: info.role,
      }),
    );
      //Enviar evento de conexión
    return {
      event: 'connectedClients',
      data: { count: clientsList.length, clients: clientsList },
    };
  }
  //Enviar mensaje a todos los clientes
  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all clients`);
  }
}
