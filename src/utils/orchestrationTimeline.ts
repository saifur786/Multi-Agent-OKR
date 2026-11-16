import { PersistedStageMetricRecord } from './orchestrationDrilldown';
import { WorkerAgentId } from './workerAgentTelemetry';

export type StageCompletionStatus = 'Succeeded' | 'Warning' | 'Failed';

export interface TimelineStageEntry {
  id: string;
  runId: string;
  run: string;
  industry: string;
  stageId: number;
  stageName: string;
  processFlowAgent: string;
  primaryWorkerId: WorkerAgentId;
  primaryWorkerName: string;
  successRate: number;
  latencyMs: number;
  anomalyCount: number;
  status: StageCompletionStatus;
  completedAt: string;
  source: string;
}

export interface LatestRunTimelineSummary {
  runId: string;
  runLabel: string;
  industry: string;
  overallStatus: StageCompletionStatus;
  succeededCount: number;
  warningCount: number;
  failedCount: number;
  totalLatencyMs: number;
  startedAt: string;
  completedAt: string;
  stages: TimelineStageEntry[];
}

export function computeStageCompletionStatus(
  successRate: number,
  anomalyCount: number
): StageCompletionStatus {
  const safeRate = Number.isFinite(successRate) ? successRate : 0;
  const safeAnomalies = Number.isFinite(anomalyCount) ? anomalyCount : 0;

  if (safeRate < 70 || safeAnomalies >= 5) {
    return 'Failed';
  }
  if (safeRate < 85 || safeAnomalies >= 3) {
    return 'Warning';
  }
  return 'Succeeded';
}

export function computeSequentialStageCompletionTimestamps(
  stages: Array<{ stageId: number; latencyMs: number }>,
  endIso: string
): Record<number, string> {
  const sorted = stages.slice().sort((a, b) => a.stageId - b.stageId);
  const parsedEndMs = Date.parse(endIso);
  const endMs = Number.isFinite(parsedEndMs) ? parsedEndMs : Date.now();
  const result: Record<number, string> = {};

  sorted.forEach((stage, idx) => {
    const remainingMs = sorted
      .slice(idx + 1)
      .reduce((acc, next) => acc + Math.max(80, Math.round(next.latencyMs || 250)), 0);
    result[stage.stageId] = new Date(endMs - remainingMs).toISOString();
  });

  return result;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatStageCompletionTimestamp(
  isoString?: string | null,
  options?: { utc?: boolean }
): string {
  if (!isoString) return 'Pending';
  const parsedMs = Date.parse(isoString);
  if (!Number.isFinite(parsedMs)) return 'Pending';

  const date = new Date(parsedMs);
  const useUtc = Boolean(options?.utc);

  const month = SHORT_MONTHS[useUtc ? date.getUTCMonth() : date.getMonth()];
  const day = String(useUtc ? date.getUTCDate() : date.getDate()).padStart(2, '0');
  const hours = String(useUtc ? date.getUTCHours() : date.getHours()).padStart(2, '0');
  const minutes = String(useUtc ? date.getUTCMinutes() : date.getMinutes()).padStart(2, '0');
  const seconds = String(useUtc ? date.getUTCSeconds() : date.getSeconds()).padStart(2, '0');
  const millis = String(useUtc ? date.getUTCMilliseconds() : date.getMilliseconds()).padStart(3, '0');

  return `${month} ${day}, ${hours}:${minutes}:${seconds}.${millis}${useUtc ? ' UTC' : ''}`;
}

export function extractLatestRunStageTimeline(
  records: PersistedStageMetricRecord[],
  preferredRunId?: string | null
): LatestRunTimelineSummary | null {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const byRunId = new Map<string, PersistedStageMetricRecord[]>();
  records.forEach((rec) => {
    if (!rec || !rec.runId) return;
    const list = byRunId.get(rec.runId) || [];
    list.push(rec);
    byRunId.set(rec.runId, list);
  });

  if (byRunId.size === 0) {
    return null;
  }

  let selectedRunId: string | null = null;
  if (preferredRunId && byRunId.has(preferredRunId)) {
    selectedRunId = preferredRunId;
  } else {
    let newestTs = -Infinity;
    for (const [runId, group] of byRunId.entries()) {
      const groupMaxTs = group.reduce((maxVal, item) => {
        const ts = Date.parse(item.completedAt || item.createdAt || '');
        return Number.isFinite(ts) && ts > maxVal ? ts : maxVal;
      }, -Infinity);
      if (groupMaxTs >= newestTs) {
        newestTs = groupMaxTs;
        selectedRunId = runId;
      }
    }
  }

  if (!selectedRunId) {
    return null;
  }

  const rawGroup = byRunId.get(selectedRunId) || [];
  if (rawGroup.length === 0) {
    return null;
  }

  // Deduplicate by stageId and sort 1..6
  const stageMap = new Map<number, PersistedStageMetricRecord>();
  rawGroup.forEach((item) => {
    stageMap.set(item.stageId, item);
  });
  const sortedDocs = Array.from(stageMap.values()).sort((a, b) => a.stageId - b.stageId);

  const distinctExplicitTimestamps = new Set(
    sortedDocs.map((doc) => doc.completedAt).filter((ts): ts is string => Boolean(ts))
  );
  const runEndIso =
    sortedDocs[sortedDocs.length - 1]?.completedAt ||
    sortedDocs[sortedDocs.length - 1]?.createdAt ||
    new Date().toISOString();

  const fallbackTimestamps = computeSequentialStageCompletionTimestamps(
    sortedDocs.map((doc) => ({ stageId: doc.stageId, latencyMs: doc.latencyMs })),
    runEndIso
  );

  const needsSequentialSynthesis = distinctExplicitTimestamps.size < sortedDocs.length;

  const stages: TimelineStageEntry[] = sortedDocs.map((doc) => {
    const completedAt =
      !needsSequentialSynthesis && doc.completedAt
        ? doc.completedAt
        : fallbackTimestamps[doc.stageId] || doc.createdAt || runEndIso;
    const status = doc.status || computeStageCompletionStatus(doc.successRate, doc.anomalyCount);

    return {
      id: doc.id,
      runId: doc.runId,
      run: doc.run,
      industry: doc.industry,
      stageId: doc.stageId,
      stageName: doc.stageName,
      processFlowAgent: doc.processFlowAgent,
      primaryWorkerId: doc.primaryWorkerId,
      primaryWorkerName: doc.primaryWorkerName,
      successRate: Number(doc.successRate.toFixed(1)),
      latencyMs: Math.round(doc.latencyMs),
      anomalyCount: Math.max(0, Math.round(doc.anomalyCount)),
      status,
      completedAt,
      source: doc.source
    };
  });

  const succeededCount = stages.filter((s) => s.status === 'Succeeded').length;
  const warningCount = stages.filter((s) => s.status === 'Warning').length;
  const failedCount = stages.filter((s) => s.status === 'Failed').length;
  const overallStatus: StageCompletionStatus =
    failedCount > 0 ? 'Failed' : warningCount > 0 ? 'Warning' : 'Succeeded';

  const totalLatencyMs = stages.reduce((sum, s) => sum + s.latencyMs, 0);
  const firstStageEndMs = Date.parse(stages[0]?.completedAt || runEndIso);
  const startedAt = Number.isFinite(firstStageEndMs)
    ? new Date(firstStageEndMs - Math.max(80, stages[0]?.latencyMs || 250)).toISOString()
    : runEndIso;
  const completedAt = stages[stages.length - 1]?.completedAt || runEndIso;

  return {
    runId: selectedRunId,
    runLabel: stages[0]?.run || 'Latest Run',
    industry: stages[0]?.industry || 'Telco',
    overallStatus,
    succeededCount,
    warningCount,
    failedCount,
    totalLatencyMs,
    startedAt,
    completedAt,
    stages
  };
}
