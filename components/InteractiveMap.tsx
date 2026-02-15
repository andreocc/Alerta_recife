
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
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    }

    const map = mapRef.current;
    
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polygon) map.removeLayer(layer);
    });

    riskZones.forEach(zone => {
      const color = zone.level === 'critical' ? '#ef4444' : zone.level === 'high' ? '#f97316' : '#3b82f6';
      L.polygon(zone.polygon as any, { color, fillOpacity: 0.2, weight: 2 }).addTo(map).on('click', () => onSelectEvent(zone));
    });

    history.forEach(event => {
      const color = event.severity === 'severe' ? '#ef4444' : '#f97316';
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color}; width:16px; height:16px; border:2px solid white; border-radius:50%;"></div>`,
        iconSize: [16, 16],
      });
      L.marker([event.lat, event.lng], { icon }).addTo(map).on('click', () => onSelectEvent(event));
    });

    map.invalidateSize();
  }, [history, riskZones, onSelectEvent]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};
