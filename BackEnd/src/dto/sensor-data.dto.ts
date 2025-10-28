import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SensorDataDto {
  @ApiProperty({
    example: 'DEV-ABCD-1234',
    description: 'ID del dispositivo que envía los datos',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    example: 28.4682,
    description: 'Latitud GPS (-90 a 90)',
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    example: -16.2546,
    description: 'Longitud GPS (-180 a 180)',
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    example: 45.5,
    description: 'Nivel de combustible en litros',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  fuelLevel: number;

  @ApiProperty({
    example: 85.3,
    description: 'Temperatura del motor en °C',
    minimum: -50,
    maximum: 150,
  })
  @IsNumber()
  @Min(-50)
  @Max(150)
  temperature: number;

  @ApiPropertyOptional({
    example: 80,
    description: 'Velocidad actual en km/h',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  speed?: number;

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Tasa de consumo de combustible en L/h',
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fuelConsumptionRate?: number;
}
