import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type  { User } from '../types';

// Estado de la aplicación
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}
// Crear store de autenticación
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => { // Actualizar datos de autenticación
        localStorage.setItem('access_token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null, isAuthenticated: false }); // Actualizar datos de autenticación
      },
    }),
    { // Configuración de persistance
      name: 'auth-storage',
    }
  )
);
