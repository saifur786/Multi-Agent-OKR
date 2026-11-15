import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_DATA } from '../data/industryData';
import {
  collectPortfolioNotifications,
  countUnreadNotifications,
  evaluateOkrCriticality,
  filterPortfolioNotifications,
  groupNotificationsByIndustryAndOrg
} from './headerNotifications';
import { BusEvent, IndustryDataBundle, TraceabilityNode } from '../types/orchestration';

test('evaluateOkrCriticality flags Behind, P0 - Critical, and At Risk <60% OKRs', () => {
  const base: TraceabilityNode = {
    id: 't-kr-test',
    title: 'Test KR',
    owner: 'CTO',
    status: 'On Track',
    progress: 82,
    budget: '$4M',
    parentIds: [],
    childIds: [],
    ai: { analyse: '', predict: '', recommend: '', automate: '', optimise: '' }
  };

  assert.equal(evaluateOkrCriticality(base).isCritical, false);

  const behind = evaluateOkrCriticality({ ...base, status: 'Behind', progress: 65 });
  assert.equal(behind.isCritical, true);
  assert.equal(behind.severity, 'critical');

  const p0 = evaluateOkrCriticality({
    ...base,
    manualPriority: {
      priority: 'P0 - Critical',
      overrideReason: 'Board escalation',
      overriddenBy: 'CEO',
      overrideTimestamp: '2026-11-14T00:00:00Z'
    }
  });
  assert.equal(p0.isCritical, true);
  assert.equal(p0.severity, 'critical');

  const atRiskLow = evaluateOkrCriticality({ ...base, status: 'At Risk', progress: 58 });
  assert.equal(atRiskLow.isCritical, true);
  assert.equal(atRiskLow.severity, 'high');

  const atRiskHealthy = evaluateOkrCriticality({ ...base, status: 'At Risk', progress: 68 });
  assert.equal(atRiskHealthy.isCritical, false);
});

test('collectPortfolioNotifications detects critical OKRs and active disasters tagged by Industry and Organisation', () => {
  const telcoLive: IndustryDataBundle = {
    ...INDUSTRY_DATA['Telco'],
    activeDisasters: (INDUSTRY_DATA['Telco'].activeDisasters || []).map((d, idx) =>
      idx === 0 ? { ...d, active: true } : d
    )
  };

  const liveEvent: BusEvent = {
    id: 'ev-dis-1',
    timestamp: '10:15:00',
    topic: 'SIGNIFICANT_EVENT_TRIGGERED',
    sourceAgent: 'Disaster Simulator Radar',
    targetAgent: 'Risk Sentinel & Executive Reporter',
    summary: 'CATASTROPHIC EVENT TRIGGERED',
    payload: {
      disasterId: telcoLive.activeDisasters![0].id,
      title: telcoLive.activeDisasters![0].title
    },
    latencyMs: 12,
    severity: 'danger'
  };

  const alerts = collectPortfolioNotifications(INDUSTRY_DATA, 'Telco', telcoLive, [liveEvent]);

  // Should contain Telco active disaster with organisationName = Apex Telecommunications
  const telcoDisaster = alerts.find(
    (a) => a.category === 'disaster_event' && a.industryKey === 'Telco'
  );
  assert.ok(telcoDisaster, 'Expected Telco disaster notification');
  assert.equal(telcoDisaster.organisationName, 'Apex Telecommunications');
  assert.equal(telcoDisaster.targetTab, 'disasters');
  assert.equal(telcoDisaster.isNew, true);
  assert.equal(telcoDisaster.detectedAt, '10:15:00');

  // Should also detect cross-industry critical OKRs (e.g. Banking b-kr1 at 58% and Telco t-kr1 at 58%)
  const bankingOkrAlert = alerts.find(
    (a) => a.category === 'critical_okr' && a.industryKey === 'Banking' && a.targetOkrId === 'b-kr1'
  );
  assert.ok(bankingOkrAlert, 'Expected Banking critical OKR notification');
  assert.equal(bankingOkrAlert.organisationName, INDUSTRY_DATA['Banking'].name);
  assert.equal(bankingOkrAlert.targetTab, 'okrs');

  // Layer 5 Orphan Epics (e.g. t-p-orphan1) must NOT be misclassified as Critical OKRs
  const orphanEpicAlert = alerts.find((a) => a.targetOkrId === 't-p-orphan1');
  assert.equal(orphanEpicAlert, undefined, 'Orphan Epic t-p-orphan1 should not appear as a Critical OKR');
});

test('filterPortfolioNotifications, grouping, and unread counter work by Industry, category, and read state', () => {
  const alerts = collectPortfolioNotifications(INDUSTRY_DATA, 'Telco', INDUSTRY_DATA['Telco'], []);

  const currentOnly = filterPortfolioNotifications(alerts, {
    scope: 'current',
    activeIndustryKey: 'Telco',
    category: 'all',
    industryFilter: 'ALL'
  });
  assert.ok(currentOnly.length >= 1);
  assert.ok(currentOnly.every((a) => a.industryKey === 'Telco'));

  const grouped = groupNotificationsByIndustryAndOrg(alerts, 'Telco');
  assert.ok(grouped.length >= 2, 'Expected multiple industries grouped');
  assert.equal(grouped[0].industryKey, 'Telco', 'Active industry should sort first when present');

  const readIds = new Set<string>([alerts[0].id]);
  const unreadCount = countUnreadNotifications(alerts, readIds);
  assert.equal(unreadCount, alerts.length - 1);
});
