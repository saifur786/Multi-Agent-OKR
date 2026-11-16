import type {
  IndustryDataBundle,
  OrganisationalPrerequisiteItem,
  PrerequisiteCategoryKey,
  TraceabilityNode
} from '../types/orchestration';

export interface PrerequisiteCategoryDescriptor {
  key: PrerequisiteCategoryKey;
  label: string;
  subtitle: string;
}

export interface CanonicalPrerequisiteSpec {
  id: string;
  categoryKey: PrerequisiteCategoryKey;
  label: string;
  description: string;
  defaultSourceSystem: string;
  defaultTargetAgents: string[];
}

export const PREREQUISITE_CATEGORIES: PrerequisiteCategoryDescriptor[] = [
  {
    key: 'strategy_governance',
    label: 'Strategy & Governance',
    subtitle: 'Strategic priorities, OKR policy guardrails, and RACI accountability models.'
  },
  {
    key: 'business_context',
    label: 'Business Context',
    subtitle: 'Enterprise goals, value drivers, risk/compliance mandates, and operating hierarchy.'
  },
  {
    key: 'execution_data',
    label: 'Execution Data',
    subtitle: 'Structured business problems, existing OKRs, programs/epics, and capacity budgets.'
  },
  {
    key: 'knowledge_sources',
    label: 'Knowledge Sources',
    subtitle: 'Portfolio repositories, enterprise knowledge bases, and operational/market signals.'
  }
];

export const PREREQUISITE_CATEGORY_LABEL_MAP: Record<PrerequisiteCategoryKey, string> = {
  strategy_governance: 'Strategy & Governance',
  business_context: 'Business Context',
  execution_data: 'Execution Data',
  knowledge_sources: 'Knowledge Sources'
};

export const AVAILABLE_PREREQUISITE_AI_AGENTS: string[] = [
  'Supervisor Agent',
  'Strategy Explorer',
  'OKR Quality Auditor',
  'Alignment Capacity Agent',
  'Risk Sentinel',
  'Executive Reporter',
  'Retrospective Learner'
];

export const CANONICAL_PREREQUISITE_SPECS: CanonicalPrerequisiteSpec[] = [
  // 1. Strategy & Governance
  {
    id: 'sg_corporate_strategy',
    categoryKey: 'strategy_governance',
    label: 'Corporate Strategy, Objectives & investment priorities',
    description: 'Board-approved growth themes, capital allocation envelope, and multi-quarter investment priorities.',
    defaultSourceSystem: 'Planview Strategic Portfolio',
    defaultTargetAgents: ['Supervisor Agent', 'Strategy Explorer', 'Executive Reporter']
  },
  {
    id: 'sg_okr_framework',
    categoryKey: 'strategy_governance',
    label: 'OKR framework, Policies & Government rules',
    description: 'SMART thresholds, scoring cadences, mandatory KR metadata fields, and statutory/government mandates.',
    defaultSourceSystem: 'Enterprise Policy Registry',
    defaultTargetAgents: ['Supervisor Agent', 'OKR Quality Auditor', 'Risk Sentinel']
  },
  {
    id: 'sg_raci_model',
    categoryKey: 'strategy_governance',
    label: 'RACI, Ownership & accountability model',
    description: 'Executive sponsors, KR owners, escalation chains, and decision-rights matrix.',
    defaultSourceSystem: 'HR & Governance RACI Directory',
    defaultTargetAgents: ['Supervisor Agent', 'OKR Quality Auditor', 'Alignment Capacity Agent']
  },
  // 2. Business Context
  {
    id: 'bc_goals_value_drivers',
    categoryKey: 'business_context',
    label: 'Goals & Value drivers',
    description: 'Core economic value levers, margin targets, customer retention drivers, and target growth outcomes.',
    defaultSourceSystem: 'Value Driver & Strategy Map',
    defaultTargetAgents: ['Strategy Explorer', 'OKR Quality Auditor', 'Executive Reporter']
  },
  {
    id: 'bc_risk_compliance',
    categoryKey: 'business_context',
    label: 'Risk, Compliance & regulatory requirements',
    description: 'Industry compliance standards, audit obligations, operational resilience thresholds, and risk appetite.',
    defaultSourceSystem: 'ServiceNow GRC & Risk Ledger',
    defaultTargetAgents: ['Risk Sentinel', 'OKR Quality Auditor', 'Supervisor Agent']
  },
  {
    id: 'bc_org_hierarchy',
    categoryKey: 'business_context',
    label: 'Organisational hierarchy & operating model',
    description: 'Business units, value streams, release trains, and squad topology across the enterprise.',
    defaultSourceSystem: 'Workday Org & Operating Model',
    defaultTargetAgents: ['Alignment Capacity Agent', 'Strategy Explorer', 'Supervisor Agent']
  },
  // 3. Execution Data
  {
    id: 'ed_business_problems',
    categoryKey: 'execution_data',
    label: 'Structured Business Problems',
    description: 'Validated problem statements, root causes, causal chains to dollar impact, and remediation windows.',
    defaultSourceSystem: 'Planview Anvi Problem Studio',
    defaultTargetAgents: ['Strategy Explorer', 'OKR Quality Auditor', 'Retrospective Learner']
  },
  {
    id: 'ed_existing_okrs',
    categoryKey: 'execution_data',
    label: 'Existing OKRs',
    description: 'Active quarterly Objectives and Key Results with current progress, baselines, targets, and health.',
    defaultSourceSystem: 'OKR Portfolio Ledger',
    defaultTargetAgents: ['OKR Quality Auditor', 'Alignment Capacity Agent', 'Executive Reporter']
  },
  {
    id: 'ed_programs_epics',
    categoryKey: 'execution_data',
    label: 'Programs, Projects, Epics, & investments',
    description: 'Funded delivery programs, agile epics, roadmap milestones, and cross-team dependency linkages.',
    defaultSourceSystem: 'Planview Portfolios & Jira Align',
    defaultTargetAgents: ['Alignment Capacity Agent', 'Risk Sentinel', 'Executive Reporter']
  },
  {
    id: 'ed_capacity_budgets',
    categoryKey: 'execution_data',
    label: 'Resource Capacity, Budgets & performance metrics',
    description: 'Squad FTE capacity, utilisation percentages, capital burn rates, and delivery throughput KPIs.',
    defaultSourceSystem: 'Planview Resource Management',
    defaultTargetAgents: ['Alignment Capacity Agent', 'Executive Reporter', 'Risk Sentinel']
  },
  // 4. Knowledge Sources
  {
    id: 'ks_portfolio_repos',
    categoryKey: 'knowledge_sources',
    label: 'Planview (or custom), Jira, Planner & portfolio repositories',
    description: 'Connected portfolio, Agile backlog, and task management repositories supplying live delivery signals.',
    defaultSourceSystem: 'Planview Portfolios, Jira Cloud & Microsoft Planner (Custom Ready)',
    defaultTargetAgents: ['Alignment Capacity Agent', 'Risk Sentinel', 'Supervisor Agent']
  },
  {
    id: 'ks_enterprise_policies',
    categoryKey: 'knowledge_sources',
    label: 'Enterprise policies & knowledge bases',
    description: 'Internal architecture playbooks, retrospective lessons learned, and indexed RAG policy documents.',
    defaultSourceSystem: '5-Pillar RAG & MongoDB Knowledge Base',
    defaultTargetAgents: ['Strategy Explorer', 'Retrospective Learner', 'Supervisor Agent']
  },
  {
    id: 'ks_operational_signals',
    categoryKey: 'knowledge_sources',
    label: 'Operational, customer & market signals',
    description: 'Real-time NPS/CSAT telemetry, incident webhooks, market benchmarks, and external event triggers.',
    defaultSourceSystem: 'ServiceNow, Datadog & Market Telemetry Feed',
    defaultTargetAgents: ['Risk Sentinel', 'Strategy Explorer', 'Retrospective Learner']
  }
];

function summarizeTitles(nodes: TraceabilityNode[] | undefined, fallback: string, limit = 3): string {
  if (!Array.isArray(nodes) || nodes.length === 0) return fallback;
  return nodes
    .slice(0, limit)
    .map((n) => n.title)
    .filter(Boolean)
    .join('; ');
}

export function buildDefaultOrganisationalPrerequisites(
  industry: Partial<IndustryDataBundle> | null | undefined,
  nowIso: string = new Date().toISOString()
): OrganisationalPrerequisiteItem[] {
  const safeName = String(industry?.name || 'Enterprise').trim() || 'Enterprise';
  const safeSector = String(industry?.sector || 'Technology').trim() || 'Technology';
  const safeQuarter = String(industry?.quarter || 'Q4 2026').trim() || 'Q4 2026';
  const safeBudget = String(industry?.totalBudget || '$25.0M').trim() || '$25.0M';
  const traceability = industry?.traceability || {};
  const policies = Array.isArray(industry?.policies) ? industry.policies : [];
  const orgDirectory = Array.isArray(industry?.orgDirectory) ? industry.orgDirectory : [];
  const programs = Array.isArray(industry?.programs) ? industry.programs : [];
  const disasters = Array.isArray(industry?.activeDisasters) ? industry.activeDisasters : [];
  const kb = Array.isArray(industry?.knowledgeBase) ? industry.knowledgeBase : [];

  const themesSummary = summarizeTitles(traceability[1], `${safeName} strategic growth & modernisation themes`);
  const objectivesSummary = summarizeTitles(traceability[2], `${safeName} quarterly strategic objectives`);
  const krsSummary = summarizeTitles(traceability[3], `${safeName} measurable Key Results`);
  const epicsSummary = summarizeTitles(traceability[4], `${safeName} delivery epics & cross-team initiatives`);
  const squadsSummary = summarizeTitles(traceability[5], `Core delivery squads for ${safeName}`);

  const problemDescriptions = [
    ...Object.values(traceability)
      .flat()
      .map((n) => n?.businessProblem?.problemDescription)
      .filter((d): d is string => Boolean(d && d.trim())),
    ...programs
      .map((p) => p?.businessProblem?.problemDescription)
      .filter((d): d is string => Boolean(d && d.trim()))
  ];

  const policiesSummary =
    policies.length > 0
      ? policies
          .slice(0, 3)
          .map((p) => `${p.ruleName} (min ${p.minMeasurableScore}%, ${p.governanceFrequency})`)
          .join('; ')
      : 'Mandatory SMART compliance (>=75% measurable score), quarterly cadence, and owner accountability.';

  const raciSummary =
    orgDirectory.length > 0
      ? orgDirectory
          .slice(0, 4)
          .map((m) => `${m.name} (${m.role}, ${m.department})`)
          .join('; ')
      : `Executive Sponsors, OKR Creators, Operations Monitors, and Policy Managers for ${safeName}.`;

  const riskSummary =
    disasters.length > 0
      ? disasters
          .slice(0, 3)
          .map((d) => `${d.title} [${d.severity}]`)
          .join('; ')
      : `${safeSector} regulatory & operational resilience controls monitored by Risk Sentinel.`;

  const kbTitles = kb.map((p) => `${p.title} (${p.metric})`).slice(0, 3).join('; ');
  const marketKb = kb.find((p) => p.id === 'kb2' || /market/i.test(p.title));
  const customerKb = kb.find((p) => p.id === 'kb3' || /customer/i.test(p.title));
  const capacityKb = kb.find((p) => p.id === 'kb5' || /resource|util/i.test(p.title));

  const contentById: Record<string, string> = {
    sg_corporate_strategy: `Active ${safeQuarter} portfolio investment envelope of ${safeBudget} across ${safeName} (${safeSector}). Priority strategic themes: ${themesSummary}.`,
    sg_okr_framework: `Enforced governance rules for ${safeName}: ${policiesSummary}.`,
    sg_raci_model: `Accountable enterprise RACI directory: ${raciSummary}. All Key Results require a named owner and escalation chain.`,
    bc_goals_value_drivers: `Primary value drivers for ${safeName}: ${objectivesSummary}. Overall attainment benchmark ${industry?.attainment ?? 72}%.`,
    bc_risk_compliance: `Regulatory and operational risk register: ${riskSummary}. ${marketKb?.summary || ''}`.trim(),
    bc_org_hierarchy: `${safeName} operating model spans ${safeSector} value streams and execution squads (${squadsSummary}).`,
    ed_business_problems:
      problemDescriptions.length > 0
        ? `Tracked business problems & root causes: ${problemDescriptions.slice(0, 2).join(' | ')}`
        : `Structured business problem definitions capturing impacted stakeholders, causal chain to dollar impact, and target remediation timing.`,
    ed_existing_okrs: `Active Key Results under governance: ${krsSummary}.`,
    ed_programs_epics: `Delivery programs (${programs.length} managed programs) and epics: ${epicsSummary}.`,
    ed_capacity_budgets: `Portfolio budget ${safeBudget}. ${capacityKb ? `${capacityKb.title}: ${capacityKb.metric} — ${capacityKb.summary}` : `Squad capacity & utilisation telemetry tracked across ${squadsSummary}.`}`,
    ks_portfolio_repos: `Connected repositories: Planview Portfolios (Layers 1–7), Jira Software sprint feeds, Microsoft Planner, and custom portfolio endpoints.`,
    ks_enterprise_policies: `Indexed knowledge bases & playbooks: ${kbTitles || '5-Pillar Enterprise RAG Vector Store & Retrospective lessons learned'}.`,
    ks_operational_signals: `Live signals from ${customerKb ? `${customerKb.title} (${customerKb.metric})` : 'NPS/CSAT voice of customer'}, scheduled Risk Sentinel cron triggers, and webhook streams.`
  };

  return CANONICAL_PREREQUISITE_SPECS.map((spec) => ({
    id: spec.id,
    categoryKey: spec.categoryKey,
    categoryLabel: PREREQUISITE_CATEGORY_LABEL_MAP[spec.categoryKey],
    label: spec.label,
    description: spec.description,
    content: contentById[spec.id] || spec.description,
    sourceSystem: spec.defaultSourceSystem,
    owner: orgDirectory[0]?.name || `${safeName} Governance Lead`,
    targetAgents: [...spec.defaultTargetAgents],
    enabledForAgents: true,
    syncStatus: 'Synced',
    isCanonical: true,
    tags: [safeName, PREREQUISITE_CATEGORY_LABEL_MAP[spec.categoryKey]],
    updatedAt: nowIso
  }));
}

export function normalizeOrganisationalPrerequisites(
  rawItems: unknown,
  industry?: Partial<IndustryDataBundle> | null
): OrganisationalPrerequisiteItem[] {
  const defaults = buildDefaultOrganisationalPrerequisites(industry);
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return defaults;
  }

  const incomingById = new Map<string, any>();
  const customItems: OrganisationalPrerequisiteItem[] = [];

  rawItems.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Record<string, any>;
    const id = String(item.id || '').trim();
    if (!id) return;

    const categoryKey: PrerequisiteCategoryKey =
      item.categoryKey in PREREQUISITE_CATEGORY_LABEL_MAP
        ? (item.categoryKey as PrerequisiteCategoryKey)
        : 'knowledge_sources';

    const normalized: OrganisationalPrerequisiteItem = {
      id: id.slice(0, 80),
      categoryKey,
      categoryLabel: PREREQUISITE_CATEGORY_LABEL_MAP[categoryKey],
      label: String(item.label || '').trim().slice(0, 180) || 'Custom Pre-Requisite',
      description: String(item.description || '').trim().slice(0, 400),
      content: String(item.content || '').trim().slice(0, 2000),
      sourceSystem: String(item.sourceSystem || '').trim().slice(0, 140) || 'Custom Knowledge Source',
      owner: String(item.owner || '').trim().slice(0, 100) || 'Governance Lead',
      targetAgents: Array.isArray(item.targetAgents)
        ? item.targetAgents.map((a: any) => String(a).trim()).filter(Boolean).slice(0, 8)
        : ['Supervisor Agent'],
      enabledForAgents: item.enabledForAgents !== false,
      syncStatus:
        item.syncStatus === 'Configured' || item.syncStatus === 'Pending Review'
          ? item.syncStatus
          : 'Synced',
      isCanonical: Boolean(item.isCanonical),
      tags: Array.isArray(item.tags)
        ? item.tags.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 6)
        : [],
      updatedAt: String(item.updatedAt || new Date().toISOString())
    };

    if (CANONICAL_PREREQUISITE_SPECS.some((spec) => spec.id === id)) {
      incomingById.set(id, normalized);
    } else {
      customItems.push(normalized);
    }
  });

  const mergedCanonical = defaults.map((defItem) => {
    const existing = incomingById.get(defItem.id);
    if (!existing) return defItem;
    return {
      ...defItem,
      ...existing,
      // Keep canonical category & official label intact unless custom override is desired
      categoryKey: defItem.categoryKey,
      categoryLabel: defItem.categoryLabel,
      label: defItem.label,
      isCanonical: true,
      content: existing.content || defItem.content,
      sourceSystem: existing.sourceSystem || defItem.sourceSystem
    };
  });

  return [...mergedCanonical, ...customItems];
}

export function searchOrganisationalPrerequisites(
  items: OrganisationalPrerequisiteItem[],
  query: string,
  categoryFilter: PrerequisiteCategoryKey | 'all' = 'all'
): OrganisationalPrerequisiteItem[] {
  const cleanQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    if (categoryFilter !== 'all' && item.categoryKey !== categoryFilter) {
      return false;
    }
    if (!cleanQuery) return true;
    const haystack = [
      item.categoryLabel,
      item.label,
      item.description,
      item.content,
      item.sourceSystem,
      item.owner,
      ...item.targetAgents,
      ...item.tags
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(cleanQuery);
  });
}

export interface PrerequisiteCoverageSummary {
  totalCount: number;
  enabledCount: number;
  byCategory: Record<
    PrerequisiteCategoryKey,
    {
      label: string;
      total: number;
      enabled: number;
      customCount: number;
    }
  >;
}

export function computePrerequisitesCoverageStats(
  items: OrganisationalPrerequisiteItem[]
): PrerequisiteCoverageSummary {
  const byCategory: PrerequisiteCoverageSummary['byCategory'] = {
    strategy_governance: { label: 'Strategy & Governance', total: 0, enabled: 0, customCount: 0 },
    business_context: { label: 'Business Context', total: 0, enabled: 0, customCount: 0 },
    execution_data: { label: 'Execution Data', total: 0, enabled: 0, customCount: 0 },
    knowledge_sources: { label: 'Knowledge Sources', total: 0, enabled: 0, customCount: 0 }
  };

  let enabledCount = 0;
  items.forEach((item) => {
    const bucket = byCategory[item.categoryKey];
    if (!bucket) return;
    bucket.total += 1;
    if (item.enabledForAgents) {
      bucket.enabled += 1;
      enabledCount += 1;
    }
    if (!item.isCanonical) {
      bucket.customCount += 1;
    }
  });

  return {
    totalCount: items.length,
    enabledCount,
    byCategory
  };
}

export function buildPrerequisitesAgentContext(
  items: OrganisationalPrerequisiteItem[],
  maxItemsPerCategory = 6
): string {
  const enabledItems = items.filter((item) => item.enabledForAgents);
  if (enabledItems.length === 0) {
    return 'No Organisational/Industry Pre-Requisites currently enabled for AI Agents.';
  }

  return PREREQUISITE_CATEGORIES.map((category) => {
    const categoryItems = enabledItems
      .filter((item) => item.categoryKey === category.key)
      .slice(0, maxItemsPerCategory);
    if (categoryItems.length === 0) {
      return `${category.label}: (none enabled)`;
    }
    const lines = categoryItems.map(
      (item) =>
        `  - ${item.label} [${item.sourceSystem} | Owner: ${item.owner} | Agents: ${item.targetAgents.join(', ')}]: ${item.content}`
    );
    return `${category.label}:\n${lines.join('\n')}`;
  }).join('\n\n');
}
