import React from 'react';
import { Brain, Search, Database, Cpu, ArrowRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReasonStep {
  type: 'search' | 'retrieval' | 'tool' | 'thought';
  label: string;
  details: string;
  timestamp: string;
}

interface AgentReasoningProps {
  steps: ReasonStep[];
  isLoading: boolean;
}

const AgentReasoning: React.FC<AgentReasoningProps> = ({ steps, isLoading }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'search': return <Search size={14} className="text-blue-400" />;
      case 'retrieval': return <Database size={14} className="text-purple-400" />;
      case 'tool': return <Cpu size={14} className="text-orange-400" />;
      default: return <Brain size={14} className="text-green-400" />;
    }
  };

  return (
    <div className="glass-panel p-6 h-full flex flex-col relative overflow-hidden group">
      {/* Decorative cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4 relative z-10 border-b border-cyan-900/30 pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="text-cyan-400 animate-pulse" size={20} />
          <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            Intelligence Feed
          </h2>
        </div>
        {isLoading && (
          <span className="flex items-center space-x-2 text-[10px] bg-cyan-950/50 text-cyan-400 px-3 py-1.5 rounded-sm border border-cyan-500/30">
            <Cpu size={12} className="animate-spin" />
            <span className="font-mono tracking-widest font-bold">ANALYZING</span>
          </span>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {steps.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <Cpu size={32} className="mb-3 text-cyan-600" />
            <p className="text-xs uppercase font-bold tracking-[0.2em] font-mono text-cyan-600">Awaiting Telemetry</p>
          </div>
        ) : (
          <AnimatePresence>
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative pl-6 border-l border-cyan-900/50 pb-2"
              >
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#0B0F19] border-2 border-cyan-700 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                </div>
                <div className="bg-cyan-950/20 backdrop-blur-sm border border-cyan-900/50 rounded-md p-3 hover:bg-cyan-900/30 transition-all hover:border-cyan-700/50 group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-cyan-300">
                      {getIcon(step.type)}
                      <span>{step.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 group-hover:text-cyan-400 transition-colors">{step.timestamp}</span>
                  </div>
                  <p className="text-xs text-cyan-100/70 leading-relaxed font-mono">{step.details}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex justify-center my-2 opacity-30 text-cyan-500">
                    <ArrowRight size={14} className="rotate-90" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AgentReasoning;
