import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

// Crear decorador para establecer los roles requeridos
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
