import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { SensorData } from './sensor-data.entity';

// Entidad para gestionar dispositivos
@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  deviceId: string; // ID público del dispositivo (ej: DEV-ABCD-1234)

  @Column()
  name: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  licensePlate: string; // Placa del vehículo

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relación: Muchos dispositivos pertenecen a un usuario
  @ManyToOne(() => User, (user) => user.devices, { onDelete: 'CASCADE' })
  user: User;

  // Relación: Un dispositivo tiene muchos registros de sensores
  @OneToMany(() => SensorData, (sensorData) => sensorData.device, {
    cascade: true,
    onDelete: 'CASCADE', // Borrar registros de sensores también
  })
  sensorData: SensorData[];
}
