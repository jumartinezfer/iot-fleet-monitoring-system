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

    // Verificar TODAS las alertas (combustible, temperatura, consumo)
    const alerts = this.checkAllAlerts(
      sensorDataDto.fuelLevel,
      sensorDataDto.temperature,
      sensorDataDto.fuelConsumptionRate || 0,
      sensorDataDto.speed || 0,
    );

    // Guardar alerta combinada (si existe)
    sensorData.alert = alerts.length > 0 ? alerts.join(' | ') : null;
    // Guardar datos
    const savedData = await this.sensorDataRepository.save(sensorData);

    // Construir objeto con deviceId STRING (no el objeto device)
    const dataToSend = {
      id: savedData.id,
      deviceId: sensorDataDto.deviceId, // Usar el deviceId STRING del DTO
      latitude: savedData.latitude,
      longitude: savedData.longitude,
      fuelLevel: savedData.fuelLevel,
      temperature: savedData.temperature,
      speed: savedData.speed,
      fuelConsumptionRate: savedData.fuelConsumptionRate,
      alert: savedData.alert, // Mensaje de alerta como string
      timestamp: savedData.timestamp,
    };

    console.log('📡 Emitiendo sensorData por WebSocket:', dataToSend);

    // Broadcast datos completos con alertas vía WebSocket
    this.eventsGateway.broadcastSensorData(sensorDataDto.deviceId, dataToSend);

    // Si hay alertas, notificar también a admins
    if (savedData.alert) {
      const alertToSend = {
        deviceId: sensorDataDto.deviceId,
        deviceName: device.name,
        message: savedData.alert,
        fuelLevel: savedData.fuelLevel,
        latitude: savedData.latitude,
        longitude: savedData.longitude,
        timestamp: savedData.timestamp,
      };

      // Emitir alerta por WebSocket
      this.eventsGateway.sendAlertToAdmins(alertToSend);
    }

    return savedData;
  }

  // Método que verifica TODAS las alertas
  private checkAllAlerts(
    fuelLevel: number,
    temperature: number,
    fuelConsumptionRate: number,
    speed: number,
  ): string[] {
    const alerts: string[] = [];

    // Alerta de combustible bajo (< 10 litros)
    if (fuelLevel < 10) {
      alerts.push(`Combustible crítico: ${fuelLevel.toFixed(1)}L`);
    }

    // Alerta de temperatura alta (> 90°C)
    if (temperature > 90) {
      alerts.push(`Temperatura alta: ${temperature.toFixed(1)}°C`);
    }

    // Alerta de consumo excesivo (> 15 L/h)
    if (fuelConsumptionRate > 15) {
      alerts.push(`Consumo excesivo: ${fuelConsumptionRate.toFixed(1)}L/h`);
    }

    // Alerta de autonomía baja (predicción)
    const autonomyAlert = this.predictFuelAlert(
      fuelLevel,
      fuelConsumptionRate,
      speed,
    );
    // Agregar alerta de autonomía
    if (autonomyAlert) {
      alerts.push(autonomyAlert);
    }

    // Mostrar alertas
    return alerts;
  }

  // Algoritmo predictivo de combustible (autonomía)
  private predictFuelAlert(
    fuelLevel: number,
    fuelConsumptionRate: number,
    speed: number,
  ): string | null {
    let estimatedConsumption = fuelConsumptionRate;

    // Si no hay consumo, calcular consumo basado en velocidad
    if (estimatedConsumption === 0 && speed > 0) {
      estimatedConsumption = speed * 0.08;
    }

    // Si no hay consumo, no hay alerta
    if (estimatedConsumption === 0) {
      return null;
    }

    // Calcular autonomía
    const autonomyHours = fuelLevel / estimatedConsumption;

    // Alerta menos de una hora
    if (autonomyHours < 1) {
      const autonomyMinutes = Math.round(autonomyHours * 60);
      return `Autonomía baja: ${autonomyMinutes} min`;
    }

    // Alerta de menos de 2 horas
    if (autonomyHours < 2) {
      const autonomyMinutes = Math.round(autonomyHours * 60);
      return `Autonomía media: ${autonomyMinutes} min`;
    }

    return null;
  }

  // Obtener últimos datos de un dispositivo
  async getLatestData(
    deviceId: string,
    limit: number = 10,
  ): Promise<SensorData[]> {
    console.log('🔍 Buscando datos para deviceId:', deviceId);

    const device = await this.devicesService.findByDeviceId(deviceId);

    if (!device) {
      // No se encontró el dispositivo
      throw new NotFoundException('Dispositivo no encontrado');
    }

    // Query con relación explícita
    const data = await this.sensorDataRepository.find({
      where: { device: { id: device.id } },
      relations: ['device'],
      order: { timestamp: 'DESC' },
      take: limit,
    });

    console.log(`Datos encontrados: ${data.length} registros`);

    // Si no hay datos con relación, intentar búsqueda alternativa
    if (data.length === 0) {
      console.log('⚠️Intentando búsqueda alternativa...');

      const alternativeData = await this.sensorDataRepository
        .createQueryBuilder('sensor_data')
        .leftJoinAndSelect('sensor_data.device', 'device')
        .where('device.deviceId = :deviceId', { deviceId })
        .orderBy('sensor_data.timestamp', 'DESC')
        .take(limit)
        .getMany();

      console.log(`📊 Búsqueda alternativa: ${alternativeData.length} registros`);
      return alternativeData;
    }

    return data;
  }

  // Obtener datos históricos con filtros
  async getHistoricalData(
    deviceId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SensorData[]> {
    const device = await this.devicesService.findByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

    const query = this.sensorDataRepository
      .createQueryBuilder('sensor_data')
      .where('sensor_data.deviceId = :deviceId', { deviceId: device.id })
      .orderBy('sensor_data.timestamp', 'DESC');

    if (startDate) {
      query.andWhere('sensor_data.timestamp >= :startDate', { startDate });
    }

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

  // Obtener estadísticas de un dispositivo
  async getDeviceStatistics(deviceId: string): Promise<any> {
    const device = await this.devicesService.findByDeviceId(deviceId);

    if (!device) {
      throw new NotFoundException('Dispositivo no encontrado');
    }

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
