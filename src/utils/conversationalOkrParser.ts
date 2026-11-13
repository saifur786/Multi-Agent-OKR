import {
  BusinessMetricIndicator,
  EventTopic,
  PriorityLevel,
  StructuredBusinessProblem
} from '../types/orchestration';
import { parseRawProblemText } from './businessProblemLibrary';

export type ConversationIntent =
  | 'create_okr'
  | 'update_business_problem'
  | 'run_orchestration'
  | 'clarify'
  | 'unknown';

export type MissingAttributeKey =
  | 'title'
  | 'owner'
  | 'ownerVerification'
  | 'budget'
  | 'problemDescription'
  | 'impactedStakeholders'
  | 'causalChainToDollarImpact'
  | 'rootCause'
  | 'remediationTimings'
  | 'metrics'
  | 'laggingMetric';

export interface MissingAttributeDetail {
  key: MissingAttributeKey;
  category: 'OKR' | 'Business Problem';
  label: string;
  question: string;
  example: string;
  prefixHint: string;
}

export interface ConversationalOkrDraft {
  title?: string;
  parentId?: string;
  owner?: string;
  priority?: PriorityLevel;
  budget?: string;
  targetDate?: string;
  problemDescription?: string;
  impactedStakeholders?: string[];
  causalChainToDollarImpact?: string;
  rootCause?: string;
  rootCauses?: string[];
  targetRemediationTiming?: string;
  remediationTimings?: string[];
  metrics?: BusinessMetricIndicator[];
  lastAskedField?: MissingAttributeKey | null;
  explicitFields?: string[];
  autoCompletedFields?: string[];
}

export interface ConversationalContext {
  industryName?: string;
  sector?: string;
  quarter?: string;
  owners?: string[];
  parentOptions?: Array<{ id: string; title?: string }>;
  existingOkrTitles?: string[];
  priorityOptions?: string[];
  autoCompleteRemaining?: boolean;
}

export interface ConversationalHistoryTurn {
  role: 'user' | 'assistant' | string;
  text: string;
  nextExpectedField?: MissingAttributeKey | null;
}

export interface ConversationalOrchestrationEvent {
  topic: EventTopic;
  sourceAgent: string;
  targetAgent: string;
  summary: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface ConversationalParseResult {
  assistantMessage: string;
  intent: ConversationIntent;
  confidence: number;
  questions: string[];
  actionPlan: string[];
  okrDraft: ConversationalOkrDraft | null;
  businessProblem: StructuredBusinessProblem | null;
  orchestrationEvents: ConversationalOrchestrationEvent[];
  missingAttributes: MissingAttributeDetail[];
  capturedAttributes: string[];
  readinessPct: number;
  isDraftComplete: boolean;
  nextExpectedField: MissingAttributeKey | null;
}

const KNOWN_SECTION_KEYS = new Set([
  'owner',
  'accountable owner',
  'assignee',
  'assigned to',
  'timeline',
  'target timeline',
  'timing',
  'remediation timing',
  'target remediation timing',
  'target date',
  'deadline',
  'due',
  'due date',
  'metric',
  'metrics',
  'indicator',
  'indicators',
  'kpi',
  'kpis',
  'title',
  'okr',
  'kr',
  'objective',
  'outcome',
  'target outcome',
  'goal',
  'priority',
  'budget',
  'problem',
  'problem description',
  'business problem',
  'description',
  'issue',
  'stakeholder',
  'stakeholders',
  'impacted stakeholders',
  'causal chain',
  'causal chain to $ impact',
  'causal chain to dollar impact',
  'dollar impact',
  '$ impact',
  'root cause',
  'root causes',
  'cause',
  'causes'
]);

function normalizeSectionKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

function extractLabeledSections(text: string): Record<string, string[]> {
  const sections: Record<string, string[]> = {};
  const lines = text.split(/\r?\n/);
  let currentKey: string | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const cleanBullet = trimmed.replace(/^[-*•\d.)]+\s*/, '').trim();
    const labelMatch = cleanBullet.match(/^([A-Za-z][A-Za-z0-9\s$/-]{1,36}):\s*(.*)$/);
    if (labelMatch) {
      const candidateKey = normalizeSectionKey(labelMatch[1]);
      if (KNOWN_SECTION_KEYS.has(candidateKey)) {
        currentKey = candidateKey;
        if (!sections[currentKey]) sections[currentKey] = [];
        if (labelMatch[2].trim()) {
          sections[currentKey].push(labelMatch[2].trim());
        }
        continue;
      }
    }

    if (currentKey) {
      sections[currentKey].push(trimmed);
    }
  }

  return sections;
}

function getSectionValues(sections: Record<string, string[]>, keys: string[]): string[] {
  const collected: string[] = [];
  for (const key of keys) {
    if (Array.isArray(sections[key])) {
      collected.push(...sections[key]);
    }
  }
  return collected;
}

export function resolveOwnerName(rawOwner: string, availableOwners: string[]): string {
  const cleaned = rawOwner.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return '';
  const lower = cleaned.toLowerCase();

  const exact = availableOwners.find((candidate) => candidate.toLowerCase() === lower);
  if (exact) return exact;

  const partial = availableOwners.find(
    (candidate) => candidate.toLowerCase().includes(lower) || lower.includes(candidate.toLowerCase())
  );
  return partial || cleaned;
}

export function isOwnerInDirectory(owner: string | undefined, availableOwners: string[]): boolean {
  if (!owner || !owner.trim()) return false;
  if (availableOwners.length === 0) return true;
  const lower = owner.trim().toLowerCase();
  return availableOwners.some(
    (member) => member.toLowerCase().includes(lower) || lower.includes(member.toLowerCase())
  );
}

function inferMetricType(prefixOrSuffix: string, indicator: string): 'Leading' | 'Lagging' {
  if (/lagging|lag/i.test(prefixOrSuffix)) return 'Lagging';
  if (/leading|lead/i.test(prefixOrSuffix)) return 'Leading';
  if (/churn|revenue|arr|margin|cost|roi|nps|loss|profit|\$/i.test(indicator)) return 'Lagging';
  return 'Leading';
}

export function parseMetricLine(line: string): BusinessMetricIndicator | null {
  const cleaned = line
    .trim()
    .replace(/^[-*]\s*/, '')
    .replace(/^metric[s]?:\s*/i, '')
    .trim();
  if (!cleaned) return null;

  let metricTypeHint = '';
  let body = cleaned;

  const prefixMatch = body.match(/^(Leading|Lagging)(?:\s*Metric)?\s*(?:[•|\-–—:]\s*|\s+)(.+)$/i);
  if (prefixMatch) {
    metricTypeHint = prefixMatch[1];
    body = prefixMatch[2].trim();
  }

  const suffixMatch = body.match(/^(.+?)\s*\((Leading|Lagging)(?:\s*Metric)?\)\s*$/i);
  if (suffixMatch) {
    body = suffixMatch[1].trim();
    metricTypeHint = suffixMatch[2];
  }

  const colonSplit = body.match(/^([^:]+):\s*(.+)$/);
  if (colonSplit) {
    const indicator = colonSplit[1].trim();
    const valuesPart = colonSplit[2].trim();
    const arrowMatch = valuesPart.match(/^(.+?)\s*(?:→|->|=>|\bto\b)\s*(.+)$/i);
    if (arrowMatch) {
      const baselineValue = arrowMatch[1].trim();
      const targetValue = arrowMatch[2].trim();
      if (indicator && baselineValue && targetValue) {
        return {
          indicator,
          baselineValue,
          targetValue,
          metricType: inferMetricType(metricTypeHint, `${indicator} ${baselineValue} ${targetValue}`)
        };
      }
    }
  }

  const fromToMatch = body.match(/^(.+?)\s+from\s+(.+?)\s+(?:→|->|=>|\bto\b)\s+(.+)$/i);
  if (fromToMatch) {
    const indicator = fromToMatch[1].trim();
    const baselineValue = fromToMatch[2].trim();
    const targetValue = fromToMatch[3].trim();
    return {
      indicator,
      baselineValue,
      targetValue,
      metricType: inferMetricType(metricTypeHint, `${indicator} ${baselineValue} ${targetValue}`)
    };
  }

  const inlineArrowMatch = body.match(
    /^(.+?)\s+([<$€£>]?\d[\w.%$€£/-]*(?:\s*[a-zA-Z%]+)?)\s*(?:→|->|=>)\s*([<$€£>]?\d[\w.%$€£/-]*(?:\s*[a-zA-Z%]+)?)$/i
  );
  if (inlineArrowMatch) {
    const indicator = inlineArrowMatch[1].replace(/[:\-–]+$/, '').trim();
    const baselineValue = inlineArrowMatch[2].trim();
    const targetValue = inlineArrowMatch[3].trim();
    if (indicator && !/->|→/.test(indicator)) {
      return {
        indicator,
        baselineValue,
        targetValue,
        metricType: inferMetricType(metricTypeHint, `${indicator} ${baselineValue} ${targetValue}`)
      };
    }
  }

  return null;
}

function extractMetricsFromText(text: string, sections: Record<string, string[]>): BusinessMetricIndicator[] {
  const results: BusinessMetricIndicator[] = [];
  const seen = new Set<string>();

  const pushUnique = (metric: BusinessMetricIndicator | null) => {
    if (!metric || !metric.indicator) return;
    const key = `${metric.metricType}:${metric.indicator.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push(metric);
  };

  const metricSectionLines = getSectionValues(sections, ['metric', 'metrics', 'indicator', 'indicators', 'kpi', 'kpis']);
  for (const line of metricSectionLines) {
    for (const part of line.split(/;|\n/)) {
      pushUnique(parseMetricLine(part));
    }
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    if (/^(Leading|Lagging)\b/i.test(trimmed) || /^[-*•]\s*(Leading|Lagging)\b/i.test(trimmed)) {
      pushUnique(parseMetricLine(trimmed));
      continue;
    }
    if (/:.+\s*(?:→|->|=>)\s*/.test(trimmed) && !/causal chain/i.test(trimmed)) {
      pushUnique(parseMetricLine(trimmed));
    }
  }

  const verbMetricMatch = text.match(
    /(?:reduce|cut|lower|decrease|improve|lift|increase|grow|expand)\s+([a-zA-Z0-9%\s/-]{3,45}?)\s+from\s+([<$€£>]?\d[\w.%$€£/-]*(?:\s*[a-zA-Z%]+)?)\s+(?:to|→|->)\s+([<$€£>]?\d[\w.%$€£/-]*(?:\s*[a-zA-Z%]+)?)/i
  );
  if (verbMetricMatch) {
    const indicator = verbMetricMatch[1].trim().replace(/\b\w/g, (ch) => ch.toUpperCase());
    pushUnique({
      indicator,
      baselineValue: verbMetricMatch[2].trim(),
      targetValue: verbMetricMatch[3].trim(),
      metricType: inferMetricType('', indicator)
    });
  }

  return results;
}

function inferLastAskedFieldFromHistory(
  history: ConversationalHistoryTurn[],
  previousDraft: ConversationalOkrDraft | null
): MissingAttributeKey | null {
  if (previousDraft?.lastAskedField) {
    return previousDraft.lastAskedField;
  }

  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    if (turn.role !== 'assistant') continue;
    if (turn.nextExpectedField) return turn.nextExpectedField;
    const lower = (turn.text || '').toLowerCase();
    if (/root cause|underlying cause/.test(lower)) return 'rootCause';
    if (/causal chain|dollar impact|\$ impact/.test(lower)) return 'causalChainToDollarImpact';
    if (/stakeholder/.test(lower)) return 'impactedStakeholders';
    if (/problem description|business problem/.test(lower)) return 'problemDescription';
    if (/budget|allocated capital|opex|capex/.test(lower)) return 'budget';
    if (/hr directory|accountable owner|who should own/.test(lower)) return 'owner';
    if (/timeline|remediation timing|sprint|target date/.test(lower)) return 'remediationTimings';
    if (/lagging/.test(lower)) return 'laggingMetric';
    if (/metric|indicator|kpi/.test(lower)) return 'metrics';
    if (/target outcome|okr title|key result title/.test(lower)) return 'title';
    break;
  }
  return null;
}

function parseSingleTurnUpdates(
  text: string,
  context: ConversationalContext,
  lastAskedField: MissingAttributeKey | null = null
): {
  updates: Partial<ConversationalOkrDraft>;
  explicitFieldsCount: number;
  hasCreateSignal: boolean;
  hasBusinessProblemSignal: boolean;
  hasOrchestrationSignal: boolean;
  hasAutoCompleteSignal: boolean;
} {
  const trimmed = text.trim();
  const sections = extractLabeledSections(trimmed);
  const availableOwners = Array.isArray(context.owners) ? context.owners : [];
  const updates: Partial<ConversationalOkrDraft> = {};
  let explicitFieldsCount = 0;

  // 1. Owner
  const ownerLines = getSectionValues(sections, ['owner', 'accountable owner', 'assignee', 'assigned to']);
  let rawOwner = ownerLines[0] || '';
  if (!rawOwner) {
    const inlineOwner = trimmed.match(
      /(?:^|\b)(?:owner|assigned to)\s*(?:is|:)\s*([A-Za-z][A-Za-z.\s-]{1,40}?)(?:,|\n|;|$)/i
    );
    if (inlineOwner) rawOwner = inlineOwner[1];
  }
  if (rawOwner) {
    updates.owner = resolveOwnerName(rawOwner, availableOwners);
    if (updates.owner) explicitFieldsCount++;
  } else if (availableOwners.length > 0) {
    const matchedDirectoryOwner = availableOwners.find((name) =>
      trimmed.toLowerCase().includes(name.toLowerCase())
    );
    if (matchedDirectoryOwner) {
      updates.owner = matchedDirectoryOwner;
      explicitFieldsCount++;
    }
  }

  // 2. Timeline / Target Remediation Timing
  const timingLines = getSectionValues(sections, [
    'timeline',
    'target timeline',
    'timing',
    'remediation timing',
    'target remediation timing',
    'target date',
    'deadline',
    'due',
    'due date'
  ]);
  const extractedTimings: string[] = [];
  if (timingLines.length > 0) {
    for (const line of timingLines) {
      for (const piece of line.split(/[,;]/)) {
        const clean = piece.trim();
        if (clean) extractedTimings.push(clean);
      }
    }
  } else {
    const quarterMatches = trimmed.match(/\bQ[1-4]\s*\d{4}(?:\s*Sprint\s*\d+)?\b/gi);
    if (quarterMatches) {
      quarterMatches.forEach((m) => extractedTimings.push(m.replace(/\s+/g, ' ').trim()));
    }
  }
  if (extractedTimings.length > 0) {
    const uniqueTimings = Array.from(new Set(extractedTimings));
    updates.remediationTimings = uniqueTimings;
    updates.targetRemediationTiming = uniqueTimings[0];
    updates.targetDate = uniqueTimings[0];
    explicitFieldsCount++;
  }

  // 3. Metrics
  const metrics = extractMetricsFromText(trimmed, sections);
  if (metrics.length > 0) {
    updates.metrics = metrics;
    explicitFieldsCount++;
  }

  // 4. Priority
  const priorityLines = getSectionValues(sections, ['priority']);
  const priorityText = priorityLines[0] || trimmed;
  if (/\bP0\b|critical/i.test(priorityText)) {
    updates.priority = 'P0 - Critical';
    if (priorityLines.length > 0 || /\bP0\b/i.test(trimmed)) explicitFieldsCount++;
  } else if (/\bP1\b|high priority/i.test(priorityText)) {
    updates.priority = 'P1 - High';
    if (priorityLines.length > 0 || /\bP1\b/i.test(trimmed)) explicitFieldsCount++;
  } else if (/\bP2\b|medium priority/i.test(priorityText)) {
    updates.priority = 'P2 - Medium';
    if (priorityLines.length > 0 || /\bP2\b/i.test(trimmed)) explicitFieldsCount++;
  } else if (/\bP3\b|deferred/i.test(priorityText)) {
    updates.priority = 'P3 - Deferred';
    if (priorityLines.length > 0 || /\bP3\b/i.test(trimmed)) explicitFieldsCount++;
  }

  // 5. Budget
  const budgetLines = getSectionValues(sections, ['budget']);
  if (budgetLines[0]) {
    updates.budget = budgetLines[0].trim();
    explicitFieldsCount++;
  } else {
    const nonMetricText = trimmed
      .split(/\r?\n/)
      .filter((line) => !/→|->|=>/.test(line) && !/^(Leading|Lagging)\b/i.test(line.trim()))
      .join(' ');
    const budgetMatch = nonMetricText.match(/(?:budget(?:\s+of|\s*:)?\s*)(\$[\d.,]+\s*[mMkKbB]?)/i);
    if (budgetMatch?.[1]) {
      updates.budget = budgetMatch[1].replace(/\s+/g, '');
      explicitFieldsCount++;
    }
  }

  // 6. Title / Target Outcome
  const outcomeLines = getSectionValues(sections, ['title', 'okr', 'kr', 'objective', 'outcome', 'target outcome', 'goal']);
  if (outcomeLines[0]) {
    updates.title = outcomeLines[0].trim();
    explicitFieldsCount++;
  } else {
    const titleMatch = trimmed.match(
      /(?:create|add|new|draft)\s+(?:a\s+|an\s+)?(?:p[0-3]\s+)?(?:okr|key result|objective)\s+(?:to|for|about)\s+(.+?)(?:\.|,|\n|$)/i
    );
    if (titleMatch?.[1]) {
      const candidateTitle = titleMatch[1].trim();
      if (!/^(?:owner|timeline|metric)/i.test(candidateTitle)) {
        updates.title = candidateTitle.charAt(0).toUpperCase() + candidateTitle.slice(1);
        explicitFieldsCount++;
      }
    }
  }

  // 7. Structured Business Problem attributes
  const problemLines = getSectionValues(sections, ['problem', 'problem description', 'business problem', 'description', 'issue']);
  if (problemLines.length > 0) {
    updates.problemDescription = problemLines.join(' ').trim();
    explicitFieldsCount++;
  }

  const stakeholderLines = getSectionValues(sections, ['stakeholder', 'stakeholders', 'impacted stakeholders']);
  if (stakeholderLines.length > 0) {
    const stakeholders = stakeholderLines
      .flatMap((line) => line.split(/[,;]/))
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
    if (stakeholders.length > 0) {
      updates.impactedStakeholders = Array.from(new Set(stakeholders));
      explicitFieldsCount++;
    }
  }

  const causalLines = getSectionValues(sections, [
    'causal chain',
    'causal chain to $ impact',
    'causal chain to dollar impact',
    'dollar impact',
    '$ impact'
  ]);
  if (causalLines.length > 0) {
    updates.causalChainToDollarImpact = causalLines.join(' ').trim();
    explicitFieldsCount++;
  } else {
    const arrowChainLine = trimmed
      .split(/\r?\n/)
      .find((line) => (line.match(/→|->/g) || []).length >= 2 && !/^(Leading|Lagging)\b/i.test(line.trim()));
    if (arrowChainLine) {
      updates.causalChainToDollarImpact = arrowChainLine.trim();
      explicitFieldsCount++;
    }
  }

  const rootCauseLines = getSectionValues(sections, ['root cause', 'root causes', 'cause', 'causes']);
  if (rootCauseLines.length > 0) {
    const causes = rootCauseLines
      .flatMap((line) => line.split(/[,;]/))
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);
    if (causes.length > 0) {
      updates.rootCauses = Array.from(new Set(causes));
      updates.rootCause = updates.rootCauses[0];
      explicitFieldsCount++;
    }
  }

  const hasAutoCompleteSignal =
    Boolean(context.autoCompleteRemaining) ||
    /(auto[- ]?(?:fill|complete)|construct (?:full |complete )?draft|fill remaining|generate remaining|finalize draft|complete with defaults)/i.test(
      trimmed
    );

  // 8. Contextual plain-prose mapping when user answers the agent's last asked question directly without labels
  if (explicitFieldsCount === 0 && !hasAutoCompleteSignal && lastAskedField && trimmed.length >= 2) {
    const isCommandOnly = /^(create|add|new|orchestrate|run|apply|help|yes|ok|sure)\b/i.test(trimmed) && trimmed.split(/\s+/).length <= 3;
    if (!isCommandOnly) {
      switch (lastAskedField) {
        case 'owner':
        case 'ownerVerification': {
          if (trimmed.split(/\s+/).length <= 5 && !/->|→/.test(trimmed)) {
            updates.owner = resolveOwnerName(trimmed, availableOwners);
            if (updates.owner) explicitFieldsCount++;
          }
          break;
        }
        case 'budget': {
          const dollarOnly = trimmed.match(/(\$[\d.,]+\s*[mMkKbB]?)/i);
          if (dollarOnly?.[1]) {
            updates.budget = dollarOnly[1].replace(/\s+/g, '');
            explicitFieldsCount++;
          }
          break;
        }
        case 'rootCause': {
          if (trimmed.length >= 6) {
            const parts = trimmed.includes(';')
              ? trimmed.split(';').map((p) => p.trim()).filter(Boolean)
              : [trimmed];
            updates.rootCauses = parts;
            updates.rootCause = parts[0];
            explicitFieldsCount++;
          }
          break;
        }
        case 'causalChainToDollarImpact': {
          if (trimmed.length >= 8) {
            updates.causalChainToDollarImpact = trimmed;
            explicitFieldsCount++;
          }
          break;
        }
        case 'impactedStakeholders': {
          const list = trimmed
            .split(/[,;\n]|\band\b/i)
            .map((item) => item.replace(/^[-*•]\s*/, '').trim())
            .filter(Boolean);
          if (list.length > 0) {
            updates.impactedStakeholders = Array.from(new Set(list));
            explicitFieldsCount++;
          }
          break;
        }
        case 'problemDescription': {
          if (trimmed.length >= 10) {
            updates.problemDescription = trimmed;
            explicitFieldsCount++;
          }
          break;
        }
        case 'remediationTimings': {
          const parts = trimmed.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
          if (parts.length > 0) {
            updates.remediationTimings = parts;
            updates.targetRemediationTiming = parts[0];
            updates.targetDate = parts[0];
            explicitFieldsCount++;
          }
          break;
        }
        case 'title': {
          if (trimmed.length >= 6) {
            updates.title = trimmed;
            explicitFieldsCount++;
          }
          break;
        }
        case 'metrics':
        case 'laggingMetric': {
          const maybeMetric = parseMetricLine(
            lastAskedField === 'laggingMetric' && !/^(Leading|Lagging)/i.test(trimmed)
              ? `Lagging • ${trimmed}`
              : trimmed
          );
          if (maybeMetric) {
            updates.metrics = [maybeMetric];
            explicitFieldsCount++;
          }
          break;
        }
      }
    }
  }

  // Also capture standalone dollar budget if user gave "$5.5M" explicitly
  if (!updates.budget && /^\$[\d.,]+\s*[mMkKbB]?$/i.test(trimmed)) {
    updates.budget = trimmed.replace(/\s+/g, '');
    explicitFieldsCount++;
  }

  const hasCreateSignal =
    /(create|add|new|draft)\s+(?:a\s+|an\s+)?(?:p[0-3]\s+)?(okr|key result|objective)/i.test(trimmed) ||
    Boolean(updates.title);
  const hasBusinessProblemSignal =
    /(business problem|root cause|stakeholder|causal chain)/i.test(trimmed) ||
    Boolean(
      updates.problemDescription ||
        updates.rootCause ||
        updates.causalChainToDollarImpact ||
        updates.impactedStakeholders
    );
  const hasOrchestrationSignal =
    /(orchestrate|run agents|trigger agents|advisory|supervisor|orchestration actions)/i.test(trimmed);

  return {
    updates,
    explicitFieldsCount,
    hasCreateSignal,
    hasBusinessProblemSignal,
    hasOrchestrationSignal,
    hasAutoCompleteSignal
  };
}

export function mergeConversationalDrafts(
  base: ConversationalOkrDraft | null | undefined,
  incoming: Partial<ConversationalOkrDraft> | null | undefined
): ConversationalOkrDraft {
  const safeBase = base ?? {};
  const safeIncoming = incoming ?? {};

  const mergedTimings = Array.from(
    new Set(
      [
        ...(Array.isArray(safeIncoming.remediationTimings) && safeIncoming.remediationTimings.length > 0
          ? safeIncoming.remediationTimings
          : safeBase.remediationTimings || []),
        ...(safeIncoming.targetRemediationTiming ? [safeIncoming.targetRemediationTiming] : [])
      ]
        .map((t) => String(t).trim())
        .filter(Boolean)
    )
  );

  const mergedRootCauses = Array.from(
    new Set(
      [
        ...(Array.isArray(safeIncoming.rootCauses) && safeIncoming.rootCauses.length > 0
          ? safeIncoming.rootCauses
          : safeBase.rootCauses || []),
        ...(safeIncoming.rootCause ? [safeIncoming.rootCause] : [])
      ]
        .map((c) => String(c).trim())
        .filter(Boolean)
    )
  );

  // Merge metrics intelligently so adding a Lagging metric preserves an existing Leading metric from an earlier turn!
  const metricsMap = new Map<string, BusinessMetricIndicator>();
  for (const m of [...(safeBase.metrics || []), ...(safeIncoming.metrics || [])]) {
    if (!m || !m.indicator) continue;
    const key = `${m.metricType}:${m.indicator.toLowerCase()}`;
    metricsMap.set(key, m);
  }
  const mergedMetrics = Array.from(metricsMap.values());

  const mergedStakeholders =
    Array.isArray(safeIncoming.impactedStakeholders) && safeIncoming.impactedStakeholders.length > 0
      ? safeIncoming.impactedStakeholders
      : safeBase.impactedStakeholders || [];

  const mergedExplicitFields = Array.from(
    new Set([
      ...(Array.isArray(safeBase.explicitFields) ? safeBase.explicitFields : []),
      ...(Array.isArray(safeIncoming.explicitFields) ? safeIncoming.explicitFields : [])
    ])
  );

  return {
    ...safeBase,
    ...safeIncoming,
    impactedStakeholders: mergedStakeholders,
    rootCauses: mergedRootCauses,
    rootCause: safeIncoming.rootCause || mergedRootCauses[0] || safeBase.rootCause,
    remediationTimings: mergedTimings,
    targetRemediationTiming:
      safeIncoming.targetRemediationTiming || mergedTimings[0] || safeBase.targetRemediationTiming,
    targetDate: safeIncoming.targetDate || mergedTimings[0] || safeBase.targetDate,
    metrics: mergedMetrics,
    explicitFields: mergedExplicitFields.length > 0 ? mergedExplicitFields : undefined
  };
}

function deriveTitleFromDraft(draft: ConversationalOkrDraft, sector: string): string {
  if (draft.title && draft.title.trim()) return draft.title.trim();

  const metrics = draft.metrics || [];
  if (metrics.length > 0) {
    const primary = metrics[0];
    const baseNum = parseFloat(String(primary.baselineValue).replace(/[^0-9.-]/g, ''));
    const targetNum = parseFloat(String(primary.targetValue).replace(/[^0-9.-]/g, ''));
    const verb =
      !Number.isNaN(baseNum) && !Number.isNaN(targetNum) && targetNum < baseNum
        ? 'Reduce'
        : 'Improve';
    return `${verb} ${primary.indicator} from ${primary.baselineValue} to ${primary.targetValue}`;
  }

  if (draft.problemDescription && draft.problemDescription.trim().length >= 10) {
    const snippet = draft.problemDescription.trim().split(/[.!\n]/)[0].slice(0, 64);
    return `Resolve ${snippet}`;
  }

  return `Resolve ${sector || 'Enterprise'} execution bottleneck`;
}

export function buildStructuredBusinessProblemFromDraft(
  draft: ConversationalOkrDraft,
  sector: string,
  rawFallbackText: string
): StructuredBusinessProblem {
  const heuristicProblem = parseRawProblemText(rawFallbackText || draft.title || sector, sector);

  const rootCauses =
    draft.rootCauses && draft.rootCauses.length > 0
      ? draft.rootCauses
      : draft.rootCause
        ? [draft.rootCause]
        : heuristicProblem.rootCauses && heuristicProblem.rootCauses.length > 0
          ? heuristicProblem.rootCauses
          : [heuristicProblem.rootCause];

  const remediationTimings =
    draft.remediationTimings && draft.remediationTimings.length > 0
      ? draft.remediationTimings
      : draft.targetRemediationTiming
        ? [draft.targetRemediationTiming]
        : [heuristicProblem.targetRemediationTiming || 'Q2 2027 Sprint 4'];

  const metrics: BusinessMetricIndicator[] =
    draft.metrics && draft.metrics.length > 0 ? draft.metrics : heuristicProblem.metrics;

  const stakeholders =
    draft.impactedStakeholders && draft.impactedStakeholders.length > 0
      ? draft.impactedStakeholders
      : heuristicProblem.impactedStakeholders;

  const metricNarrative =
    metrics.length > 0
      ? `Address ${metrics.map((m) => `${m.indicator} (${m.baselineValue} → ${m.targetValue})`).join(' and ')} to stabilize ${sector || 'enterprise'} outcomes.`
      : heuristicProblem.problemDescription;

  const problemDescription =
    draft.problemDescription && draft.problemDescription.trim().length >= 12
      ? draft.problemDescription.trim()
      : metricNarrative;

  const laggingMetric = metrics.find((m) => m.metricType === 'Lagging');
  const leadingMetric = metrics.find((m) => m.metricType === 'Leading');
  const causalChainToDollarImpact =
    draft.causalChainToDollarImpact && draft.causalChainToDollarImpact.trim()
      ? draft.causalChainToDollarImpact.trim()
      : leadingMetric && laggingMetric
        ? `${leadingMetric.indicator} degradation (${leadingMetric.baselineValue}) → delivery friction → ${laggingMetric.indicator} exposure (${laggingMetric.baselineValue} → ${laggingMetric.targetValue}).`
        : heuristicProblem.causalChainToDollarImpact;

  return {
    problemDescription,
    impactedStakeholders: stakeholders,
    causalChainToDollarImpact,
    rootCause: rootCauses[0] || heuristicProblem.rootCause,
    rootCauses,
    targetRemediationTiming: remediationTimings[0],
    remediationTimings,
    metrics
  };
}

export function evaluateMissingAttributes(
  captured: ConversationalOkrDraft,
  context: ConversationalContext
): {
  missingAttributes: MissingAttributeDetail[];
  capturedAttributes: string[];
  readinessPct: number;
} {
  const owners = Array.isArray(context.owners) ? context.owners : [];
  const ownerSuggestions = owners.slice(0, 3).join(', ') || 'VP Engineering, Chief Digital Officer';
  const sectorLabel = context.sector || 'Enterprise';

  const capturedAttributes: string[] = [];
  const missingAttributes: MissingAttributeDetail[] = [];

  // 1. OKR Title / Outcome
  if (captured.title && captured.title.trim().length >= 5) {
    capturedAttributes.push('OKR Title');
  } else {
    missingAttributes.push({
      key: 'title',
      category: 'OKR',
      label: 'OKR Outcome / Title',
      question: `What measurable target outcome should this ${sectorLabel} OKR achieve?`,
      example: 'title: Reduce customer onboarding cycle time from 9 days to 3 days',
      prefixHint: 'title: '
    });
  }

  // 2. Accountable Owner + HR Directory check
  if (!captured.owner || !captured.owner.trim()) {
    missingAttributes.push({
      key: 'owner',
      category: 'OKR',
      label: 'Accountable Owner (HR Directory)',
      question: `Who is the accountable executive owner from the HR directory (e.g., ${ownerSuggestions})?`,
      example: `owner: ${owners[0] || 'Dr. Elena Vance'}`,
      prefixHint: 'owner: '
    });
  } else if (owners.length > 0 && !isOwnerInDirectory(captured.owner, owners)) {
    capturedAttributes.push(`Owner (${captured.owner} — unverified)`);
    missingAttributes.push({
      key: 'ownerVerification',
      category: 'OKR',
      label: 'HR Directory Owner Verification',
      question: `"${captured.owner}" is not in the HR Directory. Supervisor policy requires an HR-verified owner to publish (e.g., ${ownerSuggestions}) — who should be assigned?`,
      example: `owner: ${owners[0]}`,
      prefixHint: 'owner: '
    });
  } else {
    capturedAttributes.push(`Owner (${captured.owner})`);
  }

  // 3. Budget Allocation
  if (captured.budget && captured.budget.trim() && captured.budget !== '$0') {
    capturedAttributes.push(`Budget (${captured.budget})`);
  } else {
    missingAttributes.push({
      key: 'budget',
      category: 'OKR',
      label: 'Allocated Budget',
      question: 'What capital or operating budget should be allocated to execute this OKR?',
      example: 'budget: $4.5M',
      prefixHint: 'budget: '
    });
  }

  // 4. Business Problem Description
  if (captured.problemDescription && captured.problemDescription.trim().length >= 15) {
    capturedAttributes.push('Problem Description');
  } else {
    missingAttributes.push({
      key: 'problemDescription',
      category: 'Business Problem',
      label: 'Problem Description',
      question: 'Describe the core business problem and strategic intent (what friction is blocking growth)?',
      example: 'problem: Manual provisioning bottlenecks delay customer activation and threaten enterprise ARR.',
      prefixHint: 'problem: '
    });
  }

  // 5. Impacted Stakeholders
  if (Array.isArray(captured.impactedStakeholders) && captured.impactedStakeholders.length > 0) {
    capturedAttributes.push('Impacted Stakeholders');
  } else {
    missingAttributes.push({
      key: 'impactedStakeholders',
      category: 'Business Problem',
      label: 'Impacted Stakeholders',
      question: 'Which stakeholders, customer segments, or operational teams are impacted?',
      example: 'stakeholders: Enterprise Customers, Field Operations, Executive Board',
      prefixHint: 'stakeholders: '
    });
  }

  // 6. Causal Chain to $ Impact
  if (captured.causalChainToDollarImpact && captured.causalChainToDollarImpact.trim().length >= 10) {
    capturedAttributes.push('Causal Chain to $ Impact');
  } else {
    missingAttributes.push({
      key: 'causalChainToDollarImpact',
      category: 'Business Problem',
      label: 'Causal Chain to $ Impact',
      question: 'What is the causal chain from operational root trigger to dollar/revenue impact?',
      example: 'causal chain: Provisioning delay → 9-day onboarding → 3.5% early churn → $6.0M ARR risk',
      prefixHint: 'causal chain: '
    });
  }

  // 7. Root Cause
  if (
    (captured.rootCause && captured.rootCause.trim().length >= 8) ||
    (Array.isArray(captured.rootCauses) && captured.rootCauses.some((c) => c.trim().length >= 8))
  ) {
    capturedAttributes.push('Root Cause');
  } else {
    missingAttributes.push({
      key: 'rootCause',
      category: 'Business Problem',
      label: 'Root Cause',
      question: 'What is the primary root cause driving this problem?',
      example: 'root cause: Fragmented manual approval gates and legacy CRM integration latency',
      prefixHint: 'root cause: '
    });
  }

  // 8. Target Remediation Timing
  if (
    (Array.isArray(captured.remediationTimings) && captured.remediationTimings.length > 0) ||
    (captured.targetRemediationTiming && captured.targetRemediationTiming.trim().length >= 2)
  ) {
    capturedAttributes.push('Target Remediation Timing');
  } else {
    missingAttributes.push({
      key: 'remediationTimings',
      category: 'Business Problem',
      label: 'Target Remediation Timing',
      question: 'What is the target remediation timeline or delivery sprint milestone?',
      example: 'timeline: Q2 2027 Sprint 4',
      prefixHint: 'timeline: '
    });
  }

  // 9. Measurable Leading & Lagging Metrics
  const metrics = Array.isArray(captured.metrics) ? captured.metrics : [];
  const hasLeading = metrics.some((m) => m.metricType === 'Leading');
  const hasLagging = metrics.some((m) => m.metricType === 'Lagging');

  if (metrics.length === 0) {
    missingAttributes.push({
      key: 'metrics',
      category: 'Business Problem',
      label: 'Leading & Lagging Metrics',
      question: 'Which measurable Leading (operational) and Lagging (financial/churn) metrics with baseline → target values should we track?',
      example: 'metric: Leading • Cycle Time: 9 days → 3 days; Lagging • Revenue Risk: $6.0M → $0',
      prefixHint: 'metric: '
    });
  } else if (!hasLagging) {
    capturedAttributes.push('Leading Metric');
    missingAttributes.push({
      key: 'laggingMetric',
      category: 'Business Problem',
      label: 'Lagging Business Metric ($ / Churn)',
      question: 'You have a Leading metric — what Lagging financial or customer impact metric (e.g., Revenue Risk or Churn %) pairs with it?',
      example: 'Lagging • Revenue Risk: $6.0M → $0',
      prefixHint: 'metric: Lagging • '
    });
  } else if (!hasLeading) {
    capturedAttributes.push('Lagging Metric');
    missingAttributes.push({
      key: 'metrics',
      category: 'Business Problem',
      label: 'Leading Operational Metric',
      question: 'You have a Lagging metric — what Leading operational indicator predicts progress early?',
      example: 'Leading • Cycle Time: 9 days → 3 days',
      prefixHint: 'metric: Leading • '
    });
  } else {
    capturedAttributes.push('Leading & Lagging Metrics');
  }

  const totalCheckpoints = 9;
  const completedCount = Math.max(0, totalCheckpoints - missingAttributes.length);
  const readinessPct = Math.round((completedCount / totalCheckpoints) * 100);

  return {
    missingAttributes,
    capturedAttributes,
    readinessPct
  };
}

export function parseConversationalOkrInput(
  message: string,
  context: ConversationalContext = {},
  history: ConversationalHistoryTurn[] = [],
  previousDraft: ConversationalOkrDraft | null = null
): ConversationalParseResult {
  const text = String(message || '').trim();
  const sector = context.sector || 'Enterprise';
  const owners = Array.isArray(context.owners) ? context.owners : [];
  const parentOptions = Array.isArray(context.parentOptions) ? context.parentOptions : [];

  // Reconstruct accumulated explicitly-supplied draft across previousDraft.explicitFields + user history + latest message
  // (Never treat prior-turn heuristic fallback placeholders as user-confirmed attributes.)
  let accumulated: ConversationalOkrDraft = {};
  if (previousDraft) {
    if (Array.isArray(previousDraft.explicitFields)) {
      const allowed = new Set(previousDraft.explicitFields);
      const filtered: Record<string, unknown> = {};
      for (const key of allowed) {
        const val = (previousDraft as Record<string, unknown>)[key];
        if (val !== undefined) filtered[key] = val;
      }
      accumulated = filtered as ConversationalOkrDraft;
      if (previousDraft.lastAskedField) {
        accumulated.lastAskedField = previousDraft.lastAskedField;
      }
      if (previousDraft.explicitFields.length > 0) {
        accumulated.explicitFields = [...previousDraft.explicitFields];
      }
    } else if (history.length === 0) {
      accumulated = { ...previousDraft };
    }
  }
  let sawCreateInHistory = false;
  let sawProblemInHistory = false;

  for (let i = 0; i < history.length; i++) {
    const turn = history[i];
    if (turn.role !== 'user' || !turn.text) continue;
    const priorAssistantSlice = history.slice(0, i);
    const turnAskedField = inferLastAskedFieldFromHistory(priorAssistantSlice, null);
    const parsedTurn = parseSingleTurnUpdates(turn.text, context, turnAskedField);
    accumulated = mergeConversationalDrafts(accumulated, parsedTurn.updates);
    if (parsedTurn.hasCreateSignal) sawCreateInHistory = true;
    if (parsedTurn.hasBusinessProblemSignal) sawProblemInHistory = true;
  }

  const lastAskedField = inferLastAskedFieldFromHistory(history, previousDraft);
  const latestParsed = parseSingleTurnUpdates(text, context, lastAskedField);
  accumulated = mergeConversationalDrafts(accumulated, latestParsed.updates);

  const hasStructuredPayload =
    latestParsed.explicitFieldsCount > 0 ||
    Boolean(
      accumulated.title ||
        accumulated.owner ||
        accumulated.remediationTimings?.length ||
        accumulated.metrics?.length ||
        accumulated.problemDescription ||
        accumulated.rootCause ||
        accumulated.causalChainToDollarImpact ||
        accumulated.impactedStakeholders?.length ||
        accumulated.budget
    );

  let intent: ConversationIntent = 'clarify';
  if (
    latestParsed.hasOrchestrationSignal &&
    !latestParsed.hasCreateSignal &&
    latestParsed.explicitFieldsCount === 0 &&
    !previousDraft
  ) {
    intent = 'run_orchestration';
  } else if (latestParsed.hasCreateSignal || sawCreateInHistory) {
    intent = 'create_okr';
  } else if (latestParsed.hasBusinessProblemSignal || sawProblemInHistory) {
    intent =
      hasStructuredPayload && (accumulated.owner || accumulated.title || accumulated.metrics?.length)
        ? 'create_okr'
        : 'update_business_problem';
  } else if (hasStructuredPayload) {
    intent = 'create_okr';
  }

  if (intent === 'clarify') {
    const { missingAttributes, capturedAttributes, readinessPct } = evaluateMissingAttributes(accumulated, context);
    const nextField = missingAttributes[0] || null;
    return {
      assistantMessage:
        'I can help construct a Supervisor-compliant OKR and 6-dimension Business Problem. Tell me the target outcome you want to achieve, or share key details like owner, timeline, root cause, and metrics.',
      intent: 'clarify',
      confidence: 0.55,
      questions: missingAttributes.slice(0, 3).map((m) => m.question),
      actionPlan: ['Capture OKR outcome, HR owner, and budget', 'Gather 6 Business Problem dimensions', 'Construct draft for Apply Draft to Form'],
      okrDraft: null,
      businessProblem: null,
      orchestrationEvents: [],
      missingAttributes,
      capturedAttributes,
      readinessPct,
      isDraftComplete: false,
      nextExpectedField: nextField?.key || 'title'
    };
  }

  if (intent === 'run_orchestration') {
    const bp = previousDraft ? buildStructuredBusinessProblemFromDraft(previousDraft, sector, text) : null;
    const { missingAttributes, capturedAttributes, readinessPct } = evaluateMissingAttributes(accumulated, context);
    return {
      assistantMessage: 'Prepared an orchestration execution plan across Supervisor and Advisory agents.',
      intent: 'run_orchestration',
      confidence: 0.84,
      questions: [],
      actionPlan: [
        'Trigger Supervisor structural adequacy audit',
        'Run Advisory Committee score recalculation',
        'Publish constraint & intervention events to Event Bus'
      ],
      okrDraft: previousDraft || null,
      businessProblem: bp,
      orchestrationEvents: [
        {
          topic: 'ORCHESTRATION_STARTED',
          sourceAgent: 'Conversational Agent',
          targetAgent: 'Supervisor Agent',
          summary: 'Conversational workflow requested orchestration start',
          severity: 'info'
        },
        {
          topic: 'ADVISORY_COMMITTEE_EVALUATED',
          sourceAgent: 'Conversational Agent',
          targetAgent: 'Advisory Committee',
          summary: 'Requested advisory review for portfolio risk & OKR alignment',
          severity: 'success'
        }
      ],
      missingAttributes,
      capturedAttributes,
      readinessPct,
      isDraftComplete: missingAttributes.length === 0,
      nextExpectedField: missingAttributes[0]?.key || null
    };
  }

  const historyUserText = history
    .filter((t) => t.role === 'user')
    .map((t) => t.text)
    .concat(text)
    .join('\n');

  // If the user explicitly asked to auto-complete remaining fields, fill industry defaults into accumulated
  if (latestParsed.hasAutoCompleteSignal) {
    const inferredTitle = deriveTitleFromDraft(accumulated, sector);
    const heuristicBp = buildStructuredBusinessProblemFromDraft(
      { ...accumulated, title: inferredTitle },
      sector,
      historyUserText
    );
    const verifiedOwner = isOwnerInDirectory(accumulated.owner, owners)
      ? accumulated.owner
      : owners[0] || accumulated.owner || 'Executive Lead';

    const existingMetrics = Array.isArray(accumulated.metrics) ? [...accumulated.metrics] : [];
    const hasLeading = existingMetrics.some((m) => m.metricType === 'Leading');
    const hasLagging = existingMetrics.some((m) => m.metricType === 'Lagging');
    if (existingMetrics.length === 0) {
      existingMetrics.push(...heuristicBp.metrics);
    } else {
      if (!hasLeading) {
        const heuristicLeading = heuristicBp.metrics.find((m) => m.metricType === 'Leading') || {
          indicator: 'Operational Cycle Time',
          baselineValue: '65%',
          targetValue: '> 88%',
          metricType: 'Leading' as const
        };
        existingMetrics.push(heuristicLeading);
      }
      if (!hasLagging) {
        const heuristicLagging = heuristicBp.metrics.find((m) => m.metricType === 'Lagging') || {
          indicator: 'Financial Exposure Risk',
          baselineValue: '$5.5M',
          targetValue: '$0',
          metricType: 'Lagging' as const
        };
        existingMetrics.push(heuristicLagging);
      }
    }

    accumulated = {
      ...accumulated,
      title: accumulated.title || inferredTitle,
      owner: verifiedOwner,
      budget: accumulated.budget || '$4.5M',
      priority: accumulated.priority || 'P1 - High',
      problemDescription:
        accumulated.problemDescription && accumulated.problemDescription.length >= 15
          ? accumulated.problemDescription
          : heuristicBp.problemDescription,
      impactedStakeholders:
        accumulated.impactedStakeholders && accumulated.impactedStakeholders.length > 0
          ? accumulated.impactedStakeholders
          : heuristicBp.impactedStakeholders,
      causalChainToDollarImpact:
        accumulated.causalChainToDollarImpact && accumulated.causalChainToDollarImpact.length >= 10
          ? accumulated.causalChainToDollarImpact
          : heuristicBp.causalChainToDollarImpact,
      rootCause:
        accumulated.rootCause && accumulated.rootCause.length >= 8
          ? accumulated.rootCause
          : heuristicBp.rootCause,
      rootCauses:
        accumulated.rootCauses && accumulated.rootCauses.length > 0
          ? accumulated.rootCauses
          : heuristicBp.rootCauses,
      remediationTimings:
        accumulated.remediationTimings && accumulated.remediationTimings.length > 0
          ? accumulated.remediationTimings
          : heuristicBp.remediationTimings,
      targetRemediationTiming:
        accumulated.targetRemediationTiming || heuristicBp.targetRemediationTiming,
      targetDate: accumulated.targetDate || heuristicBp.targetRemediationTiming,
      metrics: existingMetrics
    };
  }

  const gapReport = evaluateMissingAttributes(accumulated, context);
  const nextExpectedField = gapReport.missingAttributes[0]?.key || null;
  const isDraftComplete = gapReport.missingAttributes.length === 0;

  const confirmedKeys = (
    [
      'title',
      'parentId',
      'owner',
      'priority',
      'budget',
      'targetDate',
      'problemDescription',
      'impactedStakeholders',
      'causalChainToDollarImpact',
      'rootCause',
      'rootCauses',
      'targetRemediationTiming',
      'remediationTimings',
      'metrics'
    ] as const
  ).filter((key) => {
    const val = accumulated[key];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && String(val).trim().length > 0;
  });

  const resolvedTitle = deriveTitleFromDraft(accumulated, sector);
  const resolvedOwner = accumulated.owner || owners[0] || 'Executive Lead';
  const resolvedParentId = accumulated.parentId || parentOptions[0]?.id || '';
  const resolvedPriority: PriorityLevel = accumulated.priority || 'P1 - High';
  const resolvedBudget = accumulated.budget || '$4.5M';

  const businessProblem = buildStructuredBusinessProblemFromDraft(
    { ...accumulated, title: resolvedTitle },
    sector,
    historyUserText
  );

  const okrDraft: ConversationalOkrDraft = {
    title: resolvedTitle,
    parentId: resolvedParentId,
    owner: resolvedOwner,
    priority: resolvedPriority,
    budget: resolvedBudget,
    targetDate: businessProblem.targetRemediationTiming,
    problemDescription: businessProblem.problemDescription,
    impactedStakeholders: businessProblem.impactedStakeholders,
    causalChainToDollarImpact: businessProblem.causalChainToDollarImpact,
    rootCause: businessProblem.rootCause,
    rootCauses: businessProblem.rootCauses,
    targetRemediationTiming: businessProblem.targetRemediationTiming,
    remediationTimings: businessProblem.remediationTimings,
    metrics: businessProblem.metrics,
    lastAskedField: nextExpectedField,
    explicitFields: Array.from(new Set(confirmedKeys))
  };

  const metricsSummary = businessProblem.metrics
    .map((m) => `${m.metricType} • ${m.indicator}: ${m.baselineValue} → ${m.targetValue}`)
    .join('; ');

  const assistantLines: string[] = [];
  if (isDraftComplete) {
    assistantLines.push(
      `Complete OKR & 6-Dimension Business Problem constructed (100% Supervisor-ready):`
    );
    assistantLines.push(`• Outcome / Title: ${resolvedTitle}`);
    assistantLines.push(`• Owner: ${resolvedOwner} • Budget: ${resolvedBudget} • Priority: ${resolvedPriority}`);
    assistantLines.push(`• Timeline: ${businessProblem.remediationTimings?.join(', ') || businessProblem.targetRemediationTiming}`);
    assistantLines.push(`• Root Cause: ${businessProblem.rootCause}`);
    assistantLines.push(`• Causal Chain: ${businessProblem.causalChainToDollarImpact}`);
    assistantLines.push(`• Stakeholders: ${businessProblem.impactedStakeholders.join(', ')}`);
    assistantLines.push(`• Metrics: ${metricsSummary}`);
    assistantLines.push(
      `Click "Apply Draft to Form" below for final review, then click "Publish OKR & Execute Remaining Stages".`
    );
  } else {
    const primaryGap = gapReport.missingAttributes[0];
    const remainingLabels = gapReport.missingAttributes.map((m) => m.label).join(', ');
    assistantLines.push(
      `Captured ${gapReport.capturedAttributes.length}/9 attributes (${gapReport.readinessPct}% complete).`
    );
    if (accumulated.title || metricsSummary) {
      assistantLines.push(`• Working Draft: ${resolvedTitle} | Owner: ${resolvedOwner} | Timeline: ${businessProblem.targetRemediationTiming}`);
    }
    assistantLines.push(`• Still Missing (${gapReport.missingAttributes.length}): ${remainingLabels}`);
    assistantLines.push(`Next Question: ${primaryGap.question}`);
    assistantLines.push(`Tip: Reply directly (e.g. "${primaryGap.example}") or click "Construct Complete Draft" to auto-fill remaining fields.`);
  }

  const questions = gapReport.missingAttributes.slice(0, 3).map((m) => m.question);
  const confidence = isDraftComplete
    ? 0.96
    : Math.min(0.92, Math.max(0.7, 0.62 + (gapReport.readinessPct / 100) * 0.3));

  return {
    assistantMessage: assistantLines.join('\n'),
    intent,
    confidence: Number(confidence.toFixed(2)),
    questions,
    actionPlan: isDraftComplete
      ? [
          'Click "Apply Draft to Form" to populate all OKR & 6 Business Problem fields',
          'Review owner, causal chain, and metrics in the Add OKR modal',
          'Click "Publish OKR & Execute Remaining Stages" to validate & update Advisory scores'
        ]
      : [
          `Answer missing field: ${gapReport.missingAttributes[0]?.label || 'remaining attributes'}`,
          'Or click "Construct Complete Draft" to auto-populate remaining fields',
          'Apply complete draft to Add OKR form for review & publish'
        ],
    okrDraft,
    businessProblem,
    orchestrationEvents: [],
    missingAttributes: gapReport.missingAttributes,
    capturedAttributes: gapReport.capturedAttributes,
    readinessPct: gapReport.readinessPct,
    isDraftComplete,
    nextExpectedField
  };
}
