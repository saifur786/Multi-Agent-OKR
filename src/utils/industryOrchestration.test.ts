import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_DATA } from '../data/industryData';
import {
  ORCHESTRATION_ACTIONS,
  ORCHESTRATION_PIPELINE_HELP,
  runIndustryOkrProgramOrchestration
} from './industryOrchestration';
import { IndustryDataBundle, TraceabilityNode } from '../types/orchestration';

function flattenNodes(bundle: IndustryDataBundle): Record<string, TraceabilityNode> {
  const map: Record<string, TraceabilityNode> = {};
  Object.values(bundle.traceability || {}).forEach((nodes) => {
    nodes.forEach((n) => {
      map[n.id] = n;
    });
  });
  return map;
}

test('ORCHESTRATION_PIPELINE_HELP and ORCHESTRATION_ACTIONS document purpose, expectations, and aligned actions', () => {
  assert.ok(ORCHESTRATION_PIPELINE_HELP.purpose.length > 30);
  assert.equal(ORCHESTRATION_PIPELINE_HELP.expectations.length, 3);
  assert.equal(ORCHESTRATION_ACTIONS.length, 3);
  assert.deepEqual(
    ORCHESTRATION_ACTIONS.map((a) => a.mode),
    ['full-pipeline', 'okr-governance', 'program-disaster-sync']
  );
});

test('runIndustryOkrProgramOrchestration evaluates OKRs, active programs, and disaster shocks for the selected industry', () => {
  const telcoBase = INDUSTRY_DATA['Telco'];
  const telcoWithDisaster: IndustryDataBundle = {
    ...telcoBase,
    activeDisasters: (telcoBase.activeDisasters || []).map((d, idx) =>
      idx === 0 ? { ...d, active: true } : d
    )
  };
  const nodesMap = flattenNodes(telcoWithDisaster);

  const result = runIndustryOkrProgramOrchestration(telcoWithDisaster, nodesMap, 'full-pipeline');

  assert.equal(result.summary.industryName, 'Apex Telecommunications');
  assert.equal(result.summary.activeDisasterCount, 1);
  assert.ok(result.summary.totalOkrs >= 5, 'Should scan all industry OKRs');
  assert.ok(result.summary.criticalOkrCount >= 1, 'Should detect critical OKR (t-kr1 at 58%)');
  assert.ok(result.summary.activeProgramCount >= 2, 'Should count Active/Initiated Telco programs');
  assert.ok(result.summary.impactedProgramCount >= 1, 'Should flag program linked to critical OKR or impacted squad');
  assert.equal(result.stageEvents.length, 6, 'Should produce 6 stage-aligned Event Bus descriptors');
  assert.equal(result.updatedStages.length, 6);

  // Stage 4 Risk Radar should reflect the active disaster
  const stage4 = result.updatedStages.find((s) => s.id === 4);
  assert.ok(stage4);
  assert.match(stage4.simMetrics.riskAlert, /ACTIVE CRISIS \(1\)/);

  // Critical OKR node AI analysis should reflect industry orchestration
  assert.match(result.updatedNodesMap['t-kr1'].ai.analyse, /\[Orchestrated Apex Telecommunications\]/);
});

test('runIndustryOkrProgramOrchestration adapts to Banking industry OKR & Program portfolio', () => {
  const banking = INDUSTRY_DATA['Banking'];
  const nodesMap = flattenNodes(banking);

  const result = runIndustryOkrProgramOrchestration(banking, nodesMap, 'okr-governance');

  assert.equal(result.summary.industryName, banking.name);
  assert.equal(result.summary.mode, 'okr-governance');
  assert.equal(result.summary.activeDisasterCount, 0);
  assert.ok(result.summary.recommendations.length >= 1);
  assert.ok(result.updatedAttainment >= 18 && result.updatedAttainment <= 99);
});
