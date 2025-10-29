import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SensorData } from '../../type.ts';

interface MapViewProps {
  data: SensorData[];
  selectedDeviceId?: string;
}
// Componente para visualizar mapa de datos de sensores
const MapView = ({ data }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  // Validar datos
  if (!data || !Array.isArray(data)) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <p className="text-gray-500">No hay datos para mostrar en el mapa</p>
      </div>
    );
  }

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [-16.2546, 28.4682],
        zoom: 10,
      });
      // Agregar control de navegación
      map.current.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
        }),
        'top-right'
      );
      // Agregar control de escala
      map.current.addControl(
        new maplibregl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        }),
        'bottom-left'
      );
      // Agregar control de zoom
      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
      });
      // Mostrar error en caso de error
      map.current.on('error', (e) => {
        console.error('MapLibre error:', e);
        setMapError('Error al cargar el mapa');
      });
      
    } catch (error) {
      console.error('Error inicializando mapa:', error);
      setMapError('Error al inicializar el mapa');
    }
    // Limpiar mapa cuando se desconecte
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Actualizar marcadores cuando cambian los datos
  useEffect(() => {
    if (!map.current || !mapLoaded || !data || data.length === 0) return;

    console.log('🗺️ Actualizando marcadores con datos:', data);

    try {
      // Obtener IDs actuales
      const currentDeviceIds = new Set(data.map(d => d.deviceId).filter(Boolean));
      
      // Remover marcadores que ya no existen
      Object.keys(markersRef.current).forEach((deviceId) => {
        if (!currentDeviceIds.has(deviceId)) {
          markersRef.current[deviceId].remove();
          delete markersRef.current[deviceId];
        }
      });

      // Actualizar o crear marcadores
      data.forEach((item, index) => {
        if (!item || typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
          return;
        }
        // Obtener marcador existente o crear uno nuevo
        const { latitude, longitude, deviceId, alert } = item;
        const hasAlerts = alert && alert.length > 0;
        const color = hasAlerts ? '#ef4444' : '#3b82f6'; // Rojo si hay alertas, azul normal

        // Si el marcador ya existe, actualizarlo
        if (deviceId && markersRef.current[deviceId]) {
          const marker = markersRef.current[deviceId];
          const currentLngLat = marker.getLngLat();
          
          // Actualizar posición si cambió
          if (currentLngLat.lat !== latitude || currentLngLat.lng !== longitude) {
            marker.setLngLat([longitude, latitude]);
          }
          
          // Actualizar color del elemento HTML del marcador
          const markerElement = marker.getElement();
          markerElement.style.backgroundColor = color;
          
          // Actualizar popup del marcador en el mapa
          const popupContent = `
            <div style="padding: 12px; font-family: system-ui;">
              <div style="font-weight: bold; margin-bottom: 8px;">📍 Vehículo ${deviceId}</div>
              <div style="font-size: 14px; line-height: 1.6;">
                <div>⛽ Combustible: <strong>${Number(item.fuelLevel).toFixed(1)} L</strong></div>
                <div>🌡️ Temperatura: <strong>${Number(item.temperature).toFixed(1)} °C</strong></div>
                <div>🚀 Velocidad: <strong>${Number(item.speed).toFixed(0)} km/h</strong></div>
                <div>⏰ Hora: ${new Date(item.timestamp).toLocaleTimeString()}</div>
                ${hasAlerts ? `<div style="color: #ef4444; font-weight: bold; margin-top: 8px;">⚠️ ${alert}</div>` : ''}
              </div>
            </div>
          `;
          marker.setPopup(
            new maplibregl.Popup({ offset: 30, maxWidth: '300px' }).setHTML(popupContent)
          );
          
        } else {
          // Crear nuevo marcador
          const el = document.createElement('div');
          el.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: ${color};
            border: 4px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: all 0.3s ease;
          `;
          // Si es el primer marcador, agregar un icono
          if (index === 0) {
            el.innerHTML = '🚗';
            el.style.fontSize = '20px';
          }
          // Crear contenido del popup
          const popupContent = `
            <div style="padding: 12px; font-family: system-ui;">
              <div style="font-weight: bold; margin-bottom: 8px;">📍 Vehículo ${deviceId || 'Desconocido'}</div>
              <div style="font-size: 14px; line-height: 1.6;">
                <div>⛽ Combustible: <strong>${Number(item.fuelLevel).toFixed(1)} L</strong></div>
                <div>🌡️ Temperatura: <strong>${Number(item.temperature).toFixed(1)} °C</strong></div>
                <div>🚀 Velocidad: <strong>${Number(item.speed).toFixed(0)} km/h</strong></div>
                <div>⏰ Hora: ${new Date(item.timestamp).toLocaleTimeString()}</div>
                ${hasAlerts ? `<div style="color: #ef4444; font-weight: bold; margin-top: 8px;">⚠️ ${alert}</div>` : ''}
              </div>
            </div>
          `;
          // Crear marcador en el mapa
          const popup = new maplibregl.Popup({
            offset: 30,
            closeButton: true,
            closeOnClick: false,
            maxWidth: '300px'
          }).setHTML(popupContent);
          // Crear marcador
          const marker = new maplibregl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(popup)
            .addTo(map.current!);
          // Agregar marcador al mapa
          if (deviceId) {
            markersRef.current[deviceId] = marker;
          }
          // Mostrar popup si es el primer marcador
          if (index === 0) {
            setTimeout(() => marker.togglePopup(), 500);
          }
        }
      });

      // Ajustar vista si hay datos
      if (data.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        data.forEach((item) => {
          if (item && typeof item.latitude === 'number' && typeof item.longitude === 'number') {
            bounds.extend([item.longitude, item.latitude]);
          }
        });
        // Ajustar vista al mapa
        map.current.fitBounds(bounds, {
          padding: 80,
          maxZoom: 14,
          duration: 1000
        });
      }
      // Mostrar mensaje de actualización de marcadores

    } catch (error) {
      console.error('Error actualizando marcadores:', error);
    }
  }, [data, mapLoaded]);
  // Si hay un error al cargar el mapa, mostrar mensaje de error
  if (mapError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-lg p-8">
        <div className="text-red-500 text-xl mb-2">⚠️ Error al cargar el mapa</div>
        <p className="text-gray-600">{mapError}</p>
      </div>
    );
  }
  // Mostrar mapa
  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg shadow-lg"
      style={{ minHeight: '400px' }}
    />
  );
};

export default MapView;
