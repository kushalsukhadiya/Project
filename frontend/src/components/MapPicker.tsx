import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  defaultLocation?: [number, number]; // [lat, lng]
}

export const MapPicker: React.FC<MapPickerProps> = ({ 
  onLocationSelect, 
  defaultLocation = [19.0760, 72.8777] // Default Mumbai coordinates
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    // Reset Default Leaflet Icons to load properly in Vite
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    if (mapRef.current && !leafletMap.current) {
      // Create map
      const map = L.map(mapRef.current).setView(defaultLocation, 13);
      leafletMap.current = map;

      // Import standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker(defaultLocation, { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Helper function for reverse geocoding via OpenStreetMap Nominatim
      const reverseGeocode = async (lat: number, lng: number) => {
        setLoadingAddress(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(addr);
          onLocationSelect(lat, lng, addr);
        } catch (err) {
          console.error('Reverse geocode failed:', err);
          const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setAddress(addr);
          onLocationSelect(lat, lng, addr);
        } finally {
          setLoadingAddress(false);
        }
      };

      // Run initial geocode
      reverseGeocode(defaultLocation[0], defaultLocation[1]);

      // Handle marker drag completion
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        reverseGeocode(position.lat, position.lng);
      });

      // Handle map clicks (shifts marker position)
      map.on('click', (event) => {
        const position = event.latlng;
        marker.setLatLng(position);
        reverseGeocode(position.lat, position.lng);
      });
    }

    // Cleanup Leaflet instance on unmount
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div ref={mapRef} className="h-64 w-full relative z-10" />
      <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-xs">
        {loadingAddress ? (
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <svg className="animate-spin h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Retrieving address from map pin...</span>
          </div>
        ) : (
          <div className="leading-relaxed">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Selected Pickup Address: </span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{address || 'Click on the map to specify coordinates'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
