import React from 'react';
import { Search, Database, Fingerprint, Map, Activity, Clock, ChevronRight } from 'lucide-react';
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
      case 'search': return <Search size={14} className="text-blue-600" />;
      case 'retrieval': return <Database size={14} className="text-indigo-600" />;
      case 'tool': return <Map size={14} className="text-orange-600" />;
      default: return <Fingerprint size={14} className="text-emerald-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'search': return 'bg-blue-50 border-blue-100';
      case 'retrieval': return 'bg-indigo-50 border-indigo-100';
      case 'tool': return 'bg-orange-50 border-orange-100';
      default: return 'bg-emerald-50 border-emerald-100';
    }
  };

  return (
    <div className="card p-6 h-full flex flex-col border-t-4 border-t-indigo-500 overflow-hidden">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Activity className="text-indigo-600" size={18} />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
            Intelligence Pipeline
          </h2>
        </div>
        {isLoading && (
          <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar relative">
        {/* Timeline vertical line */}
        {steps.length > 0 && (
          <div className="absolute left-[13px] top-2 bottom-4 w-0.5 bg-gray-100" />
        )}

        {steps.length === 0 && !isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Clock size={24} className="text-gray-300" />
            </div>
            <p className="text-xs font-bold text-muted uppercase tracking-widest">Awaiting Live Telemetry</p>
            <p className="text-[10px] text-gray-400 mt-1">Initiate a scenario to begin analysis</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="relative pl-8 group"
              >
                {/* Node marker */}
                <div className={`
                  absolute left-0 top-1 w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center z-10 shadow-sm
                  ${getBgColor(step.type)}
                `}>
                  {getIcon(step.type)}
                  {idx === steps.length - 1 && isLoading && (
                    <div className="absolute inset-0 rounded-full bg-current opacity-20 animate-ping" />
                  )}
                </div>

                <div className="bg-gray-50 border border-slate-200 rounded-xl p-3.5 hover:bg-white hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 flex items-center">
                      {step.label.replace('Groq ', '').replace('Gemini ', '')}
                      <ChevronRight size={10} className="ml-1 text-muted" />
                    </span>
                    <span className="text-[9px] font-medium text-muted font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      {step.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed font-medium">
                    {step.details}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AgentReasoning;
