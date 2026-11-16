import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Bot,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Layers,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type {
  IndustryDataBundle,
  ManagedProgram,
  OrganisationalPrerequisiteItem,
  SignificantDisasterEvent,
  TraceabilityNode
} from '../types/orchestration';
import {
  buildDecisionMakingEngineSnapshot,
  type InitiativeFundingEvaluation,
  type ReallocationCondition
} from '../utils/decisionMakingEngine';
import { eventBus } from '../utils/eventBus';

interface DecisionMakingEngineViewProps {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  onUpdateNodesMap: React.Dispatch<React.SetStateAction<Record<string, TraceabilityNode>>>;
  onCommitNodesMap: (
    updater:
      | Record<string, TraceabilityNode>
      | ((prev: Record<string, TraceabilityNode>) => Record<string, TraceabilityNode>)
  ) => Promise<boolean>;
  managedPrograms: ManagedProgram[];
  onUpdateManagedPrograms: React.Dispatch<React.SetStateAction<ManagedProgram[]>>;
  activeDisasters: SignificantDisasterEvent[];
  prerequisites?: OrganisationalPrerequisiteItem[];
  canExecuteDecisions: boolean;
  activeUserRoleSummary?: string;
  onNavigateToTraceability: (nodeId: string) => void;
  onNavigateToStudio: () => void;
}

type AttributeFocus = 'all' | 'stop-funding' | 'quantified' | 'drift' | 'reallocation';

interface AiDecisionSynthesisResponse {
  executiveHeadline: string;
  stopFundingReasoning: string;
  prioritisationReasoning: string;
  driftDetectionReasoning: string;
  resourceReallocationReasoning: string;
  recommendedActions: string[];
  source: string;
  persistence: string;
  latencyMs: number;
  generatedAt: string;
}

export const DecisionMakingEngineView: React.FC<DecisionMakingEngineViewProps> = ({
  industry,
  nodesMap,
  onUpdateNodesMap: _onUpdateNodesMap,
  onCommitNodesMap,
  managedPrograms,
  onUpdateManagedPrograms,
  activeDisasters,
  prerequisites,
  canExecuteDecisions,
  activeUserRoleSummary,
  onNavigateToTraceability,
  onNavigateToStudio
}) => {
  const [attributeFocus, setAttributeFocus] = useState<AttributeFocus>('all');
  const [condition, setCondition] = useState<ReallocationCondition>('operational');
  const [selectedDriftProgramId, setSelectedDriftProgramId] = useState<string>('');
  const [stoppedIds, setStoppedIds] = useState<Record<string, boolean>>({});
  const [reclaimedExtraBudgetM, setReclaimedExtraBudgetM] = useState<number>(0);
  const [reclaimedExtraFte, setReclaimedExtraFte] = useState<number>(0);
  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  const [aiSynthesis, setAiSynthesis] = useState<AiDecisionSynthesisResponse | null>(null);
  const [isSynthesizingAi, setIsSynthesizingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const baseSnapshot = useMemo(
    () =>
      buildDecisionMakingEngineSnapshot({
        industry,
        nodesMap,
        managedPrograms,
        activeDisasters,
        prerequisites,
        condition
      }),
    [industry, nodesMap, managedPrograms, activeDisasters, prerequisites, condition]
  );

  const snapshot = useMemo(() => {
    const hasExtraPool = reclaimedExtraBudgetM > 0 || reclaimedExtraFte > 0;
    if (!hasExtraPool) return baseSnapshot;
    return buildDecisionMakingEngineSnapshot({
      industry,
      nodesMap,
      managedPrograms,
      activeDisasters,
      prerequisites,
      condition,
      overrideBudgetPoolM: Number(
        (baseSnapshot.totalReclaimableBudgetM + reclaimedExtraBudgetM).toFixed(2)
      ),
      overrideFtePool: baseSnapshot.totalReclaimableFte + reclaimedExtraFte
    });
  }, [
    baseSnapshot,
    reclaimedExtraBudgetM,
    reclaimedExtraFte,
    industry,
    nodesMap,
    managedPrograms,
    activeDisasters,
    prerequisites,
    condition
  ]);

  const activeDriftProgram = useMemo(() => {
    if (!snapshot.driftModels.length) return null;
    return (
      snapshot.driftModels.find((m) => m.programId === selectedDriftProgramId) ||
      snapshot.driftModels[0]
    );
  }, [snapshot.driftModels, selectedDriftProgramId]);

  const visibleFundingRows = useMemo(
    () => snapshot.fundingEvaluations.slice(0, 6),
    [snapshot.fundingEvaluations]
  );

  const fundingChartData = useMemo(
    () =>
      visibleFundingRows.map((item) => ({
        name: item.title.length > 22 ? `${item.title.slice(0, 20)}..` : item.title,
        fullTitle: item.title,
        valueScore: item.valueContributionScore,
        wasteRisk: item.wasteRiskScore,
        budgetM: item.budgetM,
        verdict: item.verdict
      })),
    [visibleFundingRows]
  );

  const quantifiedChartData = useMemo(
    () =>
      snapshot.quantifiedInvestments.slice(0, 6).map((item) => ({
        name: item.title.length > 15 ? `${item.title.slice(0, 13)}..` : item.title,
        fullTitle: item.title,
        quantifiedScore: item.quantifiedProblemScore,
        opinionScore: item.opinionScore,
        exposureM: item.annualExposureM,
        roiMultiple: item.estimatedRoiMultiple
      })),
    [snapshot.quantifiedInvestments]
  );

  const reallocationChartData = useMemo(
    () =>
      snapshot.reallocationPlan.allocations.map((row) => ({
        name: row.targetTitle.length > 16 ? `${row.targetTitle.slice(0, 14)}..` : row.targetTitle,
        fullTitle: row.targetTitle,
        currentBudgetM: row.currentBudgetM,
        reallocatedBoostM: row.proposedAddBudgetM,
        projectedTotalM: Number((row.currentBudgetM + row.proposedAddBudgetM).toFixed(2)),
        liftPct: row.expectedAttainmentLiftPct
      })),
    [snapshot.reallocationPlan.allocations]
  );

  const handleStopFunding = async (item: InitiativeFundingEvaluation) => {
    if (!canExecuteDecisions) {
      setActionBanner({
        type: 'warning',
        text: 'Current role has read-only access. Switch to Super Admin or OKR Creator to execute funding stops.'
      });
      return;
    }

    const releaseBudget = item.reclaimableBudgetM > 0 ? item.reclaimableBudgetM : Math.max(1.2, item.budgetM);
    const releaseFte = item.reclaimableFte > 0 ? item.reclaimableFte : Math.max(4, item.fte);

    if (item.sourceType === 'program') {
      onUpdateManagedPrograms((prev) =>
        prev.map((prog) =>
          prog.id === item.id
            ? {
                ...prog,
                status: 'Terminated',
                terminationReason: 'Executive Decision Engine: low marginal strategic value contribution.',
                terminationDate: new Date().toISOString().split('T')[0],
                reallocatedHeadcount: releaseFte,
                reallocatedBudget: `$${releaseBudget.toFixed(2)}M`
              }
            : prog
        )
      );
    } else {
      const updater = (prev: Record<string, TraceabilityNode>): Record<string, TraceabilityNode> => {
        const target = prev[item.id];
        if (!target) return prev;
        return {
          ...prev,
          [item.id]: {
            ...target,
            budget: '$0.0M (Reclaimed)',
            progress: Math.min(100, target.progress),
            status: 'Behind' as const,
            ai: {
              ...target.ai,
              optimise: `[Executive Decision Engine: Funding halted; $${releaseBudget.toFixed(2)}M / ${releaseFte} FTE reclaimed.] ${target.ai?.optimise || ''}`.trim()
            }
          }
        };
      };
      await onCommitNodesMap(updater);
    }

    setStoppedIds((prev) => ({ ...prev, [item.id]: true }));
    setReclaimedExtraBudgetM((prev) => Number((prev + releaseBudget).toFixed(2)));
    setReclaimedExtraFte((prev) => prev + releaseFte);

    eventBus.publish({
      topic: 'PROGRAM_TERMINATED',
      sourceAgent: 'Executive Decision Engine (HITL)',
      targetAgent: 'Alignment & Capacity Agent',
      summary: `Stop-funding executed for "${item.title}": $${releaseBudget.toFixed(2)}M and ${releaseFte} FTE reclaimed into agile reallocation pool.`,
      payload: {
        initiativeId: item.id,
        sourceType: item.sourceType,
        reclaimedBudgetM: releaseBudget,
        reclaimedFte: releaseFte
      },
      latencyMs: 38,
      severity: 'warning'
    });

    setActionBanner({
      type: 'success',
      text: `Halted funding for "${item.title}" — $${releaseBudget.toFixed(2)}M and ${releaseFte} FTE added to the Reallocation Pool.`
    });
  };

  const handleApplyRapidReallocation = async () => {
    if (!canExecuteDecisions) {
      setActionBanner({
        type: 'warning',
        text: 'Current role has read-only access. Switch to Super Admin or OKR Creator to commit resource reallocations.'
      });
      return;
    }

    const allocations = snapshot.reallocationPlan.allocations;
    if (allocations.length === 0) return;

    const updater = (prev: Record<string, TraceabilityNode>): Record<string, TraceabilityNode> => {
      const next = { ...prev };
      for (const row of allocations) {
        const existing = next[row.targetId];
        if (!existing) continue;
        const newBudget = row.currentBudgetM + row.proposedAddBudgetM;
        const nextProgress = Math.min(98, Math.round(existing.progress + row.expectedAttainmentLiftPct * 0.55));
        const nextStatus: TraceabilityNode['status'] =
          nextProgress >= 75 ? 'On Track' : existing.status === 'Behind' ? 'At Risk' : existing.status;
        next[row.targetId] = {
          ...existing,
          budget: `$${newBudget.toFixed(2)}M`,
          progress: nextProgress,
          status: nextStatus,
          ai: {
            ...existing.ai,
            optimise: `[Reallocated +$${row.proposedAddBudgetM.toFixed(2)}M / +${row.proposedAddFte} FTE under ${snapshot.reallocationPlan.conditionLabel}.] ${existing.ai?.optimise || ''}`.trim()
          }
        };
      }
      return next;
    };

    await onCommitNodesMap(updater);

    eventBus.publish({
      topic: 'INTERVENTION_APPLIED',
      sourceAgent: 'Executive Decision Engine (HITL)',
      targetAgent: 'Portfolio Execution Engine',
      summary: `Rapid reallocation (${snapshot.reallocationPlan.conditionLabel}): deployed $${snapshot.reallocationPlan.availablePoolBudgetM}M & ${snapshot.reallocationPlan.availablePoolFte} FTE across ${allocations.length} high-ROI streams (+${snapshot.reallocationPlan.projectedPortfolioLiftPct}% lift).`,
      payload: {
        condition,
        allocations
      },
      latencyMs: 42,
      severity: 'info'
    });

    setActionBanner({
      type: 'success',
      text: `Applied rapid reallocation (${snapshot.reallocationPlan.reallocationLeadTimeDays}-day lead time): $${snapshot.reallocationPlan.availablePoolBudgetM}M & ${snapshot.reallocationPlan.availablePoolFte} FTE committed to top ${allocations.length} quantified streams.`
    });
  };

  const handleRefreshAiReasoning = async () => {
    setIsSynthesizingAi(true);
    setAiError(null);
    try {
      const topQuant = snapshot.quantifiedInvestments[0];
      const topDrift = activeDriftProgram || snapshot.driftModels[0];
      const resp = await fetch('/api/agents/decision-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: industry.name,
          quarter: industry.quarter,
          condition,
          snapshotSummary: {
            stopFundingCandidatesCount: snapshot.stopFundingCandidatesCount,
            totalReclaimableBudgetM: snapshot.totalReclaimableBudgetM,
            totalReclaimableFte: snapshot.totalReclaimableFte,
            topQuantifiedTitle: topQuant?.title,
            topQuantifiedExposureM: topQuant?.annualExposureM,
            topQuantifiedRoi: topQuant?.estimatedRoiMultiple,
            topDriftProgram: topDrift?.programTitle,
            topDriftGapPct: topDrift?.currentDriftGapPct,
            weeksBeforeFailure: topDrift?.weeksBeforeFailure,
            projectedCostAtRiskM: topDrift?.projectedCostAtRiskM,
            reallocationLeadTimeDays: snapshot.reallocationPlan.reallocationLeadTimeDays,
            projectedPortfolioLiftPct: snapshot.reallocationPlan.projectedPortfolioLiftPct,
            topTargets: snapshot.reallocationPlan.allocations.map((a) => ({
              title: a.targetTitle,
              addBudgetM: a.proposedAddBudgetM,
              addFte: a.proposedAddFte
            }))
          }
        })
      });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || 'AI Decision Engine synthesis failed');
      }
      setAiSynthesis(data as AiDecisionSynthesisResponse);
      setActionBanner({
        type: 'success',
        text: `Executive AI reasoning refreshed (${data.source} · ${data.persistence} persisted in ${data.latencyMs}ms).`
      });
    } catch (err: any) {
      setAiError(err?.message || 'Unable to refresh AI executive reasoning.');
    } finally {
      setIsSynthesizingAi(false);
    }
  };

  const showSection = (section: AttributeFocus) =>
    attributeFocus === 'all' || attributeFocus === section;

  const stopReasoningText = aiSynthesis?.stopFundingReasoning || snapshot.attributeReasoning.stopFunding;
  const quantifiedReasoningText =
    aiSynthesis?.prioritisationReasoning || snapshot.attributeReasoning.quantifiedPrioritisation;
  const driftReasoningText =
    aiSynthesis?.driftDetectionReasoning ||
    activeDriftProgram?.aiReasoning ||
    snapshot.attributeReasoning.strategicDrift;
  const reallocationReasoningText =
    aiSynthesis?.resourceReallocationReasoning || snapshot.attributeReasoning.resourceReallocation;

  return (
    <div className="space-y-6" data-testid="decision-making-engine-view">
      {/* Executive Control Bar & KPI Strip */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span>Executive Decision Making Engine</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-slate-600">{industry.name} · {industry.quarter}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Capital Discipline, Problem-Quantified Priority &amp; Early Drift Intervention
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {aiSynthesis?.executiveHeadline ||
                'Visualizes stop-funding candidates, business-problem ROI rankings, timeline drift signals with external influences, and rapid reallocation simulations — with live AI reasoning below every decision attribute.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="refresh-ai-decision-reasoning-btn"
              onClick={() => void handleRefreshAiReasoning()}
              disabled={isSynthesizingAi}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizingAi ? 'animate-spin' : ''}`} />
              <span>{isSynthesizingAi ? 'Synthesizing AI Reasoning...' : 'Refresh AI Executive Reasoning'}</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToStudio}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Open OKR Studio</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 4-Metric Executive KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <span>1. Reclaimable Capital</span>
              <Ban className="w-4 h-4 text-rose-600 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                ${snapshot.totalReclaimableBudgetM.toFixed(2)}M
              </span>
              <span className="text-xs font-semibold text-rose-700">
                {snapshot.totalReclaimableFte} FTE
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {snapshot.stopFundingCandidatesCount} stop-funding candidate(s) flagged
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <span>2. Top Quantified Exposure</span>
              <DollarSign className="w-4 h-4 text-indigo-600 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                ${snapshot.topQuantifiedGapM.toFixed(2)}M
              </span>
              <span className="text-xs font-semibold text-indigo-700">
                {snapshot.averageEvidenceCompletenessPct}% Evidence
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Ranked on causal $ impact vs. opinion weights
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <span>3. Early Strategic Drift</span>
              <TrendingDown className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                {snapshot.earlyDriftCount} Program{snapshot.earlyDriftCount === 1 ? '' : 's'}
              </span>
              <span className="text-xs font-semibold text-amber-700">
                ${snapshot.totalCapitalAtDriftRiskM.toFixed(2)}M Risk
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Detected ahead of delivery SLA or budget loss
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
              <span>4. Reallocation Velocity</span>
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2 tabular-nums">
              <span className="text-2xl font-bold text-slate-900">
                {snapshot.reallocationPlan.reallocationLeadTimeDays} Days
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                +{snapshot.reallocationPlan.projectedPortfolioLiftPct}% Lift
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              vs. {snapshot.reallocationPlan.baselineLeadTimeDays}-day quarterly cycle baseline
            </p>
          </div>
        </div>

        {/* Section Focus Filter & Role Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Decision Engine Attributes">
            {(
              [
                { id: 'all', label: 'All 4 Attributes' },
                { id: 'stop-funding', label: '1. Stop Funding' },
                { id: 'quantified', label: '2. Quantified Priority' },
                { id: 'drift', label: '3. Strategic Drift Drill-Down' },
                { id: 'reallocation', label: '4. Rapid Reallocation' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={attributeFocus === tab.id}
                onClick={() => setAttributeFocus(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  attributeFocus === tab.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            Execution Mode:{' '}
            <strong className="text-slate-800">
              {canExecuteDecisions ? 'Executive Write Access' : 'Read-Only Advisory'}
            </strong>
            {activeUserRoleSummary ? ` · ${activeUserRoleSummary}` : ''}
          </span>
        </div>

        {actionBanner && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-xs font-medium flex items-center justify-between gap-3 ${
              actionBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : actionBanner.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{actionBanner.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionBanner(null)}
              className="text-xs font-semibold underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {aiError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>AI Reasoning request failed: {aiError}</span>
          </div>
        )}

        {aiSynthesis?.recommendedActions && aiSynthesis.recommendedActions.length > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Board-Level Recommended Actions ({aiSynthesis.source})</span>
              </span>
              <span className="text-[11px] text-indigo-700 tabular-nums">
                Persisted to {aiSynthesis.persistence} · {aiSynthesis.latencyMs}ms
              </span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-800">
              {aiSynthesis.recommendedActions.map((act, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-indigo-200/80 bg-white px-3 py-2 leading-relaxed"
                >
                  <span className="font-bold text-indigo-700 mr-1.5">{idx + 1}.</span>
                  {act}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ATTRIBUTE 1: Stop Funding Low-Value Initiatives */}
      {showSection('stop-funding') && (
        <section
          data-testid="attribute-stop-funding"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700">
                Attribute 01 · Capital Stop-Loss
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Stop Funding Initiatives That No Longer Contribute Meaningful Value
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Identifies orphaned epics, stalled programs, and low-yield streams consuming budget below the 48/100 value floor.
              </p>
            </div>
            <div className="text-right tabular-nums shrink-0">
              <div className="text-xs text-slate-500">Total Reclaimable Pool</div>
              <div className="text-base font-bold text-rose-700">
                ${snapshot.totalReclaimableBudgetM.toFixed(2)}M · {snapshot.totalReclaimableFte} FTE
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Visualization: Value Score vs Waste Risk Chart */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Value Contribution Score (0–100)</span>
                <span className="text-[11px] font-normal text-slate-500">Threshold: 48/100</span>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fundingChartData}
                    layout="vertical"
                    margin={{ top: 6, right: 20, left: 4, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={132}
                      tick={{ fontSize: 11, fill: '#334155' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}
                      formatter={(val: any, _name: any, props: any) => [
                        `${val}/100 (${props?.payload?.verdict || ''})`,
                        'Value Score'
                      ]}
                      labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullTitle || ''}
                    />
                    <ReferenceLine x={48} stroke="#dc2626" strokeDasharray="4 4" />
                    <Bar dataKey="valueScore" radius={[0, 6, 6, 0]} barSize={20}>
                      {fundingChartData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.verdict === 'Stop Funding'
                              ? '#dc2626'
                              : entry.verdict === 'Review & Trim'
                                ? '#d97706'
                                : '#059669'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-red-600" />
                  Stop Funding (&lt;48)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-amber-600" />
                  Review &amp; Trim (48–65)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                  Protect &amp; Fund (66+)
                </span>
              </div>
            </div>

            {/* Right Actionable Table */}
            <div className="lg:col-span-7 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Initiative</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Value</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Reclaim</th>
                    <th className="py-2.5 px-3 font-semibold">Verdict</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleFundingRows.map((item) => {
                    const isStopped = Boolean(stoppedIds[item.id]);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                            {item.owner} · ${item.budgetM.toFixed(2)}M · {item.progressPct}% progress
                            {item.isOrphan ? ' · Unlinked Orphan' : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold tabular-nums text-slate-800">
                          {item.valueContributionScore}/100
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                          ${item.reclaimableBudgetM.toFixed(2)}M · {item.reclaimableFte} FTE
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              item.verdict === 'Stop Funding'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : item.verdict === 'Review & Trim'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.verdict}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {item.verdict !== 'Protect & Fund' ? (
                            <button
                              type="button"
                              data-testid={`stop-funding-btn-${item.id}`}
                              disabled={isStopped}
                              onClick={() => void handleStopFunding(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Ban className="w-3 h-3" />
                              <span>{isStopped ? 'Reclaimed' : 'Stop Funding'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-700">Protected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Reasoning Directly Below Attribute 1 */}
          <div
            data-testid="ai-reasoning-stop-funding"
            className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-950">
                <span>AI Reasoning — Stop-Funding Discipline</span>
                <span className="text-[11px] font-medium text-indigo-700">
                  ({aiSynthesis ? aiSynthesis.source : 'Continuous Portfolio Valuation'})
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{stopReasoningText}</p>
              {visibleFundingRows[0] && (
                <p className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">Top Candidate Diagnosis:</strong>{' '}
                  {visibleFundingRows[0].aiReasoning}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ATTRIBUTE 2: Prioritised Investment Based on Quantified Business Problems */}
      {showSection('quantified') && (
        <section
          data-testid="attribute-quantified-investment"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                Attribute 02 · Evidence-Led Capital Allocation
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Prioritised Investment Based on Quantified Business Problems Rather Than Opinion
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Re-ranks Key Result funding by annualized $M exposure, ROI multiple, and 6-dimension Business Problem completeness vs. legacy opinion weights.
              </p>
            </div>
            <div className="text-right tabular-nums shrink-0">
              <div className="text-xs text-slate-500">Avg. Problem Evidence</div>
              <div className="text-base font-bold text-indigo-700">
                {snapshot.averageEvidenceCompletenessPct}% Verified
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Chart: Quantified Problem Score vs Opinion Baseline */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Quantified Problem ROI vs. Opinion Score</span>
                <span className="text-[11px] font-normal text-slate-500">0–100 Index</span>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quantifiedChartData} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} interval={0} height={38} />
                    <YAxis domain={[0, 100]} width={32} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}
                      labelFormatter={(_l, p) => p?.[0]?.payload?.fullTitle || ''}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="quantifiedScore" name="Quantified Problem Score" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="opinionScore" name="Opinion / Legacy Priority" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ranked Problem Economics Table */}
            <div className="lg:col-span-7 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Quant. Rank</th>
                    <th className="py-2.5 px-3 font-semibold">Key Result &amp; Quantified Problem</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Exposure</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ROI</th>
                    <th className="py-2.5 px-3 font-semibold text-right">vs Opinion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {snapshot.quantifiedInvestments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold tabular-nums text-indigo-700">
                        #{item.rankByQuantifiedProblem}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.causalChain}
                        </div>
                        <button
                          type="button"
                          onClick={() => onNavigateToTraceability(item.id)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Inspect 7-Layer Lineage</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-800">
                        ${item.annualExposureM.toFixed(2)}M
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-emerald-700 font-bold">
                        {item.estimatedRoiMultiple}x
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        <span
                          className={`inline-flex items-center gap-0.5 font-semibold ${
                            item.rankShift > 0
                              ? 'text-emerald-700'
                              : item.rankShift < 0
                                ? 'text-amber-700'
                                : 'text-slate-600'
                          }`}
                        >
                          {item.rankShift > 0
                            ? `+${item.rankShift} up`
                            : item.rankShift < 0
                              ? `${item.rankShift} down`
                              : 'Aligned'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Reasoning Directly Below Attribute 2 */}
          <div
            data-testid="ai-reasoning-quantified"
            className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-950">
                <span>AI Reasoning — Quantified Business Problem Prioritisation</span>
                <span className="text-[11px] font-medium text-indigo-700">
                  ({aiSynthesis ? aiSynthesis.source : '6-Dimension Causal Scoring'})
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{quantifiedReasoningText}</p>
              {snapshot.quantifiedInvestments[0] && (
                <p className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">#1 Investment Driver:</strong>{' '}
                  {snapshot.quantifiedInvestments[0].aiReasoning}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ATTRIBUTE 3: Detect Strategic Drift Early (Drill-Down Timeline & External Influence) */}
      {showSection('drift') && (
        <section
          data-testid="attribute-strategic-drift"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Attribute 03 · Early Warning &amp; Drill-Down
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Detect Strategic Drift Before Lost Budget or Delivery Failure
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Select any program to inspect its 8-week timeline divergence against baseline plan and the exact external influences driving early drift.
              </p>
            </div>
            <div className="text-right tabular-nums shrink-0">
              <div className="text-xs text-slate-500">Exposure Ahead of Failure</div>
              <div className="text-base font-bold text-amber-700">
                ${snapshot.totalCapitalAtDriftRiskM.toFixed(2)}M at Drift Risk
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Program Drift Selector List */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                Select Program for Timeline Drill-Down
              </div>
              {snapshot.driftModels.map((model) => {
                const isSelected = activeDriftProgram?.programId === model.programId;
                return (
                  <button
                    key={model.programId}
                    type="button"
                    data-testid={`drift-program-select-${model.programId}`}
                    onClick={() => setSelectedDriftProgramId(model.programId)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-500/25'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-snug">
                        {model.programTitle}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 border ${
                          model.driftSeverity === 'Critical Drift'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : model.driftSeverity === 'Early Drift'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {model.driftSeverity}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 tabular-nums">
                      <span>Drift Gap: <strong className="text-slate-900">{model.currentDriftGapPct}%</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Warning: <strong className="text-amber-800">{model.weeksBeforeFailure} wks</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Risk: <strong className="text-rose-700">${model.projectedCostAtRiskM.toFixed(2)}M</strong></span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Interactive Drill-Down Panel: Program Timeline + External Influences */}
            <div
              data-testid="drift-drilldown-panel"
              className="lg:col-span-8 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4"
            >
              {activeDriftProgram ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-700">
                        Drill-Down View · Program Timeline &amp; External Influences
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {activeDriftProgram.programTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Linked KR: {activeDriftProgram.linkedOkrTitle} · Budget ${activeDriftProgram.budgetM.toFixed(2)}M · {activeDriftProgram.fte} FTE
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 tabular-nums shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>{activeDriftProgram.weeksBeforeFailure} Weeks Before SLA / Budget Loss</span>
                    </div>
                  </div>

                  {/* Timeline Chart comparing Planned vs Projected + External Shock Reference Markers */}
                  <div className="h-[240px] w-full bg-white rounded-lg border border-slate-200 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeDriftProgram.timeline} margin={{ top: 14, right: 16, left: -12, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#475569' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} unit="%" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderColor: '#e2e8f0',
                            borderRadius: '10px',
                            fontSize: '12px'
                          }}
                          formatter={(val: any, name: any) => [`${val}%`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        {activeDriftProgram.externalInfluences.map((inf) => (
                          <ReferenceLine
                            key={inf.id}
                            x={inf.timelinePeriod}
                            stroke="#d97706"
                            strokeDasharray="3 3"
                            label={{
                              value: inf.category,
                              position: 'top',
                              fill: '#b45309',
                              fontSize: 10
                            }}
                          />
                        ))}
                        <Area
                          type="monotone"
                          dataKey="plannedProgressPct"
                          name="Planned Baseline %"
                          fill="#e0e7ff"
                          stroke="#4f46e5"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="projectedProgressPct"
                          name="Projected Trajectory %"
                          stroke="#dc2626"
                          strokeWidth={2.5}
                          dot={{ r: 3.5, fill: '#dc2626' }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* External Influence Factors Driving the Drift */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>External Influences Mapped to Program Timeline</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {activeDriftProgram.externalInfluences.map((inf) => (
                        <div
                          key={inf.id}
                          className="rounded-lg border border-slate-200 bg-white p-3 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold text-slate-900">
                              {inf.timelinePeriod} · {inf.category}
                            </span>
                            <span className="font-bold text-rose-700 tabular-nums">
                              {inf.impactPct}% velocity
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800">{inf.label}</div>
                          <div className="text-[11px] text-slate-500">
                            Signal: {inf.sourceSignal}
                          </div>
                          <div className="text-[11px] text-indigo-700 font-medium pt-0.5">
                            Mitigation: {inf.mitigationHint}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No active programs available for drift modeling in this industry.
                </div>
              )}
            </div>
          </div>

          {/* AI Reasoning Directly Below Attribute 3 */}
          <div
            data-testid="ai-reasoning-drift"
            className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-950">
                <span>AI Reasoning — Early Strategic Drift &amp; External Influences</span>
                <span className="text-[11px] font-medium text-indigo-700">
                  ({aiSynthesis ? aiSynthesis.source : 'Timeline Divergence Telemetry'})
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{driftReasoningText}</p>
              {activeDriftProgram && aiSynthesis && (
                <p className="text-[11px] text-slate-600">
                  <strong className="text-slate-800">Selected Program Trace:</strong>{' '}
                  {activeDriftProgram.aiReasoning}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ATTRIBUTE 4: Reallocate Resources Faster Under Changing Conditions */}
      {showSection('reallocation') && (
        <section
          data-testid="attribute-resource-reallocation"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Attribute 04 · Agile Resource Redeployment
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Reallocate Resources Faster When Operational, Market Demand or Regulatory Conditions Change
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Simulates instant redeployment of reclaimed capital &amp; FTEs from low-value initiatives into high-ROI Key Results.
              </p>
            </div>
            <button
              type="button"
              data-testid="apply-reallocation-btn"
              onClick={() => void handleApplyRapidReallocation()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Apply Rapid Reallocation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Condition Switcher */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 mr-1">Condition Trigger:</span>
              {(
                [
                  { id: 'operational', label: 'Operational Disruption' },
                  { id: 'market_demand', label: 'Market Demand Shift' },
                  { id: 'regulatory', label: 'Regulatory Mandate' }
                ] as const
              ).map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  data-testid={`reallocation-condition-${cond.id}`}
                  onClick={() => setCondition(cond.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    condition === cond.id
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-600 tabular-nums">
              Available Pool:{' '}
              <strong className="text-slate-900">
                ${snapshot.reallocationPlan.availablePoolBudgetM.toFixed(2)}M · {snapshot.reallocationPlan.availablePoolFte} FTE
              </strong>
              {' · '}
              Lead Time:{' '}
              <strong className="text-emerald-700">
                {snapshot.reallocationPlan.reallocationLeadTimeDays}d (vs {snapshot.reallocationPlan.baselineLeadTimeDays}d)
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Before vs After Stacked Bar Chart */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Target Stream Funding Shift ($M)</span>
                <span className="text-[11px] font-normal text-emerald-700 tabular-nums">
                  Avg +{snapshot.reallocationPlan.projectedPortfolioLiftPct}% Lift
                </span>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reallocationChartData} margin={{ top: 8, right: 12, left: -12, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" interval={0} tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} unit="M" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '10px',
                        fontSize: '12px'
                      }}
                      formatter={(val: any, name: any) => [`$${val}M`, name]}
                      labelFormatter={(_l, p) => p?.[0]?.payload?.fullTitle || ''}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="currentBudgetM" name="Current Budget ($M)" stackId="a" fill="#94a3b8" />
                    <Bar dataKey="reallocatedBoostM" name="Rapid Boost (+$M)" stackId="a" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Reallocation Breakdown Table */}
            <div className="lg:col-span-7 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Priority Receiving Stream</th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Add Budget</th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">Add FTE</th>
                    <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">OKR Lift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {snapshot.reallocationPlan.allocations.map((row) => (
                    <tr key={row.targetId} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{row.targetTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{row.rationale}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-emerald-700 whitespace-nowrap">
                        +${row.proposedAddBudgetM.toFixed(2)}M
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold tabular-nums text-slate-800 whitespace-nowrap">
                        +{row.proposedAddFte} FTE
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-indigo-700 whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />
                          +{row.expectedAttainmentLiftPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Reasoning Directly Below Attribute 4 */}
          <div
            data-testid="ai-reasoning-reallocation"
            className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-indigo-950">
                <span>AI Reasoning — Rapid Condition-Responsive Reallocation</span>
                <span className="text-[11px] font-medium text-indigo-700">
                  ({aiSynthesis ? aiSynthesis.source : snapshot.reallocationPlan.conditionLabel})
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{reallocationReasoningText}</p>
              <p className="text-[11px] text-slate-600">
                <strong className="text-slate-800">Active Condition Signal:</strong>{' '}
                {snapshot.reallocationPlan.triggerSummary}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default DecisionMakingEngineView;
