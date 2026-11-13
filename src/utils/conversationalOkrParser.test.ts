import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMetricLine,
  parseConversationalOkrInput
} from './conversationalOkrParser';

test('parseMetricLine parses Leading and Lagging bullet arrow strings cleanly', () => {
  const m1 = parseMetricLine('Leading • Cycle Time: 9 days → 3 days');
  assert.deepEqual(m1, {
    indicator: 'Cycle Time',
    baselineValue: '9 days',
    targetValue: '3 days',
    metricType: 'Leading'
  });

  const m2 = parseMetricLine('Lagging • Revenue Risk: $6.0M → $0');
  assert.deepEqual(m2, {
    indicator: 'Revenue Risk',
    baselineValue: '$6.0M',
    targetValue: '$0',
    metricType: 'Lagging'
  });

  const m3 = parseMetricLine('Network Utilisation: 94% -> < 72% (Leading)');
  assert.deepEqual(m3, {
    indicator: 'Network Utilisation',
    baselineValue: '94%',
    targetValue: '< 72%',
    metricType: 'Leading'
  });
});

test('parseConversationalOkrInput parses user structured reply into OKR and Business Problem objects', () => {
  const userMessage = [
    'owner: saifur',
    'timeline: Q2 2027 Sprint 4',
    'metric:',
    'Leading • Cycle Time: 9 days → 3 days',
    'Lagging • Revenue Risk: $6.0M → $0'
  ].join('\n');

  const result = parseConversationalOkrInput(
    userMessage,
    {
      industryName: 'Apex Telecommunications',
      sector: 'Telecommunications',
      owners: ['Dr. Elena Vance', 'Marcus Sterling'],
      parentOptions: [{ id: 't-o1', title: 'Accelerate 5G SA Metro Densification' }]
    },
    [
      { role: 'assistant', text: 'I can help create an OKR or business problem draft. Tell me target outcome, owner, timeline, and measurable metric.' }
    ]
  );

  assert.equal(result.intent, 'create_okr');
  assert.ok(result.okrDraft);
  assert.ok(result.businessProblem);
  assert.equal(result.okrDraft.owner, 'saifur');
  assert.equal(result.okrDraft.targetRemediationTiming, 'Q2 2027 Sprint 4');
  assert.deepEqual(result.okrDraft.remediationTimings, ['Q2 2027 Sprint 4']);
  assert.equal(result.okrDraft.metrics?.length, 2);
  assert.deepEqual(result.okrDraft.metrics?.[0], {
    indicator: 'Cycle Time',
    baselineValue: '9 days',
    targetValue: '3 days',
    metricType: 'Leading'
  });
  assert.deepEqual(result.okrDraft.metrics?.[1], {
    indicator: 'Revenue Risk',
    baselineValue: '$6.0M',
    targetValue: '$0',
    metricType: 'Lagging'
  });
  assert.equal(result.businessProblem.targetRemediationTiming, 'Q2 2027 Sprint 4');
  assert.equal(result.businessProblem.metrics.length, 2);
  assert.ok(!result.assistantMessage.includes('Tell me target outcome, owner, timeline, and measurable metric.'));
  assert.ok(result.assistantMessage.includes('saifur'));
  assert.ok(result.assistantMessage.includes('Q2 2027 Sprint 4'));
});

test('parseConversationalOkrInput merges multi-turn context and matches HR directory owners', () => {
  const result = parseConversationalOkrInput(
    'owner: elena\ntimeline: Q3 2027 Sprint 2\nroot cause: Legacy manual provisioning queue',
    {
      sector: 'Telecommunications',
      owners: ['Dr. Elena Vance', 'Marcus Sterling'],
      parentOptions: [{ id: 't-o1', title: 'Parent Objective' }]
    },
    [
      { role: 'user', text: 'Create a P0 OKR to cut customer onboarding time from 9 days to 3 days' },
      { role: 'assistant', text: 'Got it, please share owner and timeline.' }
    ]
  );

  assert.equal(result.intent, 'create_okr');
  assert.equal(result.okrDraft?.priority, 'P0 - Critical');
  assert.equal(result.okrDraft?.owner, 'Dr. Elena Vance');
  assert.equal(result.okrDraft?.title, 'Cut customer onboarding time from 9 days to 3 days');
  assert.deepEqual(result.okrDraft?.remediationTimings, ['Q3 2027 Sprint 2']);
  assert.equal(result.businessProblem?.rootCause, 'Legacy manual provisioning queue');
  assert.equal(result.businessProblem?.metrics[0]?.indicator, 'Customer Onboarding Time');
  assert.equal(result.businessProblem?.metrics[0]?.baselineValue, '9 days');
  assert.equal(result.businessProblem?.metrics[0]?.targetValue, '3 days');
});

test('evaluateMissingAttributes & multi-turn plain-prose conversation tracks gaps accurately without fallback leakage', () => {
  const context = {
    industryName: 'Apex Telecommunications',
    sector: 'Telecommunications',
    owners: ['Dr. Elena Vance', 'Marcus Sterling'],
    parentOptions: [{ id: 't-o1', title: 'Accelerate 5G SA Metro Densification' }]
  };

  // Turn 1: Sparse request with only priority, title, and leading metric
  const turn1 = parseConversationalOkrInput(
    'Create a P1 OKR to cut customer onboarding cycle time from 9 days to 3 days',
    context,
    []
  );

  assert.equal(turn1.intent, 'create_okr');
  assert.equal(turn1.isDraftComplete, false);
  assert.ok(turn1.readinessPct < 50, `Expected <50% readiness on Turn 1, got ${turn1.readinessPct}`);
  assert.equal(turn1.nextExpectedField, 'owner');
  assert.ok(turn1.missingAttributes.some((m) => m.key === 'owner'));
  assert.ok(turn1.missingAttributes.some((m) => m.key === 'rootCause'));
  assert.ok(turn1.missingAttributes.some((m) => m.key === 'laggingMetric'));

  // Turn 2: Plain-prose reply with an unverified owner while passing Turn 1's okrDraft (which has fallback defaults)
  const historyAfterTurn1 = [
    { role: 'user', text: 'Create a P1 OKR to cut customer onboarding cycle time from 9 days to 3 days' },
    { role: 'assistant', text: turn1.assistantMessage, nextExpectedField: turn1.nextExpectedField }
  ];
  const turn2 = parseConversationalOkrInput('saifur', context, historyAfterTurn1, turn1.okrDraft);

  assert.equal(turn2.okrDraft?.owner, 'saifur');
  assert.equal(turn2.isDraftComplete, false);
  assert.equal(turn2.nextExpectedField, 'ownerVerification');
  // Crucial regression check: Turn 1's heuristic fallback fields must NOT leak as user-captured
  assert.ok(turn2.missingAttributes.some((m) => m.key === 'budget'));
  assert.ok(turn2.missingAttributes.some((m) => m.key === 'problemDescription'));
  assert.ok(turn2.missingAttributes.some((m) => m.key === 'causalChainToDollarImpact'));

  // Turn 3: Plain-prose partial HR owner name answering ownerVerification
  const historyAfterTurn2 = [
    ...historyAfterTurn1,
    { role: 'user', text: 'saifur' },
    { role: 'assistant', text: turn2.assistantMessage, nextExpectedField: turn2.nextExpectedField }
  ];
  const turn3 = parseConversationalOkrInput('elena', context, historyAfterTurn2, turn2.okrDraft);
  assert.equal(turn3.okrDraft?.owner, 'Dr. Elena Vance');
  assert.equal(turn3.nextExpectedField, 'budget');

  // Turn 4: Plain-prose dollar budget answering budget prompt
  const historyAfterTurn3 = [
    ...historyAfterTurn2,
    { role: 'user', text: 'elena' },
    { role: 'assistant', text: turn3.assistantMessage, nextExpectedField: turn3.nextExpectedField }
  ];
  const turn4 = parseConversationalOkrInput('$5.5M', context, historyAfterTurn3, turn3.okrDraft);
  assert.equal(turn4.okrDraft?.budget, '$5.5M');
  assert.equal(turn4.nextExpectedField, 'problemDescription');
  assert.ok(turn4.readinessPct > turn1.readinessPct);

  // Turn 5: Auto-complete remaining attributes preserves user's Leading metric and fills all 6 Business Problem dimensions
  const historyAfterTurn4 = [
    ...historyAfterTurn3,
    { role: 'user', text: '$5.5M' },
    { role: 'assistant', text: turn4.assistantMessage, nextExpectedField: turn4.nextExpectedField }
  ];
  const turn5 = parseConversationalOkrInput(
    'Construct complete draft',
    { ...context, autoCompleteRemaining: true },
    historyAfterTurn4,
    turn4.okrDraft
  );

  assert.equal(turn5.isDraftComplete, true);
  assert.equal(turn5.readinessPct, 100);
  assert.equal(turn5.missingAttributes.length, 0);
  assert.equal(turn5.nextExpectedField, null);
  assert.equal(turn5.okrDraft?.owner, 'Dr. Elena Vance');
  assert.equal(turn5.okrDraft?.budget, '$5.5M');
  assert.ok(turn5.businessProblem);
  assert.ok(turn5.businessProblem.metrics.some((m) => m.metricType === 'Leading' && /onboarding/i.test(m.indicator)));
  assert.ok(turn5.businessProblem.metrics.some((m) => m.metricType === 'Lagging'));
  assert.ok(turn5.assistantMessage.includes('Apply Draft to Form'));
});
