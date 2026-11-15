import test from 'node:test';
import assert from 'node:assert/strict';
import { INDUSTRY_DATA } from '../data/industryData';
import {
  buildIndustryChatContext,
  isAllowedGeminiChatModel,
  resolveGeminiChatModel,
  sanitizeChatHistoryForApi
} from './geminiChatConfig';

test('resolveGeminiChatModel strictly validates active Gemini models and defaults safely', () => {
  assert.equal(isAllowedGeminiChatModel('gemini-4-carbon'), true);
  assert.equal(isAllowedGeminiChatModel('gemini-4-argon'), true);
  assert.equal(isAllowedGeminiChatModel('gemini-4-hydrogen'), true);
  assert.equal(isAllowedGeminiChatModel('gemini-3.1-flash-lite'), true);
  assert.equal(isAllowedGeminiChatModel('gemini-1.5-pro'), false);
  assert.equal(resolveGeminiChatModel('gemini-1.5-flash'), 'gemini-4-hydrogen');
  assert.equal(resolveGeminiChatModel('gemini-4-carbon'), 'gemini-4-carbon');
});

test('buildIndustryChatContext includes active industry OKRs and knowledge pillars', () => {
  const telco = INDUSTRY_DATA['Telco'];
  const nodesMap = Object.fromEntries(
    Object.values(telco.traceability)
      .flat()
      .map((n) => [n.id, n])
  );

  const context = buildIndustryChatContext(telco, nodesMap, { kb1: true, kb2: true });
  assert.ok(context.includes(telco.name));
  assert.ok(telco.knowledgeBase[0]?.title && context.includes(telco.knowledgeBase[0].title));
  assert.ok(context.includes('Objectives & Key Results'));
});

test('sanitizeChatHistoryForApi filters empty turns and preserves role order', () => {
  const sanitized = sanitizeChatHistoryForApi([
    { role: 'user', text: '  Analyze OKR risk  ' },
    { role: 'model', text: '' },
    { role: 'model', text: 'Churn risk is elevated on core fiber backhaul.' }
  ]);
  assert.equal(sanitized.length, 2);
  assert.deepEqual(sanitized[0], { role: 'user', parts: [{ text: 'Analyze OKR risk' }] });
  assert.deepEqual(sanitized[1], {
    role: 'model',
    parts: [{ text: 'Churn risk is elevated on core fiber backhaul.' }]
  });
});
