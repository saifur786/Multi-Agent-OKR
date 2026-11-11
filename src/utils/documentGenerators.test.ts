import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateExecutiveReportCSV,
  generateBusinessRequirementDocument,
  generateRequirementTraceabilityMatrixCSV
} from './documentGenerators';
import { INDUSTRY_DATA } from '../data/industryData';

test('generateExecutiveReportCSV creates valid CSV containing all 7 layers and node health', () => {
  const industry = INDUSTRY_DATA.Banking;
  const nodesMap: Record<string, any> = {};
  Object.values(industry.traceability).forEach(nodes => {
    nodes.forEach(n => {
      nodesMap[n.id] = n;
    });
  });

  const csv = generateExecutiveReportCSV(industry, nodesMap);
  assert.ok(csv.includes('Layer_Number,Layer_Name,Node_ID,Title,Owner,Health_Status'));
  assert.ok(csv.includes('Layer 1: Corporate Strategy'));
  assert.ok(csv.includes('Layer 5: Delivery Epics'));
  assert.ok(csv.includes('Banking'));
  assert.ok(csv.includes('Q4 2026'));

  const lines = csv.trim().split('\r\n');
  assert.ok(lines.length >= 10, `Expected multiple node rows, got ${lines.length}`);
});

test('generateBusinessRequirementDocument outputs complete enterprise BRD with 7 sections', () => {
  const industry = INDUSTRY_DATA.Banking;
  const brd = generateBusinessRequirementDocument(industry);

  assert.ok(brd.includes('# Business Requirement Document (BRD)'));
  assert.ok(brd.includes('Global Horizon Bank'));
  assert.ok(brd.includes('FR-1: Strategy & Ideation Agent'));
  assert.ok(brd.includes('FR-2: OKR Quality & Prediction Agent'));
  assert.ok(brd.includes('FR-3: Alignment & Capacity Agent'));
  assert.ok(brd.includes('FR-4: Risk Detection Agent'));
  assert.ok(brd.includes('FR-5: Executive Reporting Agent'));
  assert.ok(brd.includes('FR-6: Retrospective & Learning Agent'));
  assert.ok(brd.includes('Multi-Agent Advisory Committee Protocol'));
  assert.ok(brd.includes('Closed-Form Quadratic Regression'));
});

test('generateRequirementTraceabilityMatrixCSV creates compliant RTM mapping REQ-ID to test cases', () => {
  const rtm = generateRequirementTraceabilityMatrixCSV();

  assert.ok(rtm.includes('Req_ID,Category,Business_Requirement,Functional_Specification'));
  assert.ok(rtm.includes('REQ-STRAT-01'));
  assert.ok(rtm.includes('REQ-OKR-01'));
  assert.ok(rtm.includes('REQ-MATH-01'));
  assert.ok(rtm.includes('REQ-GRAPH-01'));
  assert.ok(rtm.includes('REQ-EXEC-01'));
  assert.ok(rtm.includes('REQ-EXEC-02'));
  assert.ok(rtm.includes('REQ-DOC-01'));
  assert.ok(rtm.includes('VERIFIED_PASSED'));

  const lines = rtm.trim().split('\r\n');
  assert.ok(lines.length >= 15, `Expected multiple RTM rows, got ${lines.length}`);
});
