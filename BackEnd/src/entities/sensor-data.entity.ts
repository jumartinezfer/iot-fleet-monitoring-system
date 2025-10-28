import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';

import { Device } from './device.entity';

// Entidad para gestionar datos de sensores
@Entity('sensor_data')
export class SensorData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column('decimal', { precision: 5, scale: 2 })
  fuelLevel: number; // Nivel de combustible en litros

  @Column('decimal', { precision: 5, scale: 2 })
  temperature: number; // Temperatura del motor en °C

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  speed: number; // Velocidad en km/h

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  fuelConsumptionRate: number; // Consumo en L/h

  @Column('text', { nullable: true })
  alert: string | null; // Mensaje de alerta si existe

  @CreateDateColumn()
  timestamp: Date;

  // Relación: Muchos registros de sensores pertenecen a un dispositivo
  @ManyToOne(() => Device, (device) => device.sensorData, {
    onDelete: 'CASCADE',
  })
  device: Device;
}
