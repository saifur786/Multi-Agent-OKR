import test from 'node:test';
import assert from 'node:assert/strict';
import { flattenStageMetricsForPersistence } from './orchestrationDrilldown.ts';
import {
  computeSequentialStageCompletionTimestamps,
  computeStageCompletionStatus,
  extractLatestRunStageTimeline,
  formatStageCompletionTimestamp
} from './orchestrationTimeline.ts';

test('computeStageCompletionStatus classifies Succeeded, Warning, and Failed accurately', () => {
  assert.equal(computeStageCompletionStatus(94.2, 0), 'Succeeded');
  assert.equal(computeStageCompletionStatus(85.0, 2), 'Succeeded');
  assert.equal(computeStageCompletionStatus(82.4, 1), 'Warning');
  assert.equal(computeStageCompletionStatus(92.0, 3), 'Warning');
  assert.equal(computeStageCompletionStatus(68.5, 1), 'Failed');
  assert.equal(computeStageCompletionStatus(91.0, 5), 'Failed');
});

test('flattenStageMetricsForPersistence emits monotonic completedAt timestamps and explicit stage status', () => {
  const runEnd = '2026-11-16T13:30:00.000Z';
  const docs = flattenStageMetricsForPersistence({
    id: 'run-test-1',
    run: 'Run 11',
    industry: 'Telco',
    activeStage: 6,
    successRate: 93.4,
    latencyMs: 1200,
    anomalyCount: 1,
    source: 'gemini-2.5-flash',
    createdAt: runEnd
  });

  assert.equal(docs.length, 6);
  for (let i = 1; i < docs.length; i++) {
    const prevMs = Date.parse(docs[i - 1].completedAt || '');
    const currMs = Date.parse(docs[i].completedAt || '');
    assert.ok(currMs > prevMs, `Stage ${docs[i].stageId} should complete after Stage ${docs[i - 1].stageId}`);
  }
  assert.equal(docs[docs.length - 1].completedAt, runEnd);
  docs.forEach((doc) => {
    assert.ok(doc.status === 'Succeeded' || doc.status === 'Warning' || doc.status === 'Failed');
  });
});

test('computeSequentialStageCompletionTimestamps distributes stage end times backward from run end', () => {
  const map = computeSequentialStageCompletionTimestamps(
    [
      { stageId: 1, latencyMs: 300 },
      { stageId: 2, latencyMs: 400 },
      { stageId: 3, latencyMs: 500 }
    ],
    '2026-11-16T12:00:01.200Z'
  );

  assert.equal(map[3], '2026-11-16T12:00:01.200Z');
  assert.equal(map[2], '2026-11-16T12:00:00.700Z');
  assert.equal(map[1], '2026-11-16T12:00:00.300Z');
});

test('extractLatestRunStageTimeline selects latest run, sorts stages 1..6, and synthesizes monotonic timestamps for legacy docs', () => {
  const olderRunDocs = flattenStageMetricsForPersistence({
    id: 'run-old',
    run: 'Run 1',
    industry: 'Banking',
    activeStage: 6,
    successRate: 90,
    latencyMs: 1100,
    anomalyCount: 1,
    source: 'baseline-telemetry',
    createdAt: '2026-11-16T10:00:00.000Z'
  });

  // Simulate legacy docs from MongoDB where completedAt/status might be absent
  const newerRunDocs = flattenStageMetricsForPersistence({
    id: 'run-new',
    run: 'Run 2',
    industry: 'Banking',
    activeStage: 6,
    successRate: 83.0,
    latencyMs: 1400,
    anomalyCount: 3,
    source: 'gemini-2.5-flash',
    createdAt: '2026-11-16T11:30:00.000Z'
  })
    .map(({ completedAt: _c, status: _s, ...legacy }) => legacy)
    .reverse();

  const timeline = extractLatestRunStageTimeline([...olderRunDocs, ...newerRunDocs]);
  assert.ok(timeline);
  assert.equal(timeline.runId, 'run-new');
  assert.equal(timeline.runLabel, 'Run 2');
  assert.equal(timeline.stages.length, 6);
  assert.deepEqual(
    timeline.stages.map((s) => s.stageId),
    [1, 2, 3, 4, 5, 6]
  );

  for (let i = 1; i < timeline.stages.length; i++) {
    assert.ok(
      Date.parse(timeline.stages[i].completedAt) > Date.parse(timeline.stages[i - 1].completedAt),
      'Synthesized legacy stage completion timestamps must increase monotonically'
    );
  }
  assert.equal(
    timeline.succeededCount + timeline.warningCount + timeline.failedCount,
    6
  );

  // Preferred run override picks explicit runId even when newer runs exist
  const preferredTimeline = extractLatestRunStageTimeline([...olderRunDocs, ...newerRunDocs], 'run-old');
  assert.equal(preferredTimeline?.runId, 'run-old');
});

test('formatStageCompletionTimestamp handles valid ISO strings and missing values safely', () => {
  assert.equal(formatStageCompletionTimestamp(undefined), 'Pending');
  assert.equal(formatStageCompletionTimestamp('not-a-date'), 'Pending');
  const formatted = formatStageCompletionTimestamp('2026-11-16T13:29:04.250Z', { utc: true });
  assert.equal(formatted, 'Nov 16, 13:29:04.250 UTC');
});
