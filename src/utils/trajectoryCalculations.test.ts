import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFutureAttainmentTrajectory,
  validateOkrStructuralAdequacy
} from './trajectoryCalculations';
import { TELCO_DATA, TELCO_POLICIES, TELCO_ORG_DIRECTORY } from '../data/telcoData';

test('computeFutureAttainmentTrajectory projects target vs predicted across 5 periods', () => {
  const points = computeFutureAttainmentTrajectory(
    TELCO_DATA.attainment,
    TELCO_DATA.regressionModel,
    TELCO_DATA.traceability[3] || []
  );

  assert.equal(points.length, 5);
  assert.equal(points[0].targetTrajectory, TELCO_DATA.attainment);
  assert.equal(points[4].targetTrajectory, 100);

  // Confidence interval bounds must be logically consistent
  points.forEach((pt) => {
    assert.ok(pt.ciLower <= pt.aiPredictedTrajectory);
    assert.ok(pt.ciUpper >= pt.aiPredictedTrajectory);
    assert.ok(pt.period.length > 0);
  });
});

test('computeFutureAttainmentTrajectory models disaster shock degradation', () => {
  const activeDisaster = { ...TELCO_DATA.activeDisasters![0], active: true };
  const points = computeFutureAttainmentTrajectory(
    TELCO_DATA.attainment,
    TELCO_DATA.regressionModel,
    [],
    [activeDisaster]
  );

  points.forEach((pt) => {
    assert.ok(pt.disasterShockTrajectory !== undefined);
    assert.ok(pt.disasterShockTrajectory < pt.targetTrajectory);
  });
});

test('validateOkrStructuralAdequacy evaluates ownership and enterprise policies', () => {
  const testNode = TELCO_DATA.traceability[3][0]; // t-kr1
  const report = validateOkrStructuralAdequacy(testNode, TELCO_POLICIES, TELCO_ORG_DIRECTORY);

  assert.equal(report.okrId, 't-kr1');
  assert.ok(report.measurabilityScore >= 70);
  assert.ok(report.ambitionScore >= 70);
  assert.ok(report.structuralCheckpointsPassed >= 4);
  assert.equal(report.isAdequate, true);
});
