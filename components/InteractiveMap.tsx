
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FloodHistory, RiskZone } from '../types';

interface InteractiveMapProps {
  history: FloodHistory[];
  riskZones: RiskZone[];
  onSelectEvent: (event: FloodHistory | RiskZone) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ history, riskZones, onSelectEvent }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-8.0578, -34.8829],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO'
      }).addTo(mapRef.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    
    // Limpar camadas anteriores
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polygon) {
        map.removeLayer(layer);
      }
    });

    // Adicionar Polígonos de Risco
    riskZones.forEach(zone => {
      const color = zone.level === 'critical' ? '#ef4444' : zone.level === 'high' ? '#f97316' : '#3b82f6';
      const polygon = L.polygon(zone.polygon as any, {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map);
      
      polygon.on('click', () => onSelectEvent(zone));
    });

    // Adicionar Histórico (Markers)
    history.forEach(event => {
      const color = event.severity === 'severe' ? '#ef4444' : '#f97316';
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color}; width:12px; height:12px; border:2px solid white; border-radius:50%; box-shadow:0 0 10px rgba(0,0,0,0.2);"></div>`,
        iconSize: [12, 12]
      });

      L.marker([event.lat, event.lng], { icon })
        .addTo(map)
        .on('click', () => onSelectEvent(event));
    });

  }, [history, riskZones, onSelectEvent]);

  return <div ref={mapContainerRef} className="h-full w-full bg-slate-100" />;
};
