import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_DATA } from '../data/industryData';
import { buildSevenLayerOkrNetwork } from './traceabilityNetwork';

test('buildSevenLayerOkrNetwork builds all 7 Planview layers plus Business Problem and Remediation Timing nodes', () => {
  const telco = INDUSTRY_DATA['Telco'];
  const nodesMap = Object.fromEntries(
    Object.values(telco.traceability)
      .flat()
      .map((n) => [n.id, n])
  );

  const network = buildSevenLayerOkrNetwork(telco, nodesMap, {
    includeProblems: true,
    includeTimings: true
  });

  for (let layer = 1; layer <= 7; layer++) {
    assert.ok(network.layerCounts[layer] > 0, `Expected nodes in Layer ${layer}`);
  }
  assert.ok(network.problemNodeCount > 0, 'Expected linked Business Problem nodes');
  assert.ok(network.timingNodeCount > 0, 'Expected linked Remediation Timing nodes');
  assert.ok(network.links.some((l) => l.kind === 'hierarchy'));
  assert.ok(network.links.some((l) => l.kind === 'problem-link'));
  assert.ok(network.links.some((l) => l.kind === 'remediation-link'));
});

test('buildSevenLayerOkrNetwork respects includeProblems=false, includeTimings=false, and focusOkrId scoping', () => {
  const telco = INDUSTRY_DATA['Telco'];
  const nodesMap = Object.fromEntries(
    Object.values(telco.traceability)
      .flat()
      .map((n) => [n.id, n])
  );
  const firstKrId = telco.traceability[3][0].id;

  const focused = buildSevenLayerOkrNetwork(telco, nodesMap, {
    includeProblems: false,
    includeTimings: false,
    focusOkrId: firstKrId
  });

  assert.equal(focused.problemNodeCount, 0);
  assert.equal(focused.timingNodeCount, 0);
  assert.ok(focused.nodes.some((n) => n.id === firstKrId));
  assert.ok(focused.nodes.length < Object.keys(nodesMap).length);
});
