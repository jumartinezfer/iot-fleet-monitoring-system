import api from './api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '../type';

// Servicio de autenticación
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  // Función para registrarse
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
  // Función para obtener perfil del usuario
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },
  // Función para cerrar sesión
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};
