import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from './jwt.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  // Registro y inicio de sesión
  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto;

    // Crear usuario
    const user = await this.usersService.create(email, password, name, role);

    // Generar token JWT
    const token = this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    // Devolver token y usuario
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  // Login
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto; // valida el email y la contraseña

    // Buscar usuario
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Validar contraseña
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token JWT
    const token = this.jwtService.sign({ // firma el token
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    // Devolver token y usuario
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  // Validar token
  async validateToken(token: string) {
    try {
      // crea el payload y verificar el token
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.userId);
      // Verificar que el usuario esté activo
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Usuario no válido');
      }
      // Si el usuario está activo, devolver el usuario
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
