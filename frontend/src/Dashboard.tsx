import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import Layout from './layouts/Layout';
import ScenarioInput from './components/ScenarioInput';
import ResponsePanel from './components/ResponsePanel';
import DisasterMap from './components/DisasterMap';
import AgentReasoning from './components/AgentReasoning';
import ResourceCards from './components/ResourceCards';
import { generatePlan } from './services/api';

const DEFAULT_RESOURCES = {
  ambulances:       { available: 12, total: 20 },
  rescue_teams:     { available: 8,  total: 15 },
  medical_staff:    { available: 45, total: 60 },
  shelter_capacity: { available: 120, total: 500 },
};

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [reasoning, setReasoning] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([13.0827, 80.2707]);
  const [mapRadius, setMapRadius] = useState<number>(5);

  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: "easeOut" } 
    }
  };

  const handleGenerate = async (
    scenario: string,
    liveLocation?: { lat: number, lng: number },
    locationName?: string
  ) => {
    setError(null);
    setIsLoading(true);
    setReasoning([]);
    setPlan(null);
    try {
      const result = await generatePlan(scenario, liveLocation, locationName);
      setPlan(result);
      setReasoning(result.reasoning || []);
      if (result?.coordinates?.lat && result?.coordinates?.lng) {
        setMapCenter([result.coordinates.lat, result.coordinates.lng]);
        setMapRadius(result.coordinates.radius_km || 5);
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
      setError((err as any)?.message || "Internal Command Error. Ensure backend operations are active.");
    } finally {
      setIsLoading(false);
    }
  };

  const mapPoints: any[] = [];
  if (plan?.nearbyHospitals) {
    plan.nearbyHospitals.forEach((h: any) => {
      if (h.lat && h.lng) mapPoints.push({ lat: h.lat, lng: h.lng, label: `Medical: ${h.name}` });
    });
  }
  if (plan?.nearestShelters) {
    plan.nearestShelters.forEach((s: any) => {
      if (s.lat && s.lng) mapPoints.push({ lat: s.lat, lng: s.lng, label: `Shelter: ${s.name}` });
    });
  }

  return (
    <Layout>
      <motion.div 
        className="space-y-8 pb-12"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVars}>
          <ResourceCards data={DEFAULT_RESOURCES} />
        </motion.div>

        {error && (
          <motion.div 
            variants={itemVars}
            className="bg-red-50 border border-red-200 text-slate-900 px-6 py-4 rounded-xl flex items-center shadow-sm"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4 shrink-0">
               <span className="font-bold">!</span>
            </div>
            <div>
              <strong className="font-bold block text-sm">Deployment Failure</strong>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column — Strategic Input & Analysis */}
          <motion.div
            variants={itemVars}
            className="lg:col-span-4 space-y-8 h-full"
          >
            <ScenarioInput onGenerate={handleGenerate} isLoading={isLoading} onLocationChange={(loc) => {
              setMapCenter([loc.lat, loc.lng]);
              setMapRadius(5);
            }} />
            <div className="min-h-[450px]">
               <AgentReasoning steps={reasoning} isLoading={isLoading} />
            </div>
          </motion.div>

          {/* Right Column — Command Map & Directives */}
          <motion.div
            variants={itemVars}
            className="lg:col-span-8 space-y-8"
          >
            <DisasterMap location={mapCenter} radiusKm={mapRadius} points={mapPoints} />
            <ResponsePanel plan={plan} isLoading={isLoading} />
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
