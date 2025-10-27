import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorsService } from './sensors.service';
import { SensorsController } from './sensors.controller';
import { SensorData } from '../entities/sensor-data.entity';
import { DevicesModule } from '../devices/devices.module';
import { AuthModule } from '../auth/auth.module';
import { WebsocketModule } from '../websocket/websocket.module'; // ← Importación correcta

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorData]),
    DevicesModule,
    AuthModule,
    WebsocketModule,
  ],
  providers: [SensorsService],
  controllers: [SensorsController],
})
export class SensorsModule {}
