import type { IndustryDataBundle, TraceabilityNode } from '../types/orchestration';

export type GeminiChatModelId =
  | 'gemini-4-hydrogen'
  | 'gemini-4-argon'
  | 'gemini-4-carbon'
  | 'gemini-3.1-flash-lite';

export interface GeminiModelDescriptor {
  id: GeminiChatModelId;
  label: string;
  tier: 'General' | 'Complex' | 'Deep Reasoning' | 'Fast';
  recommendedFor: string;
}

export const GEMINI_CHAT_MODELS: GeminiModelDescriptor[] = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen',
    tier: 'General',
    recommendedFor: 'Standard OKR drafting, strategy Q&A, and RAG interpretation'
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon',
    tier: 'Complex',
    recommendedFor: 'Cross-program trade-offs, capacity rebalancing & trajectory modeling'
  },
  {
    id: 'gemini-4-carbon',
    label: 'Gemini 4 Carbon',
    tier: 'Deep Reasoning',
    recommendedFor: 'Root-cause audits, multi-layer dependency analysis & crisis response'
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    tier: 'Fast',
    recommendedFor: 'Rapid executive summaries and quick metric lookups'
  }
];

export interface SystemInstructionPreset {
  id: string;
  label: string;
  recommendedModel: GeminiChatModelId;
  instruction: string;
}

export const SYSTEM_INSTRUCTION_PRESETS: SystemInstructionPreset[] = [
  {
    id: 'strategy-advisor',
    label: 'OKR & Strategy Advisor',
    recommendedModel: 'gemini-4-hydrogen',
    instruction:
      'You are the Planview Anvi OKR & Strategy Advisor. Help executives refine objectives, measurable leading/lagging key results, stakeholder scope, and 7-layer Planview alignment concisely using concrete numbers from the active portfolio.'
  },
  {
    id: 'risk-root-cause',
    label: 'Root-Cause & Risk Auditor',
    recommendedModel: 'gemini-4-carbon',
    instruction:
      'You are the Planview Anvi Risk & Root-Cause Auditor. Diagnose causal chains to dollar impact, identify over-allocated squads or orphan epics, and recommend sequenced remediation timings with clear contingency mitigations.'
  },
  {
    id: 'rag-kb-copilot',
    label: '5-Pillar RAG Copilot',
    recommendedModel: 'gemini-4-argon',
    instruction:
      'You are the Planview Anvi 5-Pillar Knowledge Base Copilot. Ground every answer in the active industry Historical Performance, Market Data, Customer Feedback, Project Runner, and Utilisation pillars, citing specific vector insights and metrics.'
  },
  {
    id: 'executive-briefer',
    label: 'Executive Scorecard Briefer',
    recommendedModel: 'gemini-3.1-flash-lite',
    instruction:
      'You are an Executive Portfolio Briefer. Summarize attainment status, critical Behind/At Risk OKRs, active disasters, and top 3 immediate executive decisions in scannable bullet points.'
  }
];

export function isAllowedGeminiChatModel(model: string): model is GeminiChatModelId {
  return GEMINI_CHAT_MODELS.some((m) => m.id === model);
}

export function resolveGeminiChatModel(requested?: string | null): GeminiChatModelId {
  if (requested && isAllowedGeminiChatModel(requested)) {
    return requested;
  }
  return 'gemini-4-hydrogen';
}

export function buildIndustryChatContext(
  industry: IndustryDataBundle,
  nodesMap: Record<string, TraceabilityNode>,
  fedPillars: Record<string, boolean>
): string {
  const okrs = Object.values(nodesMap)
    .filter((n) => n.id.includes('kr') || n.id.includes('-o'))
    .slice(0, 8)
    .map(
      (n) =>
        `- [${n.id}] ${n.title} | Owner: ${n.owner} | Status: ${n.status} (${n.progress}%) | Remediation: ${
          n.businessProblem?.targetRemediationTiming || n.targetDate || 'Unscheduled'
        }`
    )
    .join('\n');

  const kbSummary = (industry.knowledgeBase || [])
    .filter((p) => fedPillars[p.id] !== false)
    .map(
      (p) =>
        `- ${p.title}: ${p.metric} (${p.trend}) — ${p.summary}`
    )
    .join('\n');

  const activeDisasters = (industry.activeDisasters || [])
    .filter((d) => d.active)
    .map((d) => `- ACTIVE CRISIS: ${d.title} (${d.severity}, ${d.impacts.attainmentDropPct}% attainment impact)`)
    .join('\n');

  return [
    `Active Industry: ${industry.name} (${industry.sector}) | Quarter: ${industry.quarter} | Attainment: ${industry.attainment}% | Health: ${industry.overallHealth} | Budget: ${industry.totalBudget}`,
    activeDisasters ? `Active Disasters:\n${activeDisasters}` : 'Active Disasters: None active',
    `Key Objectives & Key Results:\n${okrs || 'No OKRs loaded'}`,
    `Active 5-Pillar Knowledge Base Context:\n${kbSummary || 'No pillars enabled'}`
  ].join('\n\n');
}

export interface ChatTurnHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export function sanitizeChatHistoryForApi(
  turns: Array<{ role: 'user' | 'model'; text: string }>
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  return turns
    .filter((t) => (t.role === 'user' || t.role === 'model') && typeof t.text === 'string' && t.text.trim().length > 0)
    .slice(-16)
    .map((t) => ({
      role: t.role,
      parts: [{ text: t.text.trim().slice(0, 12000) }]
    }));
}
