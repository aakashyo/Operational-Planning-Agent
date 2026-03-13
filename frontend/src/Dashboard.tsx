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

  const handleGenerate = async (scenario: string) => {
    setIsLoading(true);
    setReasoning([]);
    setPlan(null);
    try {
      const result = await generatePlan(scenario);
      setPlan(result);
      setReasoning(result.reasoning || []);
    } catch (error) {
      console.error("Failed to generate plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <motion.div 
        className="space-y-6"
        variants={containerVars}
        initial="hidden"
        animate="show"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column — Input + Reasoning */}
          <motion.div variants={itemVars} className="lg:col-span-4 space-y-6 flex flex-col">
            <ScenarioInput onGenerate={handleGenerate} isLoading={isLoading} />
            <div className="flex-1 min-h-[400px]">
               <AgentReasoning steps={reasoning} isLoading={isLoading} />
            </div>
          </motion.div>

          {/* Right Column — Map + Plan */}
          <motion.div variants={itemVars} className="lg:col-span-8 space-y-6">
            <DisasterMap />
            <ResponsePanel plan={plan} isLoading={isLoading} />
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
