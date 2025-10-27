import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device } from '../entities/device.entity';
import { AuthModule } from '../auth/auth.module'; // ← Añadir esta importación

@Module({
  imports: [
    TypeOrmModule.forFeature([Device]),
    AuthModule, 
  ],
  providers: [DevicesService],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
