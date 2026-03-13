import React, { useState, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import {
  AlertCircle, CheckCircle2, ShieldAlert, Clock, Users,
  CloudRain, Building2, Phone, Shield, AlertTriangle, Newspaper, Home, Backpack, Download,
  Activity, Info, Map as MapIcon, ListChecks, HeartPulse, Truck
} from 'lucide-react';

interface ResponsePanelProps {
  plan: any | null;
  isLoading: boolean;
}

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
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0B0F19' },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(reportRef.current).save().then(() => {
      setIsExporting(false);
    });
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-8 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-accent/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-gray-400 animate-pulse font-medium">Synthesizing 12-Point Command Intel...</p>
        <p className="text-gray-600 text-xs">RAG Guidelines • MCP Weather • Overpass Geolocation</p>
      </div>
    );
  }

  if (!plan || !plan.incidentSummary) {
    return (
      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
          <AlertCircle size={36} className="text-gray-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">Command Center Interlink Offline</h3>
        <p className="text-gray-600 max-w-sm text-sm leading-relaxed">
          Provide a scenario to generate a comprehensive 12-section disaster operational plan.
        </p>
      </div>
    );
  }

  // Extract 12 Sections
  const summary = plan.incidentSummary;
  const risk = plan.riskAnalysis;
  const ndmaInsights = plan.ndmaGuidelineInsights || [];
  const civilianPlan = plan.actionPlanForCivilians || {};
  const operatorPlan = plan.actionPlanForRescueOperators || {};
  const monitoring = plan.continuousMonitoring;
  const supplies = plan.essentialSuppliesKit || [];
  const contacts = plan.emergencyContacts || [];
  const hospitals = plan.nearbyHospitals || [];
  const shelters = plan.nearestShelters || [];
  const advisories = plan.governmentAdvisories || [];
  const weatherText = plan.weatherConditions || "No live weather data attached.";

  // Styles
  const severityColors: any = {
    LOW: 'text-green-400 bg-green-500/10 border-green-500/30',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  const getSeverityStyle = (s: string) => severityColors[s?.toString().toUpperCase()] || severityColors['CRITICAL'];

  return (
    <div className="space-y-4">
      {/* Export Header Control */}
      <div className="flex justify-end mb-2">
        <button 
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10 px-4 py-2 rounded-md text-xs font-bold"
        >
          {isExporting ? <span className="animate-spin mr-1">⚡</span> : <Download size={14} />}
          <span>{isExporting ? 'GENERATING SECURE PDF...' : 'DOWNLOAD 12-POINT REPORT'}</span>
        </button>
      </div>

      {/* The Printable Area */}
      <div ref={reportRef} className="bg-[#0B0F19] rounded-xl overflow-hidden pb-4">
        
        {/* Section 1: Incident Summary (HEADER) */}
        <div className={`p-6 border-b border-white/10 bg-gradient-to-r ${summary.severityLevel?.toUpperCase() === 'CRITICAL' || summary.severityLevel?.toUpperCase() === 'HIGH' ? 'from-red-900/40' : 'from-yellow-900/40'} to-black`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-red-400 text-[10px] font-black tracking-widest uppercase mb-1 flex items-center"><ShieldAlert size={12} className="mr-1"/> OPERATIONAL COMMAND REPORT</span>
              <h1 className="text-2xl font-black text-white uppercase tracking-wider">{summary.disasterType}</h1>
              <p className="text-gray-400 font-medium tracking-wide flex items-center mt-1"><MapIcon size={14} className="mr-1"/> {summary.location}</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-3 py-1 rounded border font-black text-xs tracking-wider ${getSeverityStyle(summary.severityLevel)}`}>
                SEVERITY: {summary.severityLevel}
              </div>
              <p className="text-[10px] text-gray-500 mt-2 font-mono">{plan.generatedAt || new Date().toISOString()}</p>
            </div>
          </div>
          <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center gap-6">
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Operational Radius:</span>
              <span className="text-sm font-black text-white">{summary.impactRadiusKM || 5} KM</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Affected Population:</span>
              <span className="text-sm font-black text-white">{summary.estimatedAffectedPopulation || '100,000+'}</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher (Not printed as tabs, but used for Web View) */}
        <div className="flex border-b border-white/10 bg-black/20" data-html2pdf-ignore="true">
          <button onClick={() => setActiveTab('summary')} className={`flex-1 py-3 px-4 text-xs font-black uppercase transition-all ${activeTab === 'summary' ? 'text-white border-b-2 border-red-500 bg-red-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>Intelligence</button>
          <button onClick={() => setActiveTab('civilians')} className={`flex-1 py-3 px-4 text-xs font-black uppercase transition-all ${activeTab === 'civilians' ? 'text-white border-b-2 border-cyan-500 bg-cyan-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>Civilian Action</button>
          <button onClick={() => setActiveTab('operators')} className={`flex-1 py-3 px-4 text-xs font-black uppercase transition-all ${activeTab === 'operators' ? 'text-white border-b-2 border-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>Operator Directives</button>
        </div>

        <div className="p-4 space-y-6">
          
          {/* TAB 1: INTELLIGENCE */}
          <div className={activeTab === 'summary' ? 'block' : 'hidden print:block'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Section 2: Risk Analysis */}
              <div className="glass-panel p-5 border-l-4 border-l-red-500">
                <h3 className="text-sm font-black text-red-400 mb-3 flex items-center uppercase"><Activity size={16} className="mr-2"/> Risk Analysis</h3>
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">{risk?.hazardSeverity}</p>
                {risk?.predictedImpacts && risk.predictedImpacts.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-500 uppercase">Predicted Impacts:</span>
                    <ul className="list-disc pl-5 text-xs text-gray-400 space-y-1">
                      {risk.predictedImpacts.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 3 & 4: Weather & NDMA */}
              <div className="space-y-4">
                <div className="glass-panel p-4 border-l-4 border-l-blue-500">
                   <h3 className="text-xs font-black text-blue-400 mb-2 flex items-center uppercase"><CloudRain size={14} className="mr-2"/> Live Weather Context</h3>
                   <p className="text-xs text-gray-300">{weatherText}</p>
                   {risk?.environmentalConditions && <p className="text-xs text-blue-300/70 mt-2 italic border-t border-white/10 pt-2">{risk.environmentalConditions}</p>}
                </div>

                <div className="glass-panel p-4 border-l-4 border-l-purple-500">
                   <h3 className="text-xs font-black text-purple-400 mb-2 flex items-center uppercase"><Info size={14} className="mr-2"/> NDMA RAG Insights</h3>
                   <ul className="text-xs text-gray-300 space-y-2">
                     {ndmaInsights?.map((insight: string, i: number) => (
                       <li key={i} className="flex items-start"><CheckCircle2 size={12} className="text-purple-400 mr-2 mt-0.5 shrink-0"/> <span>{insight}</span></li>
                     ))}
                   </ul>
                </div>
              </div>
            </div>

            {/* Section 5 & 6: Geolocation Intel (Hospitals & Shelters) */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6">
              <div>
                 <h3 className="text-sm font-black text-green-400 mb-3 flex items-center uppercase"><Building2 size={16} className="mr-2"/> Real-time Hospitals (Overpass)</h3>
                 <div className="space-y-2">
                  {hospitals.map((h: any, i: number) => (
                    <div key={i} className="bg-green-500/5 p-3 rounded border border-green-500/10 flex justify-between items-center text-xs">
                      <div><p className="font-bold text-gray-200">{h.name}</p><p className="text-[10px] text-gray-500">{h.distance}</p></div>
                      <div className="text-right text-green-400 font-medium">{h.availableBeds || h.beds} beds<br/><span className="text-[9px] text-gray-500">ICU: {h.icuAvailability || h.icu}</span></div>
                    </div>
                  ))}
                 </div>
              </div>
              <div>
                 <h3 className="text-sm font-black text-cyan-400 mb-3 flex items-center uppercase"><Home size={16} className="mr-2"/> Emergency Shelters (Overpass)</h3>
                 <div className="space-y-2">
                  {shelters.map((s: any, i: number) => (
                    <div key={i} className="bg-cyan-500/5 p-3 rounded border border-cyan-500/10 flex justify-between items-center text-xs">
                      <div><p className="font-bold text-gray-200">{s.name}</p><p className="text-[10px] text-gray-500">{s.distance}</p></div>
                      <div className="text-right text-cyan-400 font-medium">{s.capacity} cap<br/><span className="text-[9px] text-gray-500 max-w-[100px] truncate block">{(s.availableFacilities || s.amenities || []).join(', ')}</span></div>
                    </div>
                  ))}
                 </div>
              </div>
            </div>

            {/* Section 7: Govt Advisories */}
            {advisories.length > 0 && (
              <div className="mt-4 glass-panel p-4">
                 <h3 className="text-xs font-black text-yellow-400 mb-2 flex items-center uppercase"><Newspaper size={14} className="mr-2"/> Authorities & Advisories</h3>
                 <div className="flex flex-wrap gap-2">
                   {advisories.map((adv: any, i: number) => (
                      <span key={i} className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded">{typeof adv === 'string' ? adv : adv.message || JSON.stringify(adv)}</span>
                   ))}
                 </div>
              </div>
            )}
          </div>

          {/* TAB 2: CIVILIANS */}
          <div className={`${activeTab === 'civilians' ? 'block' : 'hidden print:block print:mt-8 print:border-t print:border-white/20 print:pt-6'}`}>
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 border-l-4 border-cyan-500 pl-3">Civilian Action Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 8a: General Instructions */}
              <div className="glass-panel p-5">
                <h3 className="text-sm font-black text-cyan-400 mb-3 flex items-center uppercase"><AlertTriangle size={16} className="mr-2"/> Immediate Instructions</h3>
                <div className="space-y-3">
                  {civilianPlan?.generalInstructions?.map((inst: string, i: number) => (
                    <div key={i} className="flex items-start bg-cyan-500/5 p-3 rounded border border-cyan-500/10 text-sm text-gray-300">
                      <span className="text-cyan-400 font-black mr-3">{i+1}.</span> {inst}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {/* Section 8c: Safety */}
                <div className="glass-panel p-5">
                  <h3 className="text-sm font-black text-green-400 mb-3 flex items-center uppercase"><Shield size={16} className="mr-2"/> Vital Precautions</h3>
                  <ul className="space-y-2">
                    {civilianPlan?.safetyPrecautions?.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start text-xs text-gray-300"><CheckCircle2 size={14} className="text-green-400 mr-2 mt-0.5 shrink-0"/> {tip}</li>
                    ))}
                  </ul>
                </div>

                {/* Section 11: Essential Kit */}
                <div className="glass-panel p-5">
                  <h3 className="text-sm font-black text-purple-400 mb-3 flex items-center uppercase"><Backpack size={16} className="mr-2"/> Essential Supply Kit</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplies.map((item: string, i: number) => (
                      <span key={i} className="text-[10px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-1 rounded">{item}</span>
                    ))}
                  </div>
                </div>

                {/* Section 10: Contacts */}
                <div className="glass-panel p-5">
                  <h3 className="text-sm font-black text-red-400 mb-3 flex items-center uppercase"><Phone size={16} className="mr-2"/> Emergency Lines</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {contacts.map((c: any, i: number) => (
                      <div key={i} className="bg-red-500/5 p-2 rounded border border-red-500/10 text-xs text-center">
                        <p className="text-gray-400 font-bold mb-0.5">{c.department || c.name}</p>
                        <p className="text-red-400 font-black">{c.number}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 8b: Evacuation */}
            {civilianPlan?.evacuationRoutes && (
              <div className="mt-4 glass-panel p-5 border-l-4 border-l-yellow-500">
                 <h3 className="text-sm font-black text-yellow-500 mb-2 uppercase">Evacuation Protocol</h3>
                 <p className="text-sm text-gray-300">{civilianPlan.evacuationRoutes}</p>
              </div>
            )}
          </div>

          {/* TAB 3: OPERATORS */}
          <div className={`${activeTab === 'operators' ? 'block' : 'hidden print:block print:mt-8 print:border-t print:border-white/20 print:pt-6'}`}>
            <h2 className="text-lg font-black text-white uppercase tracking-wider mb-4 border-l-4 border-orange-500 pl-3">Rescue Operator Directives</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Section 9a: Deployment */}
               <div className="glass-panel p-5">
                 <h3 className="text-sm font-black text-orange-400 mb-3 flex items-center uppercase"><Users size={16} className="mr-2"/> Team Deployment</h3>
                 <ul className="space-y-3">
                    {operatorPlan?.deploymentStrategies?.map((s: string, i: number) => (
                      <li key={i} className="flex text-sm text-gray-300 border-l-2 border-orange-500/50 pl-3 py-1">{s}</li>
                    ))}
                 </ul>
               </div>

               {/* Section 9b: Mass Evacuation */}
               <div className="glass-panel p-5">
                 <h3 className="text-sm font-black text-yellow-400 mb-3 flex items-center uppercase"><Truck size={16} className="mr-2"/> Mass Evacuation</h3>
                 <ul className="space-y-3">
                    {operatorPlan?.evacuationPlans?.map((s: string, i: number) => (
                      <li key={i} className="flex text-sm text-gray-300 border-l-2 border-yellow-500/50 pl-3 py-1">{s}</li>
                    ))}
                 </ul>
               </div>

               {/* Section 9c: Triage */}
               <div className="glass-panel p-5">
                 <h3 className="text-sm font-black text-red-400 mb-3 flex items-center uppercase"><HeartPulse size={16} className="mr-2"/> Medical Triage</h3>
                 <ul className="space-y-3">
                    {operatorPlan?.medicalTriageProcedures?.map((s: string, i: number) => (
                      <li key={i} className="flex text-sm text-gray-300 border-l-2 border-red-500/50 pl-3 py-1">{s}</li>
                    ))}
                 </ul>
               </div>

               {/* Section 9d: Supply Logs */}
               <div className="glass-panel p-5">
                 <h3 className="text-sm font-black text-blue-400 mb-3 flex items-center uppercase"><ListChecks size={16} className="mr-2"/> Supply Logistics</h3>
                 <ul className="space-y-3">
                    {operatorPlan?.supplyDistribution?.map((s: string, i: number) => (
                      <li key={i} className="flex text-sm text-gray-300 border-l-2 border-blue-500/50 pl-3 py-1">{s}</li>
                    ))}
                 </ul>
               </div>
            </div>

            {/* Section 12: Continuous Monitoring */}
            {monitoring && (
              <div className="mt-4 glass-panel p-5 bg-black/40 border border-white/5 flex flex-col md:flex-row md:items-center justify-between">
                <div>
                   <h3 className="text-sm font-black text-gray-200 mb-1 flex items-center uppercase"><Clock size={16} className="mr-2 text-cyan-400"/> Continuous Monitoring</h3>
                   <p className="text-xs text-gray-400">Update Frequency: <span className="text-white font-bold">{monitoring.updateFrequency}</span></p>
                </div>
                <div className="mt-3 md:mt-0 flex flex-wrap gap-2">
                   {monitoring.metricsToTrack?.map((m: string, i: number) => (
                     <span key={i} className="text-[10px] uppercase font-black px-2 py-1 bg-white/10 text-gray-300 rounded border border-white/10">{m}</span>
                   ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResponsePanel;
