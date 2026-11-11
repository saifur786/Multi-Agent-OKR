/**
 * Planview Anvi Multi-Agent System & Knowledge Base Pipeline Types
 */

export type IndustryKey = 'Banking' | 'IT Consulting' | 'Retail' | 'Power Suppliers';

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
  | 'INTERVENTION_APPLIED';

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
  // Specific module artifacts
  moduleDetail: {
    badge: string;
    description: string;
  };
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

export interface IndustryDataBundle {
  id: IndustryKey;
  name: string;
  sector: string;
  quarter: string;
  overallHealth: 'On Track' | 'At Risk' | 'Behind';
  attainment: number;
  totalBudget: string;
  activeAgents: number;
  stages: LifecycleStage[];
  traceability: Record<number, TraceabilityNode[]>;
  knowledgeBase: KnowledgeBasePillar[];
  // Module-specific data
  smartRubric: SmartCriteria;
  regressionModel: RegressionModelResult;
  graphDiagnostics: GraphTraversalReport;
  cronJobs: ScheduledCronJob[];
  recentWebhooks: WebhookSimulation[];
  executivePayload: ExecutiveReportPayload;
  retrospective: RetrospectiveRootCause;
}
