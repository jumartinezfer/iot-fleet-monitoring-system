import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { websocketService } from '../services/websocket.service';
import { LogIn, Loader2 } from 'lucide-react';
  // Página de inicio de sesión
const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
    // Establecer autenticación
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Iniciar sesión
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Iniciar sesión
    try {
      const response = await authService.login({ email, password });
      setAuth(response.user, response.access_token);
      
      // Conectar WebSocket
      websocketService.connect(response.access_token);
        // Esperar un momento a que se conecte
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };
  // Mostrar página de inicio de sesión
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IoT Fleet Monitoring</h1>
          <p className="text-gray-600 mt-2">Inicia sesión en tu cuenta</p>
        </div>
        {/* Formulario de inicio de sesión */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {/* Campos de inicio de sesión */}
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="admin@test.com"
              required
              disabled={loading}
            />
          </div>
            {/* Campos de inicio de sesión */}
          <div>
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
            {/* Botón de inicio de sesión */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
              {/* Botón para cerrar sesión */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Credenciales de prueba */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Credenciales de prueba:</p>
          <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
            <p><strong>Admin:</strong> admin@test.com / admin123</p>
            <p><strong>User:</strong> user@test.com / user123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
