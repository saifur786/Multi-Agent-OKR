import {
  computeAnomalyTelemetryStats,
  isSignificantAnomalyDeviation,
  type AnomalyTelemetryStats,
  type WorkerAgentId
} from './workerAgentTelemetry';

export interface ConstituentAgentDefinition {
  agentId: string;
  agentName: string;
  processFlowRole: string;
  latencyShare: number;
  successOffset: number;
  anomalyBias: number;
}

export interface PipelineStageDefinition {
  stageId: number;
  stageName: string;
  processFlowAgent: string;
  primaryWorkerId: WorkerAgentId;
  primaryWorkerName: string;
  constituentAgents: ConstituentAgentDefinition[];
}

export interface ConstituentAgentMetric {
  agentId: string;
  agentName: string;
  processFlowRole: string;
  status: 'healthy' | 'warning' | 'critical';
  successRate: number;
  latencyMs: number;
  anomalyCount: number;
  invocations: number;
}

export interface StageMetricBreakdown {
  stageId: number;
  stageName: string;
  processFlowAgent: string;
  primaryWorkerId: WorkerAgentId;
  primaryWorkerName: string;
  successRate: number;
  latencyMs: number;
  anomalyCount: number;
  constituentAgents: ConstituentAgentMetric[];
}

export interface PersistedStageMetricRecord {
  id: string;
  runId: string;
  run: string;
  industry: string;
  stageId: number;
  stageName: string;
  processFlowAgent: string;
  primaryWorkerId: WorkerAgentId;
  primaryWorkerName: string;
  successRate: number;
  latencyMs: number;
  anomalyCount: number;
  constituentAgents: ConstituentAgentMetric[];
  source: string;
  createdAt: string;
}

export interface StageDrilldownSummary {
  stageId: number;
  stageName: string;
  processFlowAgent: string;
  primaryWorkerId: WorkerAgentId;
  primaryWorkerName: string;
  avgSuccessRate: number;
  avgLatencyMs: number;
  totalAnomalies: number;
  runCount: number;
  anomalyStats: AnomalyTelemetryStats;
  filteredRuns: Array<{
    id: string;
    run: string;
    industry: string;
    mode: string;
    stage: string;
    activeStage: number;
    successRate: number;
    latencyMs: number;
    anomalyCount: number;
    isAnomalySpike: boolean;
    source: string;
    createdAt: string;
  }>;
  constituentAgents: Array<{
    agentId: string;
    agentName: string;
    processFlowRole: string;
    status: 'healthy' | 'warning' | 'critical';
    avgSuccessRate: number;
    avgLatencyMs: number;
    totalAnomalies: number;
    totalInvocations: number;
  }>;
}

export const PIPELINE_STAGE_DEFINITIONS: PipelineStageDefinition[] = [
  {
    stageId: 1,
    stageName: 'Strategy Explorer',
    processFlowAgent: 'OKR & Problem Definition Agent',
    primaryWorkerId: 'strategy-explorer',
    primaryWorkerName: 'Strategy Explorer',
    constituentAgents: [
      {
        agentId: 'strategy-explorer',
        agentName: 'Strategy Explorer',
        processFlowRole: 'Strategic theme synthesis & investment alignment',
        latencyShare: 0.44,
        successOffset: 1.2,
        anomalyBias: 0
      },
      {
        agentId: 'conversational-orchestrator',
        agentName: 'Conversational Orchestrator',
        processFlowRole: 'NL-to-OKR intent translation & proactive routing',
        latencyShare: 0.31,
        successOffset: 0.5,
        anomalyBias: 0
      },
      {
        agentId: 'pillar-rag-retriever',
        agentName: '5-Pillar RAG Retriever',
        processFlowRole: 'Historical & regulatory vector context retrieval',
        latencyShare: 0.25,
        successOffset: -0.6,
        anomalyBias: 0.2
      }
    ]
  },
  {
    stageId: 2,
    stageName: 'OKR Quality',
    processFlowAgent: 'OKR & Problem Definition / Advisors',
    primaryWorkerId: 'okr-quality-auditor',
    primaryWorkerName: 'OKR Quality Auditor',
    constituentAgents: [
      {
        agentId: 'okr-quality-auditor',
        agentName: 'OKR Quality Auditor',
        processFlowRole: '6-attribute Business Problem & policy validation',
        latencyShare: 0.36,
        successOffset: 0.8,
        anomalyBias: 0.35
      },
      {
        agentId: 'multi-lens-advisors',
        agentName: 'Multi-Lens Advisor Committee',
        processFlowRole: 'SMART compliance & polynomial attainment forecast',
        latencyShare: 0.42,
        successOffset: -0.9,
        anomalyBias: 0.25
      },
      {
        agentId: 'policy-guardrail-checker',
        agentName: 'Policy & Ownership Validator',
        processFlowRole: 'Enterprise threshold & HR directory owner verification',
        latencyShare: 0.22,
        successOffset: 1.4,
        anomalyBias: 0.15
      }
    ]
  },
  {
    stageId: 3,
    stageName: 'Alignment',
    processFlowAgent: 'Lineage & Traceability Agent',
    primaryWorkerId: 'alignment-capacity-agent',
    primaryWorkerName: 'Alignment Capacity Agent',
    constituentAgents: [
      {
        agentId: 'alignment-capacity-agent',
        agentName: 'Alignment Capacity Agent',
        processFlowRole: 'Orphan initiative detection & cross-layer mapping',
        latencyShare: 0.41,
        successOffset: 0.4,
        anomalyBias: 0.3
      },
      {
        agentId: 'seven-layer-traverser',
        agentName: '7-Layer Dependency Traverser',
        processFlowRole: 'Business Problem to Squad lineage graph scan',
        latencyShare: 0.32,
        successOffset: 1.1,
        anomalyBias: 0.15
      },
      {
        agentId: 'squad-fte-rebalancer',
        agentName: 'Squad FTE Rebalancer',
        processFlowRole: 'Over-allocated (>100%) ART capacity smoothing',
        latencyShare: 0.27,
        successOffset: -1.1,
        anomalyBias: 0.25
      }
    ]
  },
  {
    stageId: 4,
    stageName: 'Risk Radar',
    processFlowAgent: 'Impact Assessment Agent',
    primaryWorkerId: 'risk-sentinel',
    primaryWorkerName: 'Risk Sentinel',
    constituentAgents: [
      {
        agentId: 'risk-sentinel',
        agentName: 'Risk Sentinel',
        processFlowRole: 'Real-time operational anomaly & disaster blast scan',
        latencyShare: 0.46,
        successOffset: -1.4,
        anomalyBias: 0.55
      },
      {
        agentId: 'servicenow-grc-connector',
        agentName: 'ServiceNow GRC Connector',
        processFlowRole: 'Inbound P1 incident & SLA breach ingestion',
        latencyShare: 0.29,
        successOffset: -0.5,
        anomalyBias: 0.3
      },
      {
        agentId: 'jira-velocity-listener',
        agentName: 'Jira Velocity Listener',
        processFlowRole: 'Sprint velocity dip & blocker webhook analysis',
        latencyShare: 0.25,
        successOffset: 0.3,
        anomalyBias: 0.25
      }
    ]
  },
  {
    stageId: 5,
    stageName: 'Executive Reporting',
    processFlowAgent: 'Reporting & Monitoring Agent',
    primaryWorkerId: 'executive-reporter',
    primaryWorkerName: 'Executive Reporter',
    constituentAgents: [
      {
        agentId: 'executive-reporter',
        agentName: 'Executive Reporter',
        processFlowRole: 'C-Suite portfolio attainment & variance narrative',
        latencyShare: 0.45,
        successOffset: 1.5,
        anomalyBias: 0.05
      },
      {
        agentId: 'portfolio-scorecard-aggregator',
        agentName: 'Portfolio Scorecard Aggregator',
        processFlowRole: 'Budget ROI & KPI rollup telemetry compilation',
        latencyShare: 0.31,
        successOffset: 0.9,
        anomalyBias: 0.05
      },
      {
        agentId: 'brd-rtm-exporter',
        agentName: 'BRD & RTM Exporter',
        processFlowRole: 'Auditable CSV, BRD & RTM compliance generation',
        latencyShare: 0.24,
        successOffset: 1.7,
        anomalyBias: 0
      }
    ]
  },
  {
    stageId: 6,
    stageName: 'Retrospective',
    processFlowAgent: 'Reporting & Continuous Learning',
    primaryWorkerId: 'retrospective-learner',
    primaryWorkerName: 'Retrospective Learner',
    constituentAgents: [
      {
        agentId: 'retrospective-learner',
        agentName: 'Retrospective Learner',
        processFlowRole: '5-Whys root-cause decomposition & lesson capture',
        latencyShare: 0.43,
        successOffset: 0.6,
        anomalyBias: 0.1
      },
      {
        agentId: 'pillar4-kb-vectorizer',
        agentName: 'Pillar 4 KB Vectorizer',
        processFlowRole: 'Closed-loop MongoDB knowledge base persistence',
        latencyShare: 0.33,
        successOffset: 1.1,
        anomalyBias: 0
      },
      {
        agentId: 'owner-alert-dispatcher',
        agentName: 'OKR Owner Alert Dispatcher',
        processFlowRole: 'Targeted escalation & remediation notification delivery',
        latencyShare: 0.24,
        successOffset: 0.9,
        anomalyBias: 0.05
      }
    ]
  }
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function resolveStageDefinition(stageIdOrName: number | string): PipelineStageDefinition {
  if (typeof stageIdOrName === 'number' || /^\d+$/.test(String(stageIdOrName))) {
    const numeric = Number(stageIdOrName);
    const byId = PIPELINE_STAGE_DEFINITIONS.find((s) => s.stageId === numeric);
    if (byId) return byId;
  }
  const needle = String(stageIdOrName || '').toLowerCase().trim();
  const byName = PIPELINE_STAGE_DEFINITIONS.find(
    (s) =>
      s.stageName.toLowerCase() === needle ||
      s.primaryWorkerName.toLowerCase() === needle ||
      s.primaryWorkerId === needle
  );
  return byName || PIPELINE_STAGE_DEFINITIONS[0];
}

export function generateStageMetricsForRun(params: {
  baseSuccessRate: number;
  baseLatencyMs: number;
  baseAnomalyCount: number;
  runIndex?: number;
  activeStage?: number;
  criticalOkrCount?: number;
  activeDisasterCount?: number;
}): StageMetricBreakdown[] {
  const baseSuccess = clamp(Number(params.baseSuccessRate || 92), 50, 99.8);
  const baseLatency = Math.max(180, Math.round(Number(params.baseLatencyMs || 1250)));
  const baseAnomalies = Math.max(0, Math.round(Number(params.baseAnomalyCount || 0)));
  const runIdx = Math.max(0, Number(params.runIndex || 0));
  const criticalCount = Math.max(0, Number(params.criticalOkrCount || 0));
  const disasterCount = Math.max(0, Number(params.activeDisasterCount || 0));

  return PIPELINE_STAGE_DEFINITIONS.map((stageDef) => {
    const stageIdx = stageDef.stageId - 1;
    const isFocusedStage = params.activeStage === stageDef.stageId;
    const wave = ((runIdx + stageIdx * 2) % 5) - 2; // -2..+2 deterministic variance

    // Stage-specific weighting: Risk Radar & OKR Quality carry more latency & anomalies when shocks occur
    const stageLatencyFactor =
      stageDef.stageId === 4
        ? 0.24
        : stageDef.stageId === 2
          ? 0.21
          : stageDef.stageId === 3
            ? 0.18
            : stageDef.stageId === 1
              ? 0.14
              : stageDef.stageId === 5
                ? 0.12
                : 0.11;

    const stageLatencyMs = Math.max(
      70,
      Math.round(baseLatency * stageLatencyFactor + wave * 18 + (isFocusedStage ? 25 : 0))
    );

    const stageSuccessPenalty =
      (stageDef.stageId === 4 ? disasterCount * 2.8 + criticalCount * 0.9 : 0) +
      (stageDef.stageId === 2 ? criticalCount * 1.1 : 0) +
      (stageDef.stageId === 3 ? criticalCount * 0.6 : 0);

    const stageSuccessRate = Number(
      clamp(baseSuccess + (2 - stageIdx) * 0.35 - stageSuccessPenalty + wave * 0.55, 52, 99.7).toFixed(1)
    );

    let stageAnomalyCount = 0;
    if (stageDef.stageId === 4) {
      stageAnomalyCount = Math.max(0, Math.round(baseAnomalies * 0.55 + disasterCount));
    } else if (stageDef.stageId === 2) {
      stageAnomalyCount = Math.max(0, Math.round(baseAnomalies * 0.25 + (criticalCount > 0 ? 1 : 0)));
    } else if (stageDef.stageId === 3) {
      stageAnomalyCount = Math.max(0, Math.round(baseAnomalies * 0.2));
    } else if (stageDef.stageId === 1) {
      stageAnomalyCount = baseAnomalies >= 3 ? 1 : 0;
    } else if (stageDef.stageId === 6) {
      stageAnomalyCount = baseAnomalies >= 4 ? 1 : 0;
    }

    const constituentAgents: ConstituentAgentMetric[] = stageDef.constituentAgents.map((agentDef, aIdx) => {
      const agentSuccess = Number(
        clamp(stageSuccessRate + agentDef.successOffset + ((runIdx + aIdx) % 3 - 1) * 0.4, 50, 99.9).toFixed(1)
      );
      const agentLatency = Math.max(24, Math.round(stageLatencyMs * agentDef.latencyShare));
      const agentAnomalies =
        stageAnomalyCount > 0 && (aIdx === 0 || stageAnomalyCount * agentDef.anomalyBias >= 0.45)
          ? Math.max(1, Math.round(stageAnomalyCount * Math.max(0.35, agentDef.anomalyBias)))
          : 0;
      const status: 'healthy' | 'warning' | 'critical' =
        agentAnomalies >= 2 || agentSuccess < 75
          ? 'critical'
          : agentAnomalies === 1 || agentSuccess < 88
            ? 'warning'
            : 'healthy';

      return {
        agentId: agentDef.agentId,
        agentName: agentDef.agentName,
        processFlowRole: agentDef.processFlowRole,
        status,
        successRate: agentSuccess,
        latencyMs: agentLatency,
        anomalyCount: agentAnomalies,
        invocations: isFocusedStage ? 2 : 1
      };
    });

    return {
      stageId: stageDef.stageId,
      stageName: stageDef.stageName,
      processFlowAgent: stageDef.processFlowAgent,
      primaryWorkerId: stageDef.primaryWorkerId,
      primaryWorkerName: stageDef.primaryWorkerName,
      successRate: stageSuccessRate,
      latencyMs: stageLatencyMs,
      anomalyCount: stageAnomalyCount,
      constituentAgents
    };
  });
}

export function ensureRunStageMetrics<
  T extends {
    id?: string;
    run?: string;
    stage?: string;
    activeStage?: number;
    successRate?: number;
    latencyMs?: number;
    anomalyCount?: number;
    stageMetrics?: StageMetricBreakdown[];
  }
>(run: T, runIndex: number = 0): StageMetricBreakdown[] {
  if (Array.isArray(run.stageMetrics) && run.stageMetrics.length === 6) {
    return run.stageMetrics;
  }
  return generateStageMetricsForRun({
    baseSuccessRate: Number(run.successRate ?? 92),
    baseLatencyMs: Number(run.latencyMs ?? 1250),
    baseAnomalyCount: Number(run.anomalyCount ?? 1),
    runIndex,
    activeStage: Number(run.activeStage || 1)
  });
}

export function computeAllStagesOverview(
  runs: Array<{
    id?: string;
    run?: string;
    stage?: string;
    activeStage?: number;
    successRate?: number;
    latencyMs?: number;
    anomalyCount?: number;
    stageMetrics?: StageMetricBreakdown[];
  }>
): Array<{
  stageId: number;
  stageName: string;
  processFlowAgent: string;
  primaryWorkerId: WorkerAgentId;
  primaryWorkerName: string;
  avgSuccessRate: number;
  avgLatencyMs: number;
  totalAnomalies: number;
  constituentCount: number;
}> {
  const safeRuns = Array.isArray(runs) ? runs : [];
  return PIPELINE_STAGE_DEFINITIONS.map((stageDef) => {
    const perRun = safeRuns.map((run, idx) => {
      const stages = ensureRunStageMetrics(run, idx);
      return stages.find((s) => s.stageId === stageDef.stageId) || stages[0];
    });
    const count = Math.max(1, perRun.length);
    const avgSuccessRate = Number(
      (perRun.reduce((sum, s) => sum + Number(s.successRate || 0), 0) / count).toFixed(1)
    );
    const avgLatencyMs = Math.round(
      perRun.reduce((sum, s) => sum + Number(s.latencyMs || 0), 0) / count
    );
    const totalAnomalies = perRun.reduce((sum, s) => sum + Number(s.anomalyCount || 0), 0);

    return {
      stageId: stageDef.stageId,
      stageName: stageDef.stageName,
      processFlowAgent: stageDef.processFlowAgent,
      primaryWorkerId: stageDef.primaryWorkerId,
      primaryWorkerName: stageDef.primaryWorkerName,
      avgSuccessRate,
      avgLatencyMs,
      totalAnomalies,
      constituentCount: stageDef.constituentAgents.length
    };
  });
}

export function filterInsightsByStage(
  runs: Array<{
    id: string;
    run: string;
    industry?: string;
    mode?: string;
    stage: string;
    activeStage: number;
    successRate: number;
    latencyMs: number;
    anomalyCount?: number;
    source: string;
    createdAt: string;
    stageMetrics?: StageMetricBreakdown[];
  }>,
  selectedStageId: number
): StageDrilldownSummary {
  const stageDef = resolveStageDefinition(selectedStageId);
  const safeRuns = Array.isArray(runs) ? runs : [];

  const stageSeries = safeRuns.map((run, idx) => {
    const breakdown = ensureRunStageMetrics(run, idx);
    const match = breakdown.find((s) => s.stageId === stageDef.stageId) || breakdown[0];
    return {
      run,
      match
    };
  });

  const anomalyStats = computeAnomalyTelemetryStats(
    stageSeries.map(({ match }) => ({ anomalyCount: match.anomalyCount }))
  );

  const filteredRuns = stageSeries.map(({ run, match }) => ({
    id: run.id,
    run: run.run,
    industry: run.industry || 'Enterprise',
    mode: run.mode || 'stage-drilldown',
    stage: stageDef.stageName,
    activeStage: stageDef.stageId,
    successRate: match.successRate,
    latencyMs: match.latencyMs,
    anomalyCount: match.anomalyCount,
    isAnomalySpike: isSignificantAnomalyDeviation(match.anomalyCount, anomalyStats),
    source: run.source,
    createdAt: run.createdAt
  }));

  const count = Math.max(1, filteredRuns.length);
  const avgSuccessRate = Number(
    (filteredRuns.reduce((sum, r) => sum + r.successRate, 0) / count).toFixed(1)
  );
  const avgLatencyMs = Math.round(
    filteredRuns.reduce((sum, r) => sum + r.latencyMs, 0) / count
  );
  const totalAnomalies = filteredRuns.reduce((sum, r) => sum + r.anomalyCount, 0);

  const constituentAgents = stageDef.constituentAgents.map((agentDef) => {
    const snapshots = stageSeries.map(({ match }) =>
      match.constituentAgents.find((a) => a.agentId === agentDef.agentId)
    ).filter((a): a is ConstituentAgentMetric => Boolean(a));

    const snapCount = Math.max(1, snapshots.length);
    const avgAgentSuccess = Number(
      (snapshots.reduce((sum, a) => sum + a.successRate, 0) / snapCount).toFixed(1)
    );
    const avgAgentLatency = Math.round(
      snapshots.reduce((sum, a) => sum + a.latencyMs, 0) / snapCount
    );
    const totalAgentAnomalies = snapshots.reduce((sum, a) => sum + a.anomalyCount, 0);
    const totalInvocations = snapshots.reduce((sum, a) => sum + a.invocations, 0);

    const status: 'healthy' | 'warning' | 'critical' =
      totalAgentAnomalies >= 4 || avgAgentSuccess < 78
        ? 'critical'
        : totalAgentAnomalies > 0 || avgAgentSuccess < 90
          ? 'warning'
          : 'healthy';

    return {
      agentId: agentDef.agentId,
      agentName: agentDef.agentName,
      processFlowRole: agentDef.processFlowRole,
      status,
      avgSuccessRate: avgAgentSuccess,
      avgLatencyMs: avgAgentLatency,
      totalAnomalies: totalAgentAnomalies,
      totalInvocations
    };
  });

  return {
    stageId: stageDef.stageId,
    stageName: stageDef.stageName,
    processFlowAgent: stageDef.processFlowAgent,
    primaryWorkerId: stageDef.primaryWorkerId,
    primaryWorkerName: stageDef.primaryWorkerName,
    avgSuccessRate,
    avgLatencyMs,
    totalAnomalies,
    runCount: filteredRuns.length,
    anomalyStats,
    filteredRuns,
    constituentAgents
  };
}

export function flattenStageMetricsForPersistence(run: {
  id: string;
  run: string;
  industry: string;
  activeStage: number;
  successRate: number;
  latencyMs: number;
  anomalyCount?: number;
  source: string;
  createdAt: string;
  stageMetrics?: StageMetricBreakdown[];
}): PersistedStageMetricRecord[] {
  const breakdown = ensureRunStageMetrics(run, 0);
  return breakdown.map((stage) => ({
    id: `${run.id}-stage-${stage.stageId}`,
    runId: run.id,
    run: run.run,
    industry: run.industry,
    stageId: stage.stageId,
    stageName: stage.stageName,
    processFlowAgent: stage.processFlowAgent,
    primaryWorkerId: stage.primaryWorkerId,
    primaryWorkerName: stage.primaryWorkerName,
    successRate: stage.successRate,
    latencyMs: stage.latencyMs,
    anomalyCount: stage.anomalyCount,
    constituentAgents: stage.constituentAgents,
    source: run.source,
    createdAt: run.createdAt
  }));
}
