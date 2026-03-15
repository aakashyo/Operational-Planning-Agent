import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import Layout from './layouts/Layout';
import ScenarioInput from './components/ScenarioInput';
import ResponsePanel from './components/ResponsePanel';
import DisasterMap from './components/DisasterMap';
import AgentReasoning from './components/AgentReasoning';
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

  // Animation variants
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 300, damping: 24 } 
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
      setError((err as any)?.message || "Failed to connect to backend. Check that the API server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  // Map state is driven by the latest confirmed location (either from geocoding or live coordinates)
  const radiusKm = mapRadius;

  const mapPoints: any[] = [];
  if (plan?.nearbyHospitals) {
    plan.nearbyHospitals.forEach((h: any) => {
      if (h.lat && h.lng) mapPoints.push({ lat: h.lat, lng: h.lng, label: `🏥 ${h.name}` });
    });
  }
  if (plan?.nearestShelters) {
    plan.nearestShelters.forEach((s: any) => {
      if (s.lat && s.lng) mapPoints.push({ lat: s.lat, lng: s.lng, label: `⛺ ${s.name}` });
    });
  }

  return (
    <Layout>
      <motion.div 
        className="space-y-6"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-md mb-4">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column — Input + Reasoning */}
          <motion.div
            variants={itemVars}
            className="lg:col-span-4 space-y-6 flex flex-col snap-start"
            viewport={{ once: true, amount: 0.2 }}
          >
            <ScenarioInput onGenerate={handleGenerate} isLoading={isLoading} onLocationChange={(loc) => {
              setMapCenter([loc.lat, loc.lng]);
              setMapRadius(5);
            }} />
            <div className="flex-1 min-h-[400px]">
               <AgentReasoning steps={reasoning} isLoading={isLoading} />
            </div>
          </motion.div>

          {/* Right Column — Map + Plan */}
          <motion.div
            variants={itemVars}
            className="lg:col-span-8 space-y-6 snap-start"
            viewport={{ once: true, amount: 0.2 }}
          >
            <DisasterMap location={mapCenter} radiusKm={radiusKm} points={mapPoints} />
            <ResponsePanel plan={plan} isLoading={isLoading} />
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
