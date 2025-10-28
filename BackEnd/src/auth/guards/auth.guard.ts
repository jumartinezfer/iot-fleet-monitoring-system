import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  // Validar si el token está presente y valido
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request); // Extraer token de la cabecera
    // Si no se encuentra token, lanzar una excepción
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    // Validar el token
    try {
      const user = await this.authService.validateToken(token);
      // Adjuntar usuario al request para uso posterior
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
  //Extraer token de la cabecera
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    // Verificar que el tipo de token sea Bearer
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
