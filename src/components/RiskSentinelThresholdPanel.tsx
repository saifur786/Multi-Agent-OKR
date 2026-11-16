import React, { useState } from 'react';
import { RotateCcw, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import {
  computeAllStageThresholdSummaries,
  SENSITIVITY_PRESETS,
  type AgentAnomalyThresholdConfig,
  type StageThresholdSummary
} from '../utils/riskSentinelThresholds';
import type { AnomalySensitivityLevel } from '../utils/workerAgentTelemetry';

interface RiskSentinelThresholdPanelProps {
  industryName: string;
  configs: AgentAnomalyThresholdConfig[];
  selectedStageId: number | null;
  persistenceSource: 'mongodb' | 'memory' | null;
  isSaving: boolean;
  onUpdateStagePreset: (stageId: number, level: AnomalySensitivityLevel) => void;
  onUpdateAgentConfig: (
    agentId: string,
    patch: {
      sensitivity?: AnomalySensitivityLevel;
      stdDevMultiplier?: number;
      minAnomalyFloor?: number;
    }
  ) => void;
  onSelectStage?: (stageId: number) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

const SENSITIVITY_BADGE_CLASS: Record<AnomalySensitivityLevel, string> = {
  high: 'bg-red-50 text-red-700 border-red-200',
  balanced: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-slate-100 text-slate-700 border-slate-200'
};

export const RiskSentinelThresholdPanel: React.FC<RiskSentinelThresholdPanelProps> = ({
  industryName,
  configs,
  selectedStageId,
  persistenceSource,
  isSaving,
  onUpdateStagePreset,
  onUpdateAgentConfig,
  onSelectStage,
  onResetDefaults,
  onClose
}) => {
  const [expandedStageId, setExpandedStageId] = useState<number | null>(selectedStageId ?? 4);
  const stageSummaries: StageThresholdSummary[] = computeAllStageThresholdSummaries(configs);

  return (
    <div
      data-testid="risk-sentinel-threshold-panel"
      className="rounded-xl border border-indigo-200 bg-slate-50/80 p-4 space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
              <Sliders className="w-3.5 h-3.5" />
              Risk Sentinel Per-Agent Threshold Matrix
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {isSaving
                ? 'Saving...'
                : persistenceSource === 'mongodb'
                  ? 'MongoDB Persisted'
                  : 'Synced'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure anomaly sensitivity levels per stage and per constituent agent for{' '}
            <strong className="font-semibold text-slate-800">{industryName}</strong>. Changes update the
            Historical Anomaly Frequency chart immediately.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="reset-thresholds-btn"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {stageSummaries.map((summary) => {
          const stageAgents = configs.filter((c) => c.stageId === summary.stageId);
          const isExpanded = expandedStageId === summary.stageId;
          const isDrilldownFocus = selectedStageId === summary.stageId;

          return (
            <div
              key={summary.stageId}
              data-testid={`threshold-stage-card-${summary.stageId}`}
              className={`rounded-xl border bg-white p-3 space-y-2.5 transition-colors ${
                isDrilldownFocus ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Stage {summary.stageId}
                    </span>
                    <span
                      data-testid={`threshold-stage-badge-${summary.stageId}`}
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        SENSITIVITY_BADGE_CLASS[summary.sensitivity]
                      }`}
                    >
                      {SENSITIVITY_PRESETS[summary.sensitivity].shortLabel}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                    {summary.stageName}
                  </h4>
                </div>

                {onSelectStage && (
                  <button
                    type="button"
                    onClick={() => onSelectStage(summary.stageId)}
                    className="rounded-md border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700 cursor-pointer shrink-0"
                  >
                    {isDrilldownFocus ? 'Active Chart' : 'Focus Chart'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 tabular-nums border-y border-slate-100 py-1.5">
                <span>
                  Multiplier: <strong className="text-slate-900">+{summary.stdDevMultiplier.toFixed(2)}σ</strong>
                </span>
                <span>
                  Min Floor: <strong className="text-slate-900">≥ {summary.minAnomalyFloor}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1" role="group" aria-label={`Stage ${summary.stageId} sensitivity`}>
                {(['high', 'balanced', 'low'] as AnomalySensitivityLevel[]).map((level) => {
                  const active = summary.sensitivity === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      data-testid={`stage-${summary.stageId}-preset-${level}`}
                      aria-pressed={active}
                      onClick={() => onUpdateStagePreset(summary.stageId, level)}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                        active
                          ? level === 'high'
                            ? 'border-red-500 bg-red-600 text-white'
                            : level === 'balanced'
                              ? 'border-amber-500 bg-amber-500 text-white'
                              : 'border-slate-700 bg-slate-800 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {SENSITIVITY_PRESETS[level].shortLabel}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                data-testid={`toggle-stage-agents-${summary.stageId}`}
                aria-expanded={isExpanded}
                onClick={() => setExpandedStageId(isExpanded ? null : summary.stageId)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 pt-0.5 cursor-pointer"
              >
                <span>Per-Agent Thresholds ({stageAgents.length})</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div className="space-y-2 pt-1.5 border-t border-slate-100">
                  {stageAgents.map((agent) => (
                    <div
                      key={agent.agentId}
                      data-testid={`threshold-agent-row-${agent.agentId}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-800 truncate">
                          {agent.agentName}
                        </span>
                        <select
                          aria-label={`${agent.agentName} sensitivity`}
                          data-testid={`agent-sensitivity-select-${agent.agentId}`}
                          value={agent.sensitivity}
                          onChange={(e) =>
                            onUpdateAgentConfig(agent.agentId, {
                              sensitivity: e.target.value as AnomalySensitivityLevel
                            })
                          }
                          className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 cursor-pointer"
                        >
                          <option value="high">High (Strict)</option>
                          <option value="balanced">Balanced</option>
                          <option value="low">Low (Lenient)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 tabular-nums">
                        <label className="flex flex-col gap-0.5">
                          <span>σ Mult: {agent.stdDevMultiplier.toFixed(2)}</span>
                          <input
                            type="range"
                            min={0.1}
                            max={2.0}
                            step={0.05}
                            aria-label={`${agent.agentName} standard deviation multiplier`}
                            value={agent.stdDevMultiplier}
                            onChange={(e) =>
                              onUpdateAgentConfig(agent.agentId, {
                                stdDevMultiplier: Number(e.target.value)
                              })
                            }
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </label>
                        <label className="flex flex-col gap-0.5">
                          <span>Min Floor: ≥ {agent.minAnomalyFloor}</span>
                          <input
                            type="range"
                            min={1}
                            max={6}
                            step={1}
                            aria-label={`${agent.agentName} minimum anomaly floor`}
                            value={agent.minAnomalyFloor}
                            onChange={(e) =>
                              onUpdateAgentConfig(agent.agentId, {
                                minAnomalyFloor: Number(e.target.value)
                              })
                            }
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
