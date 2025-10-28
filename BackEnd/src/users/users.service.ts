import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  // Crear nuevo usuario
  async create(
    email: string,
    password: string,
    name: string,
    role?: string,
  ): Promise<User> {
    // Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario con el tipo correcto
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      role: (role as UserRole) || UserRole.USER, 
    });
    // Guardar usuario
    return this.usersRepository.save(user);
  }
  // Obtener usuario por email
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }
  // Obtener usuario por ID
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
  // Validar contraseña
  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
