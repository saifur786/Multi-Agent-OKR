import type {
  IndustryDataBundle,
  ManagedProgram,
  OrganisationalPrerequisiteItem,
  SignificantDisasterEvent,
  TraceabilityNode
} from '../types/orchestration';

export type ReallocationCondition = 'operational' | 'market_demand' | 'regulatory';

export type FundingVerdict = 'Stop Funding' | 'Review & Trim' | 'Protect & Fund';

export interface InitiativeFundingEvaluation {
  id: string;
  sourceType: 'program' | 'epic';
  title: string;
  owner: string;
  status: string;
  budgetM: number;
  fte: number;
  progressPct: number;
  valueContributionScore: number;
  wasteRiskScore: number;
  verdict: FundingVerdict;
  reclaimableBudgetM: number;
  reclaimableFte: number;
  isOrphan: boolean;
  aiReasoning: string;
}

export interface QuantifiedInvestmentItem {
  id: string;
  title: string;
  owner: string;
  status: 'On Track' | 'At Risk' | 'Behind';
  budgetM: number;
  opinionScore: number;
  quantifiedProblemScore: number;
  annualExposureM: number;
  estimatedRoiMultiple: number;
  evidenceCompletenessPct: number;
  rankByOpinion: number;
  rankByQuantifiedProblem: number;
  rankShift: number;
  problemHeadline: string;
  causalChain: string;
  aiReasoning: string;
}

export interface ExternalInfluenceFactor {
  id: string;
  category: 'Operational' | 'Market Demand' | 'Regulatory';
  label: string;
  severity: 'Critical' | 'High' | 'Moderate';
  impactPct: number;
  timelinePeriod: string;
  timelineIndex: number;
  sourceSignal: string;
  mitigationHint: string;
}

export interface ProgramDriftTimelinePoint {
  period: string;
  periodIndex: number;
  plannedProgressPct: number;
  projectedProgressPct: number;
  driftGapPct: number;
  externalShockPct: number;
  milestoneLabel?: string;
  influenceTrigger?: string;
}

export interface ProgramDriftModel {
  programId: string;
  programTitle: string;
  linkedOkrId: string;
  linkedOkrTitle: string;
  status: string;
  budgetM: number;
  fte: number;
  currentDriftGapPct: number;
  projectedCostAtRiskM: number;
  weeksBeforeFailure: number;
  driftSeverity: 'Critical Drift' | 'Early Drift' | 'Aligned';
  timeline: ProgramDriftTimelinePoint[];
  externalInfluences: ExternalInfluenceFactor[];
  aiReasoning: string;
}

export interface ReallocationAllocationRow {
  targetId: string;
  targetTitle: string;
  owner: string;
  currentBudgetM: number;
  proposedAddBudgetM: number;
  currentFte: number;
  proposedAddFte: number;
  expectedAttainmentLiftPct: number;
  rationale: string;
}

export interface ResourceReallocationPlan {
  condition: ReallocationCondition;
  conditionLabel: string;
  triggerSummary: string;
  availablePoolBudgetM: number;
  availablePoolFte: number;
  reallocationLeadTimeDays: number;
  baselineLeadTimeDays: number;
  projectedPortfolioLiftPct: number;
  allocations: ReallocationAllocationRow[];
  aiReasoning: string;
}

export interface DecisionMakingEngineSnapshot {
  industryName: string;
  quarter: string;
  fundingEvaluations: InitiativeFundingEvaluation[];
  stopFundingCandidatesCount: number;
  totalReclaimableBudgetM: number;
  totalReclaimableFte: number;
  quantifiedInvestments: QuantifiedInvestmentItem[];
  averageEvidenceCompletenessPct: number;
  topQuantifiedGapM: number;
  driftModels: ProgramDriftModel[];
  earlyDriftCount: number;
  totalCapitalAtDriftRiskM: number;
  reallocationPlan: ResourceReallocationPlan;
  attributeReasoning: {
    stopFunding: string;
    quantifiedPrioritisation: string;
    strategicDrift: string;
    resourceReallocation: string;
  };
}

export function parseBudgetMillions(rawBudget?: string | number | null): number {
  if (typeof rawBudget === 'number' && Number.isFinite(rawBudget)) {
    return Math.max(0, Number(rawBudget.toFixed(2)));
  }
  const text = String(rawBudget || '').trim();
  if (!text) return 0;
  const match = text.match(/([\d.]+)\s*([mkMK])?/);
  if (!match) return 0;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return 0;
  const unit = (match[2] || 'm').toLowerCase();
  if (unit === 'k') return Number((numeric / 1000).toFixed(2));
  return Number(numeric.toFixed(2));
}

export function extractDollarImpactMillions(text?: string | null, fallback = 4.5): number {
  const raw = String(text || '');
  const match = raw.match(/\$\s*([\d.]+)\s*([mkMK])?/);
  if (!match) return fallback;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  const unit = (match[2] || 'm').toLowerCase();
  return unit === 'k' ? Number((numeric / 1000).toFixed(2)) : Number(numeric.toFixed(2));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function buildInitiativeFundingDecisions(params: {
  nodesMap: Record<string, TraceabilityNode>;
  managedPrograms: ManagedProgram[];
}): InitiativeFundingEvaluation[] {
  const nodes = Object.values(params.nodesMap || {});
  const evaluations: InitiativeFundingEvaluation[] = [];

  for (const prog of params.managedPrograms || []) {
    if (prog.status === 'Terminated') continue;
    const linkedOkr = prog.linkedOkrId ? params.nodesMap[prog.linkedOkrId] : undefined;
    const budgetM = (prog.resourceAssignments || []).reduce(
      (sum, r) => sum + parseBudgetMillions(r.budgetAllocation),
      0
    );
    const fte = (prog.resourceAssignments || []).reduce(
      (sum, r) => sum + Math.max(0, Number(r.assignedFte || 0)),
      0
    );
    const completedSteps = (prog.roadmap || []).filter((r) => r.status === 'Completed').length;
    const totalSteps = Math.max(1, (prog.roadmap || []).length);
    const progressPct = linkedOkr
      ? Number(linkedOkr.progress || 50)
      : Math.round((completedSteps / totalSteps) * 100);
    const hasMetrics = (prog.businessProblem?.metrics || []).length >= 2;
    const dollarExposure = extractDollarImpactMillions(prog.businessProblem?.causalChainToDollarImpact, 6.0);

    const statusPenalty = linkedOkr?.status === 'Behind' ? 22 : linkedOkr?.status === 'At Risk' ? 8 : 0;
    const valueScore = clamp(
      Math.round(
        progressPct * 0.45 +
          (hasMetrics ? 22 : 8) +
          Math.min(25, dollarExposure * 1.4) +
          (linkedOkr ? 14 : 0) -
          statusPenalty
      ),
      18,
      96
    );
    const wasteRisk = clamp(100 - valueScore + (linkedOkr?.isOrphan ? 20 : 0), 5, 95);
    const verdict: FundingVerdict =
      valueScore < 46 ? 'Stop Funding' : valueScore < 65 ? 'Review & Trim' : 'Protect & Fund';

    const reclaimableBudgetM =
      verdict === 'Stop Funding'
        ? Number(Math.max(budgetM, 1.2).toFixed(2))
        : verdict === 'Review & Trim'
          ? Number((budgetM * 0.3).toFixed(2))
          : 0;
    const reclaimableFte =
      verdict === 'Stop Funding'
        ? Math.max(fte, 4)
        : verdict === 'Review & Trim'
          ? Math.max(1, Math.round(fte * 0.25))
          : 0;

    evaluations.push({
      id: prog.id,
      sourceType: 'program',
      title: prog.title,
      owner: linkedOkr?.owner || 'Portfolio Transformation Office',
      status: linkedOkr?.status || prog.status,
      budgetM: Number(budgetM.toFixed(2)),
      fte,
      progressPct,
      valueContributionScore: valueScore,
      wasteRiskScore: wasteRisk,
      verdict,
      reclaimableBudgetM,
      reclaimableFte,
      isOrphan: !linkedOkr,
      aiReasoning:
        verdict === 'Stop Funding'
          ? `Low strategic yield (${valueScore}/100 value score, ${progressPct}% progress) with ${linkedOkr ? 'declining OKR attainment' : 'no linked Layer 3 Key Result'}. Halting releases $${reclaimableBudgetM}M and ${reclaimableFte} FTE.`
          : verdict === 'Review & Trim'
            ? `Moderate value contribution (${valueScore}/100). Trimming 30% non-critical scope recovers $${reclaimableBudgetM}M and ${reclaimableFte} FTE while preserving core SLA milestones.`
            : `High quantified return (${valueScore}/100 value score) anchored to $${dollarExposure}M impact mitigation; maintain full capital allocation.`
    });
  }

  // Evaluate Layer 4/5 initiatives & epics (especially orphan or behind/stalled streams)
  const initiativeNodes = nodes.filter(
    (node) => node.id.includes('-e') || node.id.includes('-p') || node.id.includes('orphan') || node.isOrphan
  );

  for (const node of initiativeNodes) {
    const budgetM = parseBudgetMillions(node.budget);
    if (budgetM <= 0 && !node.isOrphan) continue;
    const progressPct = clamp(Number(node.progress || 0), 0, 100);
    const isOrphan = Boolean(node.isOrphan || (node.parentIds || []).length === 0);
    const fte = Math.max(2, Number(node.squadLoad?.fte || Math.round(budgetM * 1.6) || 4));
    const statusFactor = node.status === 'On Track' ? 28 : node.status === 'At Risk' ? 14 : 2;
    const alignmentBonus = isOrphan ? 0 : 28;
    const valueScore = clamp(Math.round(progressPct * 0.42 + statusFactor + alignmentBonus), 10, 95);
    const wasteRisk = clamp(100 - valueScore + (isOrphan ? 18 : 0), 5, 98);
    const verdict: FundingVerdict =
      isOrphan || valueScore < 48
        ? 'Stop Funding'
        : valueScore < 66 || node.status === 'Behind'
          ? 'Review & Trim'
          : 'Protect & Fund';

    const reclaimableBudgetM =
      verdict === 'Stop Funding'
        ? Number((budgetM > 0 ? budgetM : 1.5).toFixed(2))
        : verdict === 'Review & Trim'
          ? Number((budgetM * 0.35).toFixed(2))
          : 0;
    const reclaimableFte =
      verdict === 'Stop Funding'
        ? fte
        : verdict === 'Review & Trim'
          ? Math.max(1, Math.round(fte * 0.3))
          : 0;

    evaluations.push({
      id: node.id,
      sourceType: 'epic',
      title: node.title,
      owner: node.owner,
      status: node.status,
      budgetM: Number((budgetM > 0 ? budgetM : 1.5).toFixed(2)),
      fte,
      progressPct,
      valueContributionScore: valueScore,
      wasteRiskScore: wasteRisk,
      verdict,
      reclaimableBudgetM,
      reclaimableFte,
      isOrphan,
      aiReasoning: isOrphan
        ? `Unlinked orphan initiative with ${progressPct}% progress and zero parent OKR contribution. Recommend immediate stop-funding to reclaim $${reclaimableBudgetM}M and ${reclaimableFte} FTE.`
        : verdict === 'Stop Funding'
          ? `Execution stalled at ${progressPct}% (${node.status}) with low marginal OKR contribution (${valueScore}/100). Reallocate $${reclaimableBudgetM}M and ${reclaimableFte} FTE to higher-yield streams.`
          : verdict === 'Review & Trim'
            ? `Execution drag detected (${node.status}, ${progressPct}% complete). Descend non-core deliverables to recover $${reclaimableBudgetM}M.`
            : `Strong execution trajectory (${progressPct}% complete, ${valueScore}/100 value score) directly advancing parent strategic OKRs.`
    });
  }

  return evaluations.sort((a, b) => a.valueContributionScore - b.valueContributionScore);
}

export function buildQuantifiedInvestmentRanking(params: {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
}): QuantifiedInvestmentItem[] {
  const rawLayer3 = params.industry.traceability?.[3] || [];
  const krNodes = rawLayer3
    .map((n) => params.nodesMap[n.id] || n)
    .filter(Boolean);

  const items = krNodes.map((node, index) => {
    const budgetM = Math.max(1.2, parseBudgetMillions(node.budget));
    const bp = node.businessProblem;
    const hasDesc = Boolean(bp?.problemDescription && bp.problemDescription.trim().length > 15);
    const hasStakeholders = (bp?.impactedStakeholders || []).length >= 2;
    const hasCausal = Boolean(bp?.causalChainToDollarImpact && bp.causalChainToDollarImpact.trim().length > 10);
    const hasRootCause = Boolean(bp?.rootCause && bp.rootCause.trim().length > 8);
    const hasTiming = Boolean(bp?.targetRemediationTiming && bp.targetRemediationTiming.trim().length > 3);
    const hasLeadingAndLagging =
      (bp?.metrics || []).some((m) => m.metricType === 'Leading') &&
      (bp?.metrics || []).some((m) => m.metricType === 'Lagging');

    const dimensionScore =
      [hasDesc, hasStakeholders, hasCausal, hasRootCause, hasTiming, hasLeadingAndLagging].filter(Boolean)
        .length / 6;
    const evidenceCompletenessPct = Math.round(dimensionScore * 100);
    const annualExposureM = extractDollarImpactMillions(
      bp?.causalChainToDollarImpact,
      Number((budgetM * (node.status === 'Behind' ? 2.4 : node.status === 'At Risk' ? 1.85 : 1.45)).toFixed(2))
    );
    const estimatedRoiMultiple = Number((annualExposureM / Math.max(0.8, budgetM)).toFixed(2));

    const priorityMap: Record<string, number> = {
      'P0 - Critical': 92,
      'P1 - High': 80,
      'P2 - Medium': 64,
      'P3 - Deferred': 44,
      AI_RECOMMENDED: 74
    };
    const opinionScore = clamp(
      node.manualPriority?.priority
        ? priorityMap[node.manualPriority.priority] ?? 72
        : 84 - index * 9,
      40,
      96
    );

    const urgencyBoost = node.status === 'Behind' ? 22 : node.status === 'At Risk' ? 14 : 6;
    const quantifiedProblemScore = clamp(
      Math.round(
        Math.min(34, annualExposureM * 1.9) +
          Math.min(26, estimatedRoiMultiple * 8.5) +
          evidenceCompletenessPct * 0.22 +
          urgencyBoost
      ),
      32,
      99
    );

    return {
      id: node.id,
      title: node.title,
      owner: node.owner,
      status: node.status,
      budgetM: Number(budgetM.toFixed(2)),
      opinionScore,
      quantifiedProblemScore,
      annualExposureM,
      estimatedRoiMultiple,
      evidenceCompletenessPct,
      rankByOpinion: index + 1,
      rankByQuantifiedProblem: index + 1,
      rankShift: 0,
      problemHeadline: bp?.problemDescription || `Quantified execution gap on ${node.title}`,
      causalChain:
        bp?.causalChainToDollarImpact ||
        `Unresolved delivery bottleneck risks $${annualExposureM}M annualized value leakage.`,
      aiReasoning: `Backed by ${evidenceCompletenessPct}% business-problem evidence completeness ($${annualExposureM}M annualized exposure, ${estimatedRoiMultiple}x ROI multiple). Quantified urgency scores ${quantifiedProblemScore}/100 vs. opinion baseline ${opinionScore}/100.`
    };
  });

  const byOpinion = [...items].sort((a, b) => b.opinionScore - a.opinionScore);
  const opinionRankMap = new Map(byOpinion.map((item, idx) => [item.id, idx + 1]));

  const byQuantified = [...items].sort((a, b) => b.quantifiedProblemScore - a.quantifiedProblemScore);
  return byQuantified.map((item, idx) => {
    const qRank = idx + 1;
    const oRank = opinionRankMap.get(item.id) ?? qRank;
    return {
      ...item,
      rankByOpinion: oRank,
      rankByQuantifiedProblem: qRank,
      rankShift: oRank - qRank
    };
  });
}

export function buildStrategicDriftModels(params: {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  managedPrograms: ManagedProgram[];
  activeDisasters: SignificantDisasterEvent[];
  prerequisites?: OrganisationalPrerequisiteItem[];
}): ProgramDriftModel[] {
  const activeCrises = (params.activeDisasters || []).filter((d) => d.active);
  const recentWebhooks = params.industry.recentWebhooks || [];
  const enabledPrereqs = (params.prerequisites || []).filter((p) => p.enabledForAgents);

  const programs = (params.managedPrograms || []).filter((p) => p.status !== 'Terminated');
  const models: ProgramDriftModel[] = programs.map((prog, progIdx) => {
    const linkedOkr = prog.linkedOkrId ? params.nodesMap[prog.linkedOkrId] : undefined;
    const budgetM = (prog.resourceAssignments || []).reduce(
      (sum, r) => sum + parseBudgetMillions(r.budgetAllocation),
      0
    );
    const fte = (prog.resourceAssignments || []).reduce(
      (sum, r) => sum + Math.max(0, Number(r.assignedFte || 0)),
      0
    );

    const externalInfluences: ExternalInfluenceFactor[] = [];

    if (activeCrises.length > 0) {
      const crisis = activeCrises[progIdx % activeCrises.length];
      externalInfluences.push({
        id: `ext-crisis-${prog.id}`,
        category: crisis.type === 'regulatory_shock' ? 'Regulatory' : 'Operational',
        label: crisis.title,
        severity: 'Critical',
        impactPct: crisis.impacts.attainmentDropPct,
        timelinePeriod: 'Wk 4',
        timelineIndex: 3,
        sourceSignal: 'Active Significant Event Trigger',
        mitigationHint: crisis.impacts.mitigationAction
      });
    }

    if (recentWebhooks[progIdx]) {
      const hook = recentWebhooks[progIdx];
      externalInfluences.push({
        id: `ext-hook-${prog.id}`,
        category: 'Operational',
        label: `${hook.source}: ${hook.event}`,
        severity: 'High',
        impactPct: -9,
        timelinePeriod: 'Wk 3',
        timelineIndex: 2,
        sourceSignal: `${hook.source} Webhook Telemetry`,
        mitigationHint: 'Rebalance squad backlog & clear integration queue before milestone gate.'
      });
    } else {
      externalInfluences.push({
        id: `ext-op-${prog.id}`,
        category: 'Operational',
        label: progIdx === 0 ? 'Supply-chain & municipal fiber permitting lag' : 'Cross-system CRM/OSS telemetry latency',
        severity: 'High',
        impactPct: -8,
        timelinePeriod: 'Wk 3',
        timelineIndex: 2,
        sourceSignal: 'Jira / Planview Delivery Telemetry',
        mitigationHint: 'Stage parallel contractor crews and decouple external dependency gates.'
      });
    }

    const regPrereq = enabledPrereqs.find((p) =>
      p.label.toLowerCase().includes('risk') || p.label.toLowerCase().includes('rule')
    );
    externalInfluences.push({
      id: `ext-reg-${prog.id}`,
      category: progIdx % 2 === 0 ? 'Market Demand' : 'Regulatory',
      label:
        progIdx % 2 === 0
          ? `${params.industry.name} enterprise SLA & peak demand surge (+24% load)`
          : regPrereq
            ? `${regPrereq.label}: Q1 mandatory compliance checkpoint`
            : 'Mandatory sector audit & reporting checkpoint',
      severity: progIdx % 2 === 0 ? 'High' : 'Moderate',
      impactPct: progIdx % 2 === 0 ? -7 : -5,
      timelinePeriod: 'Wk 5',
      timelineIndex: 4,
      sourceSignal: progIdx % 2 === 0 ? 'Market & Customer Demand Signal' : 'Governance Policy KB',
      mitigationHint:
        progIdx % 2 === 0
          ? 'Auto-scale elastic capacity and prioritize peak-cluster rollouts.'
          : 'Embed automated compliance evidence capture into Sprint 4 gate.'
    });

    const baseProgress = linkedOkr ? Number(linkedOkr.progress || 58) : 64;
    const statusDrag = linkedOkr?.status === 'Behind' ? 14 : linkedOkr?.status === 'At Risk' ? 8 : 3;
    const externalDragTotal = externalInfluences.reduce((sum, e) => sum + Math.abs(e.impactPct), 0);

    const periods = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];
    const timeline: ProgramDriftTimelinePoint[] = periods.map((period, idx) => {
      const planned = clamp(Math.round(32 + idx * 9.2), 20, 100);
      const shockHere = externalInfluences
        .filter((e) => e.timelineIndex <= idx)
        .reduce((sum, e) => sum + Math.abs(e.impactPct) * 0.45, 0);
      const projected = clamp(
        Math.round(planned - (idx >= 2 ? statusDrag * 0.55 + shockHere * 0.6 : 1) + (baseProgress - 60) * 0.15),
        15,
        98
      );
      const influenceHere = externalInfluences.find((e) => e.timelineIndex === idx);
      const milestone = prog.roadmap?.[Math.floor(idx / 3)]?.milestone;

      return {
        period,
        periodIndex: idx,
        plannedProgressPct: planned,
        projectedProgressPct: projected,
        driftGapPct: Math.max(0, Number((planned - projected).toFixed(1))),
        externalShockPct: influenceHere ? Math.abs(influenceHere.impactPct) : 0,
        milestoneLabel: idx % 3 === 1 ? milestone : undefined,
        influenceTrigger: influenceHere?.label
      };
    });

    const peakDrift = Math.max(...timeline.map((t) => t.driftGapPct), statusDrag);
    const driftSeverity: ProgramDriftModel['driftSeverity'] =
      peakDrift >= 14 ? 'Critical Drift' : peakDrift >= 7 ? 'Early Drift' : 'Aligned';
    const projectedCostAtRiskM = Number(((budgetM || 6.5) * (peakDrift / 100) * 1.4).toFixed(2));
    const weeksBeforeFailure = driftSeverity === 'Critical Drift' ? 2 : driftSeverity === 'Early Drift' ? 4 : 8;

    return {
      programId: prog.id,
      programTitle: prog.title,
      linkedOkrId: linkedOkr?.id || prog.linkedOkrId || 'okr-unlinked',
      linkedOkrTitle: linkedOkr?.title || prog.title,
      status: linkedOkr?.status || prog.status,
      budgetM: Number((budgetM || 6.5).toFixed(2)),
      fte: fte || 12,
      currentDriftGapPct: Number(peakDrift.toFixed(1)),
      projectedCostAtRiskM,
      weeksBeforeFailure,
      driftSeverity,
      timeline,
      externalInfluences,
      aiReasoning: `Detected ${peakDrift.toFixed(1)}% schedule-to-plan divergence starting at Wk 3 (${weeksBeforeFailure} weeks ahead of potential SLA breach or $${projectedCostAtRiskM}M budget loss), driven primarily by ${externalInfluences[0]?.label || 'operational variance'}.`
    };
  });

  return models.sort((a, b) => b.currentDriftGapPct - a.currentDriftGapPct);
}

export function computeResourceReallocationPlan(params: {
  condition: ReallocationCondition;
  fundingEvaluations: InitiativeFundingEvaluation[];
  quantifiedInvestments: QuantifiedInvestmentItem[];
  driftModels: ProgramDriftModel[];
  overrideBudgetPoolM?: number;
  overrideFtePool?: number;
}): ResourceReallocationPlan {
  const conditionMeta: Record<
    ReallocationCondition,
    { label: string; trigger: string; focusKeywords: string[]; leadTimeDays: number; liftFactor: number }
  > = {
    operational: {
      label: 'Operational Disruption & Bottleneck Surge',
      trigger: 'Critical latency spikes, delivery squad overload (>100%), or infrastructure failover alerts.',
      focusKeywords: ['latency', 'fiber', 'resilience', 'outage', 'network', 'core', 'dispatch'],
      leadTimeDays: 5,
      liftFactor: 1.35
    },
    market_demand: {
      label: 'Market Demand & Subscriber Shift',
      trigger: 'Rapid shift in customer adoption, churn pressure, or high-margin segment demand.',
      focusKeywords: ['churn', '5g', 'subscriber', 'customer', 'growth', 'adoption', 'digital'],
      leadTimeDays: 6,
      liftFactor: 1.4
    },
    regulatory: {
      label: 'Regulatory & Compliance Mandate',
      trigger: 'Updated government policy rules, audit deadlines, or mandatory security resilience guardrails.',
      focusKeywords: ['compliance', 'security', 'resilience', 'audit', 'policy', 'fraud', 'privacy'],
      leadTimeDays: 4,
      liftFactor: 1.25
    }
  };

  const meta = conditionMeta[params.condition];
  const naturalBudgetPool = params.fundingEvaluations.reduce(
    (sum, item) => sum + item.reclaimableBudgetM,
    0
  );
  const naturalFtePool = params.fundingEvaluations.reduce(
    (sum, item) => sum + item.reclaimableFte,
    0
  );

  const availablePoolBudgetM = Number(
    (params.overrideBudgetPoolM ?? (naturalBudgetPool > 0 ? naturalBudgetPool : 3.6)).toFixed(2)
  );
  const availablePoolFte = Math.max(
    4,
    Math.round(params.overrideFtePool ?? (naturalFtePool > 0 ? naturalFtePool : 14))
  );

  const scoredTargets = (params.quantifiedInvestments || [])
    .map((inv) => {
      const lower = `${inv.title} ${inv.problemHeadline}`.toLowerCase();
      const keywordHits = meta.focusKeywords.filter((kw) => lower.includes(kw)).length;
      const priorityScore = inv.quantifiedProblemScore + keywordHits * 12 + (inv.status === 'Behind' ? 10 : 0);
      return { inv, priorityScore, keywordHits };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 3);

  const totalScore = scoredTargets.reduce((sum, t) => sum + Math.max(1, t.priorityScore), 0) || 1;
  const allocations: ReallocationAllocationRow[] = scoredTargets.map(({ inv, priorityScore, keywordHits }) => {
    const share = Math.max(0.18, priorityScore / totalScore);
    const normalizedShare = share / scoredTargets.reduce((s, t) => s + Math.max(0.18, t.priorityScore / totalScore), 0);
    const addBudget = Number((availablePoolBudgetM * normalizedShare).toFixed(2));
    const addFte = Math.max(1, Math.round(availablePoolFte * normalizedShare));
    const liftPct = Number(
      clamp((addBudget / Math.max(1.5, inv.budgetM)) * 12 * meta.liftFactor, 2.4, 18.5).toFixed(1)
    );

    return {
      targetId: inv.id,
      targetTitle: inv.title,
      owner: inv.owner,
      currentBudgetM: inv.budgetM,
      proposedAddBudgetM: addBudget,
      currentFte: Math.max(6, Math.round(inv.budgetM * 2)),
      proposedAddFte: addFte,
      expectedAttainmentLiftPct: liftPct,
      rationale:
        keywordHits > 0
          ? `Direct alignment to ${meta.label} (${inv.estimatedRoiMultiple}x ROI, $${inv.annualExposureM}M exposure).`
          : `Top quantified business problem priority (${inv.quantifiedProblemScore}/100) requiring immediate capacity boost.`
    };
  });

  const projectedPortfolioLiftPct = Number(
    (
      allocations.reduce((sum, row) => sum + row.expectedAttainmentLiftPct, 0) /
      Math.max(1, allocations.length)
    ).toFixed(1)
  );

  return {
    condition: params.condition,
    conditionLabel: meta.label,
    triggerSummary: meta.trigger,
    availablePoolBudgetM,
    availablePoolFte,
    reallocationLeadTimeDays: meta.leadTimeDays,
    baselineLeadTimeDays: 28,
    projectedPortfolioLiftPct,
    allocations,
    aiReasoning: `Under "${meta.label}", automated stop-funding frees $${availablePoolBudgetM}M and ${availablePoolFte} FTE for redeployment within ${meta.leadTimeDays} days (vs. 28-day quarterly cycle), raising target OKR attainment by an estimated +${projectedPortfolioLiftPct}%.`
  };
}

export function buildDecisionMakingEngineSnapshot(params: {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  managedPrograms: ManagedProgram[];
  activeDisasters: SignificantDisasterEvent[];
  prerequisites?: OrganisationalPrerequisiteItem[];
  condition?: ReallocationCondition;
  overrideBudgetPoolM?: number;
  overrideFtePool?: number;
}): DecisionMakingEngineSnapshot {
  const fundingEvaluations = buildInitiativeFundingDecisions({
    nodesMap: params.nodesMap,
    managedPrograms: params.managedPrograms
  });

  const stopCandidates = fundingEvaluations.filter((item) => item.verdict === 'Stop Funding');
  const totalReclaimableBudgetM = Number(
    fundingEvaluations.reduce((sum, item) => sum + item.reclaimableBudgetM, 0).toFixed(2)
  );
  const totalReclaimableFte = fundingEvaluations.reduce((sum, item) => sum + item.reclaimableFte, 0);

  const quantifiedInvestments = buildQuantifiedInvestmentRanking({
    industry: params.industry,
    nodesMap: params.nodesMap
  });

  const averageEvidenceCompletenessPct =
    quantifiedInvestments.length > 0
      ? Math.round(
          quantifiedInvestments.reduce((sum, i) => sum + i.evidenceCompletenessPct, 0) /
            quantifiedInvestments.length
        )
      : 0;

  const topQuantified = quantifiedInvestments[0];
  const topQuantifiedGapM = topQuantified ? topQuantified.annualExposureM : 0;

  const driftModels = buildStrategicDriftModels({
    industry: params.industry,
    nodesMap: params.nodesMap,
    managedPrograms: params.managedPrograms,
    activeDisasters: params.activeDisasters,
    prerequisites: params.prerequisites
  });

  const earlyDriftCount = driftModels.filter((d) => d.driftSeverity !== 'Aligned').length;
  const totalCapitalAtDriftRiskM = Number(
    driftModels.reduce((sum, d) => sum + d.projectedCostAtRiskM, 0).toFixed(2)
  );

  const reallocationPlan = computeResourceReallocationPlan({
    condition: params.condition || 'operational',
    fundingEvaluations,
    quantifiedInvestments,
    driftModels,
    overrideBudgetPoolM: params.overrideBudgetPoolM,
    overrideFtePool: params.overrideFtePool
  });

  const topDrift = driftModels[0];

  return {
    industryName: params.industry.name,
    quarter: params.industry.quarter,
    fundingEvaluations,
    stopFundingCandidatesCount: stopCandidates.length,
    totalReclaimableBudgetM,
    totalReclaimableFte,
    quantifiedInvestments,
    averageEvidenceCompletenessPct,
    topQuantifiedGapM,
    driftModels,
    earlyDriftCount,
    totalCapitalAtDriftRiskM,
    reallocationPlan,
    attributeReasoning: {
      stopFunding:
        stopCandidates.length > 0
          ? `${stopCandidates.length} initiative(s) led by "${stopCandidates[0].title}" score below the 48/100 value threshold. Halting or trimming low-yield work unlocks $${totalReclaimableBudgetM}M and ${totalReclaimableFte} FTE without harming strategic OKRs.`
          : `Active portfolio initiatives are currently linked to strategic Key Results; incremental scope trims can still free $${totalReclaimableBudgetM}M and ${totalReclaimableFte} FTE for higher-ROI work.`,
      quantifiedPrioritisation: topQuantified
        ? `"${topQuantified.title}" leads quantified investment priority (${topQuantified.quantifiedProblemScore}/100, $${topQuantified.annualExposureM}M annualized exposure, ${topQuantified.estimatedRoiMultiple}x ROI), ranking ${topQuantified.rankShift > 0 ? `${topQuantified.rankShift} slot(s) higher than opinion-based priority` : 'at the top across both evidence and leadership weights'}.`
        : 'All OKR investments are evaluated against quantified business problem metrics and causal dollar impact.',
      strategicDrift: topDrift
        ? `"${topDrift.programTitle}" shows ${topDrift.currentDriftGapPct}% early timeline divergence (${topDrift.weeksBeforeFailure}-week warning before $${topDrift.projectedCostAtRiskM}M loss) triggered by ${topDrift.externalInfluences[0]?.label || 'external operational pressure'}.`
        : 'No active programs exhibit material strategic drift.',
      resourceReallocation: reallocationPlan.aiReasoning
    }
  };
}
