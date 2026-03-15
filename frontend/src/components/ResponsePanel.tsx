import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import {
  AlertCircle, CheckCircle2, ShieldAlert, Clock, Users,
  CloudRain, Building2, Phone, Shield, AlertTriangle, Newspaper, Home, Backpack, Download,
  Activity, Info, Map as MapIcon, ListChecks, HeartPulse, Truck, Zap, Target,
  Crosshair, BarChart3, Radio
} from 'lucide-react';

interface ResponsePanelProps {
  plan: any | null;
  isLoading: boolean;
}

// Render a list of items as descriptive cards
const ProseList: React.FC<{ items: string[]; accentColor: string; icon: React.ReactNode }> = ({ items, accentColor, icon }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {items?.map((item: string, i: number) => (
      <motion.div 
        key={i}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="flex flex-col p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group"
      >
        <div className="flex items-center space-x-2 mb-2">
          <div className={`p-1.5 rounded-md ${accentColor} bg-opacity-10`}>
            {icon}
          </div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Step 0{i+1}</span>
        </div>
        <p className="text-xs text-slate-900 leading-relaxed font-medium">{item}</p>
      </motion.div>
    ))}
  </div>
);

const CheckList: React.FC<{ items: string[]; iconColor: string }> = ({ items, iconColor }) => (
  <div className="space-y-2">
    {items?.map((item: string, i: number) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
        <CheckCircle2 size={14} className={`${iconColor} shrink-0 mt-0.5`} />
        <p className="text-xs text-muted leading-relaxed font-medium">{item}</p>
      </div>
    ))}
  </div>
);

const ResponsePanel: React.FC<ResponsePanelProps> = ({ plan, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'civilians' | 'operators'>('summary');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    const type = plan?.incidentSummary?.disasterType || 'Emergency';
    const opt = {
      margin:       10,
      filename:     `Situation_Report_${type}_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#F8FAFC' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(reportRef.current).save().then(() => { setIsExporting(false); });
  };

  if (isLoading) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center space-y-6 min-h-[400px]">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-100 border-t-primary rounded-full" 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio size={20} className="text-primary animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-900 font-bold uppercase tracking-[0.2em] text-xs">Synthesizing Strategic Response</p>
          <p className="text-muted text-[10px] mt-2 uppercase tracking-widest font-medium">Coordinating Intelligence Assets • Localizing Protocols</p>
        </div>
      </div>
    );
  }

  if (!plan || !plan.incidentSummary) {
    return (
      <div className="card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-20 h-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6">
          <ShieldAlert size={36} className="text-gray-300" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Command Link Offline</h3>
        <p className="text-muted max-w-sm text-xs leading-relaxed font-medium">
          Initialize a scenario to generate a comprehensive 12-section operational directive.
        </p>
      </div>
    );
  }

  const summary    = plan.incidentSummary;
  const risk       = plan.riskAnalysis;
  const ndmaInsights = plan.ndmaGuidelineInsights || [];
  const civilianPlan = plan.actionPlanForCivilians || {};
  const operatorPlan = plan.actionPlanForRescueOperators || {};
  const monitoring = plan.continuousMonitoring;
  const supplies   = plan.essentialSuppliesKit || [];
  const contacts   = plan.emergencyContacts || [];
  const hospitals  = plan.nearbyHospitals || [];
  const shelters   = plan.nearestShelters || [];
  const advisories = plan.governmentAdvisories || [];
  const weatherText = plan.weatherConditions || 'No live telemetry available.';

  const isCritical = summary.severityLevel?.toUpperCase() === 'CRITICAL' || summary.severityLevel?.toUpperCase() === 'HIGH';

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-muted uppercase tracking-widest font-bold text-[10px]">
          <Clock size={12} />
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-900/90 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm active:scale-95"
        >
          {isExporting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={14} />}
          <span>{isExporting ? 'Generating PDF...' : 'Download Full Report'}</span>
        </button>
      </div>

      <div ref={reportRef} className="card overflow-hidden">
        {/* Incident Summary Header */}
        <div className={`p-8 border-b border-gray-100 ${isCritical ? 'bg-red-50/30' : 'bg-blue-50/30'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${isCritical ? 'bg-red-100 text-danger border-red-200' : 'bg-blue-100 text-primary border-blue-200'}`}>
                  Operational Directive
                </span>
                <span className="text-muted text-[10px] font-bold uppercase tracking-widest">• Incident-ID: #{Math.floor(Math.random() * 90000) + 10000}</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 uppercase tracking-tight leading-none">{summary.disasterType}</h1>
              <div className="flex items-center space-x-3 text-muted text-xs font-bold uppercase">
                <span className="flex items-center"><MapIcon size={14} className="mr-1.5" /> {summary.location}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>Radius: {summary.impactRadiusKM || 5}KM</span>
              </div>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3">
               <div className={`px-4 py-2 rounded-xl border-2 flex items-center space-x-3 ${isCritical ? 'bg-white border-danger text-danger severity-critical' : 'bg-white border-warning text-warning'}`}>
                <AlertCircle size={20} />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] font-black uppercase tracking-widest">Severity Level</span>
                  <span className="text-lg font-black uppercase">{summary.severityLevel || 'Moderate'}</span>
                </div>
              </div>
              <div className="bg-white border border-gray-100 px-3 py-1.5 rounded-lg text-right shadow-sm">
                <p className="text-[9px] font-bold text-muted uppercase tracking-[0.1em]">Affected Est.</p>
                <p className="text-sm font-bold text-slate-900">{summary.estimatedAffectedPopulation || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-100 px-4 bg-gray-50/50">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'summary' ? 'text-primary' : 'text-muted hover:text-slate-900'}`}
          >
            <div className="flex items-center space-x-2">
              <BarChart3 size={14} />
              <span>Intelligence Briefing</span>
            </div>
            {activeTab === 'summary' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('civilians')}
            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'civilians' ? 'text-purple-600' : 'text-muted hover:text-slate-900'}`}
          >
            <div className="flex items-center space-x-2">
              <Users size={14} />
              <span>Civilian Safety</span>
            </div>
            {activeTab === 'civilians' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-4 right-4 h-0.5 bg-purple-600 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('operators')}
            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'operators' ? 'text-emerald-600' : 'text-muted hover:text-slate-900'}`}
          >
            <div className="flex items-center space-x-2">
              <Crosshair size={14} />
              <span>Tactical Operations</span>
            </div>
            {activeTab === 'operators' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-600 rounded-full" />}
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
              <motion.div 
                key="intelligence"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Risk Analysis Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="card-md p-6 border-l-4 border-l-red-500">
                      <div className="flex items-center space-x-2 mb-4">
                        <Activity size={18} className="text-danger" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Hazard Risk Analysis</h3>
                      </div>
                      <div className="space-y-4">
                        {risk?.hazardSeverity?.split(/(?<=\.)\s+(?=[A-Z])/).map((para: string, i: number) => (
                          <p key={i} className="text-xs text-muted leading-relaxed font-medium">{para}</p>
                        ))}
                      </div>
                      
                      <div className="mt-6">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Predicted Secondary Impacts</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {risk?.predictedImpacts?.map((impact: string, i: number) => (
                            <div key={i} className="flex items-center space-x-2 p-2 rounded-lg bg-red-50/50 border border-red-100 text-[11px] font-semibold text-danger">
                              <AlertTriangle size={12} />
                              <span>{impact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="card p-5">
                         <div className="flex items-center space-x-2 mb-3">
                          <CloudRain size={16} className="text-primary" />
                          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Atmospheric Conditions</h4>
                        </div>
                        <p className="text-xs text-muted leading-relaxed font-medium">{weatherText}</p>
                      </div>
                      <div className="card p-5">
                         <div className="flex items-center space-x-2 mb-3">
                          <Info size={16} className="text-indigo-600" />
                          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Local Protocols (NDMA)</h4>
                        </div>
                        <ul className="space-y-2">
                           {ndmaInsights.slice(0, 3).map((insight: string, i: number) => (
                             <li key={i} className="text-[11px] text-muted font-medium flex items-start">
                               <span className="w-1 h-1 rounded-full bg-indigo-300 mt-1.5 mr-2 shrink-0" />
                               {insight}
                             </li>
                           ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="card p-6 bg-emerald-50/30 border-emerald-100">
                       <div className="flex items-center space-x-2 mb-4">
                        <Building2 size={18} className="text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Medical Assets</h3>
                      </div>
                      <div className="space-y-3">
                        {hospitals.slice(0, 4).map((h: any, i: number) => (
                          <div key={i} className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[11px] font-bold text-slate-900 truncate pr-2">{h.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${h.availableBeds > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {h.availableBeds || 0} Beds
                              </span>
                            </div>
                            <span className="text-[10px] text-muted font-medium italic">{h.distance} from centroid</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="card p-6 bg-amber-50/30 border-amber-100">
                       <div className="flex items-center space-x-2 mb-4">
                        <Home size={18} className="text-amber-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Emergency Shelters</h3>
                      </div>
                      <div className="space-y-3">
                        {shelters.slice(0, 3).map((s: any, i: number) => (
                          <div key={i} className="p-3 bg-white rounded-xl border border-amber-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-slate-900 truncate">{s.name}</span>
                              <span className="text-[10px] font-bold text-amber-700">{s.capacity} CAP</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                               {s.availableFacilities?.slice(0, 2).map((fac: string, j: number) => (
                                 <span key={j} className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold uppercase">{fac}</span>
                               ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'civilians' && (
              <motion.div 
                key="civilians"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="card-md p-8 border-l-4 border-l-purple-500">
                  <div className="flex items-center space-x-3 mb-6">
                    <Shield size={22} className="text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Public Safety Orders</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center">
                          <AlertTriangle size={14} className="mr-2 text-warning" />
                          Survival Directives
                        </h4>
                        <ProseList items={civilianPlan?.generalInstructions || []} accentColor="text-purple-600" icon={<Zap size={14}/>} />
                      </div>
                    </div>

                    <div className="space-y-8">
                       <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
                         <h4 className="text-[11px] font-bold text-muted uppercase tracking-widest mb-4 flex items-center">
                          <Truck size={14} className="mr-2 text-indigo-600" />
                          Evacuation Corridors
                        </h4>
                        <div className="space-y-3">
                           {civilianPlan?.evacuationRoutes?.split(/(?<=\.)\s+(?=[A-Z])/).map((route: string, i: number) => (
                             <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-xs text-muted font-medium">
                               {route}
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="card p-5">
                          <h4 className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-3">Essentials Kit</h4>
                          <div className="space-y-2">
                             {supplies.map((item: string, i: number) => (
                               <div key={i} className="flex items-center text-[10px] font-bold text-muted">
                                 <CheckCircle2 size={12} className="mr-2 text-green-500" />
                                 {item}
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="card p-5">
                          <h4 className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-3">Hotlines</h4>
                          <div className="space-y-2">
                             {contacts.slice(0, 4).map((c: any, i: number) => (
                               <div key={i} className="flex flex-col">
                                 <span className="text-[9px] font-bold text-muted uppercase">{c.department || c.name}</span>
                                 <span className="text-xs font-black text-danger">{c.number}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'operators' && (
              <motion.div 
                key="operators"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="card-md p-6 border-t-4 border-t-emerald-500">
                     <div className="flex items-center space-x-3 mb-6">
                        <Users size={20} className="text-emerald-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Personnel Deployment</h3>
                     </div>
                     <ProseList items={operatorPlan?.deploymentStrategies || []} accentColor="text-emerald-600" icon={<Crosshair size={14}/>} />
                   </div>
                   <div className="card-md p-6 border-t-4 border-t-amber-500">
                     <div className="flex items-center space-x-3 mb-6">
                        <Truck size={20} className="text-amber-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Logistics & Supply Chain</h3>
                     </div>
                     <ProseList items={operatorPlan?.supplyDistribution || []} accentColor="text-amber-600" icon={<Backpack size={14}/>} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="card p-6">
                     <div className="flex items-center space-x-3 mb-6">
                        <HeartPulse size={20} className="text-red-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Triage & Medical Phase</h3>
                     </div>
                     <ProseList items={operatorPlan?.medicalTriageProcedures || []} accentColor="text-red-600" icon={<Activity size={14}/>} />
                   </div>
                   <div className="card p-6 bg-gray-50/50">
                     <div className="flex items-center space-x-2 mb-6">
                        <Target size={20} className="text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Intelligence Monitoring</h3>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                           <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Scan Frequency</span>
                           <span className="badge badge-blue">{monitoring?.updateFrequency || 'Real-time'}</span>
                        </div>
                        <div className="space-y-2">
                           {monitoring?.metricsToTrack?.map((metric: string, i: number) => (
                             <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                               <span className="text-xs font-semibold text-slate-900">{metric}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default ResponsePanel;
