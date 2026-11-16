import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAgentImpactMatrix,
  classifyCorrelationBand,
  computePearsonCorrelation,
  extractMatrixOkrs
} from './agentImpactMatrix';
import { PIPELINE_STAGE_DEFINITIONS } from './orchestrationDrilldown';
import { buildDefaultAgentThresholdConfigs } from './riskSentinelThresholds';
import { TELCO_DATA } from '../data/telcoData';

test('computePearsonCorrelation computes exact positive, negative, and zero-variance correlations', () => {
  assert.equal(computePearsonCorrelation([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]), 1);
  assert.equal(computePearsonCorrelation([1, 2, 3, 4, 5], [50, 40, 30, 20, 10]), -1);
  assert.equal(computePearsonCorrelation([2, 2, 2, 2], [70, 75, 80, 85]), 0);
});

test('extractMatrixOkrs extracts Key Results from industry traceability layer 3', () => {
  const okrs = extractMatrixOkrs(TELCO_DATA.traceability);
  assert.equal(okrs.length, 4);
  assert.equal(okrs[0].id, 't-kr1');
  assert.equal(okrs[0].status, 'At Risk');
});

test('buildAgentImpactMatrix correlates 6 stages against all industry OKRs with bounded Pearson r and deltas', () => {
  const runs = Array.from({ length: 10 }, (_, idx) => ({
    id: `run-${idx + 1}`,
    run: `Run ${idx + 1}`,
    activeStage: (idx % 6) + 1,
    successRate: 88 + (idx % 6),
    latencyMs: 1100 + idx * 55,
    anomalyCount: idx % 3 === 0 ? 4 : 1
  }));
  const okrs = extractMatrixOkrs(TELCO_DATA.traceability);

  const matrix = buildAgentImpactMatrix({
    runs,
    okrs,
    thresholdConfigs: buildDefaultAgentThresholdConfigs('Telco')
  });

  assert.equal(matrix.stages.length, PIPELINE_STAGE_DEFINITIONS.length);
  assert.equal(matrix.okrs.length, okrs.length);
  assert.equal(matrix.cells.length, 6 * okrs.length);

  for (const cell of matrix.cells) {
    assert.ok(cell.correlation >= -1 && cell.correlation <= 1);
    assert.equal(cell.impactBand, classifyCorrelationBand(cell.correlation));
    assert.ok(cell.rationale.length > 10);
  }

  // Risk Radar (Stage 4) on At-Risk Telco KRs should exhibit negative attainment correlation
  const riskOnKr1 = matrix.cells.find((c) => c.stageId === 4 && c.okrId === 't-kr1')!;
  assert.ok(riskOnKr1.correlation < 0);
  assert.ok(riskOnKr1.impactDeltaPct < 0);
  assert.ok(matrix.summary.strongestNegativeCell !== null);
});

test('buildAgentImpactMatrix responds to stage threshold sensitivity changes and handles empty OKRs safely', () => {
  const runs = Array.from({ length: 10 }, (_, idx) => ({
    id: `run-${idx + 1}`,
    run: `Run ${idx + 1}`,
    activeStage: 4,
    successRate: 90,
    latencyMs: 1300,
    anomalyCount: idx % 2 === 0 ? 4 : 1
  }));
  const okrs = extractMatrixOkrs(TELCO_DATA.traceability);

  const highConfigs = buildDefaultAgentThresholdConfigs('Telco').map((c) =>
    c.stageId === 4
      ? { ...c, sensitivity: 'high' as const, stdDevMultiplier: 0.75, minAnomalyFloor: 1 }
      : c
  );
  const lowConfigs = buildDefaultAgentThresholdConfigs('Telco').map((c) =>
    c.stageId === 4
      ? { ...c, sensitivity: 'low' as const, stdDevMultiplier: 1.75, minAnomalyFloor: 4 }
      : c
  );

  const highMatrix = buildAgentImpactMatrix({ runs, okrs, thresholdConfigs: highConfigs });
  const lowMatrix = buildAgentImpactMatrix({ runs, okrs, thresholdConfigs: lowConfigs });

  const highStage4 = highMatrix.stages.find((s) => s.stageId === 4)!;
  const lowStage4 = lowMatrix.stages.find((s) => s.stageId === 4)!;
  assert.ok(highStage4.spikeCount >= lowStage4.spikeCount);

  const emptyMatrix = buildAgentImpactMatrix({ runs, okrs: [] });
  assert.equal(emptyMatrix.okrs.length, 0);
  assert.equal(emptyMatrix.cells.length, 0);
  assert.equal(emptyMatrix.summary.strongestNegativeCell, null);
});
