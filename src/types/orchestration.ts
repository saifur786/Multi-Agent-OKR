/**
 * Planview Anvi Multi-Agent System & Knowledge Base Pipeline Types
 */

export type IndustryKey = string;

export type AgentRole =
  | 'supervisor'
  | 'strategy-explorer'
  | 'okr-predictor'
  | 'alignment-capacity'
  | 'risk-sentinel'
  | 'executive-reporter'
  | 'retrospective-learning';

export type EventTopic =
  | 'ORCHESTRATION_STARTED'
  | 'STRATEGY_RAG_QUERIED'
  | 'STRATEGIC_THEMES_PROPOSED'
  | 'OKR_SMART_EVALUATED'
  | 'KR_REGRESSION_PREDICTED'
  | 'ADVISORY_COMMITTEE_EVALUATED'
  | 'GRAPH_TRAVERSAL_EXECUTED'
  | 'ORPHAN_EPIC_DETECTED'
  | 'SQUAD_OVERALLOCATION_FLAGGED'
  | 'CRON_SCHEDULE_TRIGGERED'
  | 'WEBHOOK_PAYLOAD_RECEIVED'
  | 'RISK_SENTINEL_ALERT'
  | 'EXECUTIVE_PAYLOAD_COMPILED'
  | 'DASHBOARD_SYNC_ACKED'
  | 'PROJECT_RUNNER_INGESTED'
  | 'ROOT_CAUSE_SYNTHESIZED'
  | 'KNOWLEDGE_BASE_UPDATED'
  | 'INTERVENTION_APPLIED'
  | 'CUSTOM_INDUSTRY_SYNTHESIZED'
  | 'EXECUTIVE_REPORT_EXPORTED'
  | 'GOVERNANCE_DOC_EXPORTED'
  | 'MANUAL_PRIORITY_OVERRIDDEN'
  | 'OKR_CREATED_OR_EDITED'
  | 'PROGRAM_TERMINATED'
  | 'PROGRAM_INITIATED'
  | 'SIGNIFICANT_EVENT_TRIGGERED'
  | 'SIGNIFICANT_EVENT_RESOLVED'
  | 'GOVERNANCE_POLICY_VALIDATED';

export interface BusEvent {
  id: string;
  timestamp: string;
  topic: EventTopic;
  sourceAgent: string;
  targetAgent: string;
  summary: string;
  payload: Record<string, any>;
  latencyMs: number;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface AgentActionPillars {
  analyse: string;
  predict: string;
  recommend: string;
  automate: string;
  optimise: string;
}

export interface SimulationMetrics {
  velocityTrend: string;
  budgetBurn: string;
  resourceConstraint: string;
  riskAlert: string;
  recommendedAction: string;
}

export interface LifecycleStage {
  id: number;
  title: string;
  subtitle: string;
  agentRole: AgentRole;
  agentName: string;
  planviewCapability: string;
  goal: string;
  confidence: number;
  status: 'On Track' | 'At Risk' | 'Behind';
  aiActions: AgentActionPillars;
  simMetrics: SimulationMetrics;
  moduleDetail: {
    badge: string;
    description: string;
  };
}

export interface BusinessMetricIndicator {
  indicator: string;
  baselineValue: string;
  targetValue: string;
  metricType: 'Leading' | 'Lagging';
}

export interface StructuredBusinessProblem {
  problemDescription: string;
  impactedStakeholders: string[];
  causalChainToDollarImpact: string;
  rootCause: string;
  targetRemediationTiming: string;
  metrics: BusinessMetricIndicator[];
}

export type PriorityLevel = 'P0 - Critical' | 'P1 - High' | 'P2 - Medium' | 'P3 - Deferred' | 'AI_RECOMMENDED';

export interface HumanPriority {
  priority: PriorityLevel;
  overrideReason: string;
  overriddenBy: string;
  overrideTimestamp: string;
}

export interface TraceabilityNode {
  id: string;
  title: string;
  owner: string;
  status: 'On Track' | 'At Risk' | 'Behind';
  progress: number;
  budget: string;
  parentIds: string[];
  childIds: string[];
  ai: AgentActionPillars;
  squadLoad?: {
    squadName: string;
    fte: number;
    loadPct: number;
  };
  isOrphan?: boolean;
  manualPriority?: HumanPriority;
  businessProblem?: StructuredBusinessProblem;
  measurabilityScore?: number;
  ambitionScore?: number;
  programLifecycleStatus?: 'Active' | 'Terminated' | 'Initiated' | 'Proposed';
  targetDate?: string;
  kpiFormula?: string;
}

export interface KnowledgeBasePillar {
  id: string;
  title: string;
  metric: string;
  trend: string;
  summary: string;
  details: string[];
  vectorChunks: {
    id: string;
    text: string;
    source: string;
    embeddingVector?: number[];
  }[];
}

export interface SmartCriteria {
  specific: { score: number; feedback: string };
  measurable: { score: number; feedback: string };
  achievable: { score: number; feedback: string };
  relevant: { score: number; feedback: string };
  timeBound: { score: number; feedback: string };
  compositeScore: number;
}

export interface RegressionModelResult {
  historicalDataPoints: { quarter: string; actual: number; predicted: number }[];
  regressionEquation: string;
  rSquared: number;
  predictedProbability: number;
  confidenceInterval: [number, number];
  stretchFactor: number;
}

export interface GraphTraversalReport {
  orphanEpics: { id: string; title: string; budget: string; recommendedParentId: string }[];
  overAllocatedSquads: { squadId: string; name: string; currentLoad: number; maxCapacity: number; bottleneckReason: string }[];
  cycleDetected: boolean;
  totalNodesTraversed: number;
  unalignedSpend: string;
}

export interface ScheduledCronJob {
  id: string;
  name: string;
  cronExpression: string;
  lastRun: string;
  nextRun: string;
  status: 'active' | 'idle' | 'executing';
  monitoredMetric: string;
  threshold: string;
  anomalyDetected: boolean;
}

export interface WebhookSimulation {
  source: 'Jira Software' | 'ServiceNow GRC' | 'Datadog APM' | 'Workday HCM' | 'Planview AgilePlace';
  event: string;
  payload: Record<string, any>;
  triggerTime: string;
}

export interface ExecutiveReportPayload {
  reportId: string;
  generatedAt: string;
  industry: string;
  quarter: string;
  executiveSummary: {
    attainmentScore: number;
    healthStatus: string;
    totalCapitalAtRisk: string;
    portfolioContributionROI: string;
    criticalInterventionsRequired: number;
  };
  keyResultHealth: {
    krId: string;
    title: string;
    probabilityPct: number;
    status: string;
    varianceVsTarget: string;
  }[];
  resourceAllocationImpact: {
    squadName: string;
    headcountFte: number;
    allocationPct: number;
    riskLevel: 'Low' | 'Medium' | 'Critical';
  }[];
  strategicThemeAlignment: {
    theme: string;
    allocatedBudget: string;
    connectedEpicsCount: number;
    healthPct: number;
  }[];
}

export interface RetrospectiveRootCause {
  incidentId: string;
  krOrEpicName: string;
  symptom: string;
  fiveWhys: string[];
  fishbone: {
    people: string[];
    process: string[];
    technology: string[];
    governance: string[];
  };
  actionableLesson: string;
  ingestedIntoKnowledgeBase: boolean;
}

/**
 * Advisory Agent Multi-Dimensional Outcome Interface
 */
export interface AdvisoryAgentOutcome {
  id: string;
  name: string;
  role: string;
  specialty: string;
  qualityScore: number; // 0-100%
  noveltyScore: number; // 0-100%
  smartScore: number;   // 0-100%
  regressionAttainment: number; // predicted %
  rSquared: number;
  confidenceInterval: [number, number];
  verdict: 'Exceeds Bar' | 'Approved with Conditions' | 'Needs Restructuring';
  rationale: string;
  recommendedEnhancement: string;
  weights: {
    quality: number;
    novelty: number;
    smart: number;
    attainment: number;
  };
}

export interface TrajectoryPoint {
  week: number;
  label: string;
  actual?: number;
  predictedLinear: number;
  predictedPolynomial: number;
  ciLower: number;
  ciUpper: number;
}

export interface AdvisoryCommitteeSummary {
  totalAgents: number;
  consensusScore: number;
  averageQuality: number;
  averageNovelty: number;
  averageSmart: number;
  consensusAttainmentProbability: number;
  overallRSquared: number;
  confidenceInterval: [number, number];
  divergenceIndex: number;
  polynomialModel: {
    equation: string;
    linearEquation: string;
    coefficients: { a: number; b: number; c: number };
    rSquaredLinear: number;
    rSquaredPolynomial: number;
    curveType: 'Accelerating' | 'Decelerating' | 'Linear-Dominant';
    inflectionWeek: number | null;
    trajectory: TrajectoryPoint[];
  };
  agentOutcomes: AdvisoryAgentOutcome[];
}

export interface HistoricalAccuracyCohort {
  period: string;
  cycleIndex: number;
  rSquaredPolynomial: number;
  rSquaredLinear: number;
  predictedAttainment: number;
  actualAttainment: number;
  ciLower: number;
  ciUpper: number;
  ciSpread: number;
  brierScore: number;
  meanAbsoluteError: number;
  consensusDivergence: number;
  sampleSizeKRs: number;
  agentCount: number;
}

export interface AgentHistoricalAccuracyProfile {
  agentName: string;
  role: string;
  historicalRSquared: number;
  averageMAE: number;
  ciCalibrationRate: number;
  color: string;
  historicalTrend: { period: string; rSquared: number; mae: number; spread: number }[];
}

export interface OrgDirectoryMember {
  id: string;
  name: string;
  role: string;
  department: string;
  title: string;
  email: string;
  fteCapacity: number;
}

export interface OkrEnterprisePolicy {
  id: string;
  ruleName: string;
  category: 'Cadence' | 'SMART Threshold' | 'Ownership' | 'Ambition' | 'Checkpoints';
  description: string;
  minMeasurableScore: number;
  minAmbitionScore: number;
  maxKrsPerObjective: number;
  mandatoryMetadataFields: string[];
  governanceFrequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly';
  status: 'Enforced' | 'Warning' | 'Exempt';
}

export interface ManagedProgram {
  id: string;
  title: string;
  status: 'Active' | 'Terminated' | 'Initiated' | 'Proposed';
  linkedOkrId?: string;
  strategicStatement: {
    issues: string;
    intent: string;
    growthVision: string;
  };
  businessProblem: StructuredBusinessProblem;
  roadmap: {
    milestone: string;
    targetQuarter: string;
    deliverables: string[];
    status: 'Completed' | 'In Progress' | 'Upcoming';
  }[];
  resourceAssignments: {
    squadId: string;
    squadName: string;
    assignedFte: number;
    budgetAllocation: string;
  }[];
  terminationReason?: string;
  terminationDate?: string;
  reallocatedHeadcount?: number;
  reallocatedBudget?: string;
}

export interface SignificantDisasterEvent {
  id: string;
  title: string;
  type: 'cyberattack' | 'datacenter_outage' | 'network_saturation' | 'natural_disaster' | 'regulatory_shock';
  industry: string | 'Global';
  severity: 'Critical' | 'Severe' | 'Moderate';
  active: boolean;
  description: string;
  impacts: {
    attainmentDropPct: number;
    impactedLayerIds: number[];
    affectedSquads: string[];
    costImpact: string;
    mitigationAction: string;
  };
}

export interface FutureTrajectoryPoint {
  period: string;
  quarterIndex: number;
  targetTrajectory: number;
  aiPredictedTrajectory: number;
  ciLower: number;
  ciUpper: number;
  humanPrioritisedTrajectory: number;
  disasterShockTrajectory?: number;
  milestoneEvent?: string;
}

export interface IndustryDataBundle {
  id: string;
  name: string;
  sector: string;
  quarter: string;
  overallHealth: 'On Track' | 'At Risk' | 'Behind';
  attainment: number;
  totalBudget: string;
  activeAgents: number;
  isCustom?: boolean;
  stages: LifecycleStage[];
  traceability: Record<number, TraceabilityNode[]>;
  knowledgeBase: KnowledgeBasePillar[];
  smartRubric: SmartCriteria;
  regressionModel: RegressionModelResult;
  graphDiagnostics: GraphTraversalReport;
  cronJobs: ScheduledCronJob[];
  recentWebhooks: WebhookSimulation[];
  executivePayload: ExecutiveReportPayload;
  retrospective: RetrospectiveRootCause;
  orgDirectory?: OrgDirectoryMember[];
  policies?: OkrEnterprisePolicy[];
  programs?: ManagedProgram[];
  activeDisasters?: SignificantDisasterEvent[];
}
