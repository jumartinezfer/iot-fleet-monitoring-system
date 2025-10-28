import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../type';
// Interface para el store de autenticación
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
      setAuth: (user, token) => {
        // Guardar token en localStorage
        localStorage.setItem('token', token); //Cambio de 'access_token' a 'token'
        set({ user, token, isAuthenticated: true });
        console.log('Token guardado correctamente');
      },
      logout: () => {
        // Cerrar sesión
        localStorage.removeItem('token'); //Cambio de 'access_token' a 'token'
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
