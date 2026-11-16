export type WorkerAgentId =
  | 'strategy-explorer'
  | 'okr-quality-auditor'
  | 'alignment-capacity-agent'
  | 'risk-sentinel'
  | 'executive-reporter'
  | 'retrospective-learner';

export interface WorkerAgentStatusSummary {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | string;
  label: string;
  reason?: string;
  action?: string;
}

export interface WorkerAgentStatusPresentation {
  normalizedStatus: 'active' | 'idle' | 'error';
  shouldPulse: boolean;
  buttonClassName: string;
  dotClassName: string;
  pulseRingClassName: string;
}

export function getWorkerAgentStatusPresentation(status?: string): WorkerAgentStatusPresentation {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'active') {
    return {
      normalizedStatus: 'active',
      shouldPulse: true,
      buttonClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80',
      dotClassName: 'bg-emerald-500 worker-agent-active-dot',
      pulseRingClassName: 'worker-agent-active-pulse-ring'
    };
  }
  if (normalized === 'error') {
    return {
      normalizedStatus: 'error',
      shouldPulse: false,
      buttonClassName: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100/80',
      dotClassName: 'bg-red-500',
      pulseRingClassName: ''
    };
  }
  return {
    normalizedStatus: 'idle',
    shouldPulse: false,
    buttonClassName: 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300',
    dotClassName: 'bg-slate-400',
    pulseRingClassName: ''
  };
}

export interface RawAgentInteractionRecord {
  id?: string;
  agent: string;
  context?: string;
  message?: string;
  response?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

export interface WorkerAgentLogEntry {
  id: string;
  agentId: string;
  agentName: string;
  sourceAgent: string;
  context: string;
  trigger: string;
  reasoning: string;
  createdAt: string;
  store: 'mongodb' | 'memory';
  statusSnapshot?: 'active' | 'idle' | 'error';
}

export interface WorkerAgentCatalogEntry {
  id: WorkerAgentId;
  name: string;
  canonicalAgentKey: string;
  aliases: string[];
  stageNumber: number;
  domainRole: string;
}

export const WORKER_AGENT_CATALOG: WorkerAgentCatalogEntry[] = [
  {
    id: 'strategy-explorer',
    name: 'Strategy Explorer',
    canonicalAgentKey: 'StrategyExplorer',
    aliases: [
      'StrategyExplorer',
      'Strategy&IdeationAgent',
      'IdeationAgent',
      'ConversationalOrchestrator',
      'ConversationalAgent',
      'SupervisorAgent'
    ],
    stageNumber: 1,
    domainRole: 'Strategic theme synthesis & Pillar 1/2 RAG ideation'
  },
  {
    id: 'okr-quality-auditor',
    name: 'OKR Quality Auditor',
    canonicalAgentKey: 'OKRQualityAuditor',
    aliases: [
      'OKRQualityAuditor',
      'AdvisoryCommitteeAgent',
      'Multi-LensAdvisorAgents',
      'SupervisorAgent'
    ],
    stageNumber: 2,
    domainRole: 'Multi-lens SMART compliance & attainment probability forecasting'
  },
  {
    id: 'alignment-capacity-agent',
    name: 'Alignment Capacity Agent',
    canonicalAgentKey: 'AlignmentCapacityAgent',
    aliases: [
      'AlignmentCapacityAgent',
      'Alignment&CapacityAgent',
      'AlignmentAgent'
    ],
    stageNumber: 3,
    domainRole: '7-layer traceability orphan detection & squad FTE balancing'
  },
  {
    id: 'risk-sentinel',
    name: 'Risk Sentinel',
    canonicalAgentKey: 'RiskSentinel',
    aliases: [
      'RiskSentinel',
      'RiskDetectionAgent',
      'RiskDetection&Connectors',
      'RiskConnectorBridge',
      'RoleEscalationController'
    ],
    stageNumber: 4,
    domainRole: 'Operational anomaly detection across disasters, ServiceNow & Jira telemetry'
  },
  {
    id: 'executive-reporter',
    name: 'Executive Reporter',
    canonicalAgentKey: 'ExecutiveReporter',
    aliases: [
      'ExecutiveReporter',
      'ExecutiveReportingAgent'
    ],
    stageNumber: 5,
    domainRole: 'Real-time portfolio scorecard narrative & governance exports'
  },
  {
    id: 'retrospective-learner',
    name: 'Retrospective Learner',
    canonicalAgentKey: 'RetrospectiveLearner',
    aliases: [
      'RetrospectiveLearner',
      'RetrospectiveLearningAgent',
      'Retrospective&LearningAgent'
    ],
    stageNumber: 6,
    domainRole: '5-Whys root-cause learning & Pillar 4 closed-loop KB persistence'
  }
];

function normalizeToken(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function resolveWorkerCatalogEntry(agentIdOrName: string): WorkerAgentCatalogEntry {
  const token = normalizeToken(agentIdOrName);
  const found = WORKER_AGENT_CATALOG.find(
    (entry) =>
      normalizeToken(entry.id) === token ||
      normalizeToken(entry.name) === token ||
      normalizeToken(entry.canonicalAgentKey) === token ||
      entry.aliases.some((alias) => normalizeToken(alias) === token)
  );
  if (found) return found;

  // Numeric fallback ('1'..'6')
  const index = Number(agentIdOrName);
  if (Number.isInteger(index) && index >= 1 && index <= WORKER_AGENT_CATALOG.length) {
    return WORKER_AGENT_CATALOG[index - 1];
  }

  return WORKER_AGENT_CATALOG[0];
}

export function matchesWorkerAgentInteraction(
  worker: WorkerAgentCatalogEntry,
  interactionAgent: string
): boolean {
  const target = normalizeToken(interactionAgent);
  if (!target) return false;
  return (
    normalizeToken(worker.id) === target ||
    normalizeToken(worker.name) === target ||
    normalizeToken(worker.canonicalAgentKey) === target ||
    worker.aliases.some((alias) => normalizeToken(alias) === target)
  );
}

export function buildWorkerBaselineLogs(
  worker: WorkerAgentCatalogEntry,
  industryName: string
): RawAgentInteractionRecord[] {
  const now = Date.now();
  const safeIndustry = industryName.trim() || 'Enterprise';

  const templatesByWorker: Record<WorkerAgentId, Array<{ message: string; response: string }>> = {
    'strategy-explorer': [
      {
        message: `Retrieve Pillar 1 historical baselines for ${safeIndustry}`,
        response: `Indexed historical strategic OKR benchmarks and capital efficiency patterns for ${safeIndustry}.`
      },
      {
        message: `Synthesize market regulatory catalysts (Pillar 2)`,
        response: `Aligned executive growth themes against Q4 compliance constraints and industry competitive gaps.`
      },
      {
        message: `Evaluate conversational intent routing triggers`,
        response: `Mapped incoming natural-language strategic objective to Stage 1 ideation and Stage 2 advisor review.`
      },
      {
        message: `Generate industry strategic theme proposals`,
        response: `Proposed high-leverage strategic objective themes grounded in ${safeIndustry} portfolio telemetry.`
      },
      {
        message: `Verify Stage 1 -> Stage 2 context handoff`,
        response: `Published enriched problem context and stakeholder scope to OKR Quality Auditor queue.`
      }
    ],
    'okr-quality-auditor': [
      {
        message: `Run SMART completeness check across ${safeIndustry} Key Results`,
        response: `Verified Specific, Measurable, Achievable, Relevant, and Time-Bound baseline vs. target deltas.`
      },
      {
        message: `Score Financial ROI & Customer Value advisor lenses`,
        response: `Evaluated candidate OKR ROI ratio and customer turnaround impact with 95% confidence interval.`
      },
      {
        message: `Audit 6-dimension Business Problem completeness`,
        response: `Checked Description, Stakeholders, Causal Chain, Root Cause, Remediation Timing, and Leading/Lagging metrics.`
      },
      {
        message: `Calibrate polynomial attainment probability forecast`,
        response: `Computed composite consensus probability across active multi-lens advisory committee.`
      },
      {
        message: `Approve quality gate handoff to Stage 3`,
        response: `Cleared validated OKR definitions for 7-layer dependency and squad capacity mapping.`
      }
    ],
    'alignment-capacity-agent': [
      {
        message: `Scan 7-layer traceability tree for orphan epics in ${safeIndustry}`,
        response: `Identified unlinked initiatives lacking strategic OKR parent lineage and flagged remediation owner.`
      },
      {
        message: `Evaluate squad FTE allocation thresholds (>100%)`,
        response: `Checked delivery ART saturation across active sprints to prevent capacity bottlenecks.`
      },
      {
        message: `Compute cross-program dependency graph weights`,
        response: `Mapped Business Problem -> Strategic Theme -> OKR -> Program -> Squad linkages cleanly.`
      },
      {
        message: `Generate squad load rebalance recommendations`,
        response: `Recommended shifting non-critical backlog scope to bring overloaded squads below 95% utilization.`
      },
      {
        message: `Persist Stage 3 alignment snapshot`,
        response: `Published verified dependency map and capacity slack telemetry to Risk Sentinel.`
      }
    ],
    'risk-sentinel': [
      {
        message: `Poll ServiceNow ITSM & Jira webhook telemetry for ${safeIndustry}`,
        response: `Evaluated inbound incident severity and sprint velocity drift signals against SLA thresholds.`
      },
      {
        message: `Cross-check active disaster triggers & critical OKR velocity`,
        response: `Quantified operational anomaly exposure across Behind (<60%) Key Results and active shocks.`
      },
      {
        message: `Synthesize prioritized mitigation playbook`,
        response: `Ranked containment actions and program budget reallocations by confidence and recovery impact.`
      },
      {
        message: `Evaluate anomaly frequency trend across last 10 runs`,
        response: `Updated Risk Sentinel anomaly counter in orchestration run telemetry for executive insights.`
      },
      {
        message: `Monitor SLA escalation triggers`,
        response: `Verified escalation routing rules to Operations Monitor and OKR Owner notification queues.`
      }
    ],
    'executive-reporter': [
      {
        message: `Aggregate portfolio attainment & budget ROI for ${safeIndustry}`,
        response: `Compiled real-time attainment, capital utilization, and critical KR status across active programs.`
      },
      {
        message: `Synthesize Board-ready executive summary brief`,
        response: `Generated concise executive narrative highlighting top delivery risks and recovery velocity.`
      },
      {
        message: `Validate BRD & Requirement Traceability Matrix (RTM) coverage`,
        response: `Verified end-to-end linkage between REQ-IDs, strategic objectives, and telemetry checks.`
      },
      {
        message: `Prepare CSV governance export payload`,
        response: `Formatted multi-layer node health and variance metrics for executive scorecard export.`
      },
      {
        message: `Synchronize reporting cadence with Supervisor Agent`,
        response: `Published Stage 5 portfolio digest and handed off outcome variance to Retrospective Learner.`
      }
    ],
    'retrospective-learner': [
      {
        message: `Execute 5-Whys root-cause decomposition for ${safeIndustry}`,
        response: `Traced operational variance back to underlying architectural and capacity root causes.`
      },
      {
        message: `Synthesize reusable resilience lesson for Pillar 4 KB`,
        response: `Distilled actionable playbook guardrails to prevent recurrence in upcoming quarterly cycles.`
      },
      {
        message: `Persist vector knowledge chunk into MongoDB Knowledge Base`,
        response: `Indexed post-mortem embedding into Pillar 4 continuous improvement memory store.`
      },
      {
        message: `Dispatch closed-loop alert to OKR Owner`,
        response: `Sent targeted remediation alert and recommended backlog action to responsible OKR owner.`
      },
      {
        message: `Verify Stage 6 feedback loop completion`,
        response: `Updated historical lessons feed so Strategy Explorer incorporates insights in the next run.`
      }
    ]
  };

  return templatesByWorker[worker.id].map((tpl, idx) => ({
    id: `kb-seed-${worker.id}-${safeIndustry.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx + 1}`,
    agent: worker.canonicalAgentKey,
    context: `worker-reasoning:${safeIndustry}:stage-${worker.stageNumber}`,
    message: tpl.message,
    response: tpl.response,
    createdAt: new Date(now - (idx + 1) * 180_000).toISOString(),
    metadata: {
      seededBaseline: true,
      workerId: worker.id,
      workerName: worker.name,
      stageNumber: worker.stageNumber
    }
  }));
}

export function extractWorkerAgentLogs(params: {
  workerIdOrName: string;
  industryName?: string;
  interactions: RawAgentInteractionRecord[];
  store: 'mongodb' | 'memory';
  limit?: number;
}): {
  worker: WorkerAgentCatalogEntry;
  logs: WorkerAgentLogEntry[];
  totalMatched: number;
} {
  const worker = resolveWorkerCatalogEntry(params.workerIdOrName);
  const limit = Math.max(1, Math.min(10, Number(params.limit || 5)));
  const industryNeedle = String(params.industryName || '').trim().toLowerCase();

  const entries: Array<{ entry: WorkerAgentLogEntry; industryMatch: boolean }> = [];
  const seenKeys = new Set<string>();

  const sorted = (params.interactions || [])
    .slice()
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  for (const raw of sorted) {
    const rawAgent = String(raw.agent || '');
    const context = String(raw.context || 'general');
    const createdAt = String(raw.createdAt || new Date().toISOString());
    const industryMatch = !industryNeedle || context.toLowerCase().includes(industryNeedle);

    // 1. Direct agent interaction match
    if (matchesWorkerAgentInteraction(worker, rawAgent)) {
      const trigger = String(raw.message || `${worker.name} execution step`).trim();
      const reasoning = String(raw.response || '').trim() || trigger;
      const dedupeKey = `${raw.id || ''}|${trigger}|${reasoning.slice(0, 80)}`;
      if (!seenKeys.has(dedupeKey)) {
        seenKeys.add(dedupeKey);
        entries.push({
          industryMatch,
          entry: {
            id: String(raw.id || `log-${entries.length + 1}`),
            agentId: worker.id,
            agentName: worker.name,
            sourceAgent: rawAgent,
            context,
            trigger,
            reasoning,
            createdAt,
            store: params.store
          }
        });
      }
      continue;
    }

    // 2. WorkerAgentStatus snapshot containing per-worker reasoning & action
    if (normalizeToken(rawAgent) === 'workeragentstatus' && Array.isArray(raw.metadata?.statuses)) {
      const match = raw.metadata.statuses.find(
        (s: any) =>
          normalizeToken(String(s?.id || '')) === normalizeToken(worker.id) ||
          normalizeToken(String(s?.name || '')) === normalizeToken(worker.name)
      );
      if (match) {
        const statusVal =
          match.status === 'error' ? 'error' : match.status === 'active' ? 'active' : 'idle';
        const reason = String(match.reason || '').trim();
        const action = String(match.action || '').trim();
        const reasoning = action ? `${reason} Next action: ${action}` : reason;
        const trigger = `Status telemetry check (${String(match.label || statusVal)})`;
        const dedupeKey = `${raw.id || ''}|status|${reasoning.slice(0, 80)}`;
        if (reasoning && !seenKeys.has(dedupeKey)) {
          seenKeys.add(dedupeKey);
          entries.push({
            industryMatch,
            entry: {
              id: `${raw.id || 'status'}-${worker.id}`,
              agentId: worker.id,
              agentName: worker.name,
              sourceAgent: 'WorkerAgentStatus',
              context,
              trigger,
              reasoning,
              createdAt,
              store: params.store,
              statusSnapshot: statusVal
            }
          });
        }
      }
    }
  }

  // Prioritize records matching the active industry, preserving newest-first within each group
  const prioritized = [
    ...entries.filter((e) => e.industryMatch).map((e) => e.entry),
    ...entries.filter((e) => !e.industryMatch).map((e) => e.entry)
  ];

  return {
    worker,
    logs: prioritized.slice(0, limit),
    totalMatched: prioritized.length
  };
}

export function computeAnomalyCountForRun(params: {
  activeDisasterCount?: number;
  criticalOkrCount?: number;
  riskSignalCount?: number;
}): number {
  const disasters = Math.max(0, Math.round(Number(params.activeDisasterCount || 0)));
  const criticalOkrs = Math.max(0, Math.round(Number(params.criticalOkrCount || 0)));
  const signals = Math.max(0, Math.round(Number(params.riskSignalCount || 0)));

  return disasters * 2 + (criticalOkrs > 0 ? Math.ceil(criticalOkrs / 2) : 0) + signals;
}

export type AnomalySensitivityLevel = 'high' | 'balanced' | 'low';

export interface AnomalyThresholdPolicy {
  sensitivity?: AnomalySensitivityLevel;
  stdDevMultiplier?: number;
  minAnomalyFloor?: number;
}

export interface AnomalyTelemetryStats {
  mean: number;
  stdDev: number;
  deviationThreshold: number;
  effectiveThreshold: number;
  stdDevMultiplier: number;
  minAnomalyFloor: number;
  sensitivity: AnomalySensitivityLevel;
  totalAnomalies: number;
  spikeRunCount: number;
}

export function isSignificantAnomalyDeviation(
  anomalyCount: number,
  stats: Pick<AnomalyTelemetryStats, 'mean' | 'deviationThreshold'> & {
    effectiveThreshold?: number;
    minAnomalyFloor?: number;
  }
): boolean {
  const value = Math.max(0, Number(anomalyCount || 0));
  const floor = Math.max(0, Number(stats.minAnomalyFloor ?? 0));
  const cutoff = Number(stats.effectiveThreshold ?? Math.max(stats.deviationThreshold, floor));
  return value > stats.mean && value >= cutoff && value >= floor;
}

export function computeAnomalyTelemetryStats(
  runs: Array<{ anomalyCount?: number }>,
  policy?: AnomalyThresholdPolicy
): AnomalyTelemetryStats {
  const stdDevMultiplier =
    typeof policy?.stdDevMultiplier === 'number' && Number.isFinite(policy.stdDevMultiplier)
      ? Math.max(0.1, Math.min(2.5, Number(policy.stdDevMultiplier)))
      : policy?.sensitivity === 'high'
        ? 0.3
        : policy?.sensitivity === 'low'
          ? 1.35
          : 0.75;

  const minAnomalyFloor =
    typeof policy?.minAnomalyFloor === 'number' && Number.isFinite(policy.minAnomalyFloor)
      ? Math.max(1, Math.min(10, Math.round(Number(policy.minAnomalyFloor))))
      : policy?.sensitivity === 'high'
        ? 1
        : policy?.sensitivity === 'low'
          ? 3
          : 1;

  const sensitivity: AnomalySensitivityLevel =
    policy?.sensitivity ||
    (stdDevMultiplier <= 0.55 ? 'high' : stdDevMultiplier >= 1.1 ? 'low' : 'balanced');

  const counts = (runs || []).map((run) => Math.max(0, Number(run?.anomalyCount || 0)));
  if (counts.length === 0) {
    return {
      mean: 0,
      stdDev: 0,
      deviationThreshold: 0,
      effectiveThreshold: minAnomalyFloor,
      stdDevMultiplier,
      minAnomalyFloor,
      sensitivity,
      totalAnomalies: 0,
      spikeRunCount: 0
    };
  }

  const totalAnomalies = counts.reduce((sum, count) => sum + count, 0);
  const mean = Number((totalAnomalies / counts.length).toFixed(2));
  const variance =
    counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length;
  const stdDev = Number(Math.sqrt(variance).toFixed(2));
  const deviationThreshold =
    stdDev > 0
      ? Number((mean + stdDevMultiplier * stdDev).toFixed(2))
      : Number((mean + Math.max(0.25, stdDevMultiplier * 0.65)).toFixed(2));
  const effectiveThreshold = Number(Math.max(deviationThreshold, minAnomalyFloor).toFixed(2));

  const spikeRunCount = counts.filter((count) =>
    isSignificantAnomalyDeviation(count, {
      mean,
      deviationThreshold,
      effectiveThreshold,
      minAnomalyFloor
    })
  ).length;

  return {
    mean,
    stdDev,
    deviationThreshold,
    effectiveThreshold,
    stdDevMultiplier,
    minAnomalyFloor,
    sensitivity,
    totalAnomalies,
    spikeRunCount
  };
}
