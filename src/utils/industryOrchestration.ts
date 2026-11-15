import {
  EventTopic,
  IndustryDataBundle,
  LifecycleStage,
  ManagedProgram,
  OkrEnterprisePolicy,
  SignificantDisasterEvent,
  TraceabilityNode
} from '../types/orchestration';
import { evaluateOkrCriticality, isOkrTraceabilityNode } from './headerNotifications';
import { scanPortfolioOkrHealth } from './okrHealthChecker';

export type OrchestrationMode = 'full-pipeline' | 'okr-governance' | 'program-disaster-sync';

export interface OrchestrationActionMeta {
  mode: OrchestrationMode;
  label: string;
  shortLabel: string;
  description: string;
  targetView: 'lifecycle' | 'studio';
  targetStudioTab?: 'okrs' | 'health' | 'programs' | 'disasters';
  expectedOutcome: string;
}

export const ORCHESTRATION_PIPELINE_HELP = {
  title: 'Industry OKR & Program Pipeline Orchestrator',
  purpose:
    'Synchronizes the selected industry and organisation across all OKRs, 6-attribute Business Problems, Active/Initiated Programs, Squad Capacity, and Active Disaster Shocks in one coordinated run.',
  expectations: [
    'Evaluates every industry OKR against Enterprise Policies and the 6-attribute Business Problem standard, surfacing critical (Behind / P0 / <60%) items.',
    'Cross-references Active & Initiated Programs against live Disaster Shocks and >100% squad bottlenecks to generate contingency and FTE rebalancing recommendations.',
    'Refreshes 6-Stage Multi-Agent telemetry & industry attainment scores, streams stage events onto the Event Bus, and triggers alerts in the Header Notification Center.'
  ],
  tips: [
    'Use Full Pipeline when preparing an executive portfolio review or after editing multiple OKRs or triggering a disaster.',
    'Use OKR Governance Audit to inspect SMART/policy gaps and jump straight into OKR & Program Studio.',
    'Use Program & Disaster Sync to align active program roadmaps and squad capacity against active crisis events.'
  ]
};

export const ORCHESTRATION_ACTIONS: OrchestrationActionMeta[] = [
  {
    mode: 'full-pipeline',
    label: 'Run Full Industry OKR & Program Pipeline (Stages 1–6)',
    shortLabel: 'Full Industry Pipeline',
    description:
      'Runs all 6 Supervisor-Worker stages across this industry’s OKRs, Business Problems, Programs, and Disasters, then opens live 6-Stage telemetry.',
    targetView: 'lifecycle',
    expectedOutcome:
      'Updates Stage 1–6 metrics & confidence, refreshes OKR AI recommendations, recalculates industry attainment, and publishes 6 live Event Bus updates.'
  },
  {
    mode: 'okr-governance',
    label: 'Orchestrate Industry OKRs & Policy Health',
    shortLabel: 'OKR & Policy Audit',
    description:
      'Audits all OKRs for critical attainment risk, SMART thresholds, and missing 6-attribute Business Problem fields, then opens OKR & Program Studio.',
    targetView: 'studio',
    targetStudioTab: 'health',
    expectedOutcome:
      'Flags critical & incomplete OKRs in Notification Center and opens OKRHealthChecker so owners can remediate gaps immediately.'
  },
  {
    mode: 'program-disaster-sync',
    label: 'Sync Programs, Capacity & Disaster Contingencies',
    shortLabel: 'Program & Crisis Sync',
    description:
      'Evaluates Active/Initiated Programs against active disaster shocks and overloaded squads, then opens Program & Disaster management.',
    targetView: 'studio',
    targetStudioTab: 'programs',
    expectedOutcome:
      'Identifies impacted programs & overloaded squads, attaches mitigation recommendations, and syncs active crisis alerts.'
  }
];

export interface OrchestrationStageEventDescriptor {
  stageId: number;
  topic: EventTopic;
  sourceAgent: string;
  targetAgent: string;
  summary: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  payload: Record<string, any>;
}

export interface IndustryOrchestrationSummary {
  industryName: string;
  sector: string;
  mode: OrchestrationMode;
  executedAt: string;
  totalOkrs: number;
  criticalOkrCount: number;
  criticalOkrTitles: string[];
  incompleteProblemCount: number;
  policyGapCount: number;
  activeProgramCount: number;
  impactedProgramCount: number;
  totalProgramFte: number;
  overloadedSquadCount: number;
  activeDisasterCount: number;
  disasterShockPct: number;
  attainmentBefore: number;
  attainmentAfter: number;
  overallHealthAfter: 'On Track' | 'At Risk' | 'Behind';
  headline: string;
  recommendations: string[];
}

export interface IndustryOrchestrationResult {
  updatedStages: LifecycleStage[];
  updatedNodesMap: Record<string, TraceabilityNode>;
  updatedAttainment: number;
  updatedHealth: 'On Track' | 'At Risk' | 'Behind';
  stageEvents: OrchestrationStageEventDescriptor[];
  summary: IndustryOrchestrationSummary;
}

function getPolicyGapCount(okrNodes: TraceabilityNode[], policies: OkrEnterprisePolicy[]): number {
  const enforced = policies.filter((p) => p.status === 'Enforced');
  if (enforced.length === 0) return 0;

  let gaps = 0;
  okrNodes.forEach((node) => {
    const measurable = node.measurabilityScore ?? 75;
    const ambition = node.ambitionScore ?? 75;
    const hitsThreshold = enforced.some(
      (p) => measurable < p.minMeasurableScore || ambition < p.minAmbitionScore
    );
    if (hitsThreshold || !node.businessProblem?.causalChainToDollarImpact?.trim()) {
      gaps += 1;
    }
  });
  return gaps;
}

function isProgramImpactedByDisasters(
  program: ManagedProgram,
  activeDisasters: SignificantDisasterEvent[],
  criticalOkrIds: Set<string>
): boolean {
  if (program.linkedOkrId && criticalOkrIds.has(program.linkedOkrId)) return true;
  if (activeDisasters.length === 0) return false;

  const squadNames = new Set(
    (program.resourceAssignments || []).map((r) => r.squadName.toLowerCase())
  );

  return activeDisasters.some((d) =>
    (d.impacts?.affectedSquads || []).some((sq) => squadNames.has(sq.toLowerCase()))
  );
}

export function runIndustryOkrProgramOrchestration(
  bundle: IndustryDataBundle,
  nodesMap: Record<string, TraceabilityNode>,
  mode: OrchestrationMode = 'full-pipeline'
): IndustryOrchestrationResult {
  const allNodes = Object.values(nodesMap);
  const okrNodes = allNodes.filter((n) => isOkrTraceabilityNode(n));
  const programs = bundle.programs || [];
  const activePrograms = programs.filter((p) => p.status === 'Active' || p.status === 'Initiated');
  const activeDisasters = (bundle.activeDisasters || []).filter((d) => d.active);
  const policies = bundle.policies || [];

  const criticalOkrs = okrNodes.filter((n) => evaluateOkrCriticality(n).isCritical);
  const criticalOkrIds = new Set(criticalOkrs.map((n) => n.id));

  const healthScan = scanPortfolioOkrHealth(okrNodes);
  const incompleteProblemCount = healthScan.flaggedCount;
  const policyGapCount = getPolicyGapCount(okrNodes, policies);

  const overloadedSquads = allNodes.filter((n) => (n.squadLoad?.loadPct ?? 0) > 100);
  const impactedPrograms = activePrograms.filter((p) =>
    isProgramImpactedByDisasters(p, activeDisasters, criticalOkrIds)
  );
  const totalProgramFte = activePrograms.reduce(
    (sum, p) =>
      sum + (p.resourceAssignments || []).reduce((s, r) => s + (Number(r.assignedFte) || 0), 0),
    0
  );

  const disasterShockPct = activeDisasters.reduce(
    (sum, d) => sum + (Number(d.impacts?.attainmentDropPct) || 0),
    0
  );

  // Recalculate live industry attainment anchored by OKR progress & active shocks
  const avgOkrProgress =
    okrNodes.length > 0
      ? Math.round(okrNodes.reduce((sum, n) => sum + (Number(n.progress) || 0), 0) / okrNodes.length)
      : bundle.attainment;

  // Apply mild disaster drag (-1/3 of raw shock because active programs absorb part of the shock)
  const effectiveShockPenalty = Math.round(disasterShockPct * 0.35);
  const attainmentBefore = bundle.attainment;
  const updatedAttainment = Math.max(
    18,
    Math.min(99, Math.round((bundle.attainment * 0.45) + (avgOkrProgress * 0.55) + effectiveShockPenalty))
  );

  const updatedHealth: 'On Track' | 'At Risk' | 'Behind' =
    activeDisasters.some((d) => d.severity === 'Critical') || criticalOkrs.some((k) => k.status === 'Behind')
      ? updatedAttainment < 60
        ? 'Behind'
        : 'At Risk'
      : updatedAttainment >= 76 && criticalOkrs.length === 0
      ? 'On Track'
      : updatedAttainment < 55
      ? 'Behind'
      : 'At Risk';

  // Non-destructively enrich OKR AI guidance for critical/incomplete nodes
  const updatedNodesMap: Record<string, TraceabilityNode> = { ...nodesMap };
  okrNodes.forEach((node) => {
    const crit = evaluateOkrCriticality(node);
    const linkedProg = activePrograms.find((p) => p.linkedOkrId === node.id);
    if (crit.isCritical || linkedProg) {
      updatedNodesMap[node.id] = {
        ...node,
        ai: {
          ...node.ai,
          analyse: crit.isCritical
            ? `[Orchestrated ${bundle.name}] ${crit.reason} Linked program: ${linkedProg ? linkedProg.title : 'None assigned'}.`
            : node.ai.analyse,
          recommend:
            activeDisasters.length > 0 && crit.isCritical
              ? `${activeDisasters[0].impacts.mitigationAction} Escalate in OKR & Program Studio.`
              : linkedProg && crit.isCritical
              ? `Rebalance FTE within "${linkedProg.title}" to lift attainment from ${node.progress}%.`
              : node.ai.recommend
        }
      };
    }
  });

  // Refresh 6 stages dynamically with real OKR & Program telemetry
  const stages = Array.isArray(bundle.stages) ? bundle.stages : [];
  const updatedStages: LifecycleStage[] = stages.map((stage) => {
    if (stage.id === 1) {
      return {
        ...stage,
        status: activeDisasters.length > 0 ? 'At Risk' : stage.status,
        simMetrics: {
          ...stage.simMetrics,
          riskAlert:
            activeDisasters.length > 0
              ? `${activeDisasters.length} active disaster event(s) impacting ${bundle.name} strategic themes.`
              : `Strategic themes aligned across ${okrNodes.length} industry OKRs.`,
          recommendedAction: `Focus ${bundle.name} portfolio on ${criticalOkrs.length} critical OKR(s) and ${activePrograms.length} active program(s).`
        }
      };
    }
    if (stage.id === 2) {
      const stageStatus: 'On Track' | 'At Risk' | 'Behind' =
        criticalOkrs.some((k) => k.status === 'Behind')
          ? 'Behind'
          : criticalOkrs.length > 0 || incompleteProblemCount > 0
          ? 'At Risk'
          : 'On Track';
      return {
        ...stage,
        status: stageStatus,
        simMetrics: {
          ...stage.simMetrics,
          riskAlert: `${criticalOkrs.length} critical OKR(s) flagged; ${incompleteProblemCount} OKR(s) need 6-attribute Business Problem completion.`,
          recommendedAction:
            policyGapCount > 0
              ? `Resolve ${policyGapCount} enterprise OKR policy gap(s) in OKR & Program Studio.`
              : `All ${okrNodes.length} OKRs satisfy enforced enterprise policies.`
        }
      };
    }
    if (stage.id === 3) {
      return {
        ...stage,
        status: overloadedSquads.length > 0 || impactedPrograms.length > 0 ? 'At Risk' : 'On Track',
        simMetrics: {
          ...stage.simMetrics,
          resourceConstraint: `${activePrograms.length} active program(s) (${totalProgramFte} FTE allocated); ${overloadedSquads.length} squad(s) >100% load.`,
          recommendedAction:
            impactedPrograms.length > 0
              ? `Rebalance capacity across ${impactedPrograms.length} impacted program(s) (${impactedPrograms[0].title}).`
              : `Maintain current FTE distribution across ${activePrograms.length} active programs.`
        }
      };
    }
    if (stage.id === 4) {
      const stageStatus: 'On Track' | 'At Risk' | 'Behind' =
        activeDisasters.length > 0 ? 'Behind' : criticalOkrs.length > 0 ? 'At Risk' : 'On Track';
      return {
        ...stage,
        status: stageStatus,
        simMetrics: {
          ...stage.simMetrics,
          riskAlert:
            activeDisasters.length > 0
              ? `ACTIVE CRISIS (${activeDisasters.length}): ${activeDisasters.map((d) => d.title).join('; ')} (${disasterShockPct}% shock).`
              : `${criticalOkrs.length} critical OKR signal(s) monitored; 0 active catastrophic disasters.`,
          recommendedAction:
            activeDisasters.length > 0
              ? activeDisasters[0].impacts.mitigationAction
              : `Keep automated Risk Sentinel thresholds active across ${bundle.name}.`
        }
      };
    }
    if (stage.id === 5) {
      return {
        ...stage,
        status: updatedHealth,
        simMetrics: {
          ...stage.simMetrics,
          velocityTrend: `${updatedAttainment}% live attainment (${okrNodes.length} OKRs, ${activePrograms.length} programs)`,
          recommendedAction: `Distribute ${bundle.name} (${bundle.sector}) executive payload covering ${criticalOkrs.length} critical OKR(s) & ${activeDisasters.length} disaster(s).`
        }
      };
    }
    return {
      ...stage,
      simMetrics: {
        ...stage.simMetrics,
        recommendedAction: `Ingested ${criticalOkrs.length} critical OKR root cause(s) and ${impactedPrograms.length} program remediation insight(s) for ${bundle.quarter}.`
      }
    };
  });

  const recommendations: string[] = [];
  if (criticalOkrs.length > 0) {
    recommendations.push(
      `Escalate ${criticalOkrs.length} critical OKR(s): ${criticalOkrs.slice(0, 2).map((k) => k.title).join(' | ')}.`
    );
  }
  if (incompleteProblemCount > 0) {
    recommendations.push(
      `Complete 6-attribute Business Problem definitions on ${incompleteProblemCount} flagged OKR(s) via OKRHealthChecker.`
    );
  }
  if (activeDisasters.length > 0) {
    recommendations.push(
      `Activate disaster contingency for "${activeDisasters[0].title}": ${activeDisasters[0].impacts.mitigationAction}`
    );
  }
  if (impactedPrograms.length > 0 || overloadedSquads.length > 0) {
    recommendations.push(
      `Reallocate squad FTE across ${impactedPrograms.length} impacted program(s) and ${overloadedSquads.length} overloaded squad(s).`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(`Portfolio healthy: all ${okrNodes.length} OKRs and ${activePrograms.length} active programs are aligned.`);
  }

  const stageTopics: Array<{ stageId: number; topic: EventTopic; defaultAgent: string }> = [
    { stageId: 1, topic: 'STRATEGY_RAG_QUERIED', defaultAgent: 'Strategy & Ideation Agent' },
    { stageId: 2, topic: 'KR_REGRESSION_PREDICTED', defaultAgent: 'OKR Quality & Predictor Agent' },
    { stageId: 3, topic: 'GRAPH_TRAVERSAL_EXECUTED', defaultAgent: 'Alignment & Capacity Agent' },
    { stageId: 4, topic: 'RISK_SENTINEL_ALERT', defaultAgent: 'Risk Detection Agent' },
    { stageId: 5, topic: 'EXECUTIVE_PAYLOAD_COMPILED', defaultAgent: 'Executive Reporting Agent' },
    { stageId: 6, topic: 'ROOT_CAUSE_SYNTHESIZED', defaultAgent: 'Retrospective & Learning Agent' }
  ];

  const stageEvents: OrchestrationStageEventDescriptor[] = stageTopics.map(({ stageId, topic, defaultAgent }) => {
    const st = updatedStages.find((s) => s.id === stageId);
    const agentName = st?.agentName || defaultAgent;
    let summary = `Stage ${stageId} orchestrated for ${bundle.name}`;
    let severity: 'info' | 'success' | 'warning' | 'danger' = 'info';

    if (stageId === 1) {
      summary = `[${bundle.name}] Stage 1 Strategy Sync: ${okrNodes.length} OKRs & ${activePrograms.length} active programs mapped (${bundle.sector})`;
      severity = 'info';
    } else if (stageId === 2) {
      summary = `[${bundle.name}] Stage 2 OKR Audit: ${criticalOkrs.length} critical OKR(s), ${incompleteProblemCount} incomplete 6-attr problem(s), ${policyGapCount} policy gap(s)`;
      severity = criticalOkrs.length > 0 ? 'warning' : 'success';
    } else if (stageId === 3) {
      summary = `[${bundle.name}] Stage 3 Program & Capacity Sync: ${activePrograms.length} program(s) (${totalProgramFte} FTE), ${impactedPrograms.length} impacted, ${overloadedSquads.length} overloaded squad(s)`;
      severity = impactedPrograms.length > 0 || overloadedSquads.length > 0 ? 'warning' : 'success';
    } else if (stageId === 4) {
      summary =
        activeDisasters.length > 0
          ? `[${bundle.name}] Stage 4 Risk Radar: ${activeDisasters.length} ACTIVE disaster(s) (${disasterShockPct}% shock) affecting ${impactedPrograms.length} program(s)`
          : `[${bundle.name}] Stage 4 Risk Radar: ${criticalOkrs.length} critical OKR(s) monitored, 0 active disaster shocks`;
      severity = activeDisasters.length > 0 ? 'danger' : criticalOkrs.length > 0 ? 'warning' : 'success';
    } else if (stageId === 5) {
      summary = `[${bundle.name}] Stage 5 Executive Scorecard: Portfolio attainment ${updatedAttainment}% (${updatedHealth})`;
      severity = updatedHealth === 'On Track' ? 'success' : 'warning';
    } else if (stageId === 6) {
      summary = `[${bundle.name}] Stage 6 Learning Loop: ${recommendations[0]}`;
      severity = 'success';
    }

    return {
      stageId,
      topic,
      sourceAgent: agentName,
      targetAgent: 'Supervisor Agent',
      summary,
      severity,
      payload: {
        industry: bundle.name,
        sector: bundle.sector,
        mode,
        stage: stageId,
        criticalOkrs: criticalOkrs.length,
        activePrograms: activePrograms.length,
        activeDisasters: activeDisasters.length,
        attainment: updatedAttainment
      }
    };
  });

  const executedAt = new Date().toISOString();
  const headline = `${bundle.name} (${mode === 'full-pipeline' ? 'Stages 1–6' : mode === 'okr-governance' ? 'OKR Audit' : 'Program & Crisis Sync'}): ${okrNodes.length} OKRs (${criticalOkrs.length} critical), ${activePrograms.length} programs (${totalProgramFte} FTE), ${activeDisasters.length} active disaster(s) · Attainment ${updatedAttainment}%`;

  return {
    updatedStages,
    updatedNodesMap,
    updatedAttainment,
    updatedHealth,
    stageEvents,
    summary: {
      industryName: bundle.name,
      sector: bundle.sector,
      mode,
      executedAt,
      totalOkrs: okrNodes.length,
      criticalOkrCount: criticalOkrs.length,
      criticalOkrTitles: criticalOkrs.map((k) => k.title),
      incompleteProblemCount,
      policyGapCount,
      activeProgramCount: activePrograms.length,
      impactedProgramCount: impactedPrograms.length,
      totalProgramFte,
      overloadedSquadCount: overloadedSquads.length,
      activeDisasterCount: activeDisasters.length,
      disasterShockPct,
      attainmentBefore,
      attainmentAfter: updatedAttainment,
      overallHealthAfter: updatedHealth,
      headline,
      recommendations
    }
  };
}
