import React, { useState } from 'react';
import { Send, MapPin, ClipboardList, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { geocodePlace } from '../services/api';

interface ScenarioInputProps {
  onGenerate: (scenario: string, liveLocation?: { lat: number, lng: number }, locationName?: string) => void;
  isLoading: boolean;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
}

const ScenarioInput: React.FC<ScenarioInputProps> = ({ onGenerate, isLoading, onLocationChange }) => {
  const [scenario, setScenario] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [liveLocation, setLiveLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim()) return;

    let finalLocation = liveLocation;
    if (!finalLocation && locationQuery.trim()) {
      const geo = await geocodePlace(locationQuery.trim());
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
        () => {
          alert("Failed to retrieve live location. Please check permissions.");
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  return (
    <motion.div 
      className="card p-6 border-t-4 border-t-primary"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 text-primary rounded-lg">
            <ClipboardList size={20} />
          </div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
            Emergency Situation Report
          </h2>
        </div>
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
          <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
          <span className="text-[10px] text-success font-bold uppercase tracking-wide italic">Operational</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Incident Area</label>
          <div className="relative group">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={16} />
            <input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              placeholder="e.g. Chennai, Tamil Nadu"
              className="w-full h-11 bg-gray-50 border border-slate-200 rounded-xl pl-10 pr-4 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[11px] font-bold text-muted uppercase tracking-wider">Scenario Parameters</label>
            <div className="flex items-center text-[10px] text-muted space-x-1">
              <Info size={12} />
              <span>Describe the onset and severity</span>
            </div>
          </div>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="Describe the incident (e.g. 'Severe flooding reported in low-lying areas following 24h heavy rainfall...')"
            className="w-full h-32 bg-gray-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none outline-none"
          />
        </div>

        <div className="flex flex-col space-y-3">
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating || isLoading}
            className="flex items-center justify-center space-x-2 py-2 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-slate-900 transition-colors"
          >
            {isLocating ? (
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <MapPin size={14} className={liveLocation ? "text-primary fill-primary/10" : ""} />
            )}
            <span>{liveLocation ? 'Geo-target Locked' : 'Detect My Location'}</span>
          </button>

          <motion.button
            type="submit"
            whileHover={{ scale: (isLoading || !scenario.trim()) ? 1 : 1.01 }}
            whileTap={{ scale: (isLoading || !scenario.trim()) ? 1 : 0.99 }}
            disabled={isLoading || !scenario.trim()}
            className={`
              w-full py-3.5 rounded-xl flex items-center justify-center space-x-3 font-bold uppercase tracking-[0.1em] text-xs transition-all shadow-sm
              ${isLoading 
                ? 'bg-gray-100 text-muted border border-slate-200 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'}
            `}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Simulation...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Publish Response Plan</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

export default ScenarioInput;
