import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from './jwt.service';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [ConfigModule, UsersModule], // Importar UsersModule
  providers: [AuthService, JwtService, AuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtService, AuthGuard, RolesGuard],
})
export class AuthModule {}
