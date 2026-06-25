import React, { useEffect, useRef, useMemo } from 'react';
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
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const historyLayerRef = useRef<L.LayerGroup | null>(null);

  const getColor = (level: RiskLevel) => {
    switch(level) {
      case 'extremo': return '#9333ea'; // Purple 600
      case 'crítico': return '#ef4444'; // Red 500
      case 'alto': return '#f97316';    // Orange 500
      case 'médio': return '#f59e0b';   // Amber 500
      case 'baixo': return '#10b981';   // Emerald 500
      default: return '#3b82f6';        // Blue 600
    }
  };

  // Memoize formatted data to prevent unnecessary map updates
  const formattedZones = useMemo(() => {
    return riskZones.map(zone => ({
      ...zone,
      latLngs: zone.polygon.map(coord => [coord[0], coord[1]] as L.LatLngTuple)
    }));
  }, [riskZones]);

  const formattedHistory = useMemo(() => {
    return history.map(event => ({
      ...event,
      position: [event.lat, event.lng] as L.LatLngTuple
    }));
  }, [history]);

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

    // Initialize layer groups if they don't exist
    if (!zonesLayerRef.current) {
      zonesLayerRef.current = L.layerGroup().addTo(map);
    }
    if (!historyLayerRef.current) {
      historyLayerRef.current = L.layerGroup().addTo(map);
    }

    const zonesLayer = zonesLayerRef.current;
    const historyLayer = historyLayerRef.current;

    // Clear existing layers efficiently
    zonesLayer.clearLayers();
    historyLayer.clearLayers();

    // Add risk zones
    formattedZones.forEach(zone => {
      const color = getColor(zone.level);
      L.polygon(zone.latLngs, {
        color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 3,
        dashArray: zone.level === 'extremo' || zone.level === 'crítico' ? '5, 10' : ''
      }).addTo(zonesLayer).on('click', () => onSelectEvent(zone));
    });

    // Add history events
    formattedHistory.forEach(event => {
      const color = event.severity === 'severe' ? '#ef4444' : '#f97316';
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color}; width:18px; height:18px; border:3px solid white; border-radius:50%; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);"></div>`,
        iconSize: [18, 18],
      });
      L.marker(event.position, { icon }).addTo(historyLayer).on('click', () => onSelectEvent(event));
    });

    // Use requestAnimationFrame for smoother size recalculation
    requestAnimationFrame(() => {
      map.invalidateSize();
    });
  }, [formattedZones, formattedHistory, onSelectEvent]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
};
