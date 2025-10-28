import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
// interface JwtPayload
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtService {
  private readonly secret: string;

  constructor(private configService: ConfigService) {
    // Obtener el secret con valor por defecto si no existe
    this.secret =
      this.configService.get<string>('JWT_SECRET') ||
      // Si no existe, usar un secret predeterminado
      'default_secret_key_change_in_production';
  }

  // Genera un token JWT manualmente (sin librerías externas)
  sign(payload: { userId: string; email: string; role: string }): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    // Crear payload con fecha de expiración
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload: JwtPayload = {
      ...payload,
      iat: now, // creado en el momento actual
      exp: now + 24 * 60 * 60, // Expira en 24 horas
    };

    // Codificar header y payload en Base64URL
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(jwtPayload));

    // Crear signature
    const signature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
    );

    // Retornar token completo
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  // Verifica y decodifica un token JWT manualmente
  verify(token: string): JwtPayload {
    const parts = token.split('.');
    // Verificar que el token tenga 3 partes
    if (parts.length !== 3) {
      throw new Error('Token JWT inválido');
    }
    // Decodificar header y payload
    const [encodedHeader, encodedPayload, signature] = parts;

    // Verificar la firma
    const expectedSignature = this.createSignature(
      `${encodedHeader}.${encodedPayload}`,
    );

    if (signature !== expectedSignature) {
      throw new Error('Firma del token inválida');
    }

    // Decodificar payload
    const payload: JwtPayload = JSON.parse(
      this.base64UrlDecode(encodedPayload),
    );

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error('Token expirado');
    }

    return payload;
  }

  // Crea la firma del token
  private createSignature(data: string): string {
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest('base64'));
  }

  //Codifica a Base64URL
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64') // convertir a base64
      .replace(/\+/g, '-') // reemplazar + por -
      .replace(/\//g, '_') // reemplazar / por _
      .replace(/=/g, ''); // eliminar = al final
  }

  //Decodifica desde Base64URL
  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '='; // añadir = al final si falta
    }
    return Buffer.from(base64, 'base64').toString('utf-8'); // retorna decodificado
  }
}
