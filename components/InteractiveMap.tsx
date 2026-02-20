
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FloodHistory, RiskZone, RiskLevel } from '../types';

interface InteractiveMapProps {
  history: FloodHistory[];
  riskZones: RiskZone[];
  onSelectEvent: (event: FloodHistory | RiskZone) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ history, riskZones, onSelectEvent }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const getColor = (level: RiskLevel) => {
    switch(level) {
      case 'extremo': return '#9333ea'; // Purple 600
      case 'crítico': return '#ef4444'; // Red 500
      case 'alto': return '#f97316';    // Orange 500
      case 'médio': return '#f59e0b';   // Amber 500
      case 'baixo': return '#10b981';   // Emerald 500
      default: return '#3b82f6';        // Blue 500
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-8.0578, -34.8829],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }

    const map = mapRef.current;
    
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polygon) map.removeLayer(layer);
    });

    riskZones.forEach(zone => {
      const color = getColor(zone.level);
      L.polygon(zone.polygon as any, { 
        color, 
        fillColor: color,
        fillOpacity: 0.25, 
        weight: 3,
        dashArray: zone.level === 'extremo' || zone.level === 'crítico' ? '5, 10' : ''
      }).addTo(map).on('click', () => onSelectEvent(zone));
    });

    history.forEach(event => {
      const color = event.severity === 'severe' ? '#ef4444' : '#f97316';
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color}; width:18px; height:18px; border:3px solid white; border-radius:50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);"></div>`,
        iconSize: [18, 18],
      });
      L.marker([event.lat, event.lng], { icon }).addTo(map).on('click', () => onSelectEvent(event));
    });

    map.invalidateSize();
  }, [history, riskZones, onSelectEvent]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};
