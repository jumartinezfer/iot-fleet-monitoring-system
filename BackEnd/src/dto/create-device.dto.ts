import { IsString, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  deviceId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  licensePlate?: string;
}
