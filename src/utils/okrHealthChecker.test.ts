import test from 'node:test';
import assert from 'node:assert/strict';
import { TraceabilityNode } from '../types/orchestration';
import {
  OKR_REQUIRED_ATTRIBUTES,
  scanOkrHealth,
  scanPortfolioOkrHealth
} from './okrHealthChecker';

const makeBaseNode = (overrides: Partial<TraceabilityNode> = {}): TraceabilityNode => ({
  id: 't-kr1',
  title: 'Reduce subscriber churn below 1.2%',
  owner: 'Maya Lin',
  status: 'At Risk',
  progress: 54,
  budget: '$6.2M',
  parentIds: ['t-o1'],
  childIds: ['t-i1'],
  ai: {
    analyse: 'Churn spike in metro corridors.',
    predict: 'Misses Q1 target without capacity upgrade.',
    recommend: 'Accelerate fiber backhaul upgrade.',
    automate: 'Linked telemetry monitors.',
    optimise: 'Reallocate 4 FTE.'
  },
  ...overrides
});

test('scanOkrHealth flags all 6 missing attributes when businessProblem is absent', () => {
  const node = makeBaseNode({ businessProblem: undefined });
  const result = scanOkrHealth(node);

  assert.equal(result.isFlagged, true);
  assert.equal(result.healthTier, 'Incomplete');
  assert.equal(result.presentCount, 0);
  assert.equal(result.completenessPct, 0);
  assert.deepEqual(
    result.missingAttributes.map((m) => m.attribute),
    [...OKR_REQUIRED_ATTRIBUTES]
  );
});

test('scanOkrHealth accurately distinguishes present vs missing attributes on partial OKR', () => {
  const node = makeBaseNode({
    businessProblem: {
      problemDescription: 'Peak-hour optical backhaul saturation causes buffering across metro corridors.',
      impactedStakeholders: ['Mobile Subscribers', 'Field Engineering'],
      causalChainToDollarImpact: '',
      rootCause: '',
      targetRemediationTiming: '',
      metrics: [
        { indicator: 'Packet Loss', baselineValue: '4.2%', targetValue: '< 0.5%', metricType: 'Leading' }
      ]
    }
  });

  const result = scanOkrHealth(node);

  assert.equal(result.isFlagged, true);
  assert.equal(result.healthTier, 'Partial');
  assert.equal(result.presentCount, 3);
  assert.equal(result.completenessPct, 50);
  assert.deepEqual(
    result.presentAttributes.map((p) => p.attribute),
    ['Description', 'Stakeholders', 'Metrics']
  );
  assert.deepEqual(
    result.missingAttributes.map((m) => m.attribute),
    ['Causal Chain', 'Root Cause', 'Remediation Timing']
  );
});

test('scanOkrHealth recognizes array rootCauses/remediationTimings and marks complete OKRs cleanly', () => {
  const node = makeBaseNode({
    businessProblem: {
      problemDescription: 'Legacy 10Gbps core interfaces degrade peak-hour streaming throughput.',
      impactedStakeholders: ['14.8M Mobile Subscribers', 'Network Operations'],
      causalChainToDollarImpact: 'Backhaul saturation -> packet drop -> 2.1% churn -> $18.4M ARPU loss.',
      rootCause: '',
      rootCauses: ['Unupgraded 10Gbps regional fiber rings'],
      targetRemediationTiming: '',
      remediationTimings: ['Q1 2027 Sprint 6'],
      metrics: [
        { indicator: 'Network Utilisation', baselineValue: '94%', targetValue: '72%', metricType: 'Leading' },
        { indicator: 'Monthly Churn %', baselineValue: '2.4%', targetValue: '1.1%', metricType: 'Lagging' }
      ]
    }
  });

  const result = scanOkrHealth(node);

  assert.equal(result.isFlagged, false);
  assert.equal(result.healthTier, 'Complete');
  assert.equal(result.presentCount, 6);
  assert.equal(result.completenessPct, 100);
  assert.equal(result.missingAttributes.length, 0);
});

test('scanOkrHealth flags incomplete metric rows missing baseline or target values', () => {
  const node = makeBaseNode({
    businessProblem: {
      problemDescription: 'Legacy 10Gbps core interfaces degrade peak-hour streaming throughput.',
      impactedStakeholders: ['Subscribers'],
      causalChainToDollarImpact: 'Saturation -> buffering -> churn -> $12M revenue risk.',
      rootCause: 'Insufficient optical wavelength allocation on metro rings.',
      targetRemediationTiming: 'Q2 2027',
      metrics: [
        { indicator: 'Churn %', baselineValue: '', targetValue: '1.1%', metricType: 'Lagging' }
      ]
    }
  });

  const result = scanOkrHealth(node);
  assert.equal(result.isFlagged, true);
  assert.deepEqual(result.missingAttributes.map((m) => m.attribute), ['Metrics']);
});

test('scanPortfolioOkrHealth summarizes completeness, attribute coverage, and prioritizes flagged items first', () => {
  const completeNode = makeBaseNode({
    id: 't-kr-complete',
    businessProblem: {
      problemDescription: 'Legacy 10Gbps core interfaces degrade peak-hour streaming throughput.',
      impactedStakeholders: ['Subscribers'],
      causalChainToDollarImpact: 'Saturation -> buffering -> churn -> $12M revenue risk.',
      rootCause: 'Insufficient optical wavelength allocation on metro rings.',
      targetRemediationTiming: 'Q2 2027',
      metrics: [
        { indicator: 'Churn %', baselineValue: '2.3%', targetValue: '1.1%', metricType: 'Lagging' }
      ]
    }
  });

  const emptyNode = makeBaseNode({ id: 't-kr-empty', businessProblem: undefined });

  const summary = scanPortfolioOkrHealth([completeNode, emptyNode]);

  assert.equal(summary.totalOkrs, 2);
  assert.equal(summary.completeCount, 1);
  assert.equal(summary.incompleteCount, 1);
  assert.equal(summary.flaggedCount, 1);
  assert.equal(summary.overallCompletenessPct, 50);
  assert.equal(summary.results[0].okrId, 't-kr-empty');
  assert.equal(summary.results[1].okrId, 't-kr-complete');
  assert.equal(summary.attributeCoverage.length, 6);
  assert.equal(summary.attributeCoverage[0].missingCount, 1);
  assert.equal(summary.attributeCoverage[0].coveragePct, 50);
});
