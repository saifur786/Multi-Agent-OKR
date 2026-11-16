import type { TraceabilityNode } from '../types/orchestration';
import {
  PIPELINE_STAGE_DEFINITIONS,
  ensureRunStageMetrics,
  type StageMetricBreakdown
} from './orchestrationDrilldown';
import {
  buildDefaultAgentThresholdConfigs,
  computeStageThresholdSummary,
  type AgentAnomalyThresholdConfig
} from './riskSentinelThresholds';
import {
  computeAnomalyTelemetryStats,
  isSignificantAnomalyDeviation,
  type AnomalySensitivityLevel
} from './workerAgentTelemetry';

export interface MatrixOkrInput {
  id: string;
  title: string;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Behind';
  owner: string;
  isOrphan?: boolean;
  hasBusinessProblem?: boolean;
}

export interface AgentImpactMatrixOkrColumn {
  okrId: string;
  code: string;
  title: string;
  shortTitle: string;
  attainmentPct: number;
  status: 'On Track' | 'At Risk' | 'Behind';
  owner: string;
}

export interface AgentImpactMatrixStageRow {
  stageId: number;
  stageName: string;
  shortName: string;
  primaryWorkerName: string;
  totalAnomalies: number;
  spikeCount: number;
  sensitivity: AnomalySensitivityLevel;
  effectiveThreshold: number;
}

export type CorrelationImpactBand =
  | 'critical-drag'
  | 'moderate-drag'
  | 'neutral'
  | 'positive-lift';

export interface AgentImpactMatrixCell {
  id: string;
  stageId: number;
  stageName: string;
  stageShortName: string;
  okrId: string;
  okrCode: string;
  okrTitle: string;
  okrShortTitle: string;
  correlation: number; // Pearson r in [-1, 1]
  impactDeltaPct: number; // Estimated OKR attainment delta (%)
  anomalyCount: number;
  spikeCount: number;
  attainmentPct: number;
  okrStatus: 'On Track' | 'At Risk' | 'Behind';
  impactBand: CorrelationImpactBand;
  rationale: string;
}

export interface AgentImpactMatrixData {
  stages: AgentImpactMatrixStageRow[];
  okrs: AgentImpactMatrixOkrColumn[];
  cells: AgentImpactMatrixCell[];
  summary: {
    totalPairs: number;
    strongestNegativeCell: AgentImpactMatrixCell | null;
    strongestPositiveCell: AgentImpactMatrixCell | null;
    avgAbsCorrelation: number;
  };
}

export interface MatrixRunInput {
  id?: string;
  run?: string;
  activeStage?: number;
  successRate?: number;
  latencyMs?: number;
  anomalyCount?: number;
  stageMetrics?: StageMetricBreakdown[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function truncateLabel(text: string, maxLen: number): string {
  const clean = String(text || '').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(4, maxLen - 1)).trimEnd()}…`;
}

export function extractMatrixOkrs(
  traceability?: Record<number, TraceabilityNode[]>,
  nodesMap?: Record<string, TraceabilityNode>
): MatrixOkrInput[] {
  const layer3 = Array.isArray(traceability?.[3]) ? traceability![3] : [];
  const layer2 = Array.isArray(traceability?.[2]) ? traceability![2] : [];
  const mapEntries = nodesMap ? Object.values(nodesMap) : [];

  const sourceNodes =
    layer3.length > 0
      ? layer3
      : layer2.length > 0
        ? layer2
        : mapEntries.filter((n) => n && typeof n.progress === 'number');

  const resolved = sourceNodes
    .slice(0, 6)
    .map((node) => {
      const liveNode = (nodesMap && nodesMap[node.id]) || node;
      return {
        id: liveNode.id,
        title: liveNode.title,
        progress: clamp(Math.round(Number(liveNode.progress ?? 0)), 0, 100),
        status: liveNode.status || 'On Track',
        owner: liveNode.owner || 'Unassigned',
        isOrphan: Boolean(liveNode.isOrphan),
        hasBusinessProblem: Boolean(liveNode.businessProblem?.problemDescription)
      };
    });

  return resolved;
}

/**
 * Deterministic Pearson correlation between two equal-length numeric series.
 * Returns a rounded value in [-1, 1], defaulting to 0 when variance is zero.
 */
export function computePearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const denom = Math.sqrt(denX * denY);
  if (denom <= 1e-9) return 0;
  return Number(clamp(num / denom, -1, 1).toFixed(2));
}

export function classifyCorrelationBand(correlation: number): CorrelationImpactBand {
  if (correlation <= -0.5) return 'critical-drag';
  if (correlation <= -0.2) return 'moderate-drag';
  if (correlation >= 0.25) return 'positive-lift';
  return 'neutral';
}

const STAGE_SHORT_NAMES: Record<number, string> = {
  1: 'Strategy',
  2: 'OKR Quality',
  3: 'Alignment',
  4: 'Risk Radar',
  5: 'Reporting',
  6: 'Retrospective'
};

/**
 * Computes domain coupling weight between a pipeline stage and an OKR node.
 * Higher positive sensitivity => stage anomaly triggers strongly depress that OKR's attainment.
 * Negative coupling (used for Stage 5/6 healthy closed-loop remediation) => anomaly triggers stimulate corrective lift.
 */
function computeStageOkrCoupling(
  stageId: number,
  okr: MatrixOkrInput,
  okrIdx: number
): number {
  const statusFactor =
    okr.status === 'Behind' ? 1.25 : okr.status === 'At Risk' ? 1.0 : 0.45;
  const titleLower = okr.title.toLowerCase();

  let baseCoupling = 0.35;
  switch (stageId) {
    case 1: // Strategy Explorer: stronger impact on coverage/growth KRs, low on operational KRs
      baseCoupling =
        titleLower.includes('coverage') ||
        titleLower.includes('growth') ||
        titleLower.includes('revenue') ||
        titleLower.includes('market')
          ? 0.72
          : 0.28;
      break;
    case 2: // OKR Quality: high impact on KRs with unresolved business problems or At-Risk status
      baseCoupling = okr.hasBusinessProblem || okr.status !== 'On Track' ? 0.84 : 0.32;
      break;
    case 3: // Alignment & Capacity: high impact on orphan/infra/latency KRs
      baseCoupling =
        okr.isOrphan ||
        titleLower.includes('expand') ||
        titleLower.includes('latency') ||
        titleLower.includes('capacity')
          ? 0.82
          : 0.38;
      break;
    case 4: // Risk Radar: strongest direct shock impact on At-Risk/Behind KRs
      baseCoupling = okr.status === 'On Track' ? 0.58 : 1.05;
      break;
    case 5: // Executive Reporting: monitors variance; positive correlation on On-Track telemetry KRs
      baseCoupling = okr.status === 'On Track' ? -0.45 : 0.22;
      break;
    case 6: // Retrospective & Learning: closed-loop learning lifts automated & churn-recovery KRs
      baseCoupling =
        okr.status === 'On Track' || titleLower.includes('automate') || titleLower.includes('churn')
          ? -0.62
          : 0.24;
      break;
    default:
      baseCoupling = 0.35;
  }

  const columnVariation = ((okrIdx % 3) - 1) * 0.08;
  return clamp(baseCoupling * statusFactor + columnVariation, -0.95, 1.35);
}

export function buildAgentImpactMatrix(params: {
  runs: MatrixRunInput[];
  okrs: MatrixOkrInput[];
  thresholdConfigs?: AgentAnomalyThresholdConfig[];
}): AgentImpactMatrixData {
  const safeRuns = Array.isArray(params.runs) ? params.runs : [];
  const safeOkrs = Array.isArray(params.okrs) ? params.okrs : [];
  const activeConfigs =
    params.thresholdConfigs && params.thresholdConfigs.length > 0
      ? params.thresholdConfigs
      : buildDefaultAgentThresholdConfigs();

  const okrColumns: AgentImpactMatrixOkrColumn[] = safeOkrs.map((okr, idx) => ({
    okrId: okr.id,
    code: `KR-${idx + 1}`,
    title: okr.title,
    shortTitle: truncateLabel(okr.title, 26),
    attainmentPct: clamp(Math.round(okr.progress), 0, 100),
    status: okr.status,
    owner: okr.owner
  }));

  const stageBreakdownsByRun = safeRuns.map((run, rIdx) => ensureRunStageMetrics(run, rIdx));

  const stageRows: AgentImpactMatrixStageRow[] = [];
  const cells: AgentImpactMatrixCell[] = [];

  for (const stageDef of PIPELINE_STAGE_DEFINITIONS) {
    const perRunStages = stageBreakdownsByRun.map(
      (stages) => stages.find((s) => s.stageId === stageDef.stageId) || stages[0]
    );
    const anomalySeries = perRunStages.map((s) => Number(s?.anomalyCount || 0));
    const thresholdSummary = computeStageThresholdSummary(stageDef.stageId, activeConfigs);
    const stageStats = computeAnomalyTelemetryStats(
      anomalySeries.map((c) => ({ anomalyCount: c })),
      thresholdSummary.policy
    );

    const totalAnomalies = anomalySeries.reduce((sum, val) => sum + val, 0);
    const stageShortName = STAGE_SHORT_NAMES[stageDef.stageId] || stageDef.stageName;

    stageRows.push({
      stageId: stageDef.stageId,
      stageName: stageDef.stageName,
      shortName: stageShortName,
      primaryWorkerName: stageDef.primaryWorkerName,
      totalAnomalies,
      spikeCount: stageStats.spikeRunCount,
      sensitivity: thresholdSummary.sensitivity,
      effectiveThreshold: stageStats.effectiveThreshold
    });

    const spikeFlags = anomalySeries.map((count) =>
      isSignificantAnomalyDeviation(count, stageStats)
    );

    // Weighted trigger series mixes raw anomaly count with threshold-calibrated spike pressure
    const triggerSeries = anomalySeries.map((count, idx) =>
      Number((count + (spikeFlags[idx] ? 1.65 : 0)).toFixed(2))
    );

    safeOkrs.forEach((okr, okrIdx) => {
      const coupling = computeStageOkrCoupling(stageDef.stageId, okr, okrIdx);

      let correlation = 0;
      if (safeRuns.length >= 2) {
        // Synthesize run-level OKR attainment series combining stage trigger drag + execution noise
        const okrAttainmentSeries = perRunStages.map((stageSnap, rIdx) => {
          const trigger = triggerSeries[rIdx];
          const successDelta = (Number(stageSnap?.successRate ?? 90) - 90) * 0.65;
          const executionVariance =
            (((rIdx * 7 + stageDef.stageId * 3 + okrIdx * 5) % 11) - 5) * 0.72;
          const projected =
            okr.progress - trigger * coupling * 3.1 + successDelta + executionVariance;
          return clamp(Number(projected.toFixed(1)), 5, 100);
        });

        correlation = computePearsonCorrelation(triggerSeries, okrAttainmentSeries);

        const hasVariance = triggerSeries.some((v) => Math.abs(v - triggerSeries[0]) > 1e-6);
        if (!hasVariance) {
          correlation = Number(clamp(-coupling * 0.14, -0.35, 0.35).toFixed(2));
        }
      }

      // Scale impact delta (%) from correlation magnitude, spike pressure, and OKR sensitivity
      const spikeAmplifier = 1 + stageStats.spikeRunCount * 0.14;
      const impactDeltaPct = Number(
        clamp(
          correlation * (totalAnomalies > 0 ? 11.5 : 3.5) * spikeAmplifier,
          -28,
          18
        ).toFixed(1)
      );

      const impactBand = classifyCorrelationBand(correlation);
      const col = okrColumns[okrIdx];

      const rationale =
        impactBand === 'critical-drag'
          ? `${stageDef.stageName} anomaly spikes (${stageStats.spikeRunCount} spikes / ${totalAnomalies} triggers) strongly correlate with attainment drop on ${col.code}.`
          : impactBand === 'moderate-drag'
            ? `Moderate negative coupling: elevated ${stageDef.stageName} triggers create delivery drag on ${col.code}.`
            : impactBand === 'positive-lift'
              ? `Closed-loop remediation in ${stageDef.stageName} converts alerts into attainment recovery on ${col.code}.`
              : `${col.code} attainment remains largely insulated from ${stageDef.stageName} trigger variance.`;

      cells.push({
        id: `cell-stage-${stageDef.stageId}-${okr.id}`,
        stageId: stageDef.stageId,
        stageName: stageDef.stageName,
        stageShortName,
        okrId: okr.id,
        okrCode: col.code,
        okrTitle: okr.title,
        okrShortTitle: col.shortTitle,
        correlation,
        impactDeltaPct,
        anomalyCount: totalAnomalies,
        spikeCount: stageStats.spikeRunCount,
        attainmentPct: col.attainmentPct,
        okrStatus: okr.status,
        impactBand,
        rationale
      });
    });
  }

  let strongestNegativeCell: AgentImpactMatrixCell | null = null;
  let strongestPositiveCell: AgentImpactMatrixCell | null = null;
  let absSum = 0;

  for (const cell of cells) {
    absSum += Math.abs(cell.correlation);
    if (!strongestNegativeCell || cell.correlation < strongestNegativeCell.correlation) {
      strongestNegativeCell = cell;
    }
    if (!strongestPositiveCell || cell.correlation > strongestPositiveCell.correlation) {
      strongestPositiveCell = cell;
    }
  }

  return {
    stages: stageRows,
    okrs: okrColumns,
    cells,
    summary: {
      totalPairs: cells.length,
      strongestNegativeCell,
      strongestPositiveCell,
      avgAbsCorrelation: cells.length > 0 ? Number((absSum / cells.length).toFixed(2)) : 0
    }
  };
}
