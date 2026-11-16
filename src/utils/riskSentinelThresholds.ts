import {
  computeAnomalyTelemetryStats,
  isSignificantAnomalyDeviation,
  type AnomalySensitivityLevel,
  type AnomalyTelemetryStats,
  type AnomalyThresholdPolicy
} from './workerAgentTelemetry';

export interface SensitivityPresetDefinition {
  level: AnomalySensitivityLevel;
  label: string;
  shortLabel: string;
  description: string;
  stdDevMultiplier: number;
  minAnomalyFloor: number;
}

export const SENSITIVITY_PRESETS: Record<AnomalySensitivityLevel, SensitivityPresetDefinition> = {
  high: {
    level: 'high',
    label: 'High Sensitivity',
    shortLabel: 'High',
    description: 'Strict early-warning detection (+0.30σ above mean, min 1 anomaly).',
    stdDevMultiplier: 0.3,
    minAnomalyFloor: 1
  },
  balanced: {
    level: 'balanced',
    label: 'Balanced',
    shortLabel: 'Balanced',
    description: 'Standard operational threshold (+0.75σ above mean, min 2 anomalies).',
    stdDevMultiplier: 0.75,
    minAnomalyFloor: 2
  },
  low: {
    level: 'low',
    label: 'Low Sensitivity',
    shortLabel: 'Low',
    description: 'Noise-suppressed threshold (+1.35σ above mean, min 3 anomalies).',
    stdDevMultiplier: 1.35,
    minAnomalyFloor: 3
  }
};

export interface AgentThresholdSeed {
  agentId: string;
  agentName: string;
  stageId: number;
  stageName: string;
  isPrimaryWorker: boolean;
  defaultSensitivity: AnomalySensitivityLevel;
}

export const DEFAULT_AGENT_THRESHOLD_SEEDS: AgentThresholdSeed[] = [
  // Stage 1: Strategy Explorer (Low default sensitivity — exploratory theme synthesis)
  {
    agentId: 'strategy-explorer',
    agentName: 'Strategy Explorer',
    stageId: 1,
    stageName: 'Strategy Explorer',
    isPrimaryWorker: true,
    defaultSensitivity: 'low'
  },
  {
    agentId: 'conversational-orchestrator',
    agentName: 'Conversational Orchestrator',
    stageId: 1,
    stageName: 'Strategy Explorer',
    isPrimaryWorker: false,
    defaultSensitivity: 'low'
  },
  {
    agentId: 'pillar-rag-retriever',
    agentName: '5-Pillar RAG Retriever',
    stageId: 1,
    stageName: 'Strategy Explorer',
    isPrimaryWorker: false,
    defaultSensitivity: 'balanced'
  },
  // Stage 2: OKR Quality (Balanced default sensitivity — policy & SMART compliance)
  {
    agentId: 'okr-quality-auditor',
    agentName: 'OKR Quality Auditor',
    stageId: 2,
    stageName: 'OKR Quality',
    isPrimaryWorker: true,
    defaultSensitivity: 'balanced'
  },
  {
    agentId: 'multi-lens-advisors',
    agentName: 'Multi-Lens Advisor Committee',
    stageId: 2,
    stageName: 'OKR Quality',
    isPrimaryWorker: false,
    defaultSensitivity: 'balanced'
  },
  {
    agentId: 'policy-guardrail-checker',
    agentName: 'Policy & Ownership Validator',
    stageId: 2,
    stageName: 'OKR Quality',
    isPrimaryWorker: false,
    defaultSensitivity: 'high'
  },
  // Stage 3: Alignment (Balanced default sensitivity — dependency & squad load)
  {
    agentId: 'alignment-capacity-agent',
    agentName: 'Alignment Capacity Agent',
    stageId: 3,
    stageName: 'Alignment',
    isPrimaryWorker: true,
    defaultSensitivity: 'balanced'
  },
  {
    agentId: 'seven-layer-traverser',
    agentName: '7-Layer Dependency Traverser',
    stageId: 3,
    stageName: 'Alignment',
    isPrimaryWorker: false,
    defaultSensitivity: 'low'
  },
  {
    agentId: 'squad-fte-rebalancer',
    agentName: 'Squad FTE Rebalancer',
    stageId: 3,
    stageName: 'Alignment',
    isPrimaryWorker: false,
    defaultSensitivity: 'balanced'
  },
  // Stage 4: Risk Radar (High default sensitivity — live Risk Sentinel & connectors)
  {
    agentId: 'risk-sentinel',
    agentName: 'Risk Sentinel',
    stageId: 4,
    stageName: 'Risk Radar',
    isPrimaryWorker: true,
    defaultSensitivity: 'high'
  },
  {
    agentId: 'servicenow-grc-connector',
    agentName: 'ServiceNow GRC Connector',
    stageId: 4,
    stageName: 'Risk Radar',
    isPrimaryWorker: false,
    defaultSensitivity: 'high'
  },
  {
    agentId: 'jira-velocity-listener',
    agentName: 'Jira Velocity Listener',
    stageId: 4,
    stageName: 'Risk Radar',
    isPrimaryWorker: false,
    defaultSensitivity: 'high'
  },
  // Stage 5: Executive Reporting (Low default sensitivity — telemetry compilation)
  {
    agentId: 'executive-reporter',
    agentName: 'Executive Reporter',
    stageId: 5,
    stageName: 'Executive Reporting',
    isPrimaryWorker: true,
    defaultSensitivity: 'low'
  },
  {
    agentId: 'portfolio-scorecard-aggregator',
    agentName: 'Portfolio Scorecard Aggregator',
    stageId: 5,
    stageName: 'Executive Reporting',
    isPrimaryWorker: false,
    defaultSensitivity: 'low'
  },
  {
    agentId: 'brd-rtm-exporter',
    agentName: 'BRD & RTM Exporter',
    stageId: 5,
    stageName: 'Executive Reporting',
    isPrimaryWorker: false,
    defaultSensitivity: 'low'
  },
  // Stage 6: Retrospective (Balanced default sensitivity — closed-loop learning)
  {
    agentId: 'retrospective-learner',
    agentName: 'Retrospective Learner',
    stageId: 6,
    stageName: 'Retrospective',
    isPrimaryWorker: true,
    defaultSensitivity: 'balanced'
  },
  {
    agentId: 'pillar4-kb-vectorizer',
    agentName: 'Pillar 4 KB Vectorizer',
    stageId: 6,
    stageName: 'Retrospective',
    isPrimaryWorker: false,
    defaultSensitivity: 'low'
  },
  {
    agentId: 'owner-alert-dispatcher',
    agentName: 'OKR Owner Alert Dispatcher',
    stageId: 6,
    stageName: 'Retrospective',
    isPrimaryWorker: false,
    defaultSensitivity: 'high'
  }
];

export interface AgentAnomalyThresholdConfig {
  id: string;
  industry: string;
  agentId: string;
  agentName: string;
  stageId: number;
  stageName: string;
  isPrimaryWorker: boolean;
  sensitivity: AnomalySensitivityLevel;
  stdDevMultiplier: number;
  minAnomalyFloor: number;
  weight: number;
  updatedAt: string;
}

export interface StageThresholdSummary {
  stageId: number;
  stageName: string;
  sensitivity: AnomalySensitivityLevel;
  stdDevMultiplier: number;
  minAnomalyFloor: number;
  agentCount: number;
  highCount: number;
  balancedCount: number;
  lowCount: number;
  policy: AnomalyThresholdPolicy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function deriveSensitivityFromParams(
  stdDevMultiplier: number,
  minAnomalyFloor: number
): AnomalySensitivityLevel {
  if (stdDevMultiplier <= 0.52 && minAnomalyFloor <= 2) return 'high';
  if (stdDevMultiplier >= 1.08 || minAnomalyFloor >= 3) return 'low';
  return 'balanced';
}

export function buildDefaultAgentThresholdConfigs(
  industry: string = 'Telco'
): AgentAnomalyThresholdConfig[] {
  const safeIndustry = String(industry || 'Telco').trim() || 'Telco';
  const now = new Date().toISOString();

  return DEFAULT_AGENT_THRESHOLD_SEEDS.map((seed) => {
    const preset = SENSITIVITY_PRESETS[seed.defaultSensitivity];
    return {
      id: `${safeIndustry.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${seed.agentId}`,
      industry: safeIndustry,
      agentId: seed.agentId,
      agentName: seed.agentName,
      stageId: seed.stageId,
      stageName: seed.stageName,
      isPrimaryWorker: seed.isPrimaryWorker,
      sensitivity: preset.level,
      stdDevMultiplier: preset.stdDevMultiplier,
      minAnomalyFloor: preset.minAnomalyFloor,
      weight: seed.isPrimaryWorker ? 1.5 : 1.0,
      updatedAt: now
    };
  });
}

export function normalizeAgentThresholdConfigs(
  raw: unknown,
  industry: string = 'Telco'
): AgentAnomalyThresholdConfig[] {
  const defaults = buildDefaultAgentThresholdConfigs(industry);
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaults;
  }

  const byAgentId = new Map<string, any>();
  for (const item of raw) {
    if (item && typeof item.agentId === 'string') {
      byAgentId.set(item.agentId, item);
    }
  }

  return defaults.map((def) => {
    const incoming = byAgentId.get(def.agentId);
    if (!incoming) return def;

    const incomingSensitivity: AnomalySensitivityLevel =
      incoming.sensitivity === 'high' || incoming.sensitivity === 'balanced' || incoming.sensitivity === 'low'
        ? incoming.sensitivity
        : def.sensitivity;

    const preset = SENSITIVITY_PRESETS[incomingSensitivity];
    const stdDevMultiplier =
      typeof incoming.stdDevMultiplier === 'number' && Number.isFinite(incoming.stdDevMultiplier)
        ? Number(clamp(incoming.stdDevMultiplier, 0.1, 2.5).toFixed(2))
        : preset.stdDevMultiplier;
    const minAnomalyFloor =
      typeof incoming.minAnomalyFloor === 'number' && Number.isFinite(incoming.minAnomalyFloor)
        ? Math.round(clamp(incoming.minAnomalyFloor, 1, 10))
        : preset.minAnomalyFloor;

    return {
      ...def,
      id: String(incoming.id || def.id),
      industry: String(incoming.industry || def.industry),
      sensitivity: incomingSensitivity,
      stdDevMultiplier,
      minAnomalyFloor,
      weight:
        typeof incoming.weight === 'number' && Number.isFinite(incoming.weight)
          ? clamp(incoming.weight, 0.5, 3)
          : def.weight,
      updatedAt: String(incoming.updatedAt || def.updatedAt)
    };
  });
}

export function updateAgentThresholdConfig(
  configs: AgentAnomalyThresholdConfig[],
  agentId: string,
  patch: {
    sensitivity?: AnomalySensitivityLevel;
    stdDevMultiplier?: number;
    minAnomalyFloor?: number;
  }
): AgentAnomalyThresholdConfig[] {
  const now = new Date().toISOString();
  return configs.map((cfg) => {
    if (cfg.agentId !== agentId) return cfg;

    if (
      patch.sensitivity &&
      patch.stdDevMultiplier === undefined &&
      patch.minAnomalyFloor === undefined
    ) {
      const preset = SENSITIVITY_PRESETS[patch.sensitivity];
      return {
        ...cfg,
        sensitivity: preset.level,
        stdDevMultiplier: preset.stdDevMultiplier,
        minAnomalyFloor: preset.minAnomalyFloor,
        updatedAt: now
      };
    }

    const nextMult =
      patch.stdDevMultiplier !== undefined
        ? Number(clamp(patch.stdDevMultiplier, 0.1, 2.5).toFixed(2))
        : cfg.stdDevMultiplier;
    const nextFloor =
      patch.minAnomalyFloor !== undefined
        ? Math.round(clamp(patch.minAnomalyFloor, 1, 10))
        : cfg.minAnomalyFloor;
    const nextSensitivity = patch.sensitivity || deriveSensitivityFromParams(nextMult, nextFloor);

    return {
      ...cfg,
      sensitivity: nextSensitivity,
      stdDevMultiplier: nextMult,
      minAnomalyFloor: nextFloor,
      updatedAt: now
    };
  });
}

export function applyStageSensitivityPreset(
  configs: AgentAnomalyThresholdConfig[],
  stageId: number,
  sensitivity: AnomalySensitivityLevel
): AgentAnomalyThresholdConfig[] {
  const preset = SENSITIVITY_PRESETS[sensitivity];
  const now = new Date().toISOString();
  return configs.map((cfg) =>
    cfg.stageId === stageId
      ? {
          ...cfg,
          sensitivity: preset.level,
          stdDevMultiplier: preset.stdDevMultiplier,
          minAnomalyFloor: preset.minAnomalyFloor,
          updatedAt: now
        }
      : cfg
  );
}

export function computeStageThresholdSummary(
  stageId: number,
  configs: AgentAnomalyThresholdConfig[]
): StageThresholdSummary {
  const safeConfigs = configs && configs.length > 0 ? configs : buildDefaultAgentThresholdConfigs();
  const stageAgents = safeConfigs.filter((c) => c.stageId === stageId);
  const stageName =
    stageAgents[0]?.stageName ||
    DEFAULT_AGENT_THRESHOLD_SEEDS.find((s) => s.stageId === stageId)?.stageName ||
    `Stage ${stageId}`;

  if (stageAgents.length === 0) {
    const fallback = SENSITIVITY_PRESETS.balanced;
    return {
      stageId,
      stageName,
      sensitivity: 'balanced',
      stdDevMultiplier: fallback.stdDevMultiplier,
      minAnomalyFloor: fallback.minAnomalyFloor,
      agentCount: 0,
      highCount: 0,
      balancedCount: 0,
      lowCount: 0,
      policy: {
        sensitivity: 'balanced',
        stdDevMultiplier: fallback.stdDevMultiplier,
        minAnomalyFloor: fallback.minAnomalyFloor
      }
    };
  }

  const totalWeight = stageAgents.reduce((sum, a) => sum + Math.max(0.5, a.weight || 1), 0);
  const weightedMultiplier = Number(
    (
      stageAgents.reduce((sum, a) => sum + a.stdDevMultiplier * Math.max(0.5, a.weight || 1), 0) /
      Math.max(1, totalWeight)
    ).toFixed(2)
  );
  const weightedFloor = Math.max(
    1,
    Math.round(
      stageAgents.reduce((sum, a) => sum + a.minAnomalyFloor * Math.max(0.5, a.weight || 1), 0) /
        Math.max(1, totalWeight)
    )
  );

  const sensitivity = deriveSensitivityFromParams(weightedMultiplier, weightedFloor);

  return {
    stageId,
    stageName,
    sensitivity,
    stdDevMultiplier: weightedMultiplier,
    minAnomalyFloor: weightedFloor,
    agentCount: stageAgents.length,
    highCount: stageAgents.filter((a) => a.sensitivity === 'high').length,
    balancedCount: stageAgents.filter((a) => a.sensitivity === 'balanced').length,
    lowCount: stageAgents.filter((a) => a.sensitivity === 'low').length,
    policy: {
      sensitivity,
      stdDevMultiplier: weightedMultiplier,
      minAnomalyFloor: weightedFloor
    }
  };
}

export function computeAllStageThresholdSummaries(
  configs: AgentAnomalyThresholdConfig[]
): StageThresholdSummary[] {
  return [1, 2, 3, 4, 5, 6].map((stageId) => computeStageThresholdSummary(stageId, configs));
}

export function resolveAgentThresholdConfig(
  agentId: string,
  configs: AgentAnomalyThresholdConfig[]
): AgentAnomalyThresholdConfig {
  const safe = configs && configs.length > 0 ? configs : buildDefaultAgentThresholdConfigs();
  const match = safe.find((c) => c.agentId === agentId);
  if (match) return match;
  const fallback = buildDefaultAgentThresholdConfigs().find((c) => c.agentId === agentId);
  return fallback || safe[0];
}

export interface EvaluatedOverviewAnomalyPoint<T> {
  raw: T;
  anomalyCount: number;
  stageId: number;
  stageName: string;
  stageSensitivity: AnomalySensitivityLevel;
  stageThreshold: number;
  isAnomalySpike: boolean;
}

export function evaluateOverviewAnomalySeries<
  T extends {
    activeStage?: number;
    stage?: string;
    anomalyCount?: number;
  }
>(
  runs: T[],
  configs: AgentAnomalyThresholdConfig[]
): {
  stats: AnomalyTelemetryStats;
  stageSummaries: StageThresholdSummary[];
  points: EvaluatedOverviewAnomalyPoint<T>[];
} {
  const safeRuns = Array.isArray(runs) ? runs : [];
  const stageSummaries = computeAllStageThresholdSummaries(configs);
  // Anchor portfolio overview baseline stats on Stage 4 (Risk Radar / Risk Sentinel) sensitivity
  const riskRadarSummary = stageSummaries.find((s) => s.stageId === 4) || stageSummaries[0];
  const baseStats = computeAnomalyTelemetryStats(safeRuns, riskRadarSummary?.policy);

  const points: EvaluatedOverviewAnomalyPoint<T>[] = safeRuns.map((run) => {
    const count = Math.max(0, Number(run?.anomalyCount || 0));
    const stageId = Math.max(1, Math.min(6, Number(run?.activeStage || 4)));
    const summary = stageSummaries.find((s) => s.stageId === stageId) || riskRadarSummary;

    const stageDeviation =
      baseStats.stdDev > 0
        ? Number((baseStats.mean + summary.stdDevMultiplier * baseStats.stdDev).toFixed(2))
        : Number((baseStats.mean + Math.max(0.25, summary.stdDevMultiplier * 0.65)).toFixed(2));
    const stageThreshold = Number(Math.max(stageDeviation, summary.minAnomalyFloor).toFixed(2));

    const isAnomalySpike = isSignificantAnomalyDeviation(count, {
      mean: baseStats.mean,
      deviationThreshold: stageDeviation,
      effectiveThreshold: stageThreshold,
      minAnomalyFloor: summary.minAnomalyFloor
    });

    return {
      raw: run,
      anomalyCount: count,
      stageId: summary.stageId,
      stageName: summary.stageName,
      stageSensitivity: summary.sensitivity,
      stageThreshold,
      isAnomalySpike
    };
  });

  const spikeRunCount = points.filter((p) => p.isAnomalySpike).length;

  return {
    stats: {
      ...baseStats,
      spikeRunCount
    },
    stageSummaries,
    points
  };
}
