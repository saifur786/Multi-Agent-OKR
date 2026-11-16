import test from 'node:test';
import assert from 'node:assert/strict';
import { TELCO_DATA } from '../data/telcoData.ts';
import {
  buildDefaultOrganisationalPrerequisites,
  buildPrerequisitesAgentContext,
  CANONICAL_PREREQUISITE_SPECS,
  computePrerequisitesCoverageStats,
  normalizeOrganisationalPrerequisites,
  PREREQUISITE_CATEGORIES,
  searchOrganisationalPrerequisites
} from './orgPrerequisites.ts';

test('buildDefaultOrganisationalPrerequisites generates all 4 labeled categories and 13 exact canonical pre-requisite labels', () => {
  const items = buildDefaultOrganisationalPrerequisites(TELCO_DATA, '2026-11-16T14:00:00.000Z');
  assert.equal(items.length, 13);

  const expectedCategories = [
    'Strategy & Governance',
    'Business Context',
    'Execution Data',
    'Knowledge Sources'
  ];
  assert.deepEqual(
    PREREQUISITE_CATEGORIES.map((c) => c.label),
    expectedCategories
  );

  const expectedLabels = [
    'Corporate Strategy, Objectives & investment priorities',
    'OKR framework, Policies & Government rules',
    'RACI, Ownership & accountability model',
    'Goals & Value drivers',
    'Risk, Compliance & regulatory requirements',
    'Organisational hierarchy & operating model',
    'Structured Business Problems',
    'Existing OKRs',
    'Programs, Projects, Epics, & investments',
    'Resource Capacity, Budgets & performance metrics',
    'Planview (or custom), Jira, Planner & portfolio repositories',
    'Enterprise policies & knowledge bases',
    'Operational, customer & market signals'
  ];

  assert.deepEqual(
    items.map((item) => item.label),
    expectedLabels
  );

  const strategyItems = items.filter((i) => i.categoryLabel === 'Strategy & Governance');
  const businessItems = items.filter((i) => i.categoryLabel === 'Business Context');
  const executionItems = items.filter((i) => i.categoryLabel === 'Execution Data');
  const knowledgeItems = items.filter((i) => i.categoryLabel === 'Knowledge Sources');

  assert.equal(strategyItems.length, 3);
  assert.equal(businessItems.length, 3);
  assert.equal(executionItems.length, 4);
  assert.equal(knowledgeItems.length, 3);
  assert.ok(items.every((item) => item.enabledForAgents && item.content.length > 10));
});

test('normalizeOrganisationalPrerequisites preserves customized source systems, toggles, and custom entries while restoring missing canonical specs', () => {
  const customEdited = [
    {
      id: 'ks_portfolio_repos',
      categoryKey: 'knowledge_sources',
      label: 'Planview (or custom), Jira, Planner & portfolio repositories',
      sourceSystem: 'Custom Azure DevOps + Jira Cloud',
      content: 'Custom federated backlog synced every 15 minutes.',
      owner: 'Portfolio PMO',
      enabledForAgents: true,
      syncStatus: 'Configured',
      targetAgents: ['Alignment Capacity Agent', 'Risk Sentinel'],
      updatedAt: '2026-11-16T14:05:00.000Z'
    },
    {
      id: 'custom-req-1',
      categoryKey: 'business_context',
      label: 'Regional Telco Spectrum Mandates',
      description: 'FCC & ACMA 5G spectrum license obligations',
      content: 'Must retain 99.95% regional backhaul SLA across rural towers.',
      sourceSystem: 'Custom Regulatory Feed',
      owner: 'VP Regulatory Affairs',
      enabledForAgents: false,
      syncStatus: 'Pending Review',
      isCanonical: false,
      tags: ['Spectrum', 'Compliance'],
      updatedAt: '2026-11-16T14:06:00.000Z'
    }
  ];

  const normalized = normalizeOrganisationalPrerequisites(customEdited, TELCO_DATA);
  assert.equal(normalized.length, CANONICAL_PREREQUISITE_SPECS.length + 1);

  const editedRepo = normalized.find((i) => i.id === 'ks_portfolio_repos');
  assert.equal(editedRepo?.sourceSystem, 'Custom Azure DevOps + Jira Cloud');
  assert.equal(editedRepo?.syncStatus, 'Configured');
  assert.equal(editedRepo?.isCanonical, true);

  const customEntry = normalized.find((i) => i.id === 'custom-req-1');
  assert.ok(customEntry);
  assert.equal(customEntry?.categoryLabel, 'Business Context');
  assert.equal(customEntry?.enabledForAgents, false);
});

test('searchOrganisationalPrerequisites, computePrerequisitesCoverageStats, and buildPrerequisitesAgentContext work accurately', () => {
  const items = normalizeOrganisationalPrerequisites(
    buildDefaultOrganisationalPrerequisites(TELCO_DATA).map((item) =>
      item.id === 'ed_existing_okrs' ? { ...item, enabledForAgents: false } : item
    ),
    TELCO_DATA
  );

  const stats = computePrerequisitesCoverageStats(items);
  assert.equal(stats.totalCount, 13);
  assert.equal(stats.enabledCount, 12);
  assert.equal(stats.byCategory.execution_data.total, 4);
  assert.equal(stats.byCategory.execution_data.enabled, 3);

  const filtered = searchOrganisationalPrerequisites(items, 'Jira', 'knowledge_sources');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'ks_portfolio_repos');

  const promptContext = buildPrerequisitesAgentContext(items);
  assert.ok(promptContext.includes('Strategy & Governance:'));
  assert.ok(promptContext.includes('Business Context:'));
  assert.ok(promptContext.includes('Execution Data:'));
  assert.ok(promptContext.includes('Knowledge Sources:'));
  assert.ok(!promptContext.includes('- Existing OKRs ['));
});
