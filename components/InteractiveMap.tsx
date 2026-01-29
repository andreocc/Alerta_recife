
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FloodHistory } from '../types';

interface InteractiveMapProps {
  history: FloodHistory[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ history }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-8.0578, -34.8829], // Recife center
        zoom: 13,
        zoomControl: false,
      });

      // Add zoom control to a different position
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Use a clean, gray-styled tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // Clear existing markers before adding new ones
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for flood history
    history.forEach((event) => {
      const color = event.severity === 'severe' ? '#ef4444' : '#f97316';
      
      const markerHtml = `
        <div style="
          background-color: ${color};
          width: 14px;
          height: 14px;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        "></div>
      `;

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: markerHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <p style="margin: 0; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8;">${event.date} • ${event.time}</p>
          <p style="margin: 4px 0; font-size: 13px; font-weight: 700; color: #1e293b;">${event.areas.join(', ')}</p>
          <div style="display: flex; align-items: center; gap: 4px; margin-top: 6px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${event.severity === 'severe' ? '#fee2e2' : '#ffedd5'}; color: ${color};">
              ${event.severity === 'severe' ? 'GRAVE' : 'MODERADO'}
            </span>
            <span style="font-size: 10px; font-weight: 600; color: #64748b;">Causa: ${event.cause === 'both' ? 'Chuva + Maré' : event.cause === 'rain' ? 'Chuva' : 'Maré'}</span>
          </div>
        </div>
      `;

      L.marker([event.lat, event.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, {
          className: 'custom-popup',
          closeButton: false,
          offset: [0, -5]
        });
    });

    // Optional: Add some "High Risk" zones (areas below sea level)
    const riskZones = [
      { center: [-8.064, -34.872], radius: 400, name: 'Bairro do Recife' },
      { center: [-8.053, -34.887], radius: 600, name: 'Agamenon Magalhães' }
    ];

    riskZones.forEach(zone => {
      L.circle(zone.center as L.LatLngExpression, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.05,
        weight: 1,
        dashArray: '5, 5',
        radius: zone.radius
      }).addTo(map);
    });

  }, [history]);

  return (
    <div ref={mapContainerRef} className="h-full w-full bg-slate-100" />
  );
};
