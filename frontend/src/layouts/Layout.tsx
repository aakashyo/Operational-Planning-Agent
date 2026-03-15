import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  AlertTriangle, 
  Activity, 
  FileText, 
  Settings as SettingsIcon,
  Menu,
  Radio,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, color: 'primary' },
    { id: 'planner', label: 'Scenario Planner', icon: <AlertTriangle size={18} />, color: 'purple-600' },
    { id: 'monitor', label: 'Resource Monitor', icon: <Activity size={18} />, color: 'green-600' },
    { id: 'map', label: 'Disaster Map', icon: <MapIcon size={18} />, color: 'orange-500' },
    { id: 'logs', label: 'System Logs', icon: <FileText size={18} />, color: 'slate-500' },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} />, color: 'indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-primary/20">
      {/* Header */}
      <header className="app-header">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 text-muted rounded-md lg:hidden transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center space-x-3 group cursor-default">
            <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-lg shadow-sm">
              <ShieldAlert className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold uppercase tracking-tight text-slate-900 leading-none">
                Operational Planning Agent
              </h1>
              <span className="text-[10px] text-muted font-medium mt-1 uppercase tracking-wide">Emergency Command Center</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4 border-r border-slate-200 pr-4">
            <div className="badge badge-green">
              <div className="w-1.5 h-1.5 bg-success rounded-full mr-2" />
              SYSTEM OPERATIONAL
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 text-muted rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-slate-200 flex items-center justify-center overflow-hidden">
              <div className="text-[10px] font-bold text-muted">ADM</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          bg-white border-r border-slate-200 transition-all duration-300 flex flex-col
          hidden lg:flex z-40
        `}>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <div className={`transition-colors ${isActive ? 'text-primary' : 'text-muted'}`}>
                    {item.icon}
                  </div>
                  {isSidebarOpen && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute right-0 w-1 h-5 bg-primary rounded-l-full"
                    />
                  )}
                </div>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-200">
            {isSidebarOpen ? (
              <div className="bg-gray-50 border border-slate-200 p-3 rounded-lg">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Active Incidents</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-slate-900">03</span>
                  <div className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-primary">Live</div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 relative custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
