import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorkerBaselineLogs,
  computeAnomalyCountForRun,
  computeAnomalyTelemetryStats,
  extractWorkerAgentLogs,
  isSignificantAnomalyDeviation,
  matchesWorkerAgentInteraction,
  resolveWorkerCatalogEntry
} from './workerAgentTelemetry';
import { normalizeOrchestrationRuns } from './agenticCommunication';

test('resolveWorkerCatalogEntry matches id, display name, and persisted KB aliases', () => {
  assert.equal(resolveWorkerCatalogEntry('risk-sentinel').id, 'risk-sentinel');
  assert.equal(resolveWorkerCatalogEntry('Risk Sentinel').id, 'risk-sentinel');
  assert.equal(resolveWorkerCatalogEntry('RiskDetectionAgent').id, 'risk-sentinel');
  assert.equal(resolveWorkerCatalogEntry('RetrospectiveLearningAgent').id, 'retrospective-learner');
  assert.equal(resolveWorkerCatalogEntry('4').id, 'risk-sentinel');
});

test('matchesWorkerAgentInteraction maps worker aliases accurately', () => {
  const riskWorker = resolveWorkerCatalogEntry('risk-sentinel');
  assert.equal(matchesWorkerAgentInteraction(riskWorker, 'RiskDetectionAgent'), true);
  assert.equal(matchesWorkerAgentInteraction(riskWorker, 'RiskConnectorBridge'), true);
  assert.equal(matchesWorkerAgentInteraction(riskWorker, 'ExecutiveReportingAgent'), false);
});

test('extractWorkerAgentLogs returns at most 5 newest logs and prioritizes matching industry', () => {
  const interactions = [
    {
      id: 'i-1',
      agent: 'RiskDetectionAgent',
      context: 'risk-detect:Retail',
      message: 'Retail POS spike',
      response: 'Throttled non-essential batch sync.',
      createdAt: '2026-11-15T18:05:00.000Z'
    },
    ...Array.from({ length: 6 }, (_, idx) => ({
      id: `i-telco-${idx}`,
      agent: 'RiskDetectionAgent',
      context: 'risk-detect:Telco',
      message: `Telco signal ${idx + 1}`,
      response: `Mitigation reasoning step ${idx + 1}`,
      createdAt: `2026-11-15T18:0${idx}:00.000Z`
    })),
    {
      id: 'i-status',
      agent: 'WorkerAgentStatus',
      context: 'orchestration-status:Telco',
      createdAt: '2026-11-15T18:10:00.000Z',
      metadata: {
        statuses: [
          {
            id: 'risk-sentinel',
            name: 'Risk Sentinel',
            status: 'error',
            label: 'Error',
            reason: 'Active disaster detected on Telco fiber backbone.',
            action: 'Approve rerouting plan.'
          }
        ]
      }
    }
  ];

  const result = extractWorkerAgentLogs({
    workerIdOrName: 'risk-sentinel',
    industryName: 'Telco',
    interactions,
    store: 'mongodb',
    limit: 5
  });

  assert.equal(result.logs.length, 5);
  assert.equal(result.totalMatched, 8);
  assert.equal(result.logs[0].sourceAgent, 'WorkerAgentStatus');
  assert.equal(result.logs[0].statusSnapshot, 'error');
  assert.ok(result.logs[0].reasoning.includes('Approve rerouting plan.'));
  assert.ok(result.logs.every((entry) => entry.context.includes('Telco')));
});

test('buildWorkerBaselineLogs provides 5 industry-specific reasoning steps per worker', () => {
  const worker = resolveWorkerCatalogEntry('okr-quality-auditor');
  const seeded = buildWorkerBaselineLogs(worker, 'Banking');
  assert.equal(seeded.length, 5);
  assert.ok(seeded[0]?.message?.includes('Banking'));
});

test('computeAnomalyCountForRun and normalizeOrchestrationRuns track anomaly frequencies over 10 runs', () => {
  assert.equal(computeAnomalyCountForRun({ activeDisasterCount: 0, criticalOkrCount: 0, riskSignalCount: 0 }), 0);
  assert.equal(computeAnomalyCountForRun({ activeDisasterCount: 1, criticalOkrCount: 3, riskSignalCount: 1 }), 5);

  const runs = normalizeOrchestrationRuns([
    { id: 'r1', run: 'Run 1', anomalyCount: 0 },
    { id: 'r2', run: 'Run 2', anomalyCount: 4 },
    { id: 'r3', run: 'Run 3' }
  ]);
  assert.equal(runs[0].anomalyCount, 0);
  assert.equal(runs[1].anomalyCount, 4);
  assert.equal(typeof runs[2].anomalyCount, 'number');
});

test('computeAnomalyTelemetryStats computes mean threshold and flags significant above-average deviations', () => {
  const stats = computeAnomalyTelemetryStats([
    { anomalyCount: 4 },
    { anomalyCount: 2 },
    { anomalyCount: 4 },
    { anomalyCount: 3 },
    { anomalyCount: 3 },
    { anomalyCount: 1 },
    { anomalyCount: 2 },
    { anomalyCount: 2 },
    { anomalyCount: 1 },
    { anomalyCount: 1 }
  ]);

  assert.equal(stats.totalAnomalies, 23);
  assert.equal(stats.mean, 2.3);
  assert.equal(stats.spikeRunCount, 2);
  assert.equal(isSignificantAnomalyDeviation(4, stats), true);
  assert.equal(isSignificantAnomalyDeviation(2, stats), false);

  const flatStats = computeAnomalyTelemetryStats([
    { anomalyCount: 2 },
    { anomalyCount: 2 },
    { anomalyCount: 2 }
  ]);
  assert.equal(flatStats.mean, 2);
  assert.equal(flatStats.spikeRunCount, 0);
  assert.equal(isSignificantAnomalyDeviation(2, flatStats), false);
});

