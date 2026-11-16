import React, { useEffect, useRef, useState } from 'react';
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
  Zap,
  Download,
  FileText,
  Table,
  Check,
  HelpCircle,
  ChevronDown,
  RotateCcw,
  X,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Database
} from 'lucide-react';
import { IndustryDataBundle, LifecycleStage, TraceabilityNode } from '../types/orchestration';
import { StatusBadge } from './StatusBadge';
import { eventBus } from '../utils/eventBus';
import { AgentDeepDiveModal } from './AgentDeepDiveModal';
import {
  IndustryOrchestrationSummary,
  ORCHESTRATION_ACTIONS,
  ORCHESTRATION_PIPELINE_HELP,
  OrchestrationMode
} from '../utils/industryOrchestration';
import {
  generateExecutiveReportCSV,
  generateBusinessRequirementDocument,
  generateRequirementTraceabilityMatrixCSV,
  triggerFileDownload
} from '../utils/documentGenerators';
import {
  extractLatestRunStageTimeline,
  formatStageCompletionTimestamp,
  type LatestRunTimelineSummary,
  type StageCompletionStatus
} from '../utils/orchestrationTimeline';
import { StageDependencyFlowDiagram } from './StageDependencyFlowDiagram';

interface LifecycleViewProps {
  industry: IndustryDataBundle;
  industryKey?: string;
  activeStageId: number;
  onSelectStage: (stageId: number) => void;
  nodesMap: Record<string, TraceabilityNode>;
  onUpdateNodesMap: (updated: Record<string, TraceabilityNode>) => void;
  activeFedCount: number;
  canExecuteLifecycle?: boolean;
  isOrchestratingAll?: boolean;
  onRunFullOrchestration?: (mode?: OrchestrationMode) => void;
  lastOrchestrationSummary?: IndustryOrchestrationSummary | null;
  lastOrchestrationRunId?: string | null;
  onRetrospectiveCompleted?: (payload: {
    actionableLesson: string;
    vectorChunk: { id: string; text: string; source: string; sourceDocument?: string; ingestedAt?: string };
    ownerNotification?: any;
  }) => void;
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
  industryKey,
  activeStageId,
  onSelectStage,
  nodesMap,
  onUpdateNodesMap,
  activeFedCount,
  canExecuteLifecycle = true,
  isOrchestratingAll = false,
  onRunFullOrchestration,
  lastOrchestrationSummary = null,
  lastOrchestrationRunId = null,
  onRetrospectiveCompleted
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simRunCount, setSimRunCount] = useState(0);
  const [deepDiveStage, setDeepDiveStage] = useState<LifecycleStage | null>(null);
  const [isPipelineMenuOpen, setIsPipelineMenuOpen] = useState(false);
  const pipelineContainerRef = useRef<HTMLDivElement | null>(null);

  const [timelineSummary, setTimelineSummary] = useState<LatestRunTimelineSummary | null>(null);
  const [timelineSource, setTimelineSource] = useState<'mongodb' | 'memory' | null>(null);
  const [isTimelineLoading, setIsTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [timelineRefreshNonce, setTimelineRefreshNonce] = useState(0);
  const wasOrchestratingRef = useRef(isOrchestratingAll);

  const effectiveIndustryKey = (industryKey || industry.name || 'Telco').trim();

  useEffect(() => {
    if (wasOrchestratingRef.current && !isOrchestratingAll) {
      setTimelineRefreshNonce((prev) => prev + 1);
    }
    wasOrchestratingRef.current = isOrchestratingAll;
  }, [isOrchestratingAll]);

  useEffect(() => {
    if (isOrchestratingAll) return;

    let cancelled = false;
    setIsTimelineLoading(true);
    setTimelineError(null);

    const params = new URLSearchParams({ industry: effectiveIndustryKey });
    if (lastOrchestrationRunId) {
      params.set('runId', lastOrchestrationRunId);
    }

    void fetch(`/api/orchestration-stage-metrics?${params.toString()}`)
      .then(async (resp) => {
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(text || `Failed to fetch timeline (${resp.status})`);
        }
        return resp.json();
      })
      .then((data) => {
        if (cancelled) return;
        const nextTimeline: LatestRunTimelineSummary | null =
          data?.latestTimeline ||
          extractLatestRunStageTimeline(
            Array.isArray(data?.metrics) ? data.metrics : [],
            lastOrchestrationRunId
          );
        setTimelineSummary(nextTimeline);
        setTimelineSource(String(data?.source || '').startsWith('mongodb') ? 'mongodb' : 'memory');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTimelineError(err instanceof Error ? err.message : 'Unable to load MongoDB timeline');
      })
      .finally(() => {
        if (!cancelled) {
          setIsTimelineLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveIndustryKey, lastOrchestrationRunId, timelineRefreshNonce, isOrchestratingAll]);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (
        isPipelineMenuOpen &&
        pipelineContainerRef.current &&
        !pipelineContainerRef.current.contains(e.target as Node)
      ) {
        setIsPipelineMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPipelineMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPipelineMenuOpen]);

  const stages = Array.isArray(industry.stages) ? industry.stages : [];
  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0] || null;

  if (!activeStage) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <p className="text-sm font-semibold text-slate-800">Lifecycle data is unavailable for this industry.</p>
        <p className="text-xs text-slate-500 mt-1">Please reselect an industry or regenerate normalized traceability data.</p>
      </div>
    );
  }

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

  const [exportedCsv, setExportedCsv] = useState(false);
  const [downloadedBrd, setDownloadedBrd] = useState(false);
  const [downloadedRtm, setDownloadedRtm] = useState(false);

  // Export 7-layer node health and OKR metrics to CSV
  const handleExportCSV = () => {
    const csv = generateExecutiveReportCSV(industry, nodesMap);
    const filename = `${industry.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_executive_traceability_health.csv`;
    triggerFileDownload(csv, filename, 'text/csv;charset=utf-8;');
    setExportedCsv(true);
    setTimeout(() => setExportedCsv(false), 2500);

    eventBus.publish({
      topic: 'EXECUTIVE_REPORT_EXPORTED',
      sourceAgent: 'Executive Reporting Agent',
      targetAgent: 'Supervisor Agent',
      summary: `Exported comprehensive 7-layer node health and OKR traceability CSV for ${industry.name}`,
      payload: { filename, totalNodes: Object.keys(nodesMap).length, quarter: industry.quarter },
      latencyMs: 18,
      severity: 'success'
    });
  };

  // Download Business Requirement Document (BRD)
  const handleDownloadBRD = () => {
    const brd = generateBusinessRequirementDocument(industry);
    const filename = `Planview_Anvi_Business_Requirement_Document_${industry.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    triggerFileDownload(brd, filename, 'text/markdown;charset=utf-8;');
    setDownloadedBrd(true);
    setTimeout(() => setDownloadedBrd(false), 2500);

    eventBus.publish({
      topic: 'GOVERNANCE_DOC_EXPORTED',
      sourceAgent: 'Executive Reporting Agent',
      targetAgent: 'Enterprise Architecture Board',
      summary: `Generated and downloaded formal Business Requirement Document (BRD) for ${industry.name}`,
      payload: { filename, docType: 'BRD', standard: 'BRD-PV-ANVI-2026-V2.4' },
      latencyMs: 22,
      severity: 'info'
    });
  };

  // Download Requirement Traceability Matrix (RTM)
  const handleDownloadRTM = () => {
    const rtm = generateRequirementTraceabilityMatrixCSV();
    const filename = `Planview_Anvi_Requirement_Traceability_Matrix_RTM_${industry.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    triggerFileDownload(rtm, filename, 'text/csv;charset=utf-8;');
    setDownloadedRtm(true);
    setTimeout(() => setDownloadedRtm(false), 2500);

    eventBus.publish({
      topic: 'GOVERNANCE_DOC_EXPORTED',
      sourceAgent: 'Executive Reporting Agent',
      targetAgent: 'Quality & Governance Auditor',
      summary: `Generated and downloaded formal Requirement Traceability Matrix (RTM) CSV for ${industry.name}`,
      payload: { filename, docType: 'RTM', mappingsCount: 18 },
      latencyMs: 20,
      severity: 'info'
    });
  };

  return (
    <div className="space-y-6">
      {/* 6-Stage Horizontal Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Supervisor-Worker Multi-Agent OKR Lifecycle
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium tabular-nums">
              {activeFedCount}/5 Knowledge Pillars Feeding Pipeline · Stages 1–6 step-through execution &amp; telemetry
            </p>
          </div>

          {onRunFullOrchestration && (
            <div className="flex flex-wrap items-center gap-2.5">
              {isOrchestratingAll && (
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg tabular-nums">
                  Executing Stage {activeStageId} of {stages.length || 6}...
                </span>
              )}

              <div className="relative flex items-center shrink-0" ref={pipelineContainerRef}>
                <button
                  type="button"
                  data-testid="orchestrate-pipeline-btn"
                  onClick={() => canExecuteLifecycle && onRunFullOrchestration('full-pipeline')}
                  disabled={isOrchestratingAll || !canExecuteLifecycle}
                  aria-label={`Orchestrate ${industry.name} OKR & Program Pipeline across Stages 1 through 6`}
                  title={
                    canExecuteLifecycle
                      ? `Run Stages 1–6 OKR & Program orchestration for ${industry.name}`
                      : 'Requires OKR Creator or Super Admin role to execute the 6-Stage Pipeline'
                  }
                  className="flex items-center gap-1.5 px-3 py-2 rounded-l-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0 border border-indigo-600"
                >
                  {isOrchestratingAll ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin shrink-0" />
                      <span>Orchestrating...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 shrink-0" />
                      <span>Orchestrate Pipeline</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  data-testid="pipeline-help-trigger"
                  onClick={() => setIsPipelineMenuOpen((prev) => !prev)}
                  aria-label="Orchestrate Pipeline Actions, Purpose & Expectations"
                  aria-expanded={isPipelineMenuOpen}
                  aria-controls="orchestrate-pipeline-panel"
                  title="View 6-Stage Orchestration Purpose, Expectations & Aligned Actions"
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-r-xl border border-l-indigo-500 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isPipelineMenuOpen
                      ? 'bg-indigo-800 text-white border-indigo-800'
                      : 'bg-indigo-700 hover:bg-indigo-800 text-indigo-50 border-indigo-700'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                  <ChevronDown className="w-3 h-3 shrink-0" />
                </button>

                {isPipelineMenuOpen && (
                  <div
                    id="orchestrate-pipeline-panel"
                    role="region"
                    aria-label="Industry Pipeline Orchestration Guide and Actions"
                    className="absolute right-0 top-full mt-2 w-[470px] max-w-[calc(100vw-2rem)] max-h-[82vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl z-50 p-4 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-xs font-bold text-slate-900">
                            {ORCHESTRATION_PIPELINE_HELP.title}
                          </h3>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {industry.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          <strong className="text-slate-800">Purpose:</strong> {ORCHESTRATION_PIPELINE_HELP.purpose}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPipelineMenuOpen(false)}
                        aria-label="Close Pipeline Guide"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Expected Outcomes per Run
                      </h4>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {ORCHESTRATION_PIPELINE_HELP.expectations.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                        Aligned Industry OKR &amp; Program Actions
                      </h4>
                      {ORCHESTRATION_ACTIONS.map((action) => (
                        <button
                          key={action.mode}
                          type="button"
                          data-testid={`orchestrate-action-${action.mode}`}
                          disabled={isOrchestratingAll || !canExecuteLifecycle}
                          onClick={() => {
                            setIsPipelineMenuOpen(false);
                            onRunFullOrchestration(action.mode);
                          }}
                          className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                              <Play className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>{action.label}</span>
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {action.description}
                          </p>
                          <p className="text-[10px] font-medium text-indigo-700">
                            Expectation: {action.expectedOutcome}
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 space-y-1">
                      <h4 className="text-[11px] font-bold text-amber-900">Tips &amp; Guidance</h4>
                      <ul className="space-y-1 text-[11px] text-amber-900/80">
                        {ORCHESTRATION_PIPELINE_HELP.tips.map((tip, idx) => (
                          <li key={idx}>• {tip}</li>
                        ))}
                      </ul>
                    </div>

                    {lastOrchestrationSummary && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-[11px] text-emerald-900 space-y-1">
                        <div className="font-bold">
                          Last Run ({lastOrchestrationSummary.industryName})
                        </div>
                        <p className="tabular-nums">{lastOrchestrationSummary.headline}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {stages.map((stage) => {
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

      {/* Stage Dependency Flow (D3 Async Hand-Off & Latency Bottleneck Diagram) */}
      <StageDependencyFlowDiagram
        industryName={industry.name}
        stages={stages}
        timelineStages={timelineSummary?.stages}
        activeStageId={activeStageId}
        isOrchestratingAll={isOrchestratingAll}
        onSelectStage={onSelectStage}
      />

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

            {/* Stage 5 Special: Executive Reporting & Governance Exports */}
            {activeStage.id === 5 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/80 via-white to-indigo-50/80 border border-emerald-200/80 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                      Executive Governance &amp; Traceability Downloads
                    </span>
                    <p className="text-xs text-slate-700 font-medium mt-0.5">
                      Export comprehensive 7-layer node health, OKR status, and download formal BRD &amp; RTM documents.
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    {Object.keys(nodesMap).length} Monitored Nodes
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-100">
                  {/* Export to CSV Button */}
                  <button
                    onClick={handleExportCSV}
                    aria-label="Export to CSV"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                      exportedCsv
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {exportedCsv ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>CSV Exported</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Export to CSV</span>
                      </>
                    )}
                  </button>

                  {/* Download BRD Button */}
                  <button
                    onClick={handleDownloadBRD}
                    aria-label="Download Business Requirement Document"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{downloadedBrd ? '✓ BRD Downloaded' : 'Download BRD (.md)'}</span>
                  </button>

                  {/* Download RTM Button */}
                  <button
                    onClick={handleDownloadRTM}
                    aria-label="Download Requirement Traceability Matrix"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs transition-all cursor-pointer"
                  >
                    <Table className="w-3.5 h-3.5 text-purple-600" />
                    <span>{downloadedRtm ? '✓ RTM Downloaded' : 'Download RTM (.csv)'}</span>
                  </button>
                </div>
              </div>
            )}

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
              disabled={isSimulating || !canExecuteLifecycle}
              aria-label="Run Agent Simulation"
              title={!canExecuteLifecycle ? 'Current role has read-only monitoring access' : undefined}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Emitting to Event Bus...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{canExecuteLifecycle ? 'Run Stage Agent Simulation' : 'Simulation Locked (Read-Only Role)'}</span>
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

      {/* 6-Stage Execution Vertical Timeline (Fetched from MongoDB) */}
      <section
        data-testid="lifecycle-vertical-timeline"
        aria-label="6-Stage Pipeline Execution Vertical Timeline"
        className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                6-Stage Execution Vertical Timeline
              </h3>
              {timelineSummary && (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md tabular-nums">
                  {timelineSummary.runLabel} · {timelineSummary.totalLatencyMs} ms total
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Sequential completion timestamp and execution outcome for all 6 pipeline stages stored in MongoDB ({effectiveIndustryKey}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isOrchestratingAll && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 tabular-nums">
                <RotateCcw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Executing Stage {activeStageId}/6 — syncing after completion</span>
              </span>
            )}

            {timelineSummary && !isOrchestratingAll && (
              <span
                data-testid="timeline-overall-summary"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold tabular-nums ${
                  timelineSummary.overallStatus === 'Failed'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : timelineSummary.overallStatus === 'Warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {timelineSummary.overallStatus === 'Failed' ? (
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                ) : timelineSummary.overallStatus === 'Warning' ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>
                  {timelineSummary.succeededCount}/{timelineSummary.stages.length} Succeeded
                  {timelineSummary.warningCount > 0 ? ` · ${timelineSummary.warningCount} Warning` : ''}
                  {timelineSummary.failedCount > 0 ? ` · ${timelineSummary.failedCount} Failed` : ''}
                </span>
              </span>
            )}

            {timelineSource && (
              <span
                data-testid="timeline-persistence-source"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
              >
                <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{timelineSource === 'mongodb' ? 'MongoDB Fetched' : 'Telemetry Store'}</span>
              </span>
            )}

            <button
              type="button"
              data-testid="refresh-lifecycle-timeline-btn"
              onClick={() => setTimelineRefreshNonce((prev) => prev + 1)}
              disabled={isTimelineLoading || isOrchestratingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isTimelineLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Timeline</span>
            </button>
          </div>
        </div>

        {timelineError && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
            <div className="flex items-center gap-2 text-xs font-medium">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Could not load pipeline timeline from MongoDB: {timelineError}</span>
            </div>
            <button
              type="button"
              onClick={() => setTimelineRefreshNonce((prev) => prev + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer shrink-0"
            >
              Retry Fetch
            </button>
          </div>
        )}

        {isTimelineLoading && !timelineSummary ? (
          <div className="space-y-3 pl-8 relative" aria-busy="true" aria-label="Loading stage timeline">
            <div aria-hidden="true" className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-200" />
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="h-16 rounded-xl border border-slate-200 bg-slate-50 animate-pulse"
              />
            ))}
          </div>
        ) : timelineSummary && timelineSummary.stages.length > 0 ? (
          <ol className="relative pl-9 space-y-3">
            <div
              aria-hidden="true"
              className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-200"
            />
            {timelineSummary.stages.map((entry) => {
              const matchedStage = stages.find((s) => s.id === entry.stageId);
              const isSelectedStage = activeStageId === entry.stageId;
              const isExecutingThisStage = isOrchestratingAll && activeStageId === entry.stageId;
              const statusMeta: Record<
                StageCompletionStatus,
                {
                  badgeClass: string;
                  markerClass: string;
                  icon: React.ReactNode;
                }
              > = {
                Succeeded: {
                  badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                  markerClass: 'bg-emerald-50 border-emerald-500 text-emerald-700',
                  icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                },
                Warning: {
                  badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
                  markerClass: 'bg-amber-50 border-amber-500 text-amber-700',
                  icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                },
                Failed: {
                  badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
                  markerClass: 'bg-rose-50 border-rose-500 text-rose-700',
                  icon: <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                }
              };

              const meta = statusMeta[entry.status];

              return (
                <li
                  key={entry.id}
                  data-testid={`timeline-stage-item-${entry.stageId}`}
                  className="relative"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute -left-9 top-3.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-2xs ${
                      isExecutingThisStage
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : meta.markerClass
                    }`}
                  >
                    {isExecutingThisStage ? (
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : entry.status === 'Failed' ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : entry.status === 'Warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectStage(entry.stageId)}
                    aria-label={`Inspect Stage ${entry.stageId}: ${matchedStage?.title || entry.stageName}`}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${
                      isSelectedStage
                        ? 'bg-indigo-50/75 border-indigo-400 ring-1 ring-indigo-300 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 tabular-nums">
                          Stage {entry.stageId}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {matchedStage?.title || entry.stageName}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          · {entry.primaryWorkerName} ({entry.processFlowAgent})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 tabular-nums">
                        <span>
                          Success Rate: <strong className="text-slate-900">{entry.successRate.toFixed(1)}%</strong>
                        </span>
                        <span>
                          Duration: <strong className="text-slate-900">{entry.latencyMs} ms</strong>
                        </span>
                        <span>
                          Anomalies: <strong className="text-slate-900">{entry.anomalyCount}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center md:flex-col md:items-end gap-1.5 shrink-0">
                      <span
                        data-testid={`timeline-stage-status-${entry.stageId}`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-bold ${meta.badgeClass}`}
                      >
                        {meta.icon}
                        <span>{entry.status}</span>
                      </span>
                      <span
                        data-testid={`timeline-stage-timestamp-${entry.stageId}`}
                        title={`ISO Completion Timestamp: ${entry.completedAt}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-700 tabular-nums"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Completed {formatStageCompletionTimestamp(entry.completedAt)}</span>
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-700">
              No persisted stage completion timeline found yet for {effectiveIndustryKey}.
            </p>
            <p className="text-xs text-slate-500">
              Click &ldquo;Orchestrate Pipeline&rdquo; above to execute Stages 1–6 and record per-stage timestamps in MongoDB.
            </p>
          </div>
        )}
      </section>

      {/* Deep Dive Workbench Modal */}
      {deepDiveStage && (
        <AgentDeepDiveModal
          stage={deepDiveStage}
          industry={industry}
          nodesMap={nodesMap}
          onUpdateNodesMap={onUpdateNodesMap}
          onRetrospectiveCompleted={onRetrospectiveCompleted}
          onClose={() => setDeepDiveStage(null)}
        />
      )}
    </div>
  );
};
