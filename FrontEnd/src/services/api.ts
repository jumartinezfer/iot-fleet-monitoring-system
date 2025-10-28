import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request: agregar token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); //Cambio de 'access_token' a 'token'
    // Agregar token a la petición
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No hay token para:', config.url);
    }
    // Devolver la petición
    return config;
  },
  (error) => {
    console.error('Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response: manejar errores 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => { // Si hay error 401, redirigir al login
    if (error.response?.status === 401) {
      console.error('Error 401: No autorizado. Redirigiendo al login...');
      localStorage.removeItem('token'); //Cambio de 'access_token' a 'token'
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
