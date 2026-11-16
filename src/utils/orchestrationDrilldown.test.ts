import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PIPELINE_STAGE_DEFINITIONS,
  computeAllStagesOverview,
  ensureRunStageMetrics,
  filterInsightsByStage,
  flattenStageMetricsForPersistence,
  generateStageMetricsForRun
} from './orchestrationDrilldown';

test('generateStageMetricsForRun generates all 6 stages with constituent agent metrics', () => {
  const breakdown = generateStageMetricsForRun({
    baseSuccessRate: 92.4,
    baseLatencyMs: 1400,
    baseAnomalyCount: 4,
    runIndex: 2,
    activeStage: 4,
    criticalOkrCount: 2,
    activeDisasterCount: 1
  });

  assert.equal(breakdown.length, 6);
  assert.equal(breakdown[0].stageId, 1);
  assert.equal(breakdown[3].stageName, 'Risk Radar');
  assert.equal(breakdown[3].constituentAgents.length, 3);
  assert.ok(breakdown[3].anomalyCount >= 2);
  assert.ok(breakdown[3].constituentAgents.some((a) => a.agentId === 'servicenow-grc-connector'));
});

test('filterInsightsByStage isolates metrics for selected stage and its constituent agents across runs', () => {
  const sampleRuns = Array.from({ length: 10 }, (_, idx) => ({
    id: `r-${idx + 1}`,
    run: `Run ${idx + 1}`,
    stage: PIPELINE_STAGE_DEFINITIONS[idx % 6].stageName,
    activeStage: (idx % 6) + 1,
    successRate: 90 + (idx % 5),
    latencyMs: 1100 + idx * 45,
    anomalyCount: idx === 2 ? 5 : idx % 3,
    source: 'baseline',
    createdAt: `2026-11-15T18:0${idx}:00.000Z`
  }));

  const drilldown = filterInsightsByStage(sampleRuns, 4);
  assert.equal(drilldown.stageId, 4);
  assert.equal(drilldown.stageName, 'Risk Radar');
  assert.equal(drilldown.filteredRuns.length, 10);
  assert.ok(drilldown.filteredRuns.every((r) => r.activeStage === 4 && r.stage === 'Risk Radar'));
  assert.equal(drilldown.constituentAgents.length, 3);
  assert.equal(drilldown.constituentAgents[0].agentName, 'Risk Sentinel');
  assert.ok(drilldown.anomalyStats.mean >= 0);
});

test('computeAllStagesOverview and flattenStageMetricsForPersistence stay consistent across all 6 stages', () => {
  const runs = [
    {
      id: 'run-a',
      run: 'Run 1',
      industry: 'Telco',
      stage: 'OKR Quality',
      activeStage: 2,
      successRate: 91.5,
      latencyMs: 1300,
      anomalyCount: 2,
      source: 'mongodb',
      createdAt: '2026-11-15T18:00:00.000Z'
    }
  ];

  const enriched = ensureRunStageMetrics(runs[0], 0);
  assert.equal(enriched.length, 6);

  const overview = computeAllStagesOverview(runs);
  assert.equal(overview.length, 6);
  assert.equal(overview[1].stageId, 2);

  const flat = flattenStageMetricsForPersistence({ ...runs[0], stageMetrics: enriched });
  assert.equal(flat.length, 6);
  assert.equal(flat[0].id, 'run-a-stage-1');
  assert.equal(flat[3].stageId, 4);
  assert.equal(flat[3].industry, 'Telco');
  assert.equal(flat[3].constituentAgents.length, 3);
});
