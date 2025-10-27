import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registrar el repositorio de User
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Exportar para usar en AuthModule
})
export class UsersModule {}
