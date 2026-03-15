import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  AlertTriangle, 
  Activity, 
  FileText, 
  Settings as SettingsIcon,
  Shield,
  Menu,
  Radio,
  Crosshair
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'planner', label: 'Scenario Planner', icon: <AlertTriangle size={20} /> },
    { id: 'monitor', label: 'Resource Monitor', icon: <Activity size={20} /> },
    { id: 'map', label: 'Disaster Map', icon: <MapIcon size={20} /> },
    { id: 'logs', label: 'System Logs', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col text-slate-100 selection:bg-primary/30">
      {/* Decorative Top Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-highlight to-accent"></div>
      
      {/* Header */}
      <header className="bg-panel/95 backdrop-blur-xl border-b border-white/10 py-3.5 px-6 flex justify-between items-center z-50 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 text-highlight rounded-md lg:hidden transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-3 group cursor-default">
            <div className="relative">
              <Crosshair className="text-highlight group-hover:rotate-90 transition-transform duration-700" size={28} />
              <div className="absolute inset-0 bg-highlight blur-md opacity-15 group-hover:opacity-40 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent leading-tight">
                Nexus
              </h1>
              <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Global Disaster Intelligence</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-sm border border-white/10">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.7)]" />
            <span className="text-[10px] font-mono font-bold text-slate-200 tracking-widest uppercase">Uplink Stable</span>
          </div>
          <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
            <Radio size={16} className="text-primary animate-pulse" />
            <div className="w-8 h-8 bg-gradient-to-br from-primary/70 to-accent/60 rounded-sm flex items-center justify-center border border-white/10 shadow-inner">
              <span className="text-[10px] font-black tracking-wider text-white">CMD</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          bg-panel/80 backdrop-blur-md border-r border-white/10 transition-all duration-300 flex flex-col
          hidden lg:flex z-40
        `}>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ x: 4, backgroundColor: 'rgba(124,58,237,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors relative
                    ${isActive ? 'text-primary bg-primary/15' : 'text-slate-300 hover:text-white'}
                  `}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(124,58,237,0.6)] rounded-r-full"
                    />
                  )}
                  <div className={isActive ? 'opacity-100' : 'opacity-70'}>{item.icon}</div>
                  {isSidebarOpen && (
                    <span className={`font-mono text-xs uppercase tracking-widest ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-white/10">
            <div className="bg-panel/70 border border-white/10 p-3 rounded-md backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black">Active Scenarios</p>
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-mono text-slate-100 font-light">03</span>
                <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded cursor-pointer hover:bg-primary/15 transition-colors uppercase tracking-widest font-bold">Monitor</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.025)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none z-0"></div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10 custom-scrollbar snap-y snap-mandatory">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
