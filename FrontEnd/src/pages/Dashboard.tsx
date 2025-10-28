import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDevicesStore } from '../store/devicesStore';
import { useSensorsStore } from '../store/sensorsStore';
import { devicesService } from '../services/devices.service';
import { sensorsService } from '../services/sensors.service';
import { websocketService } from '../services/websocket.service';
import MapView from '../components/map/MapView';
import SensorChart from '../components/dashboard/SensorChart';
import { AlertTriangle, Activity, Thermometer, Fuel, Loader2, TrendingUp, Navigation } from 'lucide-react';
import type { Alert } from '../type';
// Página principal del dashboard
const Dashboard = () => {
  const { user } = useAuthStore();
  const { devices, setDevices } = useDevicesStore();
  const { sensorData, alerts, addSensorData, addAlert, setAlerts, setSensorData, getMapData } = useSensorsStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Inicializar datos del dashboard
  useEffect(() => {
    if (!user) {
      console.warn('Usuario no encontrado, redirigiendo al login');
      window.location.href = '/login';
      return;
    }
    // Cargar datos del dashboard
    const initialize = async () => {
      await loadData();

      // Conectar WebSocket con el token del usuario
      const token = localStorage.getItem('token');
      if (token) {
        console.log('🔐 Token encontrado, conectando WebSocket...');
        websocketService.connect(token);

        // Esperar un momento a que se conecte
        setTimeout(() => {
          setupWebSocket();
        }, 500);
      } else {
        
        console.error('No hay token disponible para WebSocket');
      }
    };

    initialize();

    // Cleanup: desconectar al salir
    return () => {
      console.log('🔌 Limpiando conexión WebSocket...');
      websocketService.disconnect();
    };
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Cargando datos del dashboard...');

      // Verificar si hay datos persistidos en el store
      if (sensorData.length > 0) {
        console.log('Datos recuperados del store persistido:', sensorData.length, 'items');
      }
      // Obtener datos de dispositivos
      const devicesData = await devicesService.getAll();
      console.log('Dispositivos cargados:', devicesData);
      setDevices(devicesData || []);
      // Obtener datos de sensores
      if (devicesData && devicesData.length > 0) {
        try {
          const latestData = await sensorsService.getLatestData(
            devicesData[0].deviceId,
            20
          );
          console.log('Datos de sensores recibidos:', latestData);
          // Si hay datos, procesarlos
          if (latestData && Array.isArray(latestData) && latestData.length > 0) {
            const parsedData = latestData.map((item) => ({
              ...item,
              deviceId: item.deviceId || devicesData[0].deviceId,
              latitude: Number(item.latitude) || 0,
              longitude: Number(item.longitude) || 0,
              fuelLevel: Number(item.fuelLevel) || 0,
              temperature: Number(item.temperature) || 0,
              speed: Number(item.speed) || 0,
              fuelConsumptionRate: Number(item.fuelConsumptionRate) || 0,
            }));
            setSensorData(parsedData);
          }
        } catch (sensorErr: any) {
          console.log('No hay datos de sensores:', sensorErr.message);
        }
      }
      // Obtener alertas
      if (user?.role === 'admin') {
        try {
          const alertsData = await sensorsService.getActiveAlerts();
          console.log('Alertas cargadas:', alertsData);
          setAlerts(alertsData || []);
        } catch (alertErr: any) {
          console.log('⚠️ No hay alertas:', alertErr.message);
        }
      }
      // Mostrar mensaje de cargado
      console.log('Dashboard cargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error al cargar dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    try {
      console.log('🌐 Configurando listeners de WebSocket...');

      // Verificar que esté conectado
      if (!websocketService.isConnected()) {
        console.warn('⚠️ WebSocket aún no está conectado. Reintentando en 1s...');
        setTimeout(setupWebSocket, 1000);
        return;
      }

      console.log('WebSocket conectado, configurando listeners...');

      // Manejar datos de sensores en tiempo real
      websocketService.onSensorData((data) => {
        console.log('📡 WebSocket - Nueva data recibida:', data);

        // Crear objeto completo con deviceId
        const sensorDataWithDevice = {
          ...data,
          deviceId: data.deviceId,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          fuelLevel: Number(data.fuelLevel),
          temperature: Number(data.temperature),
          speed: Number(data.speed),
          fuelConsumptionRate: Number(data.fuelConsumptionRate),
          timestamp: new Date(data.timestamp || Date.now()),
        };

        // Agregar al store (crea nuevo array, no muta)
        addSensorData(sensorDataWithDevice as any);

        console.log('Datos agregados al store');
      });

      // Manejar alertas (solo para admins)
      if (user?.role === 'admin') {
        websocketService.onAlert((alert) => {
          console.log('WebSocket - Nueva alerta:', alert);

          // También agregar al store de sensorData para actualizar el mapa
          const sensorDataFromAlert = {
            deviceId: alert.deviceId,
            latitude: Number(alert.latitude),
            longitude: Number(alert.longitude),
            fuelLevel: Number(alert.fuelLevel),
            temperature: 0,
            speed: 0,
            fuelConsumptionRate: 0,
            alert: alert.message,
            timestamp: new Date(alert.timestamp || Date.now()),
          };
          // Agregar datos de sensores al store
          addSensorData(sensorDataFromAlert as any);
          console.log('Datos de alerta agregados al mapa');

          // También agregar a la lista de alertas
          addAlert({
            ...alert,
            deviceId: alert.deviceId,
          });
        });
      }
    } catch (err) {
      console.error('Error configurando WebSocket:', err);
    }
  };
  // Si se está cargando, mostrar mensaje de cargando
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600 text-lg">Cargando dashboard...</p>
        <p className="text-gray-400 text-sm mt-2">Por favor espera</p>
      </div>
    );
  }
  // Si hay un error, mostrar mensaje de error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-red-600 text-lg font-semibold mb-2">Error al cargar el dashboard</p>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // Obtener datos para el mapa (solo último por dispositivo)
  const mapData = getMapData();
  // Obtener datos más recientes
  const latestSensorData = sensorData[0] || {
    fuelLevel: 0,
    temperature: 0,
    speed: 0,
    timestamp: new Date(),
  };
  // Mostrar dashboard
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Dashboard IoT</h1>
        <p className="text-blue-100">
          Bienvenido, {user?.name}! • {user?.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Dispositivos</p>
              <p className="text-3xl font-bold text-gray-800">{devices?.length || 0}</p>
            </div>
            <Navigation className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        {/* Alertas Panel (Admin) */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Alertas</p>
              <p className="text-3xl font-bold text-gray-800">{alerts?.length || 0}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>
        {/* Datos de sensores Panel (Admin) */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Combustible</p>
              <p className="text-3xl font-bold text-gray-800">{latestSensorData.fuelLevel.toFixed(1)} L</p>
            </div>
            <Fuel className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
        {/* Temperatura Panel (Admin) */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Temperatura</p>
              <p className="text-3xl font-bold text-gray-800">{latestSensorData.temperature.toFixed(1)} °C</p>
            </div>
            <Thermometer className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Mapa y Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapa */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-blue-500" />
            Mapa en Tiempo Real
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({mapData.length} {mapData.length === 1 ? 'dispositivo' : 'dispositivos'})
            </span>
          </h2>
          <div className="h-96">
            <MapView data={mapData} />
          </div>
        </div>

        {/* tabla de data reciente */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-green-500" />
            Datos Recientes
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({sensorData.length} registros)
            </span>
          </h2>
          <div className="overflow-auto max-h-96">
            {sensorData.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Hora</th>
                    <th className="p-2 text-left">Combustible</th>
                    <th className="p-2 text-left">Temperatura</th>
                    <th className="p-2 text-left">Velocidad</th>
                    <th className="p-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sensorData.slice(0, 20).map((data, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{new Date(data.timestamp).toLocaleTimeString()}</td>
                      <td className="p-2">{data.fuelLevel.toFixed(1)} L</td>
                      <td className="p-2">{data.temperature.toFixed(1)} °C</td>
                      <td className="p-2">{data.speed.toFixed(0)} km/h</td>
                      <td className="p-2">
                        {data.alert ? (
                          <span className="text-red-500 font-semibold">⚠️ Alerta</span>
                        ) : (
                          <span className="text-green-500">✅ Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* graficas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-purple-500" />
          Gráficas Históricas
        </h2>
        <SensorChart data={sensorData} />
      </div>

      {/* Alertas del panel (Admin) */}
      {user?.role === 'admin' && alerts && alerts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-6 h-6" />
            Alertas Activas
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({alerts.length})
            </span>
          </h2>
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert, index) => (
              <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800">{alert.message}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Device: {alert.deviceId} • Combustible: {Number(alert.fuelLevel).toFixed(1)} L
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  📅 {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* estado vacio para no mostrar datos */}
      {sensorData.length === 0 && (
        <div className="bg-gray-50 p-12 rounded-lg text-center border-2 border-dashed border-gray-300">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-500 mb-4">
            {devices && devices.length > 0
              ? 'Envía datos desde tus dispositivos IoT para ver información en tiempo real'
              : 'Primero crea un dispositivo IoT'}
          </p>
          {(!devices || devices.length === 0) && (
            <button 
              onClick={() => window.location.href = '/devices'}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              🚗 Crear Primer Dispositivo
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
