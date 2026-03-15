import React, { useState } from 'react';
import { Send, Sparkles, Terminal, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { geocodePlace } from '../services/api';

interface ScenarioInputProps {
  onGenerate: (scenario: string, liveLocation?: { lat: number, lng: number }, locationName?: string) => void;
  isLoading: boolean;
  onLocationChange?: (location: { lat: number; lng: number }) => void; // optional callback for map centering
}

const ScenarioInput: React.FC<ScenarioInputProps> = ({ onGenerate, isLoading, onLocationChange }) => {
  const [scenario, setScenario] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [liveLocation, setLiveLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scenario.trim()) return;

    let finalLocation = liveLocation;
    if (!finalLocation && locationQuery.trim()) {
      setIsGeocoding(true);
      const geo = await geocodePlace(locationQuery.trim());
      setIsGeocoding(false);
      if (geo) {
        finalLocation = geo;
        setLiveLocation(geo);
        onLocationChange?.(geo);
      }
    }

    onGenerate(scenario, finalLocation || undefined, locationQuery.trim() || undefined);
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geo = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLiveLocation(geo);
          onLocationChange?.(geo);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error securing location", error);
          alert("Failed to retrieve live location. Please ensure location permissions are enabled.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  return (
    <motion.div 
      className="glass-panel p-6 relative overflow-hidden group"
      whileHover={{ boxShadow: "0 0 25px rgba(59, 130, 246, 0.15)" }}
    >
      {/* Decorative scanline background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center space-x-2">
          <Terminal className="text-primary" size={20} />
          <h2 className="text-lg font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Emergency Command Terminal
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] text-primary uppercase tracking-widest font-bold">System Online</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="relative mb-4 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <input
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="Location (city/address) — e.g., Kolkata"
            className="relative w-full h-10 bg-panel bg-opacity-90 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm font-mono shadow-inner"
          />
        </div>

        <div className="relative mb-6 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="[AWAITING INPUT] Describe the disaster scenario parameters... (e.g., 'Category 4 Cyclone approaching Chennai coast...')"
            className="relative w-full h-36 bg-panel bg-opacity-90 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-slate-100 placeholder-slate-500/60 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none font-mono text-sm shadow-inner"
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating || isLoading}
            className={`
              flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-all
              ${liveLocation 
                ? 'bg-primary/20 text-primary border-primary/40 hover:bg-primary/30' 
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}
            `}
          >
            {isLocating ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-primary rounded-full animate-spin mr-1" />
            ) : (
              <MapPin size={14} className={liveLocation ? "text-primary" : ""} />
            )}
            <span>{liveLocation ? 'Location Locked' : 'Share Live Location'}</span>
          </button>
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: (isLoading || !scenario.trim()) ? 1 : 1.02 }}
          whileTap={{ scale: (isLoading || !scenario.trim()) ? 1 : 0.98 }}
          disabled={isLoading || !scenario.trim()}
          className={`
            w-full py-3.5 rounded-lg flex items-center justify-center space-x-3 font-black uppercase tracking-widest transition-all
            ${isLoading 
              ? 'bg-panel/70 text-slate-400 border border-white/10 cursor-not-allowed' 
              : 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] border border-primary/30'}
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="animate-pulse tracking-[0.2em] text-sm">INITIALIZING AI PROTOCOLS...</span>
            </>
          ) : (
            <>
              <Send size={18} className="animate-pulse" />
              <span className="tracking-[0.2em] text-sm text-white">INITIALIZE RESPONSE PIPELINE</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ScenarioInput;
