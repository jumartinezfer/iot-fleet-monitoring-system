import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { User } from '../entities/user.entity';
import { CreateDeviceDto } from '../dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto, user: User): Promise<Device> {
    // Verificar si el deviceId ya existe
    const existingDevice = await this.devicesRepository.findOne({
      where: { deviceId: createDeviceDto.deviceId },
    });

    if (existingDevice) {
      throw new ConflictException('El deviceId ya existe');
    }

    const device = this.devicesRepository.create({
      ...createDeviceDto,
      user,
    });

    return this.devicesRepository.save(device);
  }

  async findAll(user: User): Promise<Device[]> {
    // Admin ve todos, usuarios normales solo los suyos
    if (user.role === 'admin') {
      return this.devicesRepository.find({ relations: ['user'] });
    }
    
    return this.devicesRepository.find({
      where: { user: { id: user.id } },
    });
  }

  async findOne(id: string, user: User): Promise<Device> {
    const device = await this.devicesRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    // Verificar permisos
    if (user.role !== 'admin' && device.user.id !== user.id) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    return device;
  }

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

    const parts = deviceId.split('-');
    if (parts.length >= 3) {
      parts[1] = '****';
    }
    return parts.join('-');
  }

  /**
   * Formatea dispositivos aplicando enmascaramiento según rol
   */
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
}
