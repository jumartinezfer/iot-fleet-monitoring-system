import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SensorData } from '../../type.ts';

interface MapViewProps {
  data: SensorData[];
  selectedDeviceId?: string;
}

const MapView = ({ data }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  // Validar datos
  if (!data || !Array.isArray(data)) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-gray-100 rounded-xl">
        <p className="text-gray-500">No hay datos para mostrar en el mapa</p>
      </div>
    );
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [-16.2546, 28.4682],
        zoom: 10,
      });

      map.current.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
        }), 
        'top-right'
      );

      map.current.addControl(
        new maplibregl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        }),
        'bottom-left'
      );

      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('MapLibre error:', e);
        setMapError('Error al cargar el mapa');
      });

    } catch (error) {
      console.error('Error inicializando mapa:', error);
      setMapError('Error al inicializar el mapa');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || !data || data.length === 0) return;

    try {
      // Limpiar marcadores antiguos
      Object.values(markersRef.current).forEach((marker) => {
        try {
          marker.remove();
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      markersRef.current = {};

      // Agregar nuevos marcadores
      data.forEach((item, index) => {
        if (!item || typeof item.latitude !== 'number' || typeof item.longitude !== 'number') {
          return;
        }

        const el = document.createElement('div');
        el.style.cssText = `
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${item.alert ? '#ef4444' : '#3b82f6'};
          border: 4px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.3s ease;
        `;
        
        if (index === 0) {
          el.innerHTML = '🚗';
          el.style.fontSize = '20px';
        }

        const popupContent = `
          <div style="padding: 12px; font-family: system-ui; min-width: 220px;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 12px; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
              📍 Datos del Vehículo
            </div>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 13px;">⛽ Combustible:</span>
                <span style="font-weight: 600; color: #059669; font-size: 14px;">${Number(item.fuelLevel).toFixed(1)} L</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 13px;">🌡️ Temperatura:</span>
                <span style="font-weight: 600; color: #ea580c; font-size: 14px;">${Number(item.temperature).toFixed(1)} °C</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 13px;">🚀 Velocidad:</span>
                <span style="font-weight: 600; color: #2563eb; font-size: 14px;">${Number(item.speed).toFixed(0)} km/h</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-size: 13px;">⏰ Hora:</span>
                <span style="font-weight: 600; color: #4b5563; font-size: 13px;">${new Date(item.timestamp).toLocaleTimeString()}</span>
              </div>
              ${item.alert ? `
                <div style="margin-top: 8px; padding: 8px; background-color: #fee2e2; border-radius: 6px; border-left: 3px solid #ef4444;">
                  <div style="color: #991b1b; font-weight: bold; font-size: 12px;">⚠️ ALERTA</div>
                  <div style="color: #7f1d1d; font-size: 11px; margin-top: 4px;">${item.alert}</div>
                </div>
              ` : ''}
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ 
          offset: 30,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px'
        }).setHTML(popupContent);

        const marker = new maplibregl.Marker(el)
          .setLngLat([item.longitude, item.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current[item.id] = marker;

        if (index === 0) {
          setTimeout(() => marker.togglePopup(), 500);
        }
      });

      // Ajustar vista
      if (data.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        data.forEach((item) => {
          if (item && typeof item.latitude === 'number' && typeof item.longitude === 'number') {
            bounds.extend([item.longitude, item.latitude]);
          }
        });
        
        map.current.fitBounds(bounds, { 
          padding: 80,
          maxZoom: 14,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Error actualizando marcadores:', error);
    }
  }, [data, mapLoaded]);

  if (mapError) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-red-50 rounded-xl border-2 border-red-200">
        <div className="text-center p-6">
          <p className="text-red-600 font-semibold mb-2">⚠️ Error al cargar el mapa</p>
          <p className="text-red-500 text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-gray-200"
    />
  );
};

export default MapView;
