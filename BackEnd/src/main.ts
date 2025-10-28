import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('IoT Fleet Monitoring API')
    .setDescription(
      'API REST para sistema de monitoreo de flotas vehiculares con IoT. ' +
        'Incluye autenticación JWT, ingesta de datos de sensores en tiempo real, ' +
        'algoritmo predictivo de combustible y WebSockets para actualizaciones en vivo.',
    )
    .setVersion('1.0.0')
    .setContact(
      'Equipo de Desarrollo',
      'https://github.com/jumartinezfer/iot-fleet-monitoring-system',
      'jumartinezfer95@gmail.com',
    )
    .addTag('Auth', 'Endpoints de autenticación y gestión de usuarios')
    .addTag('Devices', 'Gestión de dispositivos IoT')
    .addTag('Sensors', 'Ingesta y consulta de datos de sensores')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });

  // Configurar la interfaz de Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'IoT Fleet API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 Backend server running on: http://localhost:${port}`);
  console.log(`📡 WebSocket server available at: ws://localhost:${port}`);
  console.log(
    `📚 Swagger API Documentation: http://localhost:${port}/api/docs`,
  );
  console.log(`\n📋 Available endpoints:`);
  console.log(`   - POST   /auth/register`);
  console.log(`   - POST   /auth/login`);
  console.log(`   - GET    /auth/profile`);
  console.log(`   - POST   /devices`);
  console.log(`   - GET    /devices`);
  console.log(`   - GET    /devices/:id`);
  console.log(`   - POST   /sensors/ingest`);
  console.log(`   - GET    /sensors/latest/:deviceId`);
  console.log(`   - GET    /sensors/historical/:deviceId`);
  console.log(`   - GET    /sensors/alerts\n`);
}

bootstrap();
