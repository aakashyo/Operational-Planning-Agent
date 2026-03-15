import React from 'react';
import { Truck, Users, Home, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResourceData {
  ambulances:       { available: number; total: number };
  rescue_teams:     { available: number; total: number };
  medical_staff:    { available: number; total: number };
  shelter_capacity: { available: number; total: number };
}

interface ResourceCardsProps {
  data: ResourceData;
}

const iconMap = [
  { key: 'ambulances',       label: 'Ambulance Units',       icon: <Activity size={18} />, color: 'text-blue-600 bg-blue-50' },
  { key: 'rescue_teams',     label: 'Tactical Teams',        icon: <Truck size={18} />,    color: 'text-slate-900merald-600 bg-emerald-50' },
  { key: 'medical_staff',    label: 'Medical Personnel',     icon: <Users size={18} />,    color: 'text-indigo-600 bg-indigo-50' },
  { key: 'shelter_capacity', label: 'Housing Assets',       icon: <Home size={18} />,     color: 'text-amber-600 bg-amber-50' },
] as const;

const ResourceCards: React.FC<ResourceCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {iconMap.map((item, idx) => {
        const res = data[item.key];
        const pct = res.total > 0 ? (res.available / res.total) * 100 : 0;
        
        // Progress bar color based on availability
        const barColor = pct < 30 ? 'bg-danger' : pct < 60 ? 'bg-warning' : 'bg-success';

        return (
          <motion.div 
            key={item.key}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -2 }}
            className="card p-5 group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${item.color} shadow-sm transition-transform group-hover:scale-110`}>
                {item.icon}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{item.label}</p>
                <div className="flex items-baseline justify-end space-x-1 mt-0.5">
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xl font-black text-slate-900"
                  >
                    {res.available}
                  </motion.span>
                  <span className="text-[11px] font-bold text-muted">/ {res.total}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <span className="text-muted">Utilization</span>
                <span className={pct < 30 ? 'text-danger' : 'text-slate-900'}>{Math.round(pct)}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  className={`h-full ${barColor} shadow-sm`}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ResourceCards;
