import React from 'react';
import {
  Sparkles,
  Building2,
  Briefcase,
  ShoppingBag,
  Zap,
  Target,
  DollarSign,
  Activity,
  Layers,
  Database,
  Radio,
  Play,
  RotateCcw,
  Plus,
  Users,
  LineChart
} from 'lucide-react';
import { IndustryDataBundle, IndustryKey } from '../types/orchestration';
import { StatusBadge } from './StatusBadge';

export type ActiveNavView = 'lifecycle' | 'traceability' | 'knowledge' | 'advisory' | 'performance';

interface HeaderProps {
  industry: IndustryDataBundle;
  industriesList: string[];
  selectedIndustry: IndustryKey;
  onSelectIndustry: (ind: IndustryKey) => void;
  activeView: ActiveNavView;
  onSelectView: (view: ActiveNavView) => void;
  isOrchestratingAll: boolean;
  onRunFullOrchestration: () => void;
  eventCount: number;
  isEventBusOpen: boolean;
  onToggleEventBus: () => void;
  onOpenAddCustomIndustry: () => void;
}

const DEFAULT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Banking: Building2,
  'IT Consulting': Briefcase,
  Retail: ShoppingBag,
  'Power Suppliers': Zap
};

export const Header: React.FC<HeaderProps> = ({
  industry,
  industriesList,
  selectedIndustry,
  onSelectIndustry,
  activeView,
  onSelectView,
  isOrchestratingAll,
  onRunFullOrchestration,
  eventCount,
  isEventBusOpen,
  onToggleEventBus,
  onOpenAddCustomIndustry
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-50">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Planview Anvi
                </h1>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Multi-Agent Orchestrator
                </span>
                {industry.isCustom && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Custom Domain
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="font-semibold text-slate-700">{industry.name}</span>
                <span>•</span>
                <span>{industry.sector}</span>
                <span>•</span>
                <span className="font-medium text-indigo-600">{industry.quarter}</span>
              </p>
            </div>
          </div>

          {/* Controls: Industry Switcher + Add Custom Industry + Orchestration Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Organization Type Selector & Custom Industry Creator */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {industriesList.map((ind) => {
                const Icon = DEFAULT_ICONS[ind] || Building2;
                const isActive = selectedIndustry === ind;
                return (
                  <button
                    key={ind}
                    onClick={() => onSelectIndustry(ind)}
                    aria-label={`Select ${ind} industry`}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[130px]">{ind}</span>
                  </button>
                );
              })}

              {/* Add Custom Industry Button */}
              <button
                onClick={onOpenAddCustomIndustry}
                aria-label="Add Custom Industry and invoke Strategy Agent"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Industry</span>
              </button>
            </div>

            {/* Event Bus Drawer Toggle Button */}
            <button
              onClick={onToggleEventBus}
              aria-label="Toggle Event Bus Drawer"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isEventBusOpen
                  ? 'bg-violet-50 text-violet-700 border-violet-300 ring-1 ring-violet-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
              <span>Event Bus</span>
              <span className="px-1.5 py-0.2 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold">
                {eventCount}
              </span>
            </button>

            {/* Run Full Orchestration Button */}
            <button
              onClick={onRunFullOrchestration}
              disabled={isOrchestratingAll}
              aria-label="Orchestrate Full Pipeline across Stages 1 through 6"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition-all cursor-pointer"
            >
              {isOrchestratingAll ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Orchestrating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Orchestrate Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View Switcher & Executive KPI Strip */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => onSelectView('lifecycle')}
              aria-label="Switch to 6-Stage Multi-Agent Lifecycle View"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === 'lifecycle'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              6-Stage Multi-Agent Lifecycle
            </button>
            <button
              onClick={() => onSelectView('traceability')}
              aria-label="Switch to 7-Layer Planview Traceability Explorer"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === 'traceability'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              7-Layer Traceability
            </button>
            <button
              onClick={() => onSelectView('advisory')}
              aria-label="Switch to Advisory Committee Multi-Agent Outcomes"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === 'advisory'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              Advisory Committee Outcomes
            </button>
            <button
              onClick={() => onSelectView('performance')}
              aria-label="Switch to Advisory Performance & Accuracy Analytics"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === 'performance'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <LineChart className="w-4 h-4 text-emerald-500" />
              Accuracy Analytics (R² &amp; CI)
            </button>
            <button
              onClick={() => onSelectView('knowledge')}
              aria-label="Switch to AI Knowledge Base 5 Pillars"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeView === 'knowledge'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4" />
              AI Knowledge Base (5 Pillars)
            </button>
          </nav>

          {/* Quick Executive Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Attainment: <strong className="text-slate-900">{industry.attainment}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Portfolio: <strong className="text-slate-900">{industry.totalBudget}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-700">Agents Active: <strong>{industry.activeAgents}</strong></span>
            </div>
            <StatusBadge status={industry.overallHealth} />
          </div>
        </div>
      </div>
    </header>
  );
};
