import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir conexiones desde el frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // URLs permitidas
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Habilitar validación global usando class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Rechaza requests con propiedades extra
      transform: true, // Transforma los payloads a instancias de DTO
    }),
  );

  // Puerto del servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 Backend server running on: http://localhost:${port}`);
  console.log(`📡 WebSocket server available at: ws://localhost:${port}`);
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
