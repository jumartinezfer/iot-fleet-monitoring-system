import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mt-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 mt-2 mb-8">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          to="/dashboard"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <Home size={20} />
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
