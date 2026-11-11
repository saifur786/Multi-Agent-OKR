import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ShieldAlert,
  Play,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Cpu,
  Sliders,
  ExternalLink,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';
import { IndustryDataBundle, LifecycleStage, TraceabilityNode } from '../types/orchestration';
import { StatusBadge } from './StatusBadge';
import { eventBus } from '../utils/eventBus';
import { AgentDeepDiveModal } from './AgentDeepDiveModal';

interface LifecycleViewProps {
  industry: IndustryDataBundle;
  activeStageId: number;
  onSelectStage: (stageId: number) => void;
  nodesMap: Record<string, TraceabilityNode>;
  onUpdateNodesMap: (updated: Record<string, TraceabilityNode>) => void;
  activeFedCount: number;
}

const AI_PILLAR_META = [
  { key: 'analyse' as const, label: 'Analyse', icon: BarChart3, color: 'text-blue-600 bg-blue-50/70 border-blue-200' },
  { key: 'predict' as const, label: 'Predict', icon: TrendingUp, color: 'text-purple-600 bg-purple-50/70 border-purple-200' },
  { key: 'recommend' as const, label: 'Recommend', icon: Lightbulb, color: 'text-amber-600 bg-amber-50/70 border-amber-200' },
  { key: 'automate' as const, label: 'Automate', icon: Cpu, color: 'text-emerald-600 bg-emerald-50/70 border-emerald-200' },
  { key: 'optimise' as const, label: 'Optimise', icon: Sliders, color: 'text-indigo-600 bg-indigo-50/70 border-indigo-200' }
];

export const LifecycleView: React.FC<LifecycleViewProps> = ({
  industry,
  activeStageId,
  onSelectStage,
  nodesMap,
  onUpdateNodesMap,
  activeFedCount
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simRunCount, setSimRunCount] = useState(0);
  const [deepDiveStage, setDeepDiveStage] = useState<LifecycleStage | null>(null);

  const activeStage = industry.stages.find((s) => s.id === activeStageId) || industry.stages[0];

  const handleRunSimulation = () => {
    setIsSimulating(true);

    // Emit live event onto the event bus
    eventBus.publish({
      topic: 'INTERVENTION_APPLIED',
      sourceAgent: activeStage.agentName,
      targetAgent: 'Supervisor Agent',
      summary: `Executed live simulation for Stage ${activeStage.id}: ${activeStage.title}`,
      payload: {
        stageId: activeStage.id,
        agent: activeStage.agentName,
        metrics: activeStage.simMetrics,
        confidencePct: activeStage.confidence
      },
      latencyMs: 28,
      severity: activeStage.status === 'On Track' ? 'success' : 'warning'
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimRunCount((prev) => prev + 1);
    }, 550);
  };

  return (
    <div className="space-y-6">
      {/* 6-Stage Horizontal Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Supervisor-Worker Multi-Agent OKR Lifecycle
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {activeFedCount}/5 Knowledge Pillars Feeding Pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {industry.stages.map((stage) => {
            const isSelected = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                aria-label={`Select Stage ${stage.id}: ${stage.title}`}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-400 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {stage.id}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stage.status === 'On Track' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-900 line-clamp-2">{stage.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{stage.agentName}</p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded truncate max-w-full">
                    {stage.moduleDetail.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Stage Detail & Multi-Agent Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Stage Goal & 5 Agentic AI Actions */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            {/* Stage Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-700">
                    Stage {activeStage.id} of 6
                  </span>
                  <StatusBadge status={activeStage.status} />
                  <span className="text-xs font-medium text-slate-500">• {activeStage.subtitle}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{activeStage.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{activeStage.goal}</p>
                <p className="text-xs text-indigo-700 font-medium mt-1">
                  Module: {activeStage.moduleDetail.description}
                </p>
              </div>

              {/* Active Agent Info Card & Workbench Launcher */}
              <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 shrink-0 space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Worker Agent</p>
                  <p className="text-sm font-bold text-indigo-700 flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                    {activeStage.agentName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{activeStage.planviewCapability}</p>
                </div>

                <button
                  onClick={() => setDeepDiveStage(activeStage)}
                  aria-label={`Open Agent Workbench for ${activeStage.agentName}`}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Open Agent Workbench</span>
                </button>
              </div>
            </div>

            {/* 5 Agentic AI Actions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  5 Agentic AI Actions ({industry.name})
                </h4>
                <span className="text-[11px] text-slate-400">Analyse • Predict • Recommend • Automate • Optimise</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_PILLAR_META.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.key}
                      className={`p-3.5 rounded-xl border ${pillar.color} ${
                        pillar.key === 'optimise' ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide mb-1">
                        <Icon className="w-4 h-4" />
                        {pillar.label}
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {activeStage.aiActions[pillar.key]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Agent Simulation & Risk Telemetry */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                Live Agent Telemetry
              </h4>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {Math.min(99, activeStage.confidence + simRunCount)}% Confidence
              </span>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              aria-label="Run Agent Simulation"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Emitting to Event Bus...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Stage Agent Simulation</span>
                </>
              )}
            </button>

            <div className={`space-y-3 transition-opacity ${isSimulating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Velocity Trend</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {activeStage.simMetrics.velocityTrend}
                  {simRunCount > 0 && ' (Verified on Bus)'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Budget Burn</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{activeStage.simMetrics.budgetBurn}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resource Constraint</p>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {activeStage.simMetrics.resourceConstraint}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Risk Detection</p>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed font-medium">
                  {activeStage.simMetrics.riskAlert}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Recommended Action</p>
                <p className="text-xs text-emerald-900 mt-1 leading-relaxed font-medium">
                  {activeStage.simMetrics.recommendedAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Dive Workbench Modal */}
      {deepDiveStage && (
        <AgentDeepDiveModal
          stage={deepDiveStage}
          industry={industry}
          nodesMap={nodesMap}
          onUpdateNodesMap={onUpdateNodesMap}
          onClose={() => setDeepDiveStage(null)}
        />
      )}
    </div>
  );
};
