import {
  BusEvent,
  IndustryDataBundle,
  SignificantDisasterEvent,
  TraceabilityNode
} from '../types/orchestration';

export type NotificationCategory =
  | 'critical_okr'
  | 'disaster_event'
  | 'escalation'
  | 'retrospective_owner_alert';
export type NotificationSeverity = 'critical' | 'high' | 'warning';
export type NotificationScope = 'all' | 'current';

export interface PortfolioNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  industryKey: string;
  organisationName: string;
  sector: string;
  title: string;
  summary: string;
  detail: string;
  targetTab: 'okrs' | 'disasters' | 'health' | 'supervisor';
  targetOkrId?: string;
  disasterId?: string;
  statusLabel: string;
  impactMetric?: string;
  detectedAt: string;
  isNew?: boolean;
  targetRole?: string;
  targetOwner?: string;
  senderRole?: string;
}

export interface NotificationFilterOptions {
  scope: NotificationScope;
  activeIndustryKey: string;
  category: 'all' | NotificationCategory;
  industryFilter: string;
  searchQuery?: string;
}

export interface GroupedIndustryNotifications {
  industryKey: string;
  organisationName: string;
  sector: string;
  criticalOkrCount: number;
  disasterCount: number;
  items: PortfolioNotification[];
}

export function isOkrTraceabilityNode(node: TraceabilityNode, layerId?: number): boolean {
  if (!node || !node.id) return false;
  if (layerId !== undefined) {
    return layerId === 2 || layerId === 3;
  }
  const lower = node.id.toLowerCase();
  if (lower.includes('orphan')) return false;
  // Match Key Results (t-kr1, custom-kr-..., kr-...) or Objectives (t-o1, b-o2, okr-...)
  // while excluding Layer 7 outcome IDs like b-o-1 / p-o-1 and Layer 4/5/6 nodes (-i1, -p1, -t1).
  return /(?:^|-)kr\d*|^custom-kr|^okr|^[a-z]+-o\d+$/i.test(lower);
}

export function evaluateOkrCriticality(node: TraceabilityNode): {
  isCritical: boolean;
  severity: NotificationSeverity;
  reason: string;
  statusLabel: string;
} {
  const priority = node.manualPriority?.priority;
  const isP0 = priority === 'P0 - Critical';

  if (node.status === 'Behind') {
    return {
      isCritical: true,
      severity: 'critical',
      reason: isP0
        ? `OKR is Behind schedule (${node.progress}%) and escalated to P0 - Critical.`
        : `OKR status reached Behind with attainment at ${node.progress}%.`,
      statusLabel: isP0 ? 'Behind · P0 Critical' : 'Behind'
    };
  }

  if (isP0) {
    return {
      isCritical: true,
      severity: 'critical',
      reason: `Human executive escalated this OKR to P0 - Critical (${node.status}, ${node.progress}% progress).`,
      statusLabel: 'P0 - Critical'
    };
  }

  if (node.status === 'At Risk' && node.progress < 60) {
    return {
      isCritical: true,
      severity: 'high',
      reason: `OKR is At Risk with attainment at ${node.progress}% (below 60% critical threshold).`,
      statusLabel: `At Risk · ${node.progress}%`
    };
  }

  if (node.progress < 40) {
    return {
      isCritical: true,
      severity: 'high',
      reason: `OKR attainment dropped to ${node.progress}% (below 40% floor).`,
      statusLabel: `Critical Low · ${node.progress}%`
    };
  }

  return {
    isCritical: false,
    severity: 'warning',
    reason: '',
    statusLabel: node.status
  };
}

function collectBundleOkrNodes(bundle: IndustryDataBundle): TraceabilityNode[] {
  const map = new Map<string, TraceabilityNode>();
  const nonOkrLayerIds = new Set<string>();

  Object.entries(bundle.traceability || {}).forEach(([layerStr, nodes]) => {
    const layerId = Number(layerStr);
    if (!Array.isArray(nodes)) return;
    nodes.forEach((node) => {
      if (isOkrTraceabilityNode(node, layerId)) {
        map.set(node.id, node);
      } else if (node?.id) {
        nonOkrLayerIds.add(node.id);
      }
    });
  });

  Object.values(bundle.nodeMap || {}).forEach((node) => {
    if (!node || nonOkrLayerIds.has(node.id)) return;
    if (isOkrTraceabilityNode(node)) {
      map.set(node.id, node);
    }
  });

  return Array.from(map.values());
}

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  critical: 0,
  high: 1,
  warning: 2
};

export function collectPortfolioNotifications(
  industriesByKey: Record<string, IndustryDataBundle>,
  activeIndustryKey: string,
  liveActiveBundle?: IndustryDataBundle | null,
  events: BusEvent[] = []
): PortfolioNotification[] {
  const notifications: PortfolioNotification[] = [];
  const mergedIndustries: Record<string, IndustryDataBundle> = { ...industriesByKey };

  if (liveActiveBundle && activeIndustryKey) {
    mergedIndustries[activeIndustryKey] = liveActiveBundle;
  }

  // Index latest SIGNIFICANT_EVENT_TRIGGERED timestamps by disasterId for live detection timestamps
  const triggeredDisasterEventById = new Map<string, BusEvent>();
  const orphanTriggeredEvents: BusEvent[] = [];

  events.forEach((ev) => {
    if (ev.topic === 'SIGNIFICANT_EVENT_TRIGGERED') {
      const dId = ev.payload?.disasterId ? String(ev.payload.disasterId) : '';
      if (dId) {
        if (!triggeredDisasterEventById.has(dId)) {
          triggeredDisasterEventById.set(dId, ev);
        }
      } else {
        orphanTriggeredEvents.push(ev);
      }
    }
  });

  Object.entries(mergedIndustries).forEach(([indKey, bundle]) => {
    if (!bundle) return;
    const organisationName = bundle.name || indKey;
    const sector = bundle.sector || 'Enterprise Portfolio';

    // 1. Critical OKRs per Industry & Organisation
    const okrNodes = collectBundleOkrNodes(bundle);
    okrNodes.forEach((node) => {
      const check = evaluateOkrCriticality(node);
      if (!check.isCritical) return;

      const timestamp =
        node.manualPriority?.overrideTimestamp ||
        bundle.quarter ||
        'Live Monitor';

      notifications.push({
        id: `okr-crit:${indKey}:${node.id}`,
        category: 'critical_okr',
        severity: check.severity,
        industryKey: indKey,
        organisationName,
        sector,
        title: node.title,
        summary: check.reason,
        detail: `Owner: ${node.owner || 'Unassigned'} · Budget: ${node.budget || 'N/A'} · Recommendation: ${node.ai?.recommend || 'Escalate in OKR & Program Studio'}`,
        targetTab: 'okrs',
        targetOkrId: node.id,
        statusLabel: check.statusLabel,
        impactMetric: `${node.progress}% attainment · ${node.budget || 'N/A'}`,
        detectedAt: timestamp,
        isNew: Boolean(node.manualPriority?.overrideTimestamp)
      });
    });

    // 2. Active / Newly Detected Disaster Events per Industry & Organisation
    const activeDisasters = (bundle.activeDisasters || []).filter((d: SignificantDisasterEvent) => d.active);
    activeDisasters.forEach((disaster) => {
      const matchedEvent = indKey === activeIndustryKey ? triggeredDisasterEventById.get(disaster.id) : undefined;
      notifications.push({
        id: `disaster:${indKey}:${disaster.id}`,
        category: 'disaster_event',
        severity: disaster.severity === 'Critical' ? 'critical' : disaster.severity === 'Severe' ? 'high' : 'warning',
        industryKey: indKey,
        organisationName,
        sector,
        title: disaster.title,
        summary: disaster.description,
        detail: `Scope: ${disaster.industry} · Contingency: ${disaster.impacts.mitigationAction}`,
        targetTab: 'disasters',
        disasterId: disaster.id,
        statusLabel: `ACTIVE · ${disaster.severity.toUpperCase()}`,
        impactMetric: `${disaster.impacts.attainmentDropPct}% shock · ${disaster.impacts.costImpact}`,
        detectedAt: matchedEvent?.timestamp || 'Active Crisis',
        isNew: Boolean(matchedEvent)
      });
    });
  });

  // 3. Any standalone SIGNIFICANT_EVENT_TRIGGERED bus events without a disasterId match
  const activeBundle = mergedIndustries[activeIndustryKey];
  if (activeBundle) {
    orphanTriggeredEvents.forEach((ev) => {
      notifications.push({
        id: `event:${activeIndustryKey}:${ev.id}`,
        category: 'disaster_event',
        severity: ev.severity === 'danger' ? 'critical' : 'high',
        industryKey: activeIndustryKey,
        organisationName: activeBundle.name || activeIndustryKey,
        sector: activeBundle.sector || 'Enterprise Portfolio',
        title: String(ev.payload?.title || 'New Significant Event Detected'),
        summary: ev.summary,
        detail: `Source: ${ev.sourceAgent} -> ${ev.targetAgent}`,
        targetTab: 'disasters',
        statusLabel: 'NEW EVENT',
        impactMetric: ev.payload?.impactDrop ? `${ev.payload.impactDrop}% shock` : undefined,
        detectedAt: ev.timestamp,
        isNew: true
      });
    });
  }

  // Sort: Active industry first (when equal severity), then critical disasters & critical OKRs
  return notifications.sort((a, b) => {
    const sevDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sevDiff !== 0) return sevDiff;
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
    if (a.category !== b.category) return a.category === 'disaster_event' ? -1 : 1;
    if (a.industryKey === activeIndustryKey && b.industryKey !== activeIndustryKey) return -1;
    if (b.industryKey === activeIndustryKey && a.industryKey !== activeIndustryKey) return 1;
    return a.organisationName.localeCompare(b.organisationName);
  });
}

export function filterPortfolioNotifications(
  notifications: PortfolioNotification[],
  options: NotificationFilterOptions,
  dismissedIds: Set<string> = new Set()
): PortfolioNotification[] {
  const query = (options.searchQuery || '').trim().toLowerCase();

  return notifications.filter((item) => {
    if (dismissedIds.has(item.id)) return false;
    if (options.scope === 'current' && item.industryKey !== options.activeIndustryKey) return false;
    if (options.category !== 'all' && item.category !== options.category) return false;
    if (options.industryFilter && options.industryFilter !== 'ALL' && item.industryKey !== options.industryFilter) {
      return false;
    }
    if (query) {
      const haystack = `${item.title} ${item.summary} ${item.industryKey} ${item.organisationName} ${item.sector} ${item.statusLabel}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function groupNotificationsByIndustryAndOrg(
  notifications: PortfolioNotification[],
  activeIndustryKey: string
): GroupedIndustryNotifications[] {
  const groups = new Map<string, GroupedIndustryNotifications>();

  notifications.forEach((item) => {
    const existing = groups.get(item.industryKey);
    if (existing) {
      existing.items.push(item);
      if (item.category === 'critical_okr') existing.criticalOkrCount += 1;
      if (item.category === 'disaster_event') existing.disasterCount += 1;
    } else {
      groups.set(item.industryKey, {
        industryKey: item.industryKey,
        organisationName: item.organisationName,
        sector: item.sector,
        criticalOkrCount: item.category === 'critical_okr' ? 1 : 0,
        disasterCount: item.category === 'disaster_event' ? 1 : 0,
        items: [item]
      });
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.industryKey === activeIndustryKey && b.industryKey !== activeIndustryKey) return -1;
    if (b.industryKey === activeIndustryKey && a.industryKey !== activeIndustryKey) return 1;
    return b.items.length - a.items.length || a.organisationName.localeCompare(b.organisationName);
  });
}

export function countUnreadNotifications(
  notifications: PortfolioNotification[],
  readIds: Set<string>,
  dismissedIds: Set<string> = new Set()
): number {
  return notifications.filter((item) => !dismissedIds.has(item.id) && !readIds.has(item.id)).length;
}
