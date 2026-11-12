import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INDUSTRY_BUSINESS_PROBLEMS,
  getAvailableBusinessProblemsForIndustry,
  parseRawProblemText
} from './businessProblemLibrary';
import { IndustryDataBundle } from '../types/orchestration';

test('INDUSTRY_BUSINESS_PROBLEMS contains structured 6-attribute entries for all industries', () => {
  const industries = ['Telco', 'Banking', 'Retail', 'IT Consulting', 'Power Suppliers'] as const;

  for (const ind of industries) {
    const list = INDUSTRY_BUSINESS_PROBLEMS[ind];
    assert.ok(list && list.length >= 2, `Industry ${ind} should have at least 2 curated problems`);

    for (const item of list) {
      assert.ok(item.id, 'Must have ID');
      assert.ok(item.title, 'Must have Title');
      assert.ok(item.problem.problemDescription, 'Must have Problem Description');
      assert.ok(Array.isArray(item.problem.impactedStakeholders) && item.problem.impactedStakeholders.length > 0, 'Must have stakeholders');
      assert.ok(item.problem.causalChainToDollarImpact.includes('$') || item.problem.causalChainToDollarImpact.includes('->'), 'Must have causal chain with $ impact');
      assert.ok(item.problem.rootCause, 'Must have Root Cause');
      assert.ok(item.problem.targetRemediationTiming, 'Must have Target Timing');
      assert.ok(Array.isArray(item.problem.metrics) && item.problem.metrics.length >= 2, 'Must have leading and lagging metrics');
    }
  }
});

test('parseRawProblemText extracts 6 dimensions from raw unstructured text', () => {
  const rawText = 'Peak-hour cell tower backhaul saturation reaches 95% causing 4.2% subscriber churn and $18.4M annual revenue loss due to legacy optical interfaces. Target remediation by Q1 2027 Sprint 6.';

  const parsed = parseRawProblemText(rawText, 'Telecommunications');

  assert.ok(parsed.problemDescription.length > 0, 'Should extract problem description');
  assert.ok(parsed.impactedStakeholders.length > 0, 'Should extract stakeholders');
  assert.ok(parsed.causalChainToDollarImpact.includes('$18.4M'), 'Should extract dollar impact in causal chain');
  assert.ok(parsed.rootCause.toLowerCase().includes('legacy optical interfaces') || parsed.rootCause.length > 0, 'Should extract root cause');
  assert.ok(parsed.targetRemediationTiming.includes('Q1 2027 Sprint 6'), 'Should extract timing');
  assert.equal(parsed.metrics.length, 2, 'Should create 2 metrics (Leading and Lagging)');
  assert.equal(parsed.metrics[0].metricType, 'Leading');
  assert.equal(parsed.metrics[1].metricType, 'Lagging');
});

test('getAvailableBusinessProblemsForIndustry aggregates curated and runtime problems', () => {
  const mockIndustry = {
    id: 'Telco',
    name: 'Apex Telecommunications',
    sector: 'Telecommunications',
    quarter: 'Q4 2026',
    overallHealth: 'On Track',
    attainment: 71,
    totalBudget: '$54.0M',
    activeAgents: 6,
    stages: [],
    programs: []
  } as unknown as IndustryDataBundle;

  const problems = getAvailableBusinessProblemsForIndustry(mockIndustry, {});
  assert.ok(problems.length >= 4, 'Should return at least 4 telco problems');
  assert.ok(problems.some((p) => p.title.includes('Metro Backhaul Congestion')));
});
