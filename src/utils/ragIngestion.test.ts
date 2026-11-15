import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_DATA } from '../data/industryData';
import {
  buildDeterministicIngestionPreview,
  chunkDocumentText,
  classifyDocumentPillar,
  mergePreviewIntoKnowledgeBase
} from './ragIngestion';

test('classifyDocumentPillar routes policy/market documents to kb2 and staffing docs to kb5', () => {
  const policyText = 'APRA CPS 230 operational resilience regulatory compliance standard benchmark.';
  const staffingText = 'Squad FTE utilisation reached 112% capacity across backend engineering headcount.';

  assert.equal(classifyDocumentPillar(policyText, 'apra-cps230-policy.pdf'), 'kb2');
  assert.equal(classifyDocumentPillar(staffingText, 'q4-capacity.csv'), 'kb5');
  assert.equal(classifyDocumentPillar(policyText, 'policy.pdf', 'kb4'), 'kb4');
});

test('chunkDocumentText splits multi-sentence reports into bounded chunks', () => {
  const longText = [
    'Cycle time improved from 9 days to 3.4 days across core mortgage approvals in Q4.',
    'Customer NPS rose from 44 to 58 after deploying automated underwriting telemetry.',
    'Backend API squad capacity remains constrained at 108% FTE utilisation.'
  ].join(' ');

  const chunks = chunkDocumentText(longText, 'perf-report.md', { maxChunkLength: 140, maxChunks: 6 });
  assert.ok(chunks.length >= 2);
  chunks.forEach((c) => {
    assert.ok(c.text.length <= 140);
    assert.equal(c.source, 'perf-report.md');
  });
});

test('mergePreviewIntoKnowledgeBase updates targeted pillar without exceeding chunk cap', () => {
  const banking = INDUSTRY_DATA['Banking'];
  const preview = buildDeterministicIngestionPreview({
    fileName: 'apra-policy-2026.pdf',
    textContent:
      'APRA CPS 230 compliance policy mandates sub-4h failover recovery and 99.98% operational resilience SLA across tier-1 payment rails.',
    industryName: banking.name
  });

  const updated = mergePreviewIntoKnowledgeBase(banking.knowledgeBase, preview);
  assert.equal(updated.length, banking.knowledgeBase.length);

  const targetPillar = updated.find((p) => p.id === preview.targetPillarId);
  assert.ok(targetPillar);
  assert.ok(targetPillar.vectorChunks.some((c) => c.source === 'apra-policy-2026.pdf'));
  assert.ok(targetPillar.vectorChunks.length <= 20);
  assert.equal(targetPillar.metric, preview.metricHighlight);
});
