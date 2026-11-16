import {
  AdvisoryAgentOutcome,
  AdvisoryCommitteeSummary,
  EventTopic,
  SignificantDisasterEvent,
  TraceabilityNode
} from '../types/orchestration';

export type AgenticCapabilityKey =
  | 'conversational'
  | 'supervisor'
  | 'ideation'
  | 'advisor'
  | 'alignment'
  | 'risk'
  | 'reporting'
  | 'retrospective';

export interface ProactiveAgentRoute {
  agentKey: AgenticCapabilityKey;
  agentName: string;
  reason: string;
  suggestedView: 'studio' | 'lifecycle' | 'advisory' | 'traceability' | 'knowledge' | 'strategy';
  suggestedTab?: 'okrs' | 'network' | 'health' | 'programs' | 'disasters' | 'supervisor';
  actionLabel: string;
}

export interface AdvisorBusinessLens {
  id: string;
  name: string;
  focus: string;
  weight: number;
  enabled: boolean;
}

export interface OrchestrationRunRecord {
  id: string;
  run: string;
  industry: string;
  mode: string;
  stage: string;
  activeStage: number;
  successRate: number;
  latencyMs: number;
  anomalyCount?: number;
  source: string;
  supervisorSummary?: string;
  createdAt: string;
}

export interface RiskConnectorConfig {
  id: string;
  provider: 'ServiceNow' | 'Jira';
  name: string;
  endpointUrl: string;
  authMode: 'simulator' | 'bearer' | 'api-key';
  industry: string;
  enabled: boolean;
  lastTestedAt?: string;
  lastStatus?: 'connected' | 'simulated' | 'error';
  lastMessage?: string;
}

export interface PersistedNotificationRecord {
  id: string;
  category: 'critical_okr' | 'disaster_event' | 'escalation' | 'retrospective_owner_alert';
  severity: 'critical' | 'high' | 'warning';
  industryKey: string;
  organisationName: string;
  sector: string;
  title: string;
  summary: string;
  detail: string;
  targetRole?: string;
  targetOwner?: string;
  senderRole?: string;
  senderEmail?: string;
  targetTab?: 'okrs' | 'disasters' | 'health' | 'supervisor';
  targetOkrId?: string;
  statusLabel: string;
  detectedAt: string;
}

export interface SelectableAccountProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  industry: string;
  permissions: string[];
  label: string;
  accountabilities?: string;
  isCustomRegistered?: boolean;
}

export interface ResolvedUserCapabilities {
  isSuperAdmin: boolean;
  canCreateOkr: boolean;
  canExecuteLifecycle: boolean;
  canMonitor: boolean;
  canEscalateNotification: boolean;
  canManagePolicy: boolean;
  canManageDashboards: boolean;
  canManageAdmin: boolean;
  assignedIndustry: string;
  industryAccessAllowed: boolean;
  roleSummary: string;
}

export const DEFAULT_ADVISOR_LENSES: AdvisorBusinessLens[] = [
  {
    id: 'lens-financial-roi',
    name: 'Financial ROI & Capital',
    focus: 'Dollar impact, margin expansion, payback period, and capex efficiency',
    weight: 1.2,
    enabled: true
  },
  {
    id: 'lens-customer-nps',
    name: 'Customer Value & NPS',
    focus: 'Customer retention, turnaround speed, digital adoption, and churn prevention',
    weight: 1.1,
    enabled: true
  },
  {
    id: 'lens-technical-feasibility',
    name: 'Technical Architecture & Feasibility',
    focus: 'Platform scalability, dependency risk, API readiness, and SRE reliability',
    weight: 1.0,
    enabled: true
  },
  {
    id: 'lens-regulatory-risk',
    name: 'Regulatory Compliance & Risk',
    focus: 'Auditability, cyber resilience, SLA exposure, and enterprise policy guardrails',
    weight: 1.1,
    enabled: true
  },
  {
    id: 'lens-operational-capacity',
    name: 'Operational Capacity & Squads',
    focus: 'FTE bandwidth, sprint velocity realism, and cross-team handoff bottlenecks',
    weight: 1.0,
    enabled: true
  },
  {
    id: 'lens-strategic-novelty',
    name: 'Market Differentiation & Novelty',
    focus: 'Non-incremental ambition, competitive moat, and industry disruption potential',
    weight: 0.9,
    enabled: true
  }
];

export function isSuperAdminIdentity(user?: { email?: string; role?: string } | null): boolean {
  if (!user) return false;
  if (user.role === 'super-admin') return true;
  const normalizedEmail = String(user.email || '').trim().toLowerCase();
  return (
    normalizedEmail === 'saifur.rahman.au@gmail' ||
    normalizedEmail === 'saifur.rahman.au@gmail.com' ||
    normalizedEmail === 'saifurrahman.au@gmail.com'
  );
}

export function resolveUserCapabilities(
  user: { email?: string; role?: string; industry?: string; permissions?: string[] } | null | undefined,
  activeIndustry?: string
): ResolvedUserCapabilities {
  const role = String(user?.role || 'okr-creator').toLowerCase();
  const perms = new Set((user?.permissions || []).map((p) => String(p).toLowerCase()));
  const assignedIndustry = String(user?.industry || 'All').trim() || 'All';
  const superAdmin = isSuperAdminIdentity(user);

  const industryAccessAllowed =
    superAdmin ||
    assignedIndustry.toLowerCase() === 'all' ||
    !activeIndustry ||
    assignedIndustry.toLowerCase() === activeIndustry.trim().toLowerCase();

  const canCreateOkr =
    superAdmin ||
    role === 'okr-creator' ||
    perms.has('all') ||
    perms.has('create-okr');

  const canExecuteLifecycle =
    superAdmin ||
    role === 'okr-creator' ||
    perms.has('all') ||
    perms.has('execute-lifecycle');

  const canMonitor =
    superAdmin ||
    role === 'monitor' ||
    role === 'policy-manager' ||
    role === 'okr-creator' ||
    perms.has('all') ||
    perms.has('monitor') ||
    perms.has('trace');

  const canEscalateNotification =
    superAdmin ||
    role === 'monitor' ||
    perms.has('all') ||
    perms.has('notify') ||
    perms.has('escalate');

  const canManagePolicy =
    superAdmin ||
    role === 'policy-manager' ||
    perms.has('all') ||
    perms.has('manage-policy');

  const canManageDashboards =
    superAdmin ||
    role === 'policy-manager' ||
    perms.has('all') ||
    perms.has('view-dashboards') ||
    perms.has('manage-dashboards');

  const roleSummary = superAdmin
    ? 'Full platform control: industries, user accounts, policies, OKRs & all AI agents'
    : role === 'okr-creator'
      ? `Create OKRs & execute 6-stage Multi-Agent Lifecycle (${assignedIndustry})`
      : role === 'monitor'
        ? `Monitor telemetry, trace 7-layer lineage & send role escalations (${assignedIndustry})`
        : role === 'policy-manager'
          ? `Manage enterprise policies, rules & executive reporting dashboards (${assignedIndustry})`
          : `Scoped access (${assignedIndustry})`;

  return {
    isSuperAdmin: superAdmin,
    canCreateOkr,
    canExecuteLifecycle,
    canMonitor,
    canEscalateNotification,
    canManagePolicy,
    canManageDashboards,
    canManageAdmin: superAdmin,
    assignedIndustry,
    industryAccessAllowed,
    roleSummary
  };
}

export function mergeSelectableAccounts(
  baseAccounts: SelectableAccountProfile[],
  registeredUsers: Array<{
    id?: string;
    name: string;
    email: string;
    role: string;
    industry: string;
    permissions?: string[];
    status?: string;
  }>
): SelectableAccountProfile[] {
  const seenEmails = new Set(baseAccounts.map((u) => u.email.trim().toLowerCase()));
  const extras: SelectableAccountProfile[] = [];

  for (const user of registeredUsers) {
    const emailKey = String(user.email || '').trim().toLowerCase();
    if (!emailKey || seenEmails.has(emailKey)) continue;
    seenEmails.add(emailKey);
    const roleLabel =
      user.role === 'super-admin'
        ? 'Super Admin'
        : user.role === 'monitor'
          ? 'Operations Monitor'
          : user.role === 'policy-manager'
            ? 'Policy & Reporting Manager'
            : 'OKR Creator';
    const defaultPerms =
      user.role === 'super-admin'
        ? ['all']
        : user.role === 'monitor'
          ? ['monitor', 'trace', 'notify']
          : user.role === 'policy-manager'
            ? ['manage-policy', 'view-dashboards', 'manage-dashboards']
            : ['create-okr', 'execute-lifecycle'];
    extras.push({
      id: user.id || `user-${emailKey}`,
      email: user.email,
      name: user.name,
      role: user.role,
      industry: user.industry || 'Telco',
      permissions: Array.isArray(user.permissions) && user.permissions.length > 0 ? user.permissions : defaultPerms,
      label: `${roleLabel} (${user.industry || 'Enterprise'})`,
      isCustomRegistered: true
    });
  }

  return [...baseAccounts, ...extras];
}

export function determineProactiveAgentRoutes(
  prompt: string,
  intent: string,
  missingCount: number = 0,
  activeDisasterCount: number = 0
): ProactiveAgentRoute[] {
  const lower = prompt.toLowerCase();
  const routes: ProactiveAgentRoute[] = [];

  const pushUnique = (route: ProactiveAgentRoute) => {
    if (!routes.some((r) => r.agentKey === route.agentKey)) {
      routes.push(route);
    }
  };

  if (/\b(theme|strategy|ideat|vision|portfolio|market|roadmap)\b/i.test(lower)) {
    pushUnique({
      agentKey: 'ideation',
      agentName: 'Strategy & Ideation Agent',
      reason: 'Prompt involves strategic themes or portfolio direction.',
      suggestedView: 'strategy',
      actionLabel: 'Open Strategy Planner'
    });
  }

  if (/\b(smart|evaluat|score|quality|novel|advisor|committee|forecast|probab)\b/i.test(lower) || intent === 'create_okr') {
    pushUnique({
      agentKey: 'advisor',
      agentName: 'Multi-Lens Advisor Committee',
      reason: 'Validate SMART rigor & attainment probability across custom business lenses.',
      suggestedView: 'advisory',
      actionLabel: 'Evaluate with Advisors'
    });
  }

  if (/\b(orphan|align|epic|depend|squad|capacity|fte|load|bottleneck|trace)\b/i.test(lower)) {
    pushUnique({
      agentKey: 'alignment',
      agentName: 'Alignment & Capacity Agent',
      reason: 'Prompt references epics, alignment gaps, or squad capacity constraints.',
      suggestedView: 'traceability',
      actionLabel: 'Inspect 7-Layer Alignment'
    });
  }

  if (
    /\b(risk|disaster|outage|cyber|servicenow|jira|incident|blocker|velocity|anomal|sla)\b/i.test(lower) ||
    activeDisasterCount > 0 ||
    intent === 'run_orchestration'
  ) {
    pushUnique({
      agentKey: 'risk',
      agentName: 'Risk Detection Agent',
      reason: activeDisasterCount > 0
        ? `${activeDisasterCount} active disaster(s) require telemetry & mitigation triage.`
        : 'Prompt references operational risk, Jira/ServiceNow incidents, or pipeline checks.',
      suggestedView: 'studio',
      suggestedTab: 'disasters',
      actionLabel: 'Open Risk & Disaster Radar'
    });
  }

  if (/\b(report|executive|board|csv|export|brd|rtm|scorecard|summary|roi)\b/i.test(lower)) {
    pushUnique({
      agentKey: 'reporting',
      agentName: 'Executive Reporting Agent',
      reason: 'Prompt asks for executive reporting, scorecards, or audit exports.',
      suggestedView: 'lifecycle',
      actionLabel: 'Open Executive Reporting (Stage 5)'
    });
  }

  if (/\b(retro|lesson|postmortem|learn|root cause|knowledge|kb|vector|notify|alert owner)\b/i.test(lower)) {
    pushUnique({
      agentKey: 'retrospective',
      agentName: 'Retrospective & Learning Agent',
      reason: 'Capture root-cause lessons into MongoDB Knowledge Base & alert OKR owners.',
      suggestedView: 'knowledge',
      actionLabel: 'Update KB & Notify Owner'
    });
  }

  if (missingCount > 0 && routes.length === 0) {
    pushUnique({
      agentKey: 'supervisor',
      agentName: 'Supervisor Agent',
      reason: `${missingCount} OKR/Business Problem attributes still need clarification or policy validation.`,
      suggestedView: 'studio',
      suggestedTab: 'health',
      actionLabel: 'Review OKR Health Checker'
    });
  }

  if (routes.length === 0) {
    pushUnique({
      agentKey: 'supervisor',
      agentName: 'Supervisor Agent',
      reason: 'Coordinate full 6-stage lifecycle orchestration for this request.',
      suggestedView: 'lifecycle',
      actionLabel: 'Run 6-Stage Lifecycle'
    });
  }

  return routes.slice(0, 4);
}

export function resolveAdvisorLenses(
  requestedCount: number,
  customLenses: AdvisorBusinessLens[] = DEFAULT_ADVISOR_LENSES
): AdvisorBusinessLens[] {
  const safeCount = Math.max(3, Math.min(16, Math.round(requestedCount || 5)));
  const enabled = customLenses.filter((l) => l.enabled);
  const pool = enabled.length > 0 ? enabled : DEFAULT_ADVISOR_LENSES;
  const resolved: AdvisorBusinessLens[] = [];

  for (let i = 0; i < safeCount; i++) {
    const template = pool[i % pool.length];
    const cycleSuffix = i >= pool.length ? ` (Panel ${Math.floor(i / pool.length) + 1})` : '';
    resolved.push({
      ...template,
      id: `${template.id}-${i + 1}`,
      name: `${template.name}${cycleSuffix}`
    });
  }

  return resolved;
}

export function normalizeOrchestrationRuns(runs: Partial<OrchestrationRunRecord>[]): OrchestrationRunRecord[] {
  const stages = [
    'Strategy Explorer',
    'OKR Quality',
    'Alignment',
    'Risk Radar',
    'Executive Reporting',
    'Retrospective'
  ];

  const baselineAnomalies = [2, 1, 3, 2, 1, 1, 0, 2, 1, 0];

  const valid = (Array.isArray(runs) ? runs : [])
    .filter(Boolean)
    .slice(-10)
    .map((item, idx) => ({
      id: String(item.id || `run-${idx + 1}`),
      run: String(item.run || `Run ${idx + 1}`),
      industry: String(item.industry || 'Enterprise'),
      mode: String(item.mode || 'full-pipeline'),
      stage: String(item.stage || stages[idx % stages.length]),
      activeStage: Math.max(1, Math.min(6, Number(item.activeStage || (idx % 6) + 1))),
      successRate: Math.max(40, Math.min(100, Number(Number(item.successRate ?? 92).toFixed(1)))),
      latencyMs: Math.max(120, Math.round(Number(item.latencyMs ?? 1250))),
      anomalyCount: Math.max(
        0,
        Math.round(
          Number(
            item.anomalyCount !== undefined && item.anomalyCount !== null
              ? item.anomalyCount
              : baselineAnomalies[idx % baselineAnomalies.length]
          )
        )
      ),
      source: String(item.source || 'supervisor-engine'),
      supervisorSummary: item.supervisorSummary ? String(item.supervisorSummary) : undefined,
      createdAt: String(item.createdAt || new Date().toISOString())
    }));

  return valid;
}

export function normalizeRiskConnectorPayload(
  provider: 'ServiceNow' | 'Jira',
  rawPayload: Record<string, any>,
  industryName: string
): {
  title: string;
  severity: 'Critical' | 'Severe' | 'Moderate';
  impactedMetric: string;
  summary: string;
  recommendedEscalation: string;
  topic: EventTopic;
} {
  if (provider === 'ServiceNow') {
    const incidentNumber = String(rawPayload.incidentNumber || rawPayload.number || `INC${Date.now().toString().slice(-6)}`);
    const priority = String(rawPayload.priority || rawPayload.urgency || 'P1 - Critical');
    const shortDesc = String(rawPayload.short_description || rawPayload.shortDescription || rawPayload.event || 'Core production incident');
    const isCritical = /1|crit|p0|high/i.test(priority);
    return {
      title: `ServiceNow ${incidentNumber}: ${shortDesc}`,
      severity: isCritical ? 'Critical' : 'Severe',
      impactedMetric: String(rawPayload.affectedCi || rawPayload.cmdb_ci || `${industryName} SLA Availability`),
      summary: `${incidentNumber} (${priority}) ingested from ServiceNow GRC/ITSM: ${shortDesc}`,
      recommendedEscalation: isCritical ? 'Escalate immediately to Incident Commander & OKR Owner' : 'Route to Platform SRE squad',
      topic: 'RISK_SENTINEL_ALERT'
    };
  }

  const issueKey = String(rawPayload.issueKey || rawPayload.blockerIssue || `JIRA-${Date.now().toString().slice(-4)}`);
  const velocityDelta = String(rawPayload.velocityDelta || '-11.4%');
  const squad = String(rawPayload.squad || `${industryName} Core ART`);
  const summaryText = String(rawPayload.summary || rawPayload.event || `Sprint velocity drop (${velocityDelta}) on ${squad}`);
  return {
    title: `Jira ${issueKey}: ${summaryText}`,
    severity: velocityDelta.includes('-') && Math.abs(parseFloat(velocityDelta)) >= 10 ? 'Critical' : 'Severe',
    impactedMetric: `${squad} Velocity (${velocityDelta})`,
    summary: `Jira webhook signal ${issueKey} detected on ${squad}: ${summaryText}`,
    recommendedEscalation: 'Notify Delivery Lead & trigger Alignment rebalance review',
    topic: 'WEBHOOK_PAYLOAD_RECEIVED'
  };
}

export function summarizeNodesForAgents(nodesMap: Record<string, TraceabilityNode>) {
  const all = Object.values(nodesMap || {});
  const atRisk = all.filter((n) => n.status === 'At Risk' || n.status === 'Behind');
  const orphans = all.filter((n) => n.isOrphan || !n.parentIds || n.parentIds.length === 0);
  const overloaded = all.filter((n) => (n.squadLoad?.loadPct ?? 0) > 100);
  const avgProgress = all.length > 0
    ? Math.round(all.reduce((sum, n) => sum + (Number(n.progress) || 0), 0) / all.length)
    : 0;
  return {
    totalNodes: all.length,
    atRiskCount: atRisk.length,
    orphanCount: orphans.length,
    overloadedCount: overloaded.length,
    avgProgress,
    atRiskTitles: atRisk.slice(0, 5).map((n) => `${n.title} (${n.status}, ${n.progress}%)`),
    orphanTitles: orphans.slice(0, 5).map((n) => `${n.id}: ${n.title}`),
    overloadedSquads: overloaded.slice(0, 5).map((n) => `${n.squadLoad?.squadName || n.title} (${n.squadLoad?.loadPct}%)`)
  };
}
