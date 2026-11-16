import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ADVISOR_LENSES,
  determineProactiveAgentRoutes,
  isSuperAdminIdentity,
  mergeSelectableAccounts,
  normalizeOrchestrationRuns,
  normalizeRiskConnectorPayload,
  resolveAdvisorLenses,
  resolveUserCapabilities
} from './agenticCommunication';

test('resolveUserCapabilities enforces role and industry-scoped permissions', () => {
  const superAdmin = resolveUserCapabilities(
    { email: 'saifur.rahman.au@gmail', role: 'super-admin', industry: 'All', permissions: ['all'] },
    'Telco'
  );
  assert.equal(superAdmin.isSuperAdmin, true);
  assert.equal(superAdmin.canManageAdmin, true);
  assert.equal(superAdmin.canCreateOkr, true);
  assert.equal(superAdmin.canEscalateNotification, true);

  assert.equal(isSuperAdminIdentity({ email: 'saifurRahman.au@gmail.com' }), true);

  const okrCreator = resolveUserCapabilities(
    { email: 'creator@telco.local', role: 'okr-creator', industry: 'Telco', permissions: ['create-okr', 'execute-lifecycle'] },
    'Telco'
  );
  assert.equal(okrCreator.canCreateOkr, true);
  assert.equal(okrCreator.canExecuteLifecycle, true);
  assert.equal(okrCreator.canManagePolicy, false);
  assert.equal(okrCreator.canEscalateNotification, false);
  assert.equal(okrCreator.industryAccessAllowed, true);

  const crossIndustry = resolveUserCapabilities(
    { email: 'creator@telco.local', role: 'okr-creator', industry: 'Telco', permissions: ['create-okr'] },
    'Banking'
  );
  assert.equal(crossIndustry.industryAccessAllowed, false);

  const monitor = resolveUserCapabilities(
    { email: 'mon@bank.local', role: 'monitor', industry: 'Banking', permissions: ['monitor', 'trace', 'notify'] },
    'Banking'
  );
  assert.equal(monitor.canMonitor, true);
  assert.equal(monitor.canEscalateNotification, true);
  assert.equal(monitor.canCreateOkr, false);
  assert.equal(monitor.canManagePolicy, false);

  const policyMgr = resolveUserCapabilities(
    { email: 'pol@retail.local', role: 'policy-manager', industry: 'Retail', permissions: ['manage-policy', 'view-dashboards'] },
    'Retail'
  );
  assert.equal(policyMgr.canManagePolicy, true);
  assert.equal(policyMgr.canManageDashboards, true);
  assert.equal(policyMgr.canCreateOkr, false);
});

test('mergeSelectableAccounts merges dynamic admin-created industry users without duplicates', () => {
  const merged = mergeSelectableAccounts(
    [
      {
        id: 'super-admin',
        email: 'saifur.rahman.au@gmail',
        name: 'Saifur Rahman',
        role: 'super-admin',
        industry: 'All',
        permissions: ['all'],
        label: 'Super Admin'
      }
    ],
    [
      {
        id: 'u-1',
        name: 'Saifur Duplicate',
        email: 'saifur.rahman.au@gmail',
        role: 'super-admin',
        industry: 'All'
      },
      {
        id: 'u-2',
        name: 'Ava Clarke',
        email: 'ava.clarke@telco.local',
        role: 'okr-creator',
        industry: 'Telco'
      }
    ]
  );

  assert.equal(merged.length, 2);
  assert.equal(merged[1].email, 'ava.clarke@telco.local');
  assert.equal(merged[1].industry, 'Telco');
  assert.equal(merged[1].isCustomRegistered, true);
});

test('determineProactiveAgentRoutes routes prompts to expected specialized agents', () => {
  const riskRoutes = determineProactiveAgentRoutes(
    'Analyze ServiceNow critical incident and Jira sprint velocity drop before Q2 report',
    'run_orchestration',
    0,
    1
  );
  const keys = riskRoutes.map((r) => r.agentKey);
  assert.ok(keys.includes('risk'));
  assert.ok(keys.includes('reporting'));

  const okrRoutes = determineProactiveAgentRoutes(
    'Evaluate this OKR for SMART compliance and propose a strategic theme',
    'create_okr',
    0,
    0
  );
  assert.ok(okrRoutes.some((r) => r.agentKey === 'advisor'));
  assert.ok(okrRoutes.some((r) => r.agentKey === 'ideation'));
});

test('resolveAdvisorLenses expands or slices custom business lenses cleanly', () => {
  const lenses8 = resolveAdvisorLenses(8, DEFAULT_ADVISOR_LENSES);
  assert.equal(lenses8.length, 8);
  assert.ok(lenses8[6].name.includes('(Panel 2)'));

  const customOnly = resolveAdvisorLenses(4, [
    { id: 'c1', name: 'ESG Compliance', focus: 'Carbon & sustainability', weight: 1.3, enabled: true },
    { id: 'c2', name: 'Disabled Lens', focus: 'Should be skipped', weight: 1.0, enabled: false }
  ]);
  assert.equal(customOnly.length, 4);
  assert.ok(customOnly.every((l) => l.name.startsWith('ESG Compliance')));
});

test('normalizeOrchestrationRuns clamps bounds and keeps up to last 10 runs', () => {
  const many = Array.from({ length: 14 }, (_, i) => ({
    id: `r-${i}`,
    run: `Run ${i + 1}`,
    successRate: i === 13 ? 110 : 88.456,
    latencyMs: 900 + i * 20
  }));
  const normalized = normalizeOrchestrationRuns(many);
  assert.equal(normalized.length, 10);
  assert.equal(normalized[9].successRate, 100);
  assert.equal(normalized[0].run, 'Run 5');
});

test('normalizeRiskConnectorPayload parses ServiceNow and Jira signals', () => {
  const sn = normalizeRiskConnectorPayload(
    'ServiceNow',
    { number: 'INC009412', priority: 'P1 - Critical', short_description: '5G Core Gateway Timeout' },
    'Telco'
  );
  assert.equal(sn.severity, 'Critical');
  assert.equal(sn.topic, 'RISK_SENTINEL_ALERT');
  assert.ok(sn.title.includes('INC009412'));

  const jira = normalizeRiskConnectorPayload(
    'Jira',
    { issueKey: 'PAY-892', velocityDelta: '-14%', squad: 'Core Platform' },
    'Banking'
  );
  assert.equal(jira.severity, 'Critical');
  assert.equal(jira.topic, 'WEBHOOK_PAYLOAD_RECEIVED');
  assert.ok(jira.title.includes('PAY-892'));
});
