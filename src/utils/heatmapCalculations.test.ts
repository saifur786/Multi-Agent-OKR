import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculate7LayerNodeUtilisation,
  calculateLayerUtilisationAggregates,
  simulateRebalanceBottleneck,
  getUtilisationColor
} from './heatmapCalculations';
import { INDUSTRY_DATA } from '../data/industryData';

test('calculate7LayerNodeUtilisation correctly maps all 7 layers and identifies bottlenecks in red', () => {
  const industry = INDUSTRY_DATA.Banking;
  const nodesMap: Record<string, any> = {};
  Object.values(industry.traceability).forEach(nodes => {
    nodes.forEach(n => {
      nodesMap[n.id] = { ...n };
    });
  });

  const heatmapNodes = calculate7LayerNodeUtilisation(nodesMap, industry.traceability);

  // Assert all 7 layers are represented
  const layersPresent = new Set(heatmapNodes.map(n => n.layerNum));
  assert.equal(layersPresent.size, 7);
  for (let l = 1; l <= 7; l++) {
    assert.ok(layersPresent.has(l), `Layer ${l} should be present`);
  }

  // Assert bottlenecks (utilisationPct >= 100) are identified
  const bottlenecks = heatmapNodes.filter(n => n.isBottleneck);
  assert.ok(bottlenecks.length >= 3, `Expected at least 3 bottlenecks, found ${bottlenecks.length}`);

  bottlenecks.forEach(b => {
    assert.ok(b.utilisationPct >= 100);
    assert.equal(b.severity, 'critical');
    // Confirm color is red/crimson
    const color = getUtilisationColor(b.utilisationPct);
    assert.ok(color === '#ef4444' || color === '#dc2626', `Expected red color, got ${color}`);
    assert.ok(b.bottleneckReason && b.bottleneckReason.length > 5);
  });
});

test('calculateLayerUtilisationAggregates computes peak and average utilisation per layer', () => {
  const industry = INDUSTRY_DATA.Banking;
  const nodesMap: Record<string, any> = {};
  Object.values(industry.traceability).forEach(nodes => {
    nodes.forEach(n => {
      nodesMap[n.id] = { ...n };
    });
  });

  const heatmapNodes = calculate7LayerNodeUtilisation(nodesMap, industry.traceability);
  const aggregates = calculateLayerUtilisationAggregates(heatmapNodes);

  assert.equal(aggregates.length, 7);
  aggregates.forEach(agg => {
    assert.ok(agg.totalNodes > 0);
    assert.ok(agg.avgUtilisation >= 0 && agg.avgUtilisation <= 150);
    assert.ok(agg.peakUtilisation >= agg.avgUtilisation);
    assert.ok(agg.totalAllocatedFte > 0);
    assert.ok(agg.totalCapacityFte > 0);
  });

  // Layer 6 has Credit Engine Backend Devs at 108%
  const l6 = aggregates.find(a => a.layerNum === 6);
  assert.ok(l6);
  assert.ok(l6.peakUtilisation >= 108);
  assert.ok(l6.bottleneckCount >= 1);
  assert.equal(l6.isLayerBottlenecked, true);
});

test('simulateRebalanceBottleneck reduces squad load below 100% threshold', () => {
  const industry = INDUSTRY_DATA.Banking;
  const nodesMap: Record<string, any> = {};
  Object.values(industry.traceability).forEach(nodes => {
    nodes.forEach(n => {
      nodesMap[n.id] = { ...n };
    });
  });

  // b-t1 has Credit Engine Backend squad with 108% load
  assert.equal(nodesMap['b-t1']?.squadLoad?.loadPct, 108);

  const updatedMap = simulateRebalanceBottleneck(nodesMap, 'b-t1', 20);
  assert.ok((updatedMap['b-t1']?.squadLoad?.loadPct ?? 0) < 100);
  assert.equal(updatedMap['b-t1']?.status, 'On Track');
});
