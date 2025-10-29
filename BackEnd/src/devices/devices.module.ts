import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { Device } from '../entities/device.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Device]),
  AuthModule,
],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService], 
})
export class DevicesModule {}
