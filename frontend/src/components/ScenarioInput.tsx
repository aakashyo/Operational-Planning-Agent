import React, { useState } from 'react';
import { Send, Sparkles, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScenarioInputProps {
  onGenerate: (scenario: string) => void;
  isLoading: boolean;
}

const ScenarioInput: React.FC<ScenarioInputProps> = ({ onGenerate, isLoading }) => {
  const [scenario, setScenario] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scenario.trim()) {
      onGenerate(scenario);
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
          <Terminal className="text-blue-400" size={20} />
          <h2 className="text-lg font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            Emergency Command Terminal
          </h2>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] text-green-500 uppercase tracking-widest font-bold">System Online</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="relative mb-6 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="[AWAITING INPUT] Describe the disaster scenario parameters... (e.g., 'Category 4 Cyclone approaching Chennai coast...')"
            className="relative w-full h-36 bg-[#0B0F19] bg-opacity-90 backdrop-blur-sm border border-blue-900/50 rounded-lg p-4 text-cyan-100 placeholder-cyan-800/50 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none font-mono text-sm shadow-inner"
          />
        </div>
        
        <motion.button
          type="submit"
          whileHover={{ scale: (isLoading || !scenario.trim()) ? 1 : 1.02 }}
          whileTap={{ scale: (isLoading || !scenario.trim()) ? 1 : 0.98 }}
          disabled={isLoading || !scenario.trim()}
          className={`
            w-full py-3.5 rounded-lg flex items-center justify-center space-x-3 font-black uppercase tracking-widest transition-all
            ${isLoading 
              ? 'bg-blue-950/50 text-blue-500/50 border border-blue-900/30 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/50'}
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="animate-pulse tracking-[0.2em] text-sm">INITIALIZING AI PROTOCOLS...</span>
            </>
          ) : (
            <>
              <Send size={18} className="animate-pulse" />
              <span className="tracking-[0.2em] text-sm text-blue-50">INITIALIZE RESPONSE PIPELINE</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ScenarioInput;
