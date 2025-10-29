import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Importar entidades
import { User } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { SensorData } from './entities/sensor-data.entity';

// Importar módulos
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { SensorsModule } from './sensors/sensors.module';
import { WebsocketModule } from './websocket/websocket.module'; // ✅ CORREGIDO: Ruta correcta

@Module({
  imports: [
    // Configuración global de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuración de TypeORM con PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5433),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', '0123456789'),
        database: configService.get('DATABASE_NAME', 'iot_fleet_db'),
        entities: [User, Device, SensorData],
        synchronize: true,
        logging: false,
      }),
    }),

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    DevicesModule,
    SensorsModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
