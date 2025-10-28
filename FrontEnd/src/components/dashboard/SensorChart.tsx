import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { SensorData } from '../../type';

interface SensorChartProps {
  data: SensorData[];
}

const SensorChart = ({ data }: SensorChartProps) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Sin datos para graficar</p>
      </div>
    );
  }

  const chartData = [...data].reverse().slice(0, 10).map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    combustible: Number(item.fuelLevel) || 0,
    temperatura: Number(item.temperature) || 0,
    velocidad: Number(item.speed) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Gráfico de Combustible */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-3">⛽ Nivel de Combustible</h4>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value.toFixed(1)} L`, 'Combustible']}
            />
            <Area 
              type="monotone" 
              dataKey="combustible" 
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorFuel)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Temperatura */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-3">🌡️ Temperatura del Motor</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#9ca3af"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value.toFixed(1)} °C`, 'Temperatura']}
            />
            <Line 
              type="monotone" 
              dataKey="temperatura" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={{ fill: '#f97316', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorChart;
