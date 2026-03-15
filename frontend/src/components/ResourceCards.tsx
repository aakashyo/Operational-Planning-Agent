import React from 'react';
import { Truck, Users, Home, Activity } from 'lucide-react';

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
  { key: 'ambulances',       label: 'Ambulances',       icon: <Activity size={20} />, color: 'text-primary bg-primary/10' },
  { key: 'rescue_teams',     label: 'Rescue Teams',     icon: <Truck size={20} />,    color: 'text-accent bg-accent/10' },
  { key: 'medical_staff',    label: 'Medical Staff',    icon: <Users size={20} />,    color: 'text-highlight bg-highlight/10' },
  { key: 'shelter_capacity', label: 'Shelter Capacity', icon: <Home size={20} />,     color: 'text-secondary/40 bg-secondary/10' },
] as const;

const ResourceCards: React.FC<ResourceCardsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {iconMap.map((item) => {
        const res = data[item.key];
        const pct = res.total > 0 ? (res.available / res.total) * 100 : 0;
        const barColor = pct < 25 ? 'bg-risk-high' : pct < 50 ? 'bg-risk-medium' : 'bg-primary';

        return (
          <div key={item.key} className="glass-panel p-4 flex items-center space-x-4 transition-all duration-500">
            <div className={`p-3 rounded-lg ${item.color}`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase text-gray-500 font-bold">{item.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold transition-all duration-700">{res.available}</span>
                <span className="text-xs text-gray-500">of {res.total}</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResourceCards;
