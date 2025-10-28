import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateDeviceDto } from '../dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}
  // Crear nuevo dispositivo
  async create(createDeviceDto: CreateDeviceDto, user: User): Promise<Device> {
    // Verificar si el deviceId ya existe
    const existingDevice = await this.devicesRepository.findOne({
      where: { deviceId: createDeviceDto.deviceId },
    });

    if (existingDevice) {
      throw new ConflictException('El deviceId ya existe');
    }
    // Crear dispositivo
    const device = this.devicesRepository.create({
      ...createDeviceDto,
      user,
    });
    // Guardar dispositivo
    return this.devicesRepository.save(device);
  }
  // Obtener todos los dispositivos
  async findAll(user: User): Promise<Device[]> {
    // Solo los usuarios administradores vean todos los dispositivos
    const query = this.devicesRepository.createQueryBuilder('device')
    .leftJoinAndSelect('device.user', 'user')
    .where('device.isActive = :isActive', { isActive: true });
    // Solo los usuarios normales vean los dispositivos de su usuario
  if (user.role !== UserRole.ADMIN) {
    query.andWhere('device.userId = :userId', { userId: user.id });
  }
  // Obtener dispositivos
  const devices = await query.getMany();
  
  // Enmascarar el deviceId para usuarios no-admin
  const isAdmin = user.role === UserRole.ADMIN;
  
  return devices.map(device => {
    const maskedDevice = { ...device };
    maskedDevice.deviceId = this.maskDeviceId(device.deviceId, isAdmin);
    return maskedDevice;
  });
}
  // Obtener un dispositivo específico
  async findOne(id: string, user: User): Promise<Device> {
    const device = await this.devicesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    // Verificar que el dispositivo existe
    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    // Verificar permisos
    if (user.role !== 'admin' && device.user.id !== user.id) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    return device;
  }
  // Obtener un dispositivo por ID
  async findByDeviceId(deviceId: string): Promise<Device | null> {
    return this.devicesRepository.findOne({
      where: { deviceId },
      relations: ['user'],
    });
  }

  /**
   * Enmascara el deviceId para usuarios no-admin
   * Ejemplo: DEV-ABCD-1234 -> DEV-****-1234
   */
  maskDeviceId(deviceId: string, isAdmin: boolean): string {
    if (isAdmin) {
      return deviceId;
    }
    // Enmascarar el deviceId para usuarios no-admin
    const parts = deviceId.split('-');
    if (parts.length >= 3) {
      parts[1] = '****';
    }
    return parts.join('-');
  }

  //Formatea dispositivos aplicando enmascaramiento según rol   
  formatDevices(devices: Device[], isAdmin: boolean) {
    return devices.map((device) => ({
      id: device.id,
      deviceId: this.maskDeviceId(device.deviceId, isAdmin),
      name: device.name,
      model: device.model,
      licensePlate: device.licensePlate,
      isActive: device.isActive,
      createdAt: device.createdAt,
    }));
  }
  // Actualizar dispositivo
  async update(id: string, updateData: Partial<CreateDeviceDto>, user: User): Promise<Device> {
  const device = await this.devicesRepository.findOne({
    where: { id },
    relations: ['user'],
  });
  // Verificar que el dispositivo existe
  if (!device) {
    throw new NotFoundException('Dispositivo no encontrado');
  }

  // Verificar permisos
  if (user.role !== UserRole.ADMIN && device.user.id !== user.id) {
    throw new ForbiddenException('No tienes permiso para actualizar este dispositivo');
  }

  // Actualizar campos
  if (updateData.name) device.name = updateData.name;
  if (updateData.model) device.model = updateData.model;
  if (updateData.licensePlate) device.licensePlate = updateData.licensePlate;

  return await this.devicesRepository.save(device);
}

// Eliminar dispositivo (SOFT DELETE)
async remove(id: string, user: User): Promise<void> {
  const device = await this.devicesRepository.findOne({
    where: { id },
    relations: ['user'],
  });

  // Verificar que el dispositivo existe
  if (!device) {
    throw new NotFoundException('Dispositivo no encontrado');
  }

  // Verificar permisos
  if (user.role !== UserRole.ADMIN && device.user.id !== user.id) {
    throw new ForbiddenException('No tienes permiso para eliminar este dispositivo');
  }

  // Marcar como inactivo en lugar de eliminar
  device.isActive = false;
  await this.devicesRepository.save(device);
}

// Eliminar dispositivo (HARD DELETE)
// async remove(id: string, user: User): Promise<void> {
// const device = await this.deviceRepository.findOne({
//     where: { id },
///     relations: ['user'],
//   });

//   if (!device) {
//     throw new NotFoundException('Dispositivo no encontrado');
//   }

//   if (user.role !== UserRole.ADMIN && device.user.id !== user.id) {
//     throw new ForbiddenException('No tienes permiso para eliminar este dispositivo');
//   }

//   // HARD DELETE: Elimina permanentemente de la base de datos
//   await this.deviceRepository.remove(device);
// }

}


