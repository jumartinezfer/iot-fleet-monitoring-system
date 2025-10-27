import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { SensorDataDto } from '../dto/sensor-data.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  /**
   * Endpoint público para ingesta de datos desde dispositivos IoT
   * En producción esto debería usar API Key o token del dispositivo
   */
  @Post('ingest')
  async ingestData(@Body() sensorDataDto: SensorDataDto) {
    const sensorData = await this.sensorsService.ingestData(sensorDataDto);
    return {
      message: 'Datos ingresados exitosamente',
      alert: sensorData.alert,
      timestamp: sensorData.timestamp,
    };
  }

  /**
   * Obtener últimos datos de un dispositivo
   */
  @Get('latest/:deviceId')
  @UseGuards(AuthGuard)
  async getLatestData(
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.sensorsService.getLatestData(
      deviceId,
      limit ? parseInt(limit) : 10,
    );
    return { data };
  }

  /**
   * Obtener datos históricos
   */
  @Get('historical/:deviceId')
  @UseGuards(AuthGuard)
  async getHistoricalData(
    @Param('deviceId') deviceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const data = await this.sensorsService.getHistoricalData(
      deviceId,
      start,
      end,
    );
    return { data };
  }

  /**
   * Obtener alertas activas (solo admin)
   */
  @Get('alerts')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getActiveAlerts() {
    const alerts = await this.sensorsService.getActiveAlerts();
    return { alerts };
  }
}
