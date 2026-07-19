import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PlasticRequest } from '../types';

interface MapViewerProps {
  requests: PlasticRequest[];
  onMarkerClick?: (request: PlasticRequest) => void;
  center?: [number, number];
  zoom?: number;
  highlightedRequestId?: string;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  requests,
  onMarkerClick,
  center = [19.0760, 72.8777],
  zoom = 12,
  highlightedRequestId
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    // Reset Default Leaflet Icons to load properly in Vite
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    if (mapRef.current && !leafletMap.current) {
      const map = L.map(mapRef.current).setView(center, zoom);
      leafletMap.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Sync markers when requests list changes
  useEffect(() => {
    if (leafletMap.current && markersGroupRef.current) {
      const map = leafletMap.current;
      const markersGroup = markersGroupRef.current;

      markersGroup.clearLayers();

      if (requests.length === 0) return;

      const bounds = L.latLngBounds([]);

      requests.forEach((req) => {
        const coords = req.location.coordinates;
        // Mongo stores [longitude, latitude], Leaflet needs [latitude, longitude]
        if (!coords || coords.length !== 2) return;
        const latLng: [number, number] = [coords[1], coords[0]];

        bounds.extend(latLng);

        // Status-based color code matching the design checklist
        let color = '#3b82f6'; // Blue: Accepted
        if (req.status === 'pending') color = '#ef4444'; // Red: Pending
        if (req.status === 'picked_up') color = '#eab308'; // Yellow: Picked Up
        if (req.status === 'received' || req.status === 'recycled') color = '#10b981'; // Emerald Green: Completed

        const customDotIcon = L.divIcon({
          className: 'custom-dot-icon',
          html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.35); transition: transform 0.2s;" class="hover:scale-125"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker(latLng, { icon: customDotIcon }).addTo(markersGroup);

        const shortAddress = req.location.address.split(',').slice(0, 2).join(',');
        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; padding: 4px; color: #334155; line-height: 1.4;">
            <div style="font-weight: 700; color: #1e293b; font-size: 13px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 6px;">
              ${req.wasteCategory}
            </div>
            <div style="margin-bottom: 2px;">Weight: <strong style="color: #0f172a;">${req.estimatedWeight} kg</strong></div>
            <div style="margin-bottom: 4px;">Status: <span style="text-transform: uppercase; font-weight: 700; font-size: 10px; color: ${color}">${req.status.replace('_', ' ')}</span></div>
            <div style="font-size: 10px; color: #64748b; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
              ${shortAddress}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(req);
          });
        }

        // Open popup automatically if it's the highlighted request
        if (highlightedRequestId && req._id === highlightedRequestId) {
          setTimeout(() => {
            marker.openPopup();
            map.setView(latLng, 14);
          }, 100);
        }
      });

      // Fit bounds if showing multiple points
      if (requests.length > 1 && !highlightedRequestId) {
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (requests.length === 1 && !highlightedRequestId) {
        const singleCoords = requests[0].location.coordinates;
        map.setView([singleCoords[1], singleCoords[0]], 13);
      }
    }
  }, [requests, highlightedRequestId]);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div ref={mapRef} className="h-full w-full relative z-10" />
    </div>
  );
};
