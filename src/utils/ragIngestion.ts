import type { KnowledgeBasePillar } from '../types/orchestration';

export type KnowledgePillarId = 'kb1' | 'kb2' | 'kb3' | 'kb4' | 'kb5';

export interface ParsedDocumentPreview {
  targetPillarId: KnowledgePillarId;
  targetPillarTitle: string;
  fileName: string;
  summary: string;
  metricHighlight: string;
  trendTag: string;
  keyInsights: string[];
  chunks: Array<{ id: string; text: string; source: string; sourceDocument?: string; ingestedAt?: string }>;
  engine: 'gemini-rag' | 'deterministic-fallback';
}

const PILLAR_KEYWORDS: Record<KnowledgePillarId, string[]> = {
  kb1: ['attainment', 'velocity', 'sprint', 'historical', 'quarterly', 'sla', 'latency', 'defect', 'throughput', 'performance'],
  kb2: ['market', 'competitor', 'cagr', 'sector', 'benchmark', 'apra', 'regulation', 'compliance', 'policy', 'standard', 'industry'],
  kb3: ['nps', 'csat', 'customer', 'feedback', 'voice of customer', 'churn', 'adoption', 'retention', 'complaint', 'survey'],
  kb4: ['roi', 'program', 'project', 'runner', 'delivery', 'epic', 'outcome', 'release', 'milestone', 'postmortem'],
  kb5: ['fte', 'squad', 'capacity', 'utilisation', 'utilization', 'resource', 'headcount', 'allocation', 'overload', 'staffing']
};

export const PILLAR_TITLES: Record<KnowledgePillarId, string> = {
  kb1: 'Historical Performance',
  kb2: 'Market Data',
  kb3: 'Customer Feedback',
  kb4: 'Project Runner & Outcome',
  kb5: 'Resources & Utilisation'
};

export function normalizeDocumentText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts readable text runs from raw PDF bytes/string when running deterministic offline parsing.
 */
export function extractReadableTextFromPdfBytes(bytes: Uint8Array): string {
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(bytes);
  const parenStrings: string[] = [];
  const regex = /\(([^()]{4,240})\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw)) !== null) {
    const cleaned = match[1]
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length >= 6 && /[a-zA-Z]{3,}/.test(cleaned)) {
      parenStrings.push(cleaned);
    }
  }
  if (parenStrings.length >= 2) {
    return normalizeDocumentText(parenStrings.join('. '));
  }

  // Fallback ASCII run scan
  const asciiRuns = raw.match(/[A-Za-z0-9][A-Za-z0-9 ,.;:%$+\-/()]{12,240}/g) || [];
  const filtered = asciiRuns.filter(
    (run) => !/^(endobj|stream|endstream|xref|trailer|startxref|FontDescriptor|MediaBox)/.test(run)
  );
  return normalizeDocumentText(filtered.slice(0, 60).join('. '));
}

export function extractTextFromStructuredFile(fileName: string, rawText: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.json')) {
    try {
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed)) {
        return normalizeDocumentText(
          parsed
            .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
            .join('\n')
        );
      }
      if (parsed && typeof parsed === 'object') {
        return normalizeDocumentText(
          Object.entries(parsed)
            .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
            .join('\n')
        );
      }
    } catch {
      // Fall through to plain text normalization
    }
  }
  return normalizeDocumentText(rawText);
}

export function classifyDocumentPillar(
  text: string,
  fileName: string,
  requestedPillar: KnowledgePillarId | 'auto' = 'auto'
): KnowledgePillarId {
  if (requestedPillar !== 'auto' && requestedPillar in PILLAR_TITLES) {
    return requestedPillar;
  }

  const haystack = `${fileName} ${text}`.toLowerCase();
  let bestPillar: KnowledgePillarId = 'kb2';
  let bestScore = -1;

  (Object.keys(PILLAR_KEYWORDS) as KnowledgePillarId[]).forEach((pillarId) => {
    const score = PILLAR_KEYWORDS[pillarId].reduce((acc, kw) => {
      return haystack.includes(kw) ? acc + 1 : acc;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestPillar = pillarId;
    }
  });

  return bestScore > 0 ? bestPillar : 'kb2';
}

export function chunkDocumentText(
  text: string,
  sourceLabel: string,
  options: { maxChunkLength?: number; maxChunks?: number } = {}
): Array<{ id: string; text: string; source: string }> {
  const maxChunkLength = options.maxChunkLength ?? 280;
  const maxChunks = options.maxChunks ?? 8;
  const normalized = normalizeDocumentText(text);
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);

  const units = sentences.length > 0 ? sentences : [normalized];
  const chunks: Array<{ id: string; text: string; source: string; sourceDocument?: string; ingestedAt?: string }> = [];
  let buffer = '';

  const pushBuffer = (val: string) => {
    const trimmed = val.trim().slice(0, maxChunkLength);
    if (!trimmed) return;
    const ingestedAt = new Date().toISOString();
    chunks.push({
      id: `doc-vec-${Date.now()}-${chunks.length + 1}`,
      text: trimmed,
      source: sourceLabel.slice(0, 90),
      sourceDocument: sourceLabel.slice(0, 90),
      ingestedAt
    });
  };

  for (const unit of units) {
    if (chunks.length >= maxChunks) break;
    if (unit.length > maxChunkLength) {
      if (buffer) {
        pushBuffer(buffer);
        buffer = '';
        if (chunks.length >= maxChunks) break;
      }
      for (let offset = 0; offset < unit.length && chunks.length < maxChunks; offset += maxChunkLength) {
        pushBuffer(unit.slice(offset, offset + maxChunkLength));
      }
      continue;
    }

    const candidate = buffer ? `${buffer} ${unit}` : unit;
    if (candidate.length <= maxChunkLength) {
      buffer = candidate;
    } else {
      pushBuffer(buffer);
      buffer = unit;
    }
  }

  if (buffer && chunks.length < maxChunks) {
    pushBuffer(buffer);
  }

  return chunks;
}

export function buildDeterministicIngestionPreview(params: {
  fileName: string;
  textContent: string;
  targetPillarId?: KnowledgePillarId | 'auto';
  industryName: string;
}): ParsedDocumentPreview {
  const cleanText = normalizeDocumentText(params.textContent);
  const pillarId = classifyDocumentPillar(cleanText, params.fileName, params.targetPillarId || 'auto');
  const chunks = chunkDocumentText(cleanText, params.fileName);

  const metricMatch = cleanText.match(
    /(\$?\d+(?:\.\d+)?%?(?:\s*(?:M|B|K|days|hrs|hours|ms|FTE|x|NPS))?)/i
  );
  const metricHighlight = metricMatch
    ? `Indexed: ${metricMatch[1]}`
    : `${chunks.length} Vectors Indexed`;

  const sentences = cleanText
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 16);

  const summary =
    sentences[0]?.slice(0, 220) ||
    `RAG ingestion indexed ${chunks.length} semantic chunks from ${params.fileName} for ${params.industryName}.`;

  const keyInsights = sentences
    .slice(0, 3)
    .map((s) => s.slice(0, 140));

  return {
    targetPillarId: pillarId,
    targetPillarTitle: PILLAR_TITLES[pillarId],
    fileName: params.fileName,
    summary,
    metricHighlight,
    trendTag: `Ingested · ${params.fileName.slice(0, 22)}`,
    keyInsights: keyInsights.length > 0 ? keyInsights : [summary],
    chunks,
    engine: 'deterministic-fallback'
  };
}

export function mergePreviewIntoKnowledgeBase(
  currentPillars: KnowledgeBasePillar[],
  preview: ParsedDocumentPreview
): KnowledgeBasePillar[] {
  const existingIds = new Set(currentPillars.map((p) => p.id));
  const targetExists = existingIds.has(preview.targetPillarId);

  const updated = currentPillars.map((pillar) => {
    if (pillar.id !== preview.targetPillarId) return pillar;

    const existingTexts = new Set(pillar.vectorChunks.map((c) => c.text.toLowerCase()));
    const newChunks = preview.chunks.filter((c) => !existingTexts.has(c.text.toLowerCase()));
    const combinedChunks = [...newChunks, ...pillar.vectorChunks].slice(0, 20);

    const existingDetails = new Set(pillar.details.map((d) => d.toLowerCase()));
    const newDetails = preview.keyInsights.filter((d) => !existingDetails.has(d.toLowerCase()));
    const combinedDetails = [...newDetails, ...pillar.details].slice(0, 8);

    return {
      ...pillar,
      metric: preview.metricHighlight || pillar.metric,
      trend: preview.trendTag || pillar.trend,
      summary: preview.summary || pillar.summary,
      details: combinedDetails,
      vectorChunks: combinedChunks
    };
  });

  if (!targetExists) {
    updated.push({
      id: preview.targetPillarId,
      title: preview.targetPillarTitle,
      metric: preview.metricHighlight,
      trend: preview.trendTag,
      summary: preview.summary,
      details: preview.keyInsights.slice(0, 8),
      vectorChunks: preview.chunks.slice(0, 20)
    });
  }

  return updated;
}
