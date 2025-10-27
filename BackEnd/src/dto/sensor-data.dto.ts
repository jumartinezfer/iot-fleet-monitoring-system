import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class SensorDataDto {
  @IsString()
  deviceId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsNumber()
  @Min(0)
  fuelLevel: number; // Litros

  @IsNumber()
  @Min(-50)
  @Max(150)
  temperature: number; // °C

  @IsNumber()
  @IsOptional()
  @Min(0)
  speed?: number; // km/h

  @IsNumber()
  @IsOptional()
  @Min(0)
  fuelConsumptionRate?: number; // L/h
}
