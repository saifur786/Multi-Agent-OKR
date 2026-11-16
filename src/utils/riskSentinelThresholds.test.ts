import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStageSensitivityPreset,
  buildDefaultAgentThresholdConfigs,
  computeAllStageThresholdSummaries,
  computeStageThresholdSummary,
  evaluateOverviewAnomalySeries,
  normalizeAgentThresholdConfigs,
  updateAgentThresholdConfig
} from './riskSentinelThresholds';
import { filterInsightsByStage } from './orchestrationDrilldown';
import { normalizeOrchestrationRuns } from './agenticCommunication';

test('buildDefaultAgentThresholdConfigs provides 18 per-agent configs across 6 distinct stage sensitivity profiles', () => {
  const configs = buildDefaultAgentThresholdConfigs('Telco');
  assert.equal(configs.length, 18);

  const summaries = computeAllStageThresholdSummaries(configs);
  assert.equal(summaries.length, 6);
  assert.equal(summaries[0].sensitivity, 'low'); // Stage 1 Strategy Explorer
  assert.equal(summaries[1].sensitivity, 'balanced'); // Stage 2 OKR Quality
  assert.equal(summaries[2].sensitivity, 'balanced'); // Stage 3 Alignment
  assert.equal(summaries[3].sensitivity, 'high'); // Stage 4 Risk Radar
  assert.equal(summaries[4].sensitivity, 'low'); // Stage 5 Executive Reporting
  assert.equal(summaries[5].sensitivity, 'balanced'); // Stage 6 Retrospective
});

test('per-agent threshold update alters only the target stage sensitivity and chart spike counts', () => {
  const baseRuns = normalizeOrchestrationRuns(
    Array.from({ length: 10 }, (_, idx) => ({
      id: `run-${idx + 1}`,
      run: `Run ${idx + 1}`,
      industry: 'Telco',
      mode: 'full-pipeline',
      stage: 'Risk Radar',
      activeStage: 4,
      successRate: 92 - (idx % 3),
      latencyMs: 1200 + idx * 45,
      anomalyCount: idx < 4 ? 4 : 1,
      source: 'test',
      createdAt: `2026-11-15T10:0${idx}:00.000Z`
    }))
  );

  const initialConfigs = buildDefaultAgentThresholdConfigs('Telco');
  const highDrilldown = filterInsightsByStage(baseRuns, 4, initialConfigs);
  assert.equal(highDrilldown.thresholdSummary.sensitivity, 'high');
  assert.ok(highDrilldown.anomalyStats.spikeRunCount > 0);

  // Lower sensitivity on all Stage 4 agents via per-agent updates
  let updated = updateAgentThresholdConfig(initialConfigs, 'risk-sentinel', { sensitivity: 'low' });
  updated = updateAgentThresholdConfig(updated, 'servicenow-grc-connector', { sensitivity: 'low' });
  updated = updateAgentThresholdConfig(updated, 'jira-velocity-listener', { sensitivity: 'low' });

  const stage4Summary = computeStageThresholdSummary(4, updated);
  const stage2Summary = computeStageThresholdSummary(2, updated);
  assert.equal(stage4Summary.sensitivity, 'low');
  assert.equal(stage2Summary.sensitivity, 'balanced'); // Stage 2 unaffected

  const lowDrilldown = filterInsightsByStage(baseRuns, 4, updated);
  assert.equal(lowDrilldown.thresholdSummary.sensitivity, 'low');
  assert.ok(lowDrilldown.anomalyStats.effectiveThreshold > highDrilldown.anomalyStats.effectiveThreshold);
  assert.ok(lowDrilldown.anomalyStats.spikeRunCount <= highDrilldown.anomalyStats.spikeRunCount);
});

test('evaluateOverviewAnomalySeries applies stage-specific sensitivity thresholds across all 6 stages', () => {
  const runs = [
    { id: 'r1', activeStage: 1, stage: 'Strategy Explorer', anomalyCount: 2 },
    { id: 'r2', activeStage: 2, stage: 'OKR Quality', anomalyCount: 2 },
    { id: 'r3', activeStage: 4, stage: 'Risk Radar', anomalyCount: 2 },
    { id: 'r4', activeStage: 5, stage: 'Executive Reporting', anomalyCount: 1 },
    { id: 'r5', activeStage: 6, stage: 'Retrospective', anomalyCount: 1 }
  ];

  let configs = buildDefaultAgentThresholdConfigs('Banking');
  // Stage 1 is low (floor 3), Stage 4 is high (floor 1)
  const evaluated = evaluateOverviewAnomalySeries(runs, configs);
  assert.equal(evaluated.points[0].stageSensitivity, 'low');
  assert.equal(evaluated.points[0].isAnomalySpike, false); // 2 < floor 3
  assert.equal(evaluated.points[2].stageSensitivity, 'high');
  assert.equal(evaluated.points[2].isAnomalySpike, true); // 2 > mean (1.6) & >= effective cutoff

  // Raise Stage 1 sensitivity to High -> Run 1 (Stage 1, count 2) now triggers spike
  configs = applyStageSensitivityPreset(configs, 1, 'high');
  const reEvaluated = evaluateOverviewAnomalySeries(runs, configs);
  assert.equal(reEvaluated.points[0].stageSensitivity, 'high');
  assert.equal(reEvaluated.points[0].isAnomalySpike, true);
});

test('normalizeAgentThresholdConfigs restores missing agents and clamps custom numeric overrides', () => {
  const normalized = normalizeAgentThresholdConfigs(
    [
      {
        agentId: 'risk-sentinel',
        sensitivity: 'high',
        stdDevMultiplier: 0.2,
        minAnomalyFloor: 1
      },
      {
        agentId: 'strategy-explorer',
        sensitivity: 'low',
        stdDevMultiplier: 99,
        minAnomalyFloor: 0
      }
    ],
    'Retail'
  );

  assert.equal(normalized.length, 18);
  const sentinel = normalized.find((c) => c.agentId === 'risk-sentinel');
  const explorer = normalized.find((c) => c.agentId === 'strategy-explorer');
  assert.equal(sentinel?.stdDevMultiplier, 0.2);
  assert.equal(sentinel?.minAnomalyFloor, 1);
  assert.equal(explorer?.stdDevMultiplier, 2.5); // clamped
  assert.equal(explorer?.minAnomalyFloor, 1); // clamped
});
