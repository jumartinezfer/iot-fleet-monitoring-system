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

// Página principal del dashboard
const Dashboard = () => {
  const { user } = useAuthStore();
  const { devices, setDevices } = useDevicesStore();
  const { sensorData, alerts, addSensorData, addAlert, setAlerts, setSensorData } = useSensorsStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    // Cargar datos
  useEffect(() => {
    if (!user) {
      console.warn('Usuario no encontrado, redirigiendo al login');
      window.location.href = '/login';
      return;
    }
    loadData();
    setupWebSocket();
  }, [user]);
    // Función para cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Cargando datos del dashboard...');
        // Obtener datos de los dispositivos
      const devicesData = await devicesService.getAll();
      console.log('✅ Dispositivos cargados:', devicesData);
      setDevices(devicesData || []);
        // Obtener datos de los sensores
      if (devicesData && devicesData.length > 0) {
        try {
          const latestData = await sensorsService.getLatestData(
            devicesData[0].deviceId,
            20
          );
          console.log('✅ Datos de sensores recibidos:', latestData);
            // Preparar datos para el gráfico
          if (latestData && Array.isArray(latestData)) {
            const parsedData = latestData.map(item => ({
              ...item,
              latitude: Number(item.latitude) || 0,
              longitude: Number(item.longitude) || 0,
              fuelLevel: Number(item.fuelLevel) || 0,
              temperature: Number(item.temperature) || 0,
              speed: Number(item.speed) || 0,
              fuelConsumptionRate: Number(item.fuelConsumptionRate) || 0,
            }));
            // Actualizar datos de sensores
            setSensorData(parsedData);
          }
        } catch (sensorErr: any) {
          console.log('⚠️ No hay datos de sensores:', sensorErr.message);
        }
      }
        // Obtener alertas
      if (user?.role === 'admin') {
        try {
          const alertsData = await sensorsService.getActiveAlerts();
          console.log('✅ Alertas cargadas:', alertsData);
          setAlerts(alertsData || []);
        } catch (alertErr: any) {
          console.log('⚠️ No hay alertas:', alertErr.message);
        }
      }
        // Mostrar mensaje de éxito
      console.log('✅ Dashboard cargado exitosamente');
    } catch (err: any) {
      console.error('❌ Error al cargar dashboard:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };
    // Configurar WebSocket
  const setupWebSocket = () => {
    try {
      console.log('🌐 Configurando WebSocket...');
        // Evento de nueva data
      websocketService.onSensorData((data) => {
        console.log('📡 WebSocket - Nueva data:', data);
        const parsedData = {
          ...data,
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          fuelLevel: Number(data.fuelLevel),
          temperature: Number(data.temperature),
          speed: Number(data.speed),
          fuelConsumptionRate: Number(data.fuelConsumptionRate),
        };
        // Añadir datos de sensores
        addSensorData(parsedData as any);
      });
        // Evento de nueva alerta
      if (user?.role === 'admin') {
        websocketService.onAlert((alert) => {
          console.log('🚨 WebSocket - Nueva alerta:', alert);
          addAlert(alert);
        });
      }
      // Evento de error
    } catch (err) {
      console.error('❌ Error configurando WebSocket:', err);
    }
  };
    // Mostrar cargando
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={56} />
          <p className="text-lg font-semibold text-gray-700">Cargando dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espera</p>
        </div>
      </div>
    );
  }
    // Mostrar error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <AlertTriangle className="text-red-600 mr-3" size={28} />
            <h3 className="text-xl font-bold text-red-900">Error al cargar el dashboard</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button onClick={loadData} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }
    // Datos más recientes
  const latestSensorData = sensorData && sensorData.length > 0 ? sensorData[0] : null;

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-2xl shadow-2xl p-6 lg:p-8 text-white">
        <h2 className="text-2xl lg:text-4xl font-bold mb-2">📊 Dashboard de Monitoreo IoT</h2>
        <p className="text-blue-100 text-sm lg:text-base">
          Bienvenido, <span className="font-semibold">{user?.name}</span>! • 
          <span className="bg-white/20 px-3 py-1 rounded-full ml-2">
            {user?.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
          </span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium uppercase">Dispositivos</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{devices?.length || 0}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Activity className="text-blue-600" size={32} />
            </div>
          </div>
        </div>
            {/* Gráfico de alertas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium uppercase">Alertas</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{alerts?.length || 0}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>
        </div>
            {/* Gráfico de combustible */}
        {latestSensorData && (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium uppercase">Combustible</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {latestSensorData.fuelLevel.toFixed(1)} <span className="text-lg text-gray-500">L</span>
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <Fuel className="text-green-600" size={32} />
                </div>
              </div>
            </div>
            {/* Gráfico de temperatura */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium uppercase">Temperatura</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {latestSensorData.temperature.toFixed(1)} <span className="text-lg text-gray-500">°C</span>
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Thermometer className="text-orange-600" size={32} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Mapa y Gráficos */}
      {sensorData && sensorData.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Mapa - 2 columnas */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Navigation size={24} className="text-blue-600" />
                  Ubicación en Tiempo Real
                </h3>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-4 py-2 rounded-full inline-flex items-center gap-2 w-fit">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  En vivo
                </span>
              </div>
              <MapView data={sensorData} />
            </div>
          </div>

          {/* Gráficos - 1 columna */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={24} className="text-blue-600" />
                Tendencias
              </h3>
              <SensorChart data={sensorData} />
            </div>
          </div>
        </div>
      )}

      {/* Tabla de datos */}
      {sensorData && sensorData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <h3 className="text-xl font-bold text-gray-900">📊 Últimos Registros</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Combustible</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Temperatura</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Velocidad</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Estado</th>
                </tr>
              </thead>
              {/* Datos de sensores */}
              <tbody className="bg-white divide-y divide-gray-200">
                {sensorData.slice(0, 8).map((data, index) => (
                  <tr key={data.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(data.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-bold text-green-600">{data.fuelLevel.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">L</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-bold text-orange-600">{data.temperature.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">°C</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="font-bold text-blue-600">{data.speed.toFixed(0)}</span>
                      <span className="text-gray-500 ml-1">km/h</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {data.alert ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          ⚠️ Alerta
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                          ✅ Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alertas Admin */}
      {user?.role === 'admin' && alerts && alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border-l-4 border-red-500 overflow-hidden">
          <div className="px-6 py-5 bg-red-50 border-b">
            <h3 className="text-xl font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle size={24} />
              Alertas Recientes (Administrador)
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-4 p-5 bg-red-50 border-l-4 border-red-500 rounded-lg hover:shadow-md transition">
                <div className="bg-red-100 p-3 rounded-full flex-shrink-0">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 text-lg">{alert.message}</p>
                  <p className="text-sm text-red-700 mt-2">
                    <span className="font-semibold">Device:</span> {alert.deviceId} • 
                    <span className="font-semibold"> Combustible:</span> {Number(alert.fuelLevel).toFixed(1)} L
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    📅 {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sin datos */}
      {(!sensorData || sensorData.length === 0) && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-purple-300">
          <Activity className="mx-auto text-purple-600 mb-6" size={72} />
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Sin datos de sensores</h3>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            {devices && devices.length > 0 
              ? 'Envía datos desde tus dispositivos IoT para ver información en tiempo real'
              : 'Primero crea un dispositivo IoT'}
          </p>
          {(!devices || devices.length === 0) && (
            <a href="/devices" className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition text-lg">
              🚗 Crear Primer Dispositivo
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
