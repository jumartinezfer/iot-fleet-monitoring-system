import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({
    example: 'DEV-ABCD-1234',
    description: 'ID único del dispositivo IoT',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    example: 'Vehículo 1',
    description: 'Nombre descriptivo del dispositivo',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Toyota Corolla',
    description: 'Modelo del vehículo',
  })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    example: 'ABC123',
    description: 'Placa del vehículo',
  })
  @IsString()
  @IsOptional()
  licensePlate?: string;
}
