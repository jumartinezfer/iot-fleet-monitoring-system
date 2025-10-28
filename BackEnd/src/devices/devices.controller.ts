import { Controller, Get, Post, Body, Param, UseGuards, Delete, Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../entities/user.entity';

// Clase de controlador para gestionar dispositivos
@ApiTags('Devices')
@Controller('devices')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}
  // Endpoint para crear un nuevo dispositivo
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo dispositivo IoT',
    description:
      'Registra un nuevo dispositivo IoT asociado al usuario autenticado',
  })
  @ApiBody({ type: CreateDeviceDto })
  @ApiResponse({ status: 201, description: 'Dispositivo creado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 409, description: 'El deviceId ya existe' })
  async create(
    @Body() createDeviceDto: CreateDeviceDto,
    @CurrentUser() user: User,
  ) {
    // Crear dispositivo
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
  // Endpoint para obtener todos los dispositivos
  @Get()
  @ApiOperation({
    summary: 'Listar dispositivos',
    description: 'Los usuarios ven solo sus dispositivos, los admins ven todos',
  })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll(@CurrentUser() user: User) {
    const devices = await this.devicesService.findAll(user);
    return {
      devices: this.devicesService.formatDevices(
        devices,
        user.role === 'admin',
      ),
    };
  }
  // Endpoint para obtener un dispositivo específico
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener dispositivo por ID',
    description: 'Obtiene los detalles de un dispositivo específico',
  })
  @ApiParam({ name: 'id', description: 'ID del dispositivo (UUID)' })
  @ApiResponse({ status: 200, description: 'Detalles del dispositivo' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    // Obtener dispositivo
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
  // Endpoint para actualizar un dispositivo
  @Patch(':id')
@ApiOperation({ 
  summary: 'Actualizar dispositivo',
  description: 'Actualiza la información de un dispositivo específico',
})
@ApiParam({ name: 'id', description: 'ID del dispositivo (UUID)' })
@ApiBody({ type: CreateDeviceDto })
@ApiResponse({ status: 200, description: 'Dispositivo actualizado exitosamente' })
@ApiResponse({ status: 401, description: 'No autenticado' })
@ApiResponse({ status: 403, description: 'Sin permisos' })
@ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
async update(
  @Param('id') id: string,
  @Body() updateData: Partial<CreateDeviceDto>,
  @CurrentUser() user: User,
) {
    // Actualizar dispositivo
  const device = await this.devicesService.update(id, updateData, user);
  return {
    message: 'Dispositivo actualizado exitosamente',
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
// Endpoint para eliminar un dispositivo
@Delete(':id')
@ApiOperation({ 
  summary: 'Eliminar dispositivo',
  description: 'Desactiva un dispositivo (soft delete)',
})
@ApiParam({ name: 'id', description: 'ID del dispositivo (UUID)' })
@ApiResponse({ status: 200, description: 'Dispositivo eliminado exitosamente' })
@ApiResponse({ status: 401, description: 'No autenticado' })
@ApiResponse({ status: 403, description: 'Sin permisos' })
@ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
async remove(@Param('id') id: string, @CurrentUser() user: User) {
  await this.devicesService.remove(id, user);
  return {
    message: 'Dispositivo eliminado exitosamente',
  };
}

}


