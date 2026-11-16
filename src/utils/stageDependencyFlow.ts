import {
  PIPELINE_STAGE_DEFINITIONS,
  generateStageMetricsForRun,
  type StageMetricBreakdown
} from './orchestrationDrilldown';
import type { LifecycleStage } from '../types/orchestration';
import type { TimelineStageEntry } from './orchestrationTimeline';

export type BottleneckSensitivity = 'strict' | 'balanced' | 'relaxed';
export type HandoffChannelType = 'primary-stream' | 'parallel-feed' | 'feedback-loop';
export type BottleneckSeverity = 'optimal' | 'elevated' | 'critical';

export interface StageHandoffSpec {
  id: string;
  sourceStageId: number;
  targetStageId: number;
  eventTopic: string;
  payloadSummary: string;
  channelType: HandoffChannelType;
  queueWeight: number;
}

export interface StageFlowNode {
  stageId: number;
  stageName: string;
  shortName: string;
  agentName: string;
  processFlowAgent: string;
  status: string;
  latencyMs: number;
  latencySharePct: number;
  successRate: number;
  anomalyCount: number;
  confidence: number;
  upstreamWaitMs: number;
  bottleneckSeverity: BottleneckSeverity;
  isBottleneck: boolean;
  bottleneckReason: string;
}

export interface StageFlowEdge {
  id: string;
  sourceStageId: number;
  targetStageId: number;
  eventTopic: string;
  payloadSummary: string;
  channelType: HandoffChannelType;
  transferLatencyMs: number;
  edgeSeverity: BottleneckSeverity;
  isBottleneckEdge: boolean;
  isCriticalPath: boolean;
}

export interface StageDependencySummary {
  totalPipelineLatencyMs: number;
  meanStageLatencyMs: number;
  stdDevLatencyMs: number;
  bottleneckCutoffMs: number;
  elevatedCutoffMs: number;
  peakBottleneckStageId: number;
  peakBottleneckStageName: string;
  peakBottleneckLatencyMs: number;
  bottleneckStageIds: number[];
  bottleneckCount: number;
  asyncHandoffCount: number;
  criticalPathLatencyMs: number;
}

export interface StageDependencyGraph {
  nodes: StageFlowNode[];
  edges: StageFlowEdge[];
  summary: StageDependencySummary;
}

export const STAGE_SHORT_LABELS: Record<number, string> = {
  1: 'Strategy',
  2: 'OKR Quality',
  3: 'Alignment',
  4: 'Risk Radar',
  5: 'Reporting',
  6: 'Retrospective'
};

export const STAGE_HANDOFF_SPECS: StageHandoffSpec[] = [
  {
    id: 'handoff-1-2',
    sourceStageId: 1,
    targetStageId: 2,
    eventTopic: 'STRATEGY_THEMES_PROPOSED',
    payloadSummary: 'Strategic themes, 5-Pillar RAG context & Pre-Requisites envelope',
    channelType: 'primary-stream',
    queueWeight: 0.14
  },
  {
    id: 'handoff-2-3',
    sourceStageId: 2,
    targetStageId: 3,
    eventTopic: 'SMART_OKRS_VALIDATED',
    payloadSummary: 'SMART-scored Objectives/KRs & 6-attribute Business Problems',
    channelType: 'primary-stream',
    queueWeight: 0.16
  },
  {
    id: 'handoff-3-4',
    sourceStageId: 3,
    targetStageId: 4,
    eventTopic: 'LINEAGE_CAPACITY_MAPPED',
    payloadSummary: '7-layer dependency graph, orphan alerts & >100% FTE hotspots',
    channelType: 'primary-stream',
    queueWeight: 0.15
  },
  {
    id: 'handoff-4-5',
    sourceStageId: 4,
    targetStageId: 5,
    eventTopic: 'RISK_IMPACT_ASSESSED',
    payloadSummary: 'Anomaly triggers, ServiceNow/Jira feeds & disaster blast variance',
    channelType: 'primary-stream',
    queueWeight: 0.18
  },
  {
    id: 'handoff-5-6',
    sourceStageId: 5,
    targetStageId: 6,
    eventTopic: 'EXECUTIVE_VARIANCE_PUBLISHED',
    payloadSummary: 'C-Suite attainment scorecard & variance telemetry snapshot',
    channelType: 'primary-stream',
    queueWeight: 0.13
  },
  {
    id: 'handoff-2-5',
    sourceStageId: 2,
    targetStageId: 5,
    eventTopic: 'ADVISORY_FORECAST_SYNCED',
    payloadSummary: 'Multi-lens polynomial attainment forecast stream to Executive Reporter',
    channelType: 'parallel-feed',
    queueWeight: 0.12
  },
  {
    id: 'handoff-4-3',
    sourceStageId: 4,
    targetStageId: 3,
    eventTopic: 'CONTINGENCY_REALLOCATION_TRIGGERED',
    payloadSummary: 'Async risk shock triggering downstream squad FTE rebalancing',
    channelType: 'feedback-loop',
    queueWeight: 0.17
  },
  {
    id: 'handoff-6-1',
    sourceStageId: 6,
    targetStageId: 1,
    eventTopic: 'LESSONS_LEARNED_FED_BACK',
    payloadSummary: '5-Whys lessons learned persisted to Pillar 4 KB for next ideation',
    channelType: 'feedback-loop',
    queueWeight: 0.11
  }
];

const SENSITIVITY_MULTIPLIER: Record<BottleneckSensitivity, { critical: number; elevated: number }> = {
  strict: { critical: 1.12, elevated: 1.0 },
  balanced: { critical: 1.24, elevated: 1.06 },
  relaxed: { critical: 1.38, elevated: 1.14 }
};

export interface StageFlowInputMetric {
  stageId: number;
  latencyMs: number;
  successRate: number;
  anomalyCount: number;
  status?: string;
}

export function buildStageDependencyGraph(params: {
  stages?: LifecycleStage[];
  timelineStages?: TimelineStageEntry[] | null;
  fallbackMetrics?: StageMetricBreakdown[];
  sensitivity?: BottleneckSensitivity;
  activeLatencyOverrides?: Record<number, number>;
}): StageDependencyGraph {
  const sensitivity = params.sensitivity || 'balanced';
  const factors = SENSITIVITY_MULTIPLIER[sensitivity];
  const stages = Array.isArray(params.stages) ? params.stages : [];
  const timelineStages = Array.isArray(params.timelineStages) ? params.timelineStages : [];
  const fallbackBreakdown =
    Array.isArray(params.fallbackMetrics) && params.fallbackMetrics.length === 6
      ? params.fallbackMetrics
      : generateStageMetricsForRun({
          baseSuccessRate: 92.4,
          baseLatencyMs: 1280,
          baseAnomalyCount: stages.some((s) => s.status !== 'On Track') ? 2 : 1,
          runIndex: 0,
          activeStage: 4,
          criticalOkrCount: stages.filter((s) => s.status !== 'On Track').length
        });

  // Collect per-stage normalized metrics across stages 1..6
  const rawNodes = PIPELINE_STAGE_DEFINITIONS.map((def) => {
    const lifecycleStage = stages.find((s) => s.id === def.stageId);
    const timelineEntry = timelineStages.find((t) => t.stageId === def.stageId);
    const breakdownEntry = fallbackBreakdown.find((b) => b.stageId === def.stageId);

    const overrideLatency = params.activeLatencyOverrides?.[def.stageId];
    const baseLatencyMs = Math.max(
      40,
      Math.round(
        overrideLatency !== undefined
          ? overrideLatency
          : timelineEntry?.latencyMs ?? breakdownEntry?.latencyMs ?? 180
      )
    );
    const successRate = Number(
      (timelineEntry?.successRate ?? breakdownEntry?.successRate ?? 92).toFixed(1)
    );
    const anomalyCount = Math.max(
      0,
      Math.round(timelineEntry?.anomalyCount ?? breakdownEntry?.anomalyCount ?? 0)
    );
    const status =
      timelineEntry?.status ||
      lifecycleStage?.status ||
      (anomalyCount >= 3 ? 'Warning' : 'On Track');

    return {
      stageId: def.stageId,
      stageName: def.stageName,
      shortName: STAGE_SHORT_LABELS[def.stageId] || def.stageName,
      agentName: lifecycleStage?.agentName || def.primaryWorkerName,
      processFlowAgent: def.processFlowAgent,
      status,
      latencyMs: baseLatencyMs,
      successRate,
      anomalyCount,
      confidence: Math.round(lifecycleStage?.confidence ?? Math.min(99, Math.max(55, successRate)))
    };
  });

  const totalPipelineLatencyMs = Math.max(
    1,
    rawNodes.reduce((sum, node) => sum + node.latencyMs, 0)
  );
  const meanStageLatencyMs = Math.round(totalPipelineLatencyMs / Math.max(1, rawNodes.length));
  const variance =
    rawNodes.reduce((sum, node) => sum + Math.pow(node.latencyMs - meanStageLatencyMs, 2), 0) /
    Math.max(1, rawNodes.length);
  const stdDevLatencyMs = Math.round(Math.sqrt(variance));

  const bottleneckCutoffMs = Math.max(
    120,
    Math.round(
      Math.max(
        meanStageLatencyMs * factors.critical,
        meanStageLatencyMs + (sensitivity === 'strict' ? 0.55 : sensitivity === 'balanced' ? 0.85 : 1.25) * stdDevLatencyMs
      )
    )
  );
  const elevatedCutoffMs = Math.max(
    90,
    Math.round(
      Math.max(
        meanStageLatencyMs * factors.elevated,
        meanStageLatencyMs + (sensitivity === 'strict' ? 0.1 : 0.3) * stdDevLatencyMs
      )
    )
  );

  let cumulativeUpstreamMs = 0;
  const nodes: StageFlowNode[] = rawNodes.map((node, index) => {
    const latencySharePct = Number(((node.latencyMs / totalPipelineLatencyMs) * 100).toFixed(1));
    const isCritical =
      node.latencyMs >= bottleneckCutoffMs ||
      node.status === 'Failed' ||
      (node.anomalyCount >= 3 && node.latencyMs >= elevatedCutoffMs);
    const isElevated = !isCritical && (node.latencyMs >= elevatedCutoffMs || node.status === 'Warning');

    const bottleneckSeverity: BottleneckSeverity = isCritical
      ? 'critical'
      : isElevated
        ? 'elevated'
        : 'optimal';

    const bottleneckReason = isCritical
      ? `Bottleneck: ${node.latencyMs} ms exceeds ${bottleneckCutoffMs} ms cutoff (${latencySharePct}% of pipeline duration${
          node.anomalyCount > 0 ? `, ${node.anomalyCount} anomaly triggers` : ''
        }).`
      : isElevated
        ? `Elevated latency (${node.latencyMs} ms, ${latencySharePct}% share) approaching ${bottleneckCutoffMs} ms bottleneck cutoff.`
        : `Nominal async execution (${node.latencyMs} ms, ${latencySharePct}% pipeline share).`;

    const upstreamWaitMs = index === 0 ? 0 : cumulativeUpstreamMs;
    cumulativeUpstreamMs += node.latencyMs;

    return {
      ...node,
      latencySharePct,
      upstreamWaitMs,
      bottleneckSeverity,
      isBottleneck: isCritical,
      bottleneckReason
    };
  });

  const nodeById = new Map<number, StageFlowNode>(nodes.map((n) => [n.stageId, n]));
  const peakNode = [...nodes].sort((a, b) => b.latencyMs - a.latencyMs)[0] || nodes[0];

  const edges: StageFlowEdge[] = STAGE_HANDOFF_SPECS.map((spec) => {
    const sourceNode = nodeById.get(spec.sourceStageId);
    const targetNode = nodeById.get(spec.targetStageId);
    const sourceLatency = sourceNode?.latencyMs ?? meanStageLatencyMs;
    const targetLatency = targetNode?.latencyMs ?? meanStageLatencyMs;

    const queuePenalty =
      (sourceNode?.isBottleneck ? 18 : 0) +
      (targetNode?.isBottleneck ? 14 : 0) +
      Math.round((sourceNode?.anomalyCount ?? 0) * 6);
    const transferLatencyMs = Math.max(
      12,
      Math.round(sourceLatency * spec.queueWeight + targetLatency * 0.05 + queuePenalty)
    );

    const isCriticalEdge =
      Boolean(sourceNode?.isBottleneck && targetNode?.bottleneckSeverity !== 'optimal') ||
      Boolean(sourceNode?.isBottleneck && spec.channelType === 'primary-stream') ||
      transferLatencyMs >= Math.max(48, Math.round(bottleneckCutoffMs * 0.22));
    const isElevatedEdge =
      !isCriticalEdge &&
      (sourceNode?.bottleneckSeverity !== 'optimal' ||
        targetNode?.bottleneckSeverity !== 'optimal' ||
        transferLatencyMs >= Math.max(34, Math.round(elevatedCutoffMs * 0.16)));

    const edgeSeverity: BottleneckSeverity = isCriticalEdge
      ? 'critical'
      : isElevatedEdge
        ? 'elevated'
        : 'optimal';

    return {
      id: spec.id,
      sourceStageId: spec.sourceStageId,
      targetStageId: spec.targetStageId,
      eventTopic: spec.eventTopic,
      payloadSummary: spec.payloadSummary,
      channelType: spec.channelType,
      transferLatencyMs,
      edgeSeverity,
      isBottleneckEdge: edgeSeverity === 'critical',
      isCriticalPath: spec.channelType === 'primary-stream'
    };
  });

  const primaryTransferMs = edges
    .filter((e) => e.isCriticalPath)
    .reduce((sum, e) => sum + e.transferLatencyMs, 0);

  return {
    nodes,
    edges,
    summary: {
      totalPipelineLatencyMs,
      meanStageLatencyMs,
      stdDevLatencyMs,
      bottleneckCutoffMs,
      elevatedCutoffMs,
      peakBottleneckStageId: peakNode?.stageId ?? 4,
      peakBottleneckStageName: peakNode?.stageName ?? 'Risk Radar',
      peakBottleneckLatencyMs: peakNode?.latencyMs ?? 0,
      bottleneckStageIds: nodes.filter((n) => n.isBottleneck).map((n) => n.stageId),
      bottleneckCount: nodes.filter((n) => n.isBottleneck).length,
      asyncHandoffCount: edges.length,
      criticalPathLatencyMs: totalPipelineLatencyMs + primaryTransferMs
    }
  };
}
