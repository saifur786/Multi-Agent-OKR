import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_DATA } from '../data/industryData';
import {
  buildDecisionMakingEngineSnapshot,
  buildInitiativeFundingDecisions,
  buildQuantifiedInvestmentRanking,
  buildStrategicDriftModels,
  computeResourceReallocationPlan,
  parseBudgetMillions
} from './decisionMakingEngine';

test('parseBudgetMillions extracts millions and thousands reliably', () => {
  assert.equal(parseBudgetMillions('$8.5M'), 8.5);
  assert.equal(parseBudgetMillions('$750K'), 0.75);
  assert.equal(parseBudgetMillions('$0 (Reallocated)'), 0);
  assert.equal(parseBudgetMillions(null), 0);
});

test('buildInitiativeFundingDecisions flags orphan and low-value stalled initiatives for stop-funding', () => {
  const telco = INDUSTRY_DATA.Telco;
  const baseNodes = { ...(telco.nodeMap || {}) };
  baseNodes['p-orphan-test'] = {
    id: 'p-orphan-test',
    title: 'Epic: Unlinked Legacy Provisioning Script',
    owner: 'Legacy Ops',
    status: 'Behind',
    progress: 14,
    budget: '$2.4M',
    parentIds: [],
    childIds: [],
    isOrphan: true,
    ai: {
      analyse: 'No parent OKR link.',
      predict: 'Low impact.',
      recommend: 'Stop funding.',
      automate: 'Flagged.',
      optimise: 'Reallocate.'
    }
  };

  const results = buildInitiativeFundingDecisions({
    nodesMap: baseNodes,
    managedPrograms: telco.programs || []
  });

  const orphanEval = results.find((r) => r.id === 'p-orphan-test');
  assert.ok(orphanEval);
  assert.equal(orphanEval.verdict, 'Stop Funding');
  assert.equal(orphanEval.reclaimableBudgetM, 2.4);
  assert.ok(orphanEval.reclaimableFte >= 2);
});

test('buildQuantifiedInvestmentRanking prioritizes investments by quantified business problem exposure over opinion', () => {
  const telco = INDUSTRY_DATA.Telco;
  const nodesMap = { ...(telco.nodeMap || {}) };
  const ranked = buildQuantifiedInvestmentRanking({
    industry: telco,
    nodesMap
  });

  assert.ok(ranked.length >= 3);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].quantifiedProblemScore >= ranked[i].quantifiedProblemScore);
    assert.equal(ranked[i - 1].rankByQuantifiedProblem, i);
  }
  assert.ok(ranked[0].annualExposureM > 0);
  assert.ok(ranked[0].evidenceCompletenessPct > 0);
});

test('buildStrategicDriftModels surfaces timeline drift and external influences ahead of failure', () => {
  const telco = INDUSTRY_DATA.Telco;
  const activeDisaster = {
    ...(telco.activeDisasters || [])[0],
    active: true
  };

  const models = buildStrategicDriftModels({
    industry: telco,
    nodesMap: telco.nodeMap || {},
    managedPrograms: telco.programs || [],
    activeDisasters: [activeDisaster],
    prerequisites: telco.organisationalPrerequisites
  });

  assert.ok(models.length >= 2);
  const first = models[0];
  assert.equal(first.timeline.length, 8);
  assert.ok(first.externalInfluences.length >= 2);
  assert.ok(first.currentDriftGapPct > 0);
  assert.ok(first.weeksBeforeFailure >= 1);
  assert.ok(first.externalInfluences.some((inf) => inf.label === activeDisaster.title));
});

test('computeResourceReallocationPlan shifts resources based on operational, market_demand, and regulatory conditions', () => {
  const telco = INDUSTRY_DATA.Telco;
  const snapshotOperational = buildDecisionMakingEngineSnapshot({
    industry: telco,
    nodesMap: telco.nodeMap || {},
    managedPrograms: telco.programs || [],
    activeDisasters: telco.activeDisasters || [],
    condition: 'operational'
  });

  const marketPlan = computeResourceReallocationPlan({
    condition: 'market_demand',
    fundingEvaluations: snapshotOperational.fundingEvaluations,
    quantifiedInvestments: snapshotOperational.quantifiedInvestments,
    driftModels: snapshotOperational.driftModels
  });

  const regulatoryPlan = computeResourceReallocationPlan({
    condition: 'regulatory',
    fundingEvaluations: snapshotOperational.fundingEvaluations,
    quantifiedInvestments: snapshotOperational.quantifiedInvestments,
    driftModels: snapshotOperational.driftModels
  });

  assert.equal(snapshotOperational.reallocationPlan.condition, 'operational');
  assert.equal(marketPlan.condition, 'market_demand');
  assert.equal(regulatoryPlan.condition, 'regulatory');
  assert.ok(marketPlan.reallocationLeadTimeDays < marketPlan.baselineLeadTimeDays);
  assert.ok(marketPlan.allocations.length >= 2);
  assert.ok(snapshotOperational.attributeReasoning.stopFunding.length > 20);
  assert.ok(snapshotOperational.attributeReasoning.quantifiedPrioritisation.length > 20);
  assert.ok(snapshotOperational.attributeReasoning.strategicDrift.length > 20);
  assert.ok(snapshotOperational.attributeReasoning.resourceReallocation.length > 20);
});
