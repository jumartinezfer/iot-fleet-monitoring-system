/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorData } from '../entities/sensor-data.entity';
import { DevicesService } from '../devices/devices.service';
import { SensorDataDto } from '../dto/sensor-data.dto';
import { EventsGateway } from '../websocket/events.gateway';

@Injectable()
export class SensorsService {
constructor(
    @InjectRepository(SensorData)
    private sensorDataRepository: Repository<SensorData>,
    private devicesService: DevicesService,
    private eventsGateway: EventsGateway,
) {}

// Ingesta de datos de sensores con cálculo predictivo
async ingestData(sensorDataDto: SensorDataDto): Promise<SensorData> {
    // Buscar dispositivo
    const device = await this.devicesService.findByDeviceId(
    sensorDataDto.deviceId,
    );
    // Verificar que el dispositivo existe
    if (!device) {
    throw new NotFoundException('Dispositivo no encontrado');
    }

    // Crear registro de sensor
    const sensorData = this.sensorDataRepository.create({
    device,
    latitude: sensorDataDto.latitude,
    longitude: sensorDataDto.longitude,
    fuelLevel: sensorDataDto.fuelLevel,
    temperature: sensorDataDto.temperature,
    speed: sensorDataDto.speed || 0,
    fuelConsumptionRate: sensorDataDto.fuelConsumptionRate || 0,
    });

    // Algoritmo predictivo de combustible
    const alert = this.predictFuelAlert(
    sensorDataDto.fuelLevel,
    sensorDataDto.fuelConsumptionRate || 0,
    sensorDataDto.speed || 0,
    );
    // Guardar datos de sensores
    sensorData.alert = alert;

    const savedData = await this.sensorDataRepository.save(sensorData);

    // Broadcast en tiempo real vía WebSocket
    this.eventsGateway.broadcastSensorData(sensorDataDto.deviceId, {
    id: savedData.id,
    latitude: savedData.latitude,
    longitude: savedData.longitude,
    fuelLevel: savedData.fuelLevel,
    temperature: savedData.temperature,
    speed: savedData.speed,
    fuelConsumptionRate: savedData.fuelConsumptionRate,
    alert: savedData.alert,
    timestamp: savedData.timestamp,
    });

    // Si hay alerta, notifica a admins
    if (alert) {
    this.eventsGateway.sendAlertToAdmins({
        deviceId: sensorDataDto.deviceId,
        deviceName: device.name,
        message: alert,
        fuelLevel: savedData.fuelLevel,
        latitude: savedData.latitude,
        longitude: savedData.longitude,
        timestamp: savedData.timestamp,
    });
    }
    // Devolver datos de sensores
    return savedData;
}

//Algoritmo predictivo de combustible, alerta si el nivel de combustible baja a menos de 1 hora de autonomía
private predictFuelAlert(
    fuelLevel: number,
    fuelConsumptionRate: number,
    speed: number,
): string | null {
    // Si no hay datos de consumo, usar estimación basada en velocidad
    let estimatedConsumption = fuelConsumptionRate;

    if (estimatedConsumption === 0 && speed > 0) {
      // Estimación simplificada: consumo = (velocidad * 0.08) L/h Esto es una aproximación
      estimatedConsumption = speed * 0.08;
    }
    // Verificar si hay suficiente información
    if (estimatedConsumption === 0) {
      return null; // No hay suficiente información
    }

    // Calcular autonomía en horas
    const autonomyHours = fuelLevel / estimatedConsumption;

    // Generar alerta si la autonomía es menor a 1 hora
    if (autonomyHours < 1) {
      const autonomyMinutes = Math.round(autonomyHours * 60);
    return `ALERTA: Combustible bajo. Autonomía estimada: ${autonomyMinutes} minutos`;
    }

    // Alerta preventiva si la autonomía es menor a 2 horas
    if (autonomyHours < 2) {
      const autonomyMinutes = Math.round(autonomyHours * 60);
    return `ADVERTENCIA: Combustible medio. Autonomía estimada: ${autonomyMinutes} minutos`;
    }

    return null;
}

// Obtener últimos datos de un dispositivo
async getLatestData(
    deviceId: string,
    limit: number = 10,
): Promise<SensorData[]> {
    const device = await this.devicesService.findByDeviceId(deviceId);
    // Verificar que el dispositivo existe
    if (!device) {
    throw new NotFoundException('Dispositivo no encontrado');
    }
    // Obtener los últimos datos
    return this.sensorDataRepository.find({
    where: { device: { id: device.id } },
    order: { timestamp: 'DESC' },
    take: limit,
    });
}

// Obtener datos históricos con filtros
async getHistoricalData(
    deviceId: string,
    startDate?: Date,
    endDate?: Date,
): Promise<SensorData[]> {
        // Verificar que el dispositivo existe
    const device = await this.devicesService.findByDeviceId(deviceId);

    if (!device) {
    throw new NotFoundException('Dispositivo no encontrado');
    }
    // Si hay fecha de inicio, filtra los datos por rango de fechas
    const query = this.sensorDataRepository
    .createQueryBuilder('sensor_data')
    .where('sensor_data.deviceId = :deviceId', { deviceId: device.id })
    .orderBy('sensor_data.timestamp', 'DESC');

    if (startDate) {
    query.andWhere('sensor_data.timestamp >= :startDate', { startDate });
    }
    // Si no hay fecha de fin, devuelve los últimos datos
    if (endDate) {
    query.andWhere('sensor_data.timestamp <= :endDate', { endDate });
    }

    return query.getMany();
}

// Obtener alertas activas (solo para admin)
async getActiveAlerts(): Promise<SensorData[]> {
    return this.sensorDataRepository
    .createQueryBuilder('sensor_data')
    .leftJoinAndSelect('sensor_data.device', 'device')
    .where('sensor_data.alert IS NOT NULL')
    .orderBy('sensor_data.timestamp', 'DESC')
    .take(50)
    .getMany();
}

//Obtener estadísticas de un dispositivo
async getDeviceStatistics(deviceId: string): Promise<any> {
    const device = await this.devicesService.findByDeviceId(deviceId);

    if (!device) {
    throw new NotFoundException('Dispositivo no encontrado');
    }
    // Obtener estadísticas
    const data = await this.sensorDataRepository
    .createQueryBuilder('sensor_data')
    .select('AVG(sensor_data.fuelLevel)', 'avgFuel')
    .addSelect('AVG(sensor_data.temperature)', 'avgTemp')
    .addSelect('AVG(sensor_data.speed)', 'avgSpeed')
    .addSelect('MIN(sensor_data.fuelLevel)', 'minFuel')
    .addSelect('MAX(sensor_data.temperature)', 'maxTemp')
    .addSelect('COUNT(sensor_data.id)', 'totalRecords')
    .where('sensor_data.deviceId = :deviceId', { deviceId: device.id })
    .getRawOne();

    // Devolver datos
    return {
    deviceId,
    deviceName: device.name,
    statistics: {
        averageFuelLevel: parseFloat(data.avgFuel || 0).toFixed(2),
        averageTemperature: parseFloat(data.avgTemp || 0).toFixed(2),
        averageSpeed: parseFloat(data.avgSpeed || 0).toFixed(2),
        minimumFuelLevel: parseFloat(data.minFuel || 0).toFixed(2),
        maximumTemperature: parseFloat(data.maxTemp || 0).toFixed(2),
        totalRecords: parseInt(data.totalRecords || 0),
    },
    };
}
}
