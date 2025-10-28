import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SensorData } from '../../type';

interface SensorChartProps {
  data: SensorData[];
}
// Componente para visualizar gráficas de datos de sensores
const SensorChart = ({ data }: SensorChartProps) => {
  // Preparar datos para las gráficas
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      // No hay datos para graficar
      return [];
    }

    console.log('Preparando datos para gráficas. Total:', data.length);

    // Tomar los últimos 20 registros y ordenarlos cronológicamente
    const processedData = [...data]
      .slice(0, 20) // Últimos 20
      .reverse() // Del más antiguo al más reciente
      .map((item, index) => {
        const timestamp = new Date(item.timestamp);
        return {
          index: index + 1,
          time: timestamp.toLocaleTimeString('es-ES', { // Formato de hora
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          fullTime: timestamp.toLocaleString('es-ES'),
          combustible: Number(item.fuelLevel) || 0,
          temperatura: Number(item.temperature) || 0,
          velocidad: Number(item.speed) || 0,
          consumo: Number(item.fuelConsumptionRate) || 0,
        };
      });

    // procesa los datos para las gráficas
    return processedData;
  }, [data]);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">📊 Sin datos para graficar</p>
          <p className="text-gray-400 text-sm">
            Envía datos desde tus dispositivos IoT para ver las gráficas
          </p>
        </div>
      </div>
    );
  }
  // Si no hay datos para graficar, mostrar mensaje de cargando
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Procesando datos...</p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return ( // Si hay datos para mostrar
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {payload[0]?.payload?.fullTime}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <strong>{entry.value.toFixed(2)}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  // Mostrar gráficas de combustible y temperatura
  return (
    <div className="space-y-8">
      {/* Gráfica de Combustible */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          ⛽ Nivel de Combustible
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              label={{ value: 'Litros (L)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="combustible"
              stroke="#eab308"
              strokeWidth={3}
              dot={{ r: 5, fill: '#eab308' }}
              activeDot={{ r: 7 }}
              name="Combustible (L)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de Temperatura */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🌡️ Temperatura del Motor
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              label={{ value: 'Grados (°C)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperatura"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ r: 5, fill: '#f97316' }}
              activeDot={{ r: 7 }}
              name="Temperatura (°C)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de Velocidad y Consumo */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🚀 Velocidad y Consumo
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              stroke="#3b82f6"
              label={{ value: 'Velocidad (km/h)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              stroke="#10b981"
              label={{ value: 'Consumo (L/h)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="velocidad"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5, fill: '#3b82f6' }}
              activeDot={{ r: 7 }}
              name="Velocidad (km/h)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="consumo"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 5, fill: '#10b981' }}
              activeDot={{ r: 7 }}
              name="Consumo (L/h)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen estadístico */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-xs text-yellow-600 font-medium">COMBUSTIBLE PROMEDIO</p>
          <p className="text-2xl font-bold text-yellow-700">
            {(chartData.reduce((acc, curr) => acc + curr.combustible, 0) / chartData.length).toFixed(1)} L
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-600 font-medium">TEMPERATURA PROMEDIO</p>
          <p className="text-2xl font-bold text-orange-700">
            {(chartData.reduce((acc, curr) => acc + curr.temperatura, 0) / chartData.length).toFixed(1)} °C
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium">VELOCIDAD PROMEDIO</p>
          <p className="text-2xl font-bold text-blue-700">
            {(chartData.reduce((acc, curr) => acc + curr.velocidad, 0) / chartData.length).toFixed(0)} km/h
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-xs text-green-600 font-medium">CONSUMO PROMEDIO</p>
          <p className="text-2xl font-bold text-green-700">
            {(chartData.reduce((acc, curr) => acc + curr.consumo, 0) / chartData.length).toFixed(2)} L/h
          </p>
        </div>
      </div>
    </div>
  );
};

export default SensorChart;
