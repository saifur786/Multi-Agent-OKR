import { IndustryDataBundle, StructuredBusinessProblem } from '../types/orchestration';

export const normalizeStructuredBusinessProblem = (
  problem?: Partial<StructuredBusinessProblem> | null
): StructuredBusinessProblem => {
  const rootCauses = Array.isArray(problem?.rootCauses)
    ? (problem.rootCauses as string[]).map((value) => String(value).trim()).filter(Boolean)
    : [];

  const rootCause = typeof problem?.rootCause === 'string' ? problem.rootCause.trim() : '';
  const normalizedRootCauses = rootCauses.length > 0 ? rootCauses : rootCause ? [rootCause] : [];

  const remediationTimings = Array.isArray(problem?.remediationTimings)
    ? (problem.remediationTimings as string[]).map((value) => String(value).trim()).filter(Boolean)
    : [];

  const targetTiming = typeof problem?.targetRemediationTiming === 'string' ? problem.targetRemediationTiming.trim() : '';
  const normalizedTimings = remediationTimings.length > 0 ? remediationTimings : targetTiming ? [targetTiming] : [];

  const impactedStakeholders = Array.isArray(problem?.impactedStakeholders)
    ? (problem.impactedStakeholders as string[]).map((value) => String(value).trim()).filter(Boolean)
    : [];

  const metrics = Array.isArray(problem?.metrics)
    ? problem.metrics
        .map((metric) => ({
          indicator: String(metric?.indicator ?? '').trim(),
          baselineValue: String(metric?.baselineValue ?? '').trim(),
          targetValue: String(metric?.targetValue ?? '').trim(),
          metricType: metric?.metricType === 'Lagging' ? 'Lagging' : 'Leading'
        }))
        .filter((metric) => metric.indicator)
    : [];

  return {
    problemDescription: String(problem?.problemDescription ?? '').trim(),
    impactedStakeholders,
    causalChainToDollarImpact: String(problem?.causalChainToDollarImpact ?? '').trim(),
    rootCause: normalizedRootCauses[0] ?? '',
    rootCauses: normalizedRootCauses,
    targetRemediationTiming: normalizedTimings[0] ?? '',
    remediationTimings: normalizedTimings,
    metrics
  };
};

export const normalizeIndustryBundle = (industry: any): IndustryDataBundle => {
  const safeIndustry = industry ?? {};
  const traceability = safeIndustry.traceability ?? {};

  const normalizedTraceability: Record<number, any[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: []
  };
  Object.entries(traceability).forEach(([layerKey, layerNodes]) => {
    const numericLayerMatch = String(layerKey).match(/\d+/);
    const layerNumber = numericLayerMatch ? Number(numericLayerMatch[0]) : Number(layerKey);
    if (!Number.isInteger(layerNumber) || layerNumber < 1 || layerNumber > 7) {
      return;
    }

    normalizedTraceability[layerNumber] = Array.isArray(layerNodes)
      ? layerNodes.map((node: any) => ({
          ...node,
          businessProblem: node?.businessProblem ? normalizeStructuredBusinessProblem(node.businessProblem) : undefined
        }))
      : [];
  });

  const normalizedPrograms = Array.isArray(safeIndustry.programs)
    ? safeIndustry.programs.map((program: any) => ({
        ...program,
        businessProblem: normalizeStructuredBusinessProblem(program?.businessProblem)
      }))
    : [];

  return {
    id: safeIndustry.id ?? 'custom-industry',
    name: safeIndustry.name ?? 'Custom Industry',
    sector: safeIndustry.sector ?? 'Enterprise',
    quarter: safeIndustry.quarter ?? 'Q1 2027',
    overallHealth: safeIndustry.overallHealth ?? 'On Track',
    attainment: safeIndustry.attainment ?? 0,
    totalBudget: safeIndustry.totalBudget ?? '$0',
    activeAgents: safeIndustry.activeAgents ?? 0,
    stages: Array.isArray(safeIndustry.stages) ? safeIndustry.stages : [],
    traceability: normalizedTraceability,
    knowledgeBase: Array.isArray(safeIndustry.knowledgeBase) ? safeIndustry.knowledgeBase : [],
    smartRubric: safeIndustry.smartRubric ?? {
      specific: { score: 0, feedback: '' },
      measurable: { score: 0, feedback: '' },
      achievable: { score: 0, feedback: '' },
      relevant: { score: 0, feedback: '' },
      timeBound: { score: 0, feedback: '' },
      compositeScore: 0
    },
    regressionModel: safeIndustry.regressionModel ?? {
      historicalDataPoints: [],
      regressionEquation: '',
      rSquared: 0,
      predictedProbability: 0,
      confidenceInterval: [0, 0],
      stretchFactor: 0
    },
    graphDiagnostics: safeIndustry.graphDiagnostics ?? {
      orphanEpics: [],
      overAllocatedSquads: [],
      cycleDetected: false,
      totalNodesTraversed: 0,
      unalignedSpend: '$0'
    },
    cronJobs: Array.isArray(safeIndustry.cronJobs) ? safeIndustry.cronJobs : [],
    recentWebhooks: Array.isArray(safeIndustry.recentWebhooks) ? safeIndustry.recentWebhooks : [],
    executivePayload: safeIndustry.executivePayload ?? {
      reportId: '',
      generatedAt: new Date().toISOString(),
      industry: safeIndustry.name ?? 'Custom Industry',
      quarter: safeIndustry.quarter ?? 'Q1 2027',
      executiveSummary: {
        attainmentScore: 0,
        healthStatus: 'On Track',
        totalCapitalAtRisk: '$0',
        portfolioContributionROI: '$0',
        criticalInterventionsRequired: 0
      },
      keyResultHealth: []
    },
    retrospective: safeIndustry.retrospective ?? {
      incidentId: '',
      krOrEpicName: '',
      symptom: '',
      fiveWhys: [],
      fishbone: {
        people: [],
        process: [],
        technology: [],
        governance: []
      },
      actionableLesson: '',
      ingestedIntoKnowledgeBase: false
    },
    orgDirectory: Array.isArray(safeIndustry.orgDirectory) ? safeIndustry.orgDirectory : [],
    policies: Array.isArray(safeIndustry.policies) ? safeIndustry.policies : [],
    programs: normalizedPrograms,
    activeDisasters: Array.isArray(safeIndustry.activeDisasters) ? safeIndustry.activeDisasters : [],
    isCustom: Boolean(safeIndustry.isCustom)
  } as IndustryDataBundle;
};
