import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SensorsService } from './sensors.service';
import { SensorDataDto } from '../dto/sensor-data.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User, UserRole } from '../entities/user.entity';

@ApiTags('Sensors')
@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}
    // Endpoint para ingresar datos de sensores
  @Post('ingest')
  @ApiOperation({
    summary: 'Ingresar datos de sensores IoT',
    description:
      'Endpoint público para ingesta de datos desde dispositivos IoT. ' +
      'Incluye algoritmo predictivo de combustible que genera alertas automáticas.',
  })
  @ApiBody({ type: SensorDataDto })
  @ApiResponse({
    status: 201,
    description:
      'Datos ingresados exitosamente. Retorna alerta si el combustible es bajo.',
    schema: {
      example: {
        message: 'Datos ingresados exitosamente',
        alert: 'ALERTA: Combustible bajo. Autonomía estimada: 45 minutos',
        timestamp: '2025-10-27T18:30:00.000Z',
      },
    },
  })
    // Endpoint para ingresar datos de sensores
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
  async ingestData(@Body() sensorDataDto: SensorDataDto) {
    const sensorData = await this.sensorsService.ingestData(sensorDataDto);
    return {
      message: 'Datos ingresados exitosamente',
      alert: sensorData.alert,
      timestamp: sensorData.timestamp,
    };
  }
  // Endpoint para obtener los últimos datos de un dispositivo
  @Get('latest/:deviceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener últimos datos de un dispositivo',
    description:
      'Retorna los N datos más recientes de un dispositivo específico',
  })
  @ApiParam({
    name: 'deviceId',
    description: 'ID público del dispositivo (ej: DEV-ABCD-1234)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Cantidad de registros a retornar (default: 10)',
    example: 10,
  })
    // Endpoint para obtener los últimos datos de un dispositivo
  @ApiResponse({ status: 200, description: 'Últimos datos del dispositivo' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
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
  // Endpoint para obtener datos históricos de un dispositivo
  @Get('historical/:deviceId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener datos históricos de un dispositivo',
    description: 'Retorna datos históricos con filtros opcionales de fecha',
  })
  @ApiParam({ name: 'deviceId', description: 'ID público del dispositivo' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Fecha de inicio',
    example: '2025-10-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Fecha de fin',
    example: '2025-10-27T23:59:59Z',
  })
  @ApiResponse({ status: 200, description: 'Datos históricos del dispositivo' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Dispositivo no encontrado' })
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
  // Endpoint para obtener alertas activas (solo admins)
  @Get('alerts')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtener alertas activas (solo admins)',
    description:
      'Retorna las últimas 50 alertas generadas por el algoritmo predictivo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de alertas activas',
    schema: {
      example: {
        alerts: [
          {
            id: 'uuid',
            deviceId: 'DEV-ABCD-1234',
            alert: 'ALERTA: Combustible bajo. Autonomía estimada: 30 minutos',
            fuelLevel: 5.2,
            latitude: 28.4682,
            longitude: -16.2546,
            timestamp: '2025-10-27T18:30:00.000Z',
          },
        ],
      },
    },
  })
    // Endpoint para obtener alertas activas (solo admins)
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado - Solo admins' })
  async getActiveAlerts() {
    const alerts = await this.sensorsService.getActiveAlerts();
    return { alerts };
  }
}
