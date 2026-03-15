import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DisasterMapProps {
  location?: [number, number];
  points?: Array<{ lat: number; lng: number; label: string; type: 'danger' | 'resource' }>;
  radiusKm?: number;
}

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const DisasterMap: React.FC<DisasterMapProps> = ({ location = [13.0827, 80.2707], points = [], radiusKm = 5 }) => {
  return (
    <div className="card h-[400px] relative z-0 overflow-hidden">
      {/* Tactical Status Badge */}
      <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-md border border-gray-200 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center space-x-2 shadow-sm">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span className="text-slate-900">Tactical Geospatial Layer</span>
      </div>
      
      {/* Coordinate Display */}
      <div className="absolute bottom-4 right-4 z-30 flex space-x-2">
        <div className="bg-white/90 border border-gray-200 px-2 py-1 text-[9px] font-bold text-muted rounded shadow-sm">LAT: {location[0].toFixed(4)}</div>
        <div className="bg-white/90 border border-gray-200 px-2 py-1 text-[9px] font-bold text-muted rounded shadow-sm">LNG: {location[1].toFixed(4)}</div>
      </div>

      <MapContainer 
        center={location} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap & CARTO'
        />
        <ChangeView center={location} zoom={12} />
        <Circle 
          center={location} 
          pathOptions={{ 
            fillColor: '#2563EB', 
            color: '#2563EB', 
            weight: 2, 
            fillOpacity: 0.1, 
            dashArray: '5, 5' 
          }} 
          radius={radiusKm * 1000} 
        />
        {points.map((pt, idx) => (
          <Marker key={idx} position={[pt.lat, pt.lng]}>
            <Popup>
              <div className="text-[10px] font-bold uppercase tracking-tight text-slate-900 p-1">{pt.label}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DisasterMap;
