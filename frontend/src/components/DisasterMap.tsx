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

// Helper to change map view dynamically on props update
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const DisasterMap: React.FC<DisasterMapProps> = ({ location = [13.0827, 80.2707], points = [], radiusKm = 5 }) => {
  return (
    <div className="glass-panel h-[400px] relative z-0 group">
      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,100,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,100,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-20 mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Target Crosshairs Center */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center opacity-30">
        <div className="w-px h-full bg-primary/30"></div>
        <div className="h-px w-full bg-primary/30 absolute"></div>
        <div className="w-12 h-12 border border-primary/50 rounded-full absolute"></div>
        <div className="w-24 h-24 border border-primary/30 rounded-full absolute"></div>
      </div>

      {/* Radar Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
        <div className="w-[800px] h-[800px] rounded-full border border-primary/10 bg-[conic-gradient(from_0deg,transparent_70%,rgba(124,58,237,0.12)_100%)] animate-radar"></div>
      </div>

      <div className="absolute top-4 left-4 z-30 bg-panel/80 backdrop-blur-md border border-white/10 p-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 shadow-[0_0_15px_rgba(124,58,237,0.25)]">
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
        <span className="text-slate-100">Live Tactical Satellite</span>
      </div>
      
      <div className="absolute bottom-4 right-4 z-30 flex space-x-2">
        <span className="bg-panel/70 border border-white/10 px-2 py-1 text-[9px] font-mono text-slate-200 rounded backdrop-blur-sm">LAT: {location[0].toFixed(4)}</span>
        <span className="bg-panel/70 border border-white/10 px-2 py-1 text-[9px] font-mono text-slate-200 rounded backdrop-blur-sm">LNG: {location[1].toFixed(4)}</span>
      </div>

      <MapContainer 
        center={location} 
        zoom={12} 
        style={{ height: '100%', width: '100%', filter: 'grayscale(1) invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.5)' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap & CARTO'
        />
        <ChangeView center={location} zoom={12} />
        <Circle 
          center={location} 
          pathOptions={{ fillColor: '#06b6d4', color: '#06b6d4', weight: 1, fillOpacity: 0.15, dashArray: '4, 4' }} 
          radius={radiusKm * 1000} 
        />
        {points.map((pt, idx) => (
          <Marker key={idx} position={[pt.lat, pt.lng]}>
            <Popup className="custom-popup">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#0B0F19]">{pt.label}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DisasterMap;
