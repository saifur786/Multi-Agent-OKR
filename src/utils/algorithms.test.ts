import test from 'node:test';
import assert from 'node:assert/strict';
import {
  executeGraphTraversal,
  computeLineage,
  remediateOrphanNode,
  evaluateSmartCriteria,
  calculateRegressionPrediction,
  computeVectorCosineSimilarity,
  solvePolynomialRegression,
  evaluateAdvisoryCommittee,
  generateHistoricalAccuracyCohorts,
  generateAgentAccuracyProfiles
} from './algorithms';
import { TraceabilityNode } from '../types/orchestration';

test('executeGraphTraversal detects orphan epics and over-allocated squads', () => {
  const dummyNodes: Record<string, TraceabilityNode> = {
    'l1-strat': {
      id: 'l1-strat',
      title: 'Digital Core',
      owner: 'CIO',
      status: 'On Track',
      progress: 80,
      budget: '$10M',
      parentIds: [],
      childIds: ['l2-obj'],
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    },
    'l2-obj': {
      id: 'l2-obj',
      title: 'Accelerate Mortgages',
      owner: 'VP Lending',
      status: 'On Track',
      progress: 75,
      budget: '$5M',
      parentIds: ['l1-strat'],
      childIds: [],
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    },
    // Orphan Epic with no parents and isOrphan flag or no parent links
    'l5-orphan-epic': {
      id: 'l5-orphan-epic',
      title: 'Legacy Mainframe Reporting Epic',
      owner: 'Legacy Team',
      status: 'At Risk',
      progress: 30,
      budget: '$1.8M',
      parentIds: [],
      childIds: [],
      isOrphan: true,
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    },
    'l6-squad': {
      id: 'l6-squad',
      title: 'Core Backend Squad',
      owner: 'Tech Lead',
      status: 'At Risk',
      progress: 70,
      budget: '$2M',
      parentIds: [],
      childIds: [],
      squadLoad: {
        squadName: 'Core Backend Squad',
        fte: 12,
        loadPct: 115
      },
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    }
  };

  const report = executeGraphTraversal(dummyNodes);
  assert.equal(report.orphanEpics.length, 1);
  assert.equal(report.orphanEpics[0].id, 'l5-orphan-epic');
  assert.equal(report.overAllocatedSquads.length, 1);
  assert.equal(report.overAllocatedSquads[0].name, 'Core Backend Squad');
  assert.equal(report.overAllocatedSquads[0].currentLoad, 115);
  assert.equal(report.cycleDetected, false);
});

test('computeLineage traverses upstream and downstream correctly', () => {
  const dummyNodes: Record<string, TraceabilityNode> = {
    'root': {
      id: 'root',
      title: 'Root Strategy',
      owner: 'CEO',
      status: 'On Track',
      progress: 90,
      budget: '$20M',
      parentIds: [],
      childIds: ['child1'],
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    },
    'child1': {
      id: 'child1',
      title: 'Child Objective',
      owner: 'VP',
      status: 'On Track',
      progress: 85,
      budget: '$10M',
      parentIds: ['root'],
      childIds: ['grandchild1'],
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    },
    'grandchild1': {
      id: 'grandchild1',
      title: 'Grandchild KR',
      owner: 'Lead',
      status: 'On Track',
      progress: 80,
      budget: '$5M',
      parentIds: ['child1'],
      childIds: [],
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    }
  };

  const lineage = computeLineage('child1', dummyNodes);
  assert.ok(lineage.upstream.has('root'));
  assert.ok(lineage.downstream.has('grandchild1'));
  assert.equal(lineage.allHighlighted.size, 3);
});

test('remediateOrphanNode reconnects orphan into hierarchy', () => {
  const dummyNodes: Record<string, TraceabilityNode> = {
    'parent-init': {
      id: 'parent-init',
      title: 'Digital Payments Initiative',
      owner: 'Lead',
      status: 'On Track',
      progress: 70,
      budget: '$4M',
      parentIds: [],
      childIds: [],
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    },
    'orphan-epic': {
      id: 'orphan-epic',
      title: 'Instant Tap-to-Pay Epic',
      owner: 'Squad',
      status: 'At Risk',
      progress: 40,
      budget: '$1.2M',
      parentIds: [],
      childIds: [],
      isOrphan: true,
      ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
    }
  };

  const updated = remediateOrphanNode(dummyNodes, 'orphan-epic', 'parent-init');
  assert.equal(updated['orphan-epic'].isOrphan, false);
  assert.ok(updated['orphan-epic'].parentIds.includes('parent-init'));
  assert.ok(updated['parent-init'].childIds.includes('orphan-epic'));
});

test('evaluateSmartCriteria evaluates SMART criteria on measurable vs vague statements', () => {
  const wellFormedKR = 'Reduce mortgage approval turnaround from 9 days to 48 hours';
  const resultGood = evaluateSmartCriteria(wellFormedKR);

  assert.ok(resultGood.compositeScore >= 80, `Expected high composite score, got ${resultGood.compositeScore}`);
  assert.ok(resultGood.measurable.score >= 90);
  assert.ok(resultGood.specific.score >= 80);

  const vagueKR = 'Make our services better';
  const resultBad = evaluateSmartCriteria(vagueKR);
  assert.ok(resultBad.compositeScore < 70, `Expected lower composite score, got ${resultBad.compositeScore}`);
  assert.ok(resultBad.measurable.score < 50);
});

test('calculateRegressionPrediction extrapolates pace and returns confidence interval', () => {
  const historical = [40, 48, 55, 62];
  const prediction = calculateRegressionPrediction(historical, 65, 8, 12);

  assert.ok(prediction.predictedFinalPct >= 65);
  assert.ok(prediction.probabilityOfAttainment > 0 && prediction.probabilityOfAttainment <= 99);
  assert.ok(prediction.rSquared > 0);
  assert.ok(prediction.confidenceRange[0] <= prediction.predictedFinalPct);
  assert.ok(prediction.confidenceRange[1] >= prediction.predictedFinalPct);
});

test('computeVectorCosineSimilarity computes similarity correctly', () => {
  const vec1 = [1, 0, 0, 1];
  const vec2 = [1, 0, 0, 1];
  const vec3 = [0, 1, 1, 0];

  const simIdentical = computeVectorCosineSimilarity(vec1, vec2);
  const simOrthogonal = computeVectorCosineSimilarity(vec1, vec3);

  assert.equal(simIdentical, 1);
  assert.equal(simOrthogonal, 0);
});

test('solvePolynomialRegression fits quadratic curve and calculates R-squared', () => {
  const points = [
    { x: 2, y: 40 },
    { x: 4, y: 52 },
    { x: 6, y: 66 },
    { x: 8, y: 78 }
  ];

  const poly = solvePolynomialRegression(points);
  assert.ok(poly.rSquared >= 0.8, `Expected high R-squared, got ${poly.rSquared}`);
  assert.ok(typeof poly.a === 'number');
  assert.ok(typeof poly.b === 'number');
  assert.ok(typeof poly.c === 'number');
  assert.ok(['Accelerating', 'Decelerating', 'Linear-Dominant'].includes(poly.curveType));
});

test('evaluateAdvisoryCommittee generates requested N advisory agents with multiple dimensions', () => {
  const kr = 'Reduce payment API latency from 320ms to under 100ms in Q4';
  const history = [45, 52, 60, 72];
  const committee = evaluateAdvisoryCommittee(kr, history, 5);

  assert.equal(committee.totalAgents, 5, 'Should generate exactly 5 advisory agents');
  assert.equal(committee.agentOutcomes.length, 5);
  
  // Verify multiple dimensions on each agent
  for (const agent of committee.agentOutcomes) {
    assert.ok(agent.qualityScore >= 0 && agent.qualityScore <= 100);
    assert.ok(agent.noveltyScore >= 0 && agent.noveltyScore <= 100);
    assert.ok(agent.smartScore >= 0 && agent.smartScore <= 100);
    assert.ok(agent.regressionAttainment >= 0 && agent.regressionAttainment <= 100);
    assert.ok(agent.confidenceInterval[0] <= agent.confidenceInterval[1]);
    assert.ok(agent.rationale.length > 10);
  }

  // Verify polynomial model & trajectory
  assert.ok(committee.polynomialModel.rSquaredPolynomial > 0);
  assert.equal(committee.polynomialModel.trajectory.length, 12);
  assert.ok(committee.confidenceInterval[0] <= committee.confidenceInterval[1]);
});

test('generateHistoricalAccuracyCohorts returns ordered cohorts with increasing R2 and narrowing CI spread', () => {
  const quarterCohorts = generateHistoricalAccuracyCohorts('quarters');
  assert.equal(quarterCohorts.length, 8);
  
  // Verify monotonic or converging R-squared growth over time
  const firstR2 = quarterCohorts[0].rSquaredPolynomial;
  const lastR2 = quarterCohorts[quarterCohorts.length - 1].rSquaredPolynomial;
  assert.ok(lastR2 > firstR2, `Last R2 (${lastR2}) should exceed initial (${firstR2})`);
  
  // Verify CI spread narrows as confidence interval calibrates
  const firstSpread = quarterCohorts[0].ciSpread;
  const lastSpread = quarterCohorts[quarterCohorts.length - 1].ciSpread;
  assert.ok(lastSpread < firstSpread, `Last CI spread (${lastSpread}) should be tighter than first (${firstSpread})`);

  // Verify sprint cohorts
  const sprintCohorts = generateHistoricalAccuracyCohorts('sprints');
  assert.equal(sprintCohorts.length, 12);
  assert.ok(sprintCohorts[11].rSquaredPolynomial >= 0.95);
});

test('generateAgentAccuracyProfiles returns diverse advisory personas with calibration data', () => {
  const profiles = generateAgentAccuracyProfiles();
  assert.ok(profiles.length >= 5);
  for (const p of profiles) {
    assert.ok(p.historicalRSquared > 0.85);
    assert.ok(p.ciCalibrationRate >= 90);
    assert.ok(p.color.startsWith('#'));
    assert.equal(p.historicalTrend.length, 8);
  }
});

