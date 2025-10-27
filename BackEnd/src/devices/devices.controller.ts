import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('devices')
@UseGuards(AuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async create(
    @Body() createDeviceDto: CreateDeviceDto,
    @CurrentUser() user: User,
  ) {
    const device = await this.devicesService.create(createDeviceDto, user);
    return {
      message: 'Dispositivo creado exitosamente',
      device: {
        id: device.id,
        deviceId: this.devicesService.maskDeviceId(
          device.deviceId,
          user.role === 'admin',
        ),
        name: device.name,
        model: device.model,
        licensePlate: device.licensePlate,
      },
    };
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    const devices = await this.devicesService.findAll(user);
    return {
      devices: this.devicesService.formatDevices(devices, user.role === 'admin'),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    const device = await this.devicesService.findOne(id, user);
    return {
      device: {
        id: device.id,
        deviceId: this.devicesService.maskDeviceId(
          device.deviceId,
          user.role === 'admin',
        ),
        name: device.name,
        model: device.model,
        licensePlate: device.licensePlate,
        isActive: device.isActive,
        createdAt: device.createdAt,
      },
    };
  }
}
