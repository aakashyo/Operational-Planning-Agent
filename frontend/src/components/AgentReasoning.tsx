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
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4 relative z-10 border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="text-primary animate-pulse" size={20} />
            <h2 className="text-lg font-black uppercase tracking-widest text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.35)]">
              Intelligence Feed
            </h2>
          </div>
          {isLoading && (
            <span className="flex items-center space-x-2 text-[10px] bg-panel/60 text-slate-100 px-3 py-1.5 rounded-sm border border-white/10">
          </span>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {steps.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <Cpu size={32} className="mb-3 text-primary" />
            <p className="text-xs uppercase font-bold tracking-[0.2em] font-mono text-primary">Awaiting Telemetry</p>
          </div>
        ) : (
          <AnimatePresence>
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative pl-6 border-l border-white/10 pb-2"
              >
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-panel border-2 border-primary flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.35)]">
                  <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                </div>
                <div className="bg-panel/60 backdrop-blur-sm border border-white/10 rounded-md p-3 hover:bg-panel/70 transition-all hover:border-primary/40 group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-primary">
                      {getIcon(step.type)}
                      <span>{step.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 group-hover:text-slate-100 transition-colors">{step.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-200/80 leading-relaxed font-mono">{step.details}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex justify-center my-2 opacity-30 text-slate-400">
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
