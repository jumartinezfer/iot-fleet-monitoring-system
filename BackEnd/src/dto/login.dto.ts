import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Clase para iniciar sesión
export class LoginDto {
  @ApiProperty({
    example: 'admin@test.com',
    description: 'Email del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Contraseña del usuario',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}
