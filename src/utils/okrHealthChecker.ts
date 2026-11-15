import { TraceabilityNode } from '../types/orchestration';

export type BusinessProblemAttributeKey =
  | 'Description'
  | 'Stakeholders'
  | 'Causal Chain'
  | 'Root Cause'
  | 'Remediation Timing'
  | 'Metrics';

export const OKR_REQUIRED_ATTRIBUTES: readonly BusinessProblemAttributeKey[] = [
  'Description',
  'Stakeholders',
  'Causal Chain',
  'Root Cause',
  'Remediation Timing',
  'Metrics'
] as const;

export interface MissingOkrAttributeFlag {
  attribute: BusinessProblemAttributeKey;
  reason: string;
  remediationHint: string;
}

export interface PresentOkrAttributeSummary {
  attribute: BusinessProblemAttributeKey;
  preview: string;
}

export interface OkrHealthScanResult {
  okrId: string;
  okrTitle: string;
  owner: string;
  budget: string;
  progress: number;
  status: TraceabilityNode['status'];
  priority: string;
  hasBusinessProblemObject: boolean;
  presentAttributes: PresentOkrAttributeSummary[];
  missingAttributes: MissingOkrAttributeFlag[];
  presentCount: number;
  totalRequired: number;
  completenessPct: number;
  healthTier: 'Complete' | 'Partial' | 'Incomplete';
  isFlagged: boolean;
}

export interface AttributeCoverageStat {
  attribute: BusinessProblemAttributeKey;
  presentCount: number;
  missingCount: number;
  coveragePct: number;
}

export interface PortfolioOkrHealthSummary {
  totalOkrs: number;
  completeCount: number;
  partialCount: number;
  incompleteCount: number;
  flaggedCount: number;
  overallCompletenessPct: number;
  attributeCoverage: AttributeCoverageStat[];
  results: OkrHealthScanResult[];
}

export function scanOkrHealth(okr: TraceabilityNode): OkrHealthScanResult {
  const bp = okr.businessProblem;
  const hasBusinessProblemObject = Boolean(bp && typeof bp === 'object');

  const presentAttributes: PresentOkrAttributeSummary[] = [];
  const missingAttributes: MissingOkrAttributeFlag[] = [];

  // 1. Description
  const description = typeof bp?.problemDescription === 'string' ? bp.problemDescription.trim() : '';
  if (description.length >= 15) {
    presentAttributes.push({
      attribute: 'Description',
      preview: description.length > 72 ? `${description.slice(0, 69)}...` : description
    });
  } else {
    missingAttributes.push({
      attribute: 'Description',
      reason: description.length === 0
        ? 'Problem Description is missing.'
        : `Problem Description is too brief (${description.length}/15 min chars).`,
      remediationHint: 'Describe the core operational friction, customer impact, and strategic gap.'
    });
  }

  // 2. Stakeholders
  const stakeholders = Array.isArray(bp?.impactedStakeholders)
    ? bp.impactedStakeholders.map((s) => String(s).trim()).filter(Boolean)
    : [];
  if (stakeholders.length > 0) {
    presentAttributes.push({
      attribute: 'Stakeholders',
      preview: stakeholders.slice(0, 2).join(', ') + (stakeholders.length > 2 ? ` +${stakeholders.length - 2}` : '')
    });
  } else {
    missingAttributes.push({
      attribute: 'Stakeholders',
      reason: 'No Impacted Stakeholders assigned.',
      remediationHint: 'Select affected roles from the enterprise HR directory or add impacted customer segments.'
    });
  }

  // 3. Causal Chain
  const causalChain = typeof bp?.causalChainToDollarImpact === 'string' ? bp.causalChainToDollarImpact.trim() : '';
  if (causalChain.length >= 10) {
    presentAttributes.push({
      attribute: 'Causal Chain',
      preview: causalChain.length > 72 ? `${causalChain.slice(0, 69)}...` : causalChain
    });
  } else {
    missingAttributes.push({
      attribute: 'Causal Chain',
      reason: causalChain.length === 0
        ? 'Causal Chain to $ Impact is missing.'
        : 'Causal Chain narrative is incomplete (< 10 chars).',
      remediationHint: 'Map technical/operational bottleneck -> customer symptom -> quantified $ financial impact.'
    });
  }

  // 4. Root Cause
  const rootCausesList = Array.isArray(bp?.rootCauses)
    ? bp.rootCauses.map((rc) => String(rc).trim()).filter((rc) => rc.length >= 10)
    : [];
  const primaryRootCause = typeof bp?.rootCause === 'string' ? bp.rootCause.trim() : '';
  const validRootCauses = rootCausesList.length > 0
    ? rootCausesList
    : primaryRootCause.length >= 10
      ? [primaryRootCause]
      : [];

  if (validRootCauses.length > 0) {
    presentAttributes.push({
      attribute: 'Root Cause',
      preview: `${validRootCauses.length} documented`
    });
  } else {
    missingAttributes.push({
      attribute: 'Root Cause',
      reason: primaryRootCause.length === 0 && (!bp?.rootCauses || bp.rootCauses.length === 0)
        ? 'Root Cause is missing.'
        : 'Root Cause description is too vague (< 10 chars).',
      remediationHint: 'Document the underlying architectural, capacity, or process cause.'
    });
  }

  // 5. Remediation Timing
  const timingsList = Array.isArray(bp?.remediationTimings)
    ? bp.remediationTimings.map((t) => String(t).trim()).filter((t) => t.length >= 2)
    : [];
  const primaryTiming = typeof bp?.targetRemediationTiming === 'string' ? bp.targetRemediationTiming.trim() : '';
  const validTimings = timingsList.length > 0
    ? timingsList
    : primaryTiming.length >= 2
      ? [primaryTiming]
      : [];

  if (validTimings.length > 0) {
    presentAttributes.push({
      attribute: 'Remediation Timing',
      preview: validTimings.slice(0, 2).join(', ')
    });
  } else {
    missingAttributes.push({
      attribute: 'Remediation Timing',
      reason: 'Target Remediation Timing is missing.',
      remediationHint: 'Specify milestone quarter, sprint, or target delivery window (e.g., Q1 2027 Sprint 4).'
    });
  }

  // 6. Metrics
  const rawMetrics = Array.isArray(bp?.metrics) ? bp.metrics : [];
  const validMetrics = rawMetrics.filter(
    (m) =>
      m &&
      typeof m === 'object' &&
      String(m.indicator ?? '').trim().length > 0 &&
      String(m.baselineValue ?? '').trim().length > 0 &&
      String(m.targetValue ?? '').trim().length > 0
  );

  if (validMetrics.length > 0) {
    presentAttributes.push({
      attribute: 'Metrics',
      preview: `${validMetrics.length} indicator${validMetrics.length === 1 ? '' : 's'}`
    });
  } else {
    missingAttributes.push({
      attribute: 'Metrics',
      reason: rawMetrics.length === 0
        ? 'No Leading/Lagging Metrics defined.'
        : 'Existing metrics are missing concrete baseline or target values.',
      remediationHint: 'Add at least one Leading or Lagging metric with explicit baseline and target values.'
    });
  }

  const totalRequired = OKR_REQUIRED_ATTRIBUTES.length;
  const presentCount = presentAttributes.length;
  const completenessPct = Math.round((presentCount / totalRequired) * 100);
  const healthTier: OkrHealthScanResult['healthTier'] =
    missingAttributes.length === 0
      ? 'Complete'
      : presentCount === 0
        ? 'Incomplete'
        : 'Partial';

  return {
    okrId: okr.id,
    okrTitle: okr.title,
    owner: okr.owner || 'Unassigned',
    budget: okr.budget || '$0',
    progress: typeof okr.progress === 'number' ? okr.progress : 0,
    status: okr.status || 'On Track',
    priority: okr.manualPriority?.priority || 'AI_RECOMMENDED',
    hasBusinessProblemObject,
    presentAttributes,
    missingAttributes,
    presentCount,
    totalRequired,
    completenessPct,
    healthTier,
    isFlagged: missingAttributes.length > 0
  };
}

export function scanPortfolioOkrHealth(okrs: TraceabilityNode[]): PortfolioOkrHealthSummary {
  const results = okrs.map(scanOkrHealth).sort((a, b) => {
    // Flagged / lowest completeness surface first, then preserve stable title ordering
    if (a.missingAttributes.length !== b.missingAttributes.length) {
      return b.missingAttributes.length - a.missingAttributes.length;
    }
    return a.okrId.localeCompare(b.okrId);
  });

  const totalOkrs = results.length;
  const completeCount = results.filter((r) => r.healthTier === 'Complete').length;
  const partialCount = results.filter((r) => r.healthTier === 'Partial').length;
  const incompleteCount = results.filter((r) => r.healthTier === 'Incomplete').length;
  const flaggedCount = results.filter((r) => r.isFlagged).length;

  const overallCompletenessPct = totalOkrs > 0
    ? Math.round(results.reduce((sum, r) => sum + r.completenessPct, 0) / totalOkrs)
    : 100;

  const attributeCoverage: AttributeCoverageStat[] = OKR_REQUIRED_ATTRIBUTES.map((attribute) => {
    const missingCount = results.filter((r) =>
      r.missingAttributes.some((m) => m.attribute === attribute)
    ).length;
    const presentCount = totalOkrs - missingCount;
    const coveragePct = totalOkrs > 0 ? Math.round((presentCount / totalOkrs) * 100) : 100;
    return {
      attribute,
      presentCount,
      missingCount,
      coveragePct
    };
  });

  return {
    totalOkrs,
    completeCount,
    partialCount,
    incompleteCount,
    flaggedCount,
    overallCompletenessPct,
    attributeCoverage,
    results
  };
}
