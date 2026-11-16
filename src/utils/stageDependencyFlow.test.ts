import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStageDependencyGraph, STAGE_HANDOFF_SPECS } from './stageDependencyFlow';
import { INDUSTRY_DATA } from '../data/industryData';

test('buildStageDependencyGraph creates 6 nodes and all 8 async hand-off edges with critical path totals', () => {
  const telco = INDUSTRY_DATA['Telco'];
  const graph = buildStageDependencyGraph({
    stages: telco.stages,
    sensitivity: 'balanced'
  });

  assert.equal(graph.nodes.length, 6);
  assert.equal(graph.edges.length, STAGE_HANDOFF_SPECS.length);
  assert.equal(graph.nodes[0].upstreamWaitMs, 0);
  assert.ok(graph.nodes[5].upstreamWaitMs > 0);

  const shareSum = graph.nodes.reduce((sum, n) => sum + n.latencySharePct, 0);
  assert.ok(Math.abs(shareSum - 100) <= 0.6, `Expected share sum ~100, got ${shareSum}`);
  assert.ok(graph.summary.criticalPathLatencyMs > graph.summary.totalPipelineLatencyMs);

  // Feedback edges exist
  const feedbackEdges = graph.edges.filter((e) => e.channelType === 'feedback-loop');
  assert.equal(feedbackEdges.length, 2);
  assert.ok(feedbackEdges.some((e) => e.sourceStageId === 6 && e.targetStageId === 1));
  assert.ok(feedbackEdges.some((e) => e.sourceStageId === 4 && e.targetStageId === 3));
});

test('buildStageDependencyGraph detects high-latency bottleneck stages and flags downstream handoff edges', () => {
  const banking = INDUSTRY_DATA['Banking'];
  const graph = buildStageDependencyGraph({
    stages: banking.stages,
    sensitivity: 'balanced',
    activeLatencyOverrides: {
      1: 140,
      2: 195,
      3: 175,
      4: 540,
      5: 130,
      6: 120
    }
  });

  const stage4 = graph.nodes.find((n) => n.stageId === 4);
  assert.ok(stage4);
  assert.equal(stage4.isBottleneck, true);
  assert.equal(stage4.bottleneckSeverity, 'critical');
  assert.equal(graph.summary.peakBottleneckStageId, 4);
  assert.ok(graph.summary.bottleneckStageIds.includes(4));

  const handoff4to5 = graph.edges.find((e) => e.id === 'handoff-4-5');
  assert.ok(handoff4to5);
  assert.equal(handoff4to5.isBottleneckEdge, true);
  assert.equal(handoff4to5.edgeSeverity, 'critical');

  const stage1 = graph.nodes.find((n) => n.stageId === 1);
  assert.ok(stage1);
  assert.equal(stage1.isBottleneck, false);
  assert.equal(stage1.bottleneckSeverity, 'optimal');
});

test('strict vs relaxed bottleneck sensitivity shifts cutoff threshold cleanly', () => {
  const telco = INDUSTRY_DATA['Telco'];
  const latencyMap = { 1: 160, 2: 245, 3: 210, 4: 295, 5: 155, 6: 145 };

  const strictGraph = buildStageDependencyGraph({
    stages: telco.stages,
    sensitivity: 'strict',
    activeLatencyOverrides: latencyMap
  });
  const relaxedGraph = buildStageDependencyGraph({
    stages: telco.stages,
    sensitivity: 'relaxed',
    activeLatencyOverrides: latencyMap
  });

  assert.ok(strictGraph.summary.bottleneckCutoffMs < relaxedGraph.summary.bottleneckCutoffMs);
  assert.ok(strictGraph.summary.bottleneckCount >= relaxedGraph.summary.bottleneckCount);
});
