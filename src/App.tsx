/**
 * Planview Anvi Multi-Agent System & Knowledge Base Pipeline
 * Supervisor-Worker Multi-Agent Orchestration Engine over Asynchronous Event Bus
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Flame,
  Layers,
  LineChart as LineChartIcon,
  ShieldCheck,
  Sliders,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut, updateProfile } from 'firebase/auth';
import { auth } from './lib/firebase';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';
import { INDUSTRY_DATA } from './data/industryData';
import {
  IndustryKey,
  TraceabilityNode,
  BusEvent,
  IndustryDataBundle,
  KnowledgeBasePillar,
  OrganisationalPrerequisiteItem
} from './types/orchestration';
import { eventBus } from './utils/eventBus';
import { useFirebase } from './context/FirebaseContext';
import {
  loadIndustrySnapshotWithPrerequisitesFromFirestore,
  loadUserPreferencesFromFirestore,
  saveIndustryKnowledgeSnapshotToFirestore,
  saveUserPreferencesToFirestore
} from './services/firestorePersistence';
import {
  buildDefaultOrganisationalPrerequisites,
  buildPrerequisitesAgentContext,
  normalizeOrganisationalPrerequisites
} from './utils/orgPrerequisites';
import type { ParsedDocumentPreview } from './utils/ragIngestion';
import { Header, ActiveNavView } from './components/Header';
import { WorkerAgentLogsModal } from './components/WorkerAgentLogsModal';
import { RiskSentinelThresholdPanel } from './components/RiskSentinelThresholdPanel';
import { AgentImpactMatrixHeatmap } from './components/AgentImpactMatrixHeatmap';
import { extractMatrixOkrs } from './utils/agentImpactMatrix';
import {
  type AnomalySensitivityLevel,
  type WorkerAgentStatusSummary
} from './utils/workerAgentTelemetry';
import {
  computeAllStagesOverview,
  filterInsightsByStage
} from './utils/orchestrationDrilldown';
import {
  applyStageSensitivityPreset,
  buildDefaultAgentThresholdConfigs,
  evaluateOverviewAnomalySeries,
  normalizeAgentThresholdConfigs,
  SENSITIVITY_PRESETS,
  updateAgentThresholdConfig,
  type AgentAnomalyThresholdConfig
} from './utils/riskSentinelThresholds';
import { LifecycleView } from './components/LifecycleView';
import {
  UserPreferences,
  DEFAULT_NAV_ORDER,
  areNavOrdersEqual,
  loadPersistedUserPreferences,
  normalizeNavOrder,
  normalizeUserPreferences,
  reorderSecondaryNavButtons,
  savePersistedUserPreferences
} from './utils/navOrder';
import {
  PortfolioNotification,
  collectPortfolioNotifications
} from './utils/headerNotifications';
import {
  IndustryOrchestrationSummary,
  OrchestrationMode,
  runIndustryOkrProgramOrchestration
} from './utils/industryOrchestration';
import {
  OrchestrationRunRecord,
  PersistedNotificationRecord,
  SelectableAccountProfile,
  isSuperAdminIdentity,
  mergeSelectableAccounts,
  normalizeOrchestrationRuns,
  resolveUserCapabilities
} from './utils/agenticCommunication';
import type { ConversationalRoutedAgent } from './utils/conversationalOkrParser';

function lazyWithRetry<T extends React.ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await loader();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          const delayMs = 400 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError;
  });
}

const TraceabilityView = lazyWithRetry(() =>
  import('./components/TraceabilityView').then((m) => ({ default: m.TraceabilityView }))
);
const KnowledgeBaseView = lazyWithRetry(() =>
  import('./components/KnowledgeBaseView').then((m) => ({ default: m.KnowledgeBaseView }))
);
const SupervisorEventBus = lazyWithRetry(() =>
  import('./components/SupervisorEventBus').then((m) => ({ default: m.SupervisorEventBus }))
);
const AddCustomIndustryModal = lazyWithRetry(() =>
  import('./components/AddCustomIndustryModal').then((m) => ({ default: m.AddCustomIndustryModal }))
);
const AdvisoryCommitteeView = lazyWithRetry(() =>
  import('./components/AdvisoryCommitteeView').then((m) => ({ default: m.AdvisoryCommitteeView }))
);
const AdvisoryPerformanceAccuracyView = lazyWithRetry(() =>
  import('./components/AdvisoryPerformanceAccuracyView').then((m) => ({ default: m.AdvisoryPerformanceAccuracyView }))
);
const ResourceUtilisationHeatmapView = lazyWithRetry(() =>
  import('./components/ResourceUtilisationHeatmapView').then((m) => ({ default: m.ResourceUtilisationHeatmapView }))
);
const StrategicPortfolioPlannerView = lazyWithRetry(() =>
  import('./components/StrategicPortfolioPlannerView').then((m) => ({ default: m.StrategicPortfolioPlannerView }))
);
const OkrTrajectoryView = lazyWithRetry(() =>
  import('./components/OkrTrajectoryView').then((m) => ({ default: m.OkrTrajectoryView }))
);
const OkrProgramStudioView = lazyWithRetry(() =>
  import('./components/OkrProgramStudioView').then((m) => ({ default: m.OkrProgramStudioView }))
);
const EnterpriseGovernanceModal = lazyWithRetry(() =>
  import('./components/EnterpriseGovernanceModal').then((m) => ({ default: m.EnterpriseGovernanceModal }))
);
const GeminiChatbotDrawer = lazyWithRetry(() =>
  import('./components/GeminiChatbotDrawer').then((m) => ({ default: m.GeminiChatbotDrawer }))
);
const AgenticValidationModal = lazyWithRetry(() =>
  import('./components/AgenticValidationModal').then((m) => ({ default: m.AgenticValidationModal }))
);
import {
  OrgDirectoryMember,
  OkrEnterprisePolicy,
  ManagedProgram,
  SignificantDisasterEvent
} from './types/orchestration';
import { normalizeIndustryBundle, normalizeStructuredBusinessProblem } from './utils/okrNormalization';

const buildNodesMap = (industry: IndustryDataBundle): Record<string, TraceabilityNode> => {
  const map: Record<string, TraceabilityNode> = {};
  Object.values(industry.traceability || {}).forEach((layerNodes) => {
    (Array.isArray(layerNodes) ? layerNodes : []).forEach((node) => {
      map[node.id] = {
        ...node,
        businessProblem: node.businessProblem ? normalizeStructuredBusinessProblem(node.businessProblem) : undefined
      };
    });
  });
  Object.entries(industry.nodeMap || {}).forEach(([nodeId, node]) => {
    if (!node) return;
    map[nodeId] = {
      ...node,
      businessProblem: node.businessProblem ? normalizeStructuredBusinessProblem(node.businessProblem) : undefined
    };
  });
  return map;
};

const getInitialSelectedNodeId = (
  industry: IndustryDataBundle,
  nodesMap: Record<string, TraceabilityNode>
): string => {
  return (
    industry.traceability[2]?.[0]?.id ||
    industry.traceability[1]?.[0]?.id ||
    Object.keys(nodesMap)[0] ||
    ''
  );
};

const hasTraceabilityNodes = (traceability: Record<number, TraceabilityNode[]> | undefined): boolean => {
  return Object.values(traceability || {}).some((nodes) => Array.isArray(nodes) && nodes.length > 0);
};

const mergeIndustryWithFallback = (
  baseIndustry: IndustryDataBundle,
  incomingIndustry: IndustryDataBundle
): IndustryDataBundle => {
  return normalizeIndustryBundle({
    ...baseIndustry,
    ...incomingIndustry,
    stages: incomingIndustry.stages?.length ? incomingIndustry.stages : baseIndustry.stages,
    knowledgeBase: incomingIndustry.knowledgeBase?.length ? incomingIndustry.knowledgeBase : baseIndustry.knowledgeBase,
    organisationalPrerequisites: incomingIndustry.organisationalPrerequisites?.length
      ? incomingIndustry.organisationalPrerequisites
      : baseIndustry.organisationalPrerequisites,
    traceability: hasTraceabilityNodes(incomingIndustry.traceability) ? incomingIndustry.traceability : baseIndustry.traceability
  });
};

export type DemoUserProfile = SelectableAccountProfile;

const DEMO_USERS: SelectableAccountProfile[] = [
  {
    id: 'super-admin',
    email: 'saifur.rahman.au@gmail',
    name: 'Saifur Rahman',
    role: 'super-admin',
    industry: 'All',
    label: 'Super Admin',
    permissions: ['all'],
    accountabilities: 'Create industries, policies, Firebase user onboarding, OKRs & full multi-agent governance'
  },
  {
    id: 'okr-creator',
    email: 'strategy.ops@demo.local',
    name: 'Alicia Stone',
    role: 'okr-creator',
    industry: 'Telco',
    label: 'OKR Creator',
    permissions: ['create-okr', 'execute-lifecycle'],
    accountabilities: 'Author OKRs, run Conversational OKR Agent & execute 6-stage Multi-Agent Lifecycle'
  },
  {
    id: 'monitor',
    email: 'ops.monitor@demo.local',
    name: 'Marcus Liu',
    role: 'monitor',
    industry: 'Banking',
    label: 'Operations Monitor',
    permissions: ['monitor', 'trace', 'notify', 'escalate'],
    accountabilities: 'Monitor pipeline health, inspect 7-layer lineage & send escalation alerts to other roles'
  },
  {
    id: 'policy-manager',
    email: 'policy.admin@demo.local',
    name: 'Nadia Flores',
    role: 'policy-manager',
    industry: 'Retail',
    label: 'Policy Manager',
    permissions: ['manage-policy', 'view-dashboards', 'manage-dashboards'],
    accountabilities: 'Manage organisation policies, compliance guardrails & executive reporting dashboards'
  }
];

type AdminUserRecord = {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: string;
  industry: string;
  permissions: string[];
  status: 'pending' | 'invited' | 'active';
  firebaseEnabled: boolean;
  invitedAt?: string;
  createdAt: string;
};

const WORKSPACE_VIEW_ICONS: Record<ActiveNavView, React.ComponentType<{ className?: string }>> = {
  lifecycle: Activity,
  studio: Sliders,
  traceability: Layers,
  knowledge: Database,
  trajectory: TrendingUp,
  strategy: Target,
  advisory: Users,
  performance: LineChartIcon,
  heatmap: Flame
};

const WORKSPACE_VIEWS: Array<{ id: ActiveNavView; label: string; description: string }> = [
  { id: 'lifecycle', label: 'Lifecycle', description: '6-stage orchestration and worker status' },
  { id: 'studio', label: 'OKR Studio', description: 'Business problem management and draft review' },
  { id: 'traceability', label: 'Traceability', description: '7-layer dependency mapping and system health' },
  { id: 'knowledge', label: 'Knowledge Base', description: '5-pillar AI memory and vector search' },
  { id: 'trajectory', label: 'Trajectory', description: 'Target vs predicted execution curve' },
  { id: 'strategy', label: 'Portfolio Planner', description: 'Funding and strategic allocation models' },
  { id: 'advisory', label: 'Advisory', description: 'Committee outcomes and policy recommendations' },
  { id: 'performance', label: 'Accuracy', description: 'Regression quality and benchmark analytics' },
  { id: 'heatmap', label: 'Heatmap', description: 'Utilisation, load, and staffing hotspots' }
];

export default function App() {
  // Dynamic Industries Dictionary (includes defaults + user-created custom industries)
  const [industriesDict, setIndustriesDict] = useState<Record<string, IndustryDataBundle>>(
    () => ({ ...INDUSTRY_DATA })
  );

  const industriesList = useMemo(() => Object.keys(industriesDict), [industriesDict]);

  const [selectedIndustry, setSelectedIndustry] = useState<string>('Telco');
  const [activeView, setActiveView] = useState<ActiveNavView>('studio');
  const [isNavCollapsed, setIsNavCollapsed] = useState<boolean>(false);
  const [isInsightsCollapsed, setIsInsightsCollapsed] = useState<boolean>(false);
  const [activeDemoUser, setActiveDemoUser] = useState<DemoUserProfile>(DEMO_USERS[0]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [industryDraft, setIndustryDraft] = useState({
    name: 'FinTech',
    sector: 'Financial Services',
    quarter: 'Q2 2027',
    description: 'Digital finance operating model with policy-driven risk controls.'
  });
  const [policyDraft, setPolicyDraft] = useState({
    name: 'Enterprise Risk Guardrail',
    type: 'Governance',
    severity: 'High',
    description: 'Mandatory review for pricing, compliance, and operational risk before launch.'
  });
  const [inviteDraft, setInviteDraft] = useState({
    name: 'Ava Clarke',
    email: 'ava.clarke@demo.local',
    role: 'okr-creator',
    industry: 'Telco',
    permissions: 'create-okr,execute-lifecycle'
  });
  const [registrationDraft, setRegistrationDraft] = useState({
    name: 'Ava Clarke',
    email: 'ava.clarke@demo.local',
    password: 'Welcome123!',
    confirmPassword: 'Welcome123!',
    role: 'okr-creator',
    industry: 'Telco'
  });
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => loadPersistedUserPreferences());
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [isEventBusOpen, setIsEventBusOpen] = useState<boolean>(false);
  const [isOrchestratingAll, setIsOrchestratingAll] = useState<boolean>(false);
  const { user, authReady } = useFirebase();
  const isVerifiedFirebaseUser = Boolean(authReady && user && user.emailVerified);
  const capabilities = useMemo(
    () => resolveUserCapabilities(activeDemoUser, selectedIndustry),
    [activeDemoUser, selectedIndustry]
  );
  const isSuperAdmin =
    capabilities.isSuperAdmin ||
    (activeDemoUser.id === 'super-admin' && isSuperAdminIdentity({ email: user?.email ?? undefined }));
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const syncCollapsedState = () => setIsNavCollapsed(mediaQuery.matches);
    syncCollapsedState();
    mediaQuery.addEventListener('change', syncCollapsedState);
    return () => mediaQuery.removeEventListener('change', syncCollapsedState);
  }, []);
  const [isAddCustomIndustryOpen, setIsAddCustomIndustryOpen] = useState<boolean>(false);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState<boolean>(false);
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState<boolean>(false);
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState<boolean>(false);
  const [isAgenticValidatorOpen, setIsAgenticValidatorOpen] = useState<boolean>(false);
  const [draggedNavView, setDraggedNavView] = useState<ActiveNavView | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [persistedNotifications, setPersistedNotifications] = useState<PortfolioNotification[]>([]);
  const [lastOrchestrationSummary, setLastOrchestrationSummary] = useState<IndustryOrchestrationSummary | null>(null);
  const [lastOrchestrationRunId, setLastOrchestrationRunId] = useState<string | null>(null);
  const [prerequisitesPersistenceSource, setPrerequisitesPersistenceSource] = useState<
    'mongodb' | 'memory' | null
  >(null);
  const [requestedStudioTarget, setRequestedStudioTarget] = useState<{
    tab: 'okrs' | 'network' | 'health' | 'programs' | 'disasters' | 'supervisor';
    okrId?: string;
    nonce: number;
  } | null>(null);
  const orchestrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fedPillars, setFedPillars] = useState<Record<string, boolean>>({
    kb1: true,
    kb2: true,
    kb3: true,
    kb4: true,
    kb5: true
  });

  const [events, setEvents] = useState<BusEvent[]>(() =>
    eventBus.seedInitialEvents((INDUSTRY_DATA['Telco'] || INDUSTRY_DATA['Banking']).name)
  );

  const industry = useMemo(
    () => normalizeIndustryBundle(industriesDict[selectedIndustry] || industriesDict['Banking']),
    [industriesDict, selectedIndustry]
  );

  const isHydratingRef = useRef<boolean>(true);
  const selectedIndustryRef = useRef<string>(selectedIndustry);
  selectedIndustryRef.current = selectedIndustry;
  const lastPersistedSnapshotRef = useRef<string>('');

  const persistIndustry = useCallback(async (payload: IndustryDataBundle): Promise<boolean> => {
    try {
      const normalized = normalizeIndustryBundle(payload);
      const response = await fetch('/api/industries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized)
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  // Enterprise Governance State
  const [managedPrograms, setManagedPrograms] = useState<ManagedProgram[]>(
    () => (industry.programs || []).map((program) => ({
      ...program,
      businessProblem: normalizeStructuredBusinessProblem(program.businessProblem)
    }))
  );
  const [activeDisasters, setActiveDisasters] = useState<SignificantDisasterEvent[]>(
    () => industry.activeDisasters || []
  );
  const [orgDirectory, setOrgDirectory] = useState<OrgDirectoryMember[]>(
    () => industry.orgDirectory || []
  );
  const [policies, setPolicies] = useState<OkrEnterprisePolicy[]>(
    () => industry.policies || []
  );

  // Flatten nodes for the selected industry into state for live manipulation
  const [nodesMap, setNodesMap] = useState<Record<string, TraceabilityNode>>(() => buildNodesMap(industry));

  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    return getInitialSelectedNodeId(industry, nodesMap);
  });

  const hydrateIndustryState = useCallback((nextIndustry: IndustryDataBundle, reseedEvents: boolean = true) => {
    const nextNodesMap = buildNodesMap(nextIndustry);
    setNodesMap(nextNodesMap);
    setManagedPrograms((nextIndustry.programs || []).map((program) => ({
      ...program,
      businessProblem: normalizeStructuredBusinessProblem(program.businessProblem)
    })));
    setActiveDisasters(nextIndustry.activeDisasters || []);
    setOrgDirectory(nextIndustry.orgDirectory || []);
    setPolicies(nextIndustry.policies || []);
    setSelectedNodeId(getInitialSelectedNodeId(nextIndustry, nextNodesMap));

    if (reseedEvents) {
      const seeded = eventBus.seedInitialEvents(nextIndustry.name);
      setEvents(seeded);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadIndustries = async () => {
      try {
        const response = await fetch('/api/industries');
        if (!response.ok) return;
        const data = await response.json();
        const loaded = data?.industries ?? [];
        if (!isMounted || !Array.isArray(loaded) || loaded.length === 0) return;

        const merged: Record<string, IndustryDataBundle> = { ...INDUSTRY_DATA };
        loaded.forEach((entry: any) => {
          const normalized = normalizeIndustryBundle(entry);
          const normId = String(normalized.id || '').toLowerCase();
          const normName = String(normalized.name || '').toLowerCase();
          const matchedKey = Object.keys(merged).find((k) => {
            const existing = merged[k];
            return (
              k.toLowerCase() === normId ||
              String(existing?.id || '').toLowerCase() === normId ||
              String(existing?.name || '').toLowerCase() === normName
            );
          });
          const baseKey = matchedKey || normalized.name;
          const base = normalizeIndustryBundle(merged[baseKey] || normalized);
          merged[baseKey] = mergeIndustryWithFallback(base, normalized);
        });

        const currentKey = selectedIndustryRef.current;
        const nextIndustryKey = merged[currentKey]
          ? currentKey
          : merged['Telco']
            ? 'Telco'
            : Object.keys(merged)[0];
        if (!nextIndustryKey) return;

        isHydratingRef.current = true;
        const normalizedIndustry = normalizeIndustryBundle(merged[nextIndustryKey]);
        lastPersistedSnapshotRef.current = JSON.stringify(normalizedIndustry);
        setIndustriesDict(merged);
        if (nextIndustryKey !== currentKey) {
          setSelectedIndustry(nextIndustryKey);
        }
        hydrateIndustryState(normalizedIndustry, false);
      } catch {
        // Seeded defaults already active
      } finally {
        setTimeout(() => {
          isHydratingRef.current = false;
        }, 50);
      }
    };

    void loadIndustries();
    return () => {
      isMounted = false;
    };
  }, [hydrateIndustryState]);

  const userPreferencesRef = useRef<UserPreferences>(userPreferences);
  userPreferencesRef.current = userPreferences;

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user-preferences');
        if (!response.ok || !isMounted) return;
        const data = await response.json();
        const serverPrefs = normalizeUserPreferences(data?.preferences);
        const localPrefs = userPreferencesRef.current;

        const serverTime = serverPrefs.updatedAt ? Date.parse(serverPrefs.updatedAt) : 0;
        const localTime = localPrefs.updatedAt ? Date.parse(localPrefs.updatedAt) : 0;
        const localIsCustom = !areNavOrdersEqual(localPrefs.navButtonOrder, DEFAULT_NAV_ORDER);
        const ordersDiffer = !areNavOrdersEqual(localPrefs.navButtonOrder, serverPrefs.navButtonOrder);

        if (serverPrefs.updatedAt && ((!localPrefs.updatedAt && !localIsCustom) || serverTime > localTime)) {
          const saved = savePersistedUserPreferences(serverPrefs);
          if (isMounted) setUserPreferences(saved);
        } else if ((localIsCustom || localPrefs.updatedAt) && (ordersDiffer || localTime > serverTime)) {
          void fetch('/api/user-preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localPrefs)
          }).catch(() => {});
        }
      } catch {
        // Local persisted preferences remain active
      }
    };

    void loadPreferences();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void fetch('/api/admin/users')
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (Array.isArray(payload?.users)) {
          setAdminUsers(payload.users as AdminUserRecord[]);
        }
      })
      .catch(() => {
        setAdminUsers([]);
      });
  }, [activeDemoUser.role]);

  const selectableDemoUsers = useMemo(
    () => mergeSelectableAccounts(DEMO_USERS, adminUsers),
    [adminUsers]
  );

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/notifications')
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.notifications)) return;
        const mapped: PortfolioNotification[] = (data.notifications as PersistedNotificationRecord[]).map((item) => ({
          id: item.id,
          category: item.category,
          severity: item.severity,
          industryKey: item.industryKey || selectedIndustry,
          organisationName: item.organisationName || item.industryKey || 'Enterprise',
          sector: item.sector || 'Enterprise',
          title: item.title,
          summary: item.summary,
          detail: item.detail,
          targetTab: item.targetTab || 'okrs',
          targetOkrId: item.targetOkrId,
          statusLabel: item.statusLabel,
          detectedAt: item.detectedAt ? new Date(item.detectedAt).toLocaleTimeString() : 'Live',
          targetRole: item.targetRole,
          targetOwner: item.targetOwner,
          senderRole: item.senderRole,
          isNew: true
        }));
        setPersistedNotifications(mapped);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedIndustry]);

  // Sync user preferences with Firestore when authenticated
  useEffect(() => {
    if (!isVerifiedFirebaseUser || !user) return;
    let cancelled = false;
    void loadUserPreferencesFromFirestore(user.uid)
      .then((firestorePrefs) => {
        if (cancelled || !firestorePrefs) return;
        const saved = savePersistedUserPreferences(firestorePrefs);
        setUserPreferences(saved);
      })
      .catch((err) => {
        console.error('Failed to load Firestore preferences:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [isVerifiedFirebaseUser, user]);

  // Load signed-in user's Firestore Knowledge Base & Pre-Requisites snapshot for the active industry
  useEffect(() => {
    if (!isVerifiedFirebaseUser || !user || !industry?.id) return;
    let cancelled = false;
    void loadIndustrySnapshotWithPrerequisitesFromFirestore(user.uid, industry.id)
      .then((snapshot) => {
        if (cancelled || !snapshot) return;
        const { knowledgeBase: savedKnowledgeBase, organisationalPrerequisites: savedPrerequisites } = snapshot;
        if (
          (!savedKnowledgeBase || savedKnowledgeBase.length === 0) &&
          (!savedPrerequisites || savedPrerequisites.length === 0)
        ) {
          return;
        }
        setIndustriesDict((prev) => {
          const target = prev[selectedIndustry];
          if (!target) return prev;
          return {
            ...prev,
            [selectedIndustry]: normalizeIndustryBundle({
              ...target,
              knowledgeBase:
                savedKnowledgeBase && savedKnowledgeBase.length > 0
                  ? savedKnowledgeBase
                  : target.knowledgeBase,
              organisationalPrerequisites:
                savedPrerequisites && savedPrerequisites.length > 0
                  ? savedPrerequisites
                  : target.organisationalPrerequisites
            })
          };
        });
      })
      .catch((err) => {
        console.error('Failed to load Firestore industry KB snapshot:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [isVerifiedFirebaseUser, user, industry?.id, selectedIndustry]);

  // Load persisted Organisational & Industry Pre-Requisites from MongoDB / Session Store per industry
  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/prerequisites?industry=${encodeURIComponent(selectedIndustry)}`)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.prerequisites)) return;
        setPrerequisitesPersistenceSource(
          data.source === 'mongodb' ? 'mongodb' : 'memory'
        );
        setIndustriesDict((prev) => {
          const target = prev[selectedIndustry];
          if (!target) return prev;
          const normalized = normalizeOrganisationalPrerequisites(data.prerequisites, target);
          if (
            JSON.stringify(target.organisationalPrerequisites || []) === JSON.stringify(normalized)
          ) {
            return prev;
          }
          const updatedBundle = normalizeIndustryBundle({
            ...target,
            organisationalPrerequisites: normalized
          });
          lastPersistedSnapshotRef.current = JSON.stringify(updatedBundle);
          return {
            ...prev,
            [selectedIndustry]: updatedBundle
          };
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedIndustry]);

  const handleUpdateNavButtonOrder = useCallback((nextOrder: ActiveNavView[]) => {
    const saved = savePersistedUserPreferences({ navButtonOrder: nextOrder });
    setUserPreferences(saved);
    void fetch('/api/user-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved)
    }).catch(() => {});
    if (isVerifiedFirebaseUser && user) {
      void saveUserPreferencesToFirestore(user.uid, saved, selectedIndustryRef.current).catch((err) => {
        console.error('Failed to sync navigation preferences to Firestore:', err);
      });
    }
  }, [isVerifiedFirebaseUser, user]);

  const buildBundleWithNodes = useCallback(
    (nextNodesMap: Record<string, TraceabilityNode>): IndustryDataBundle => {
      const seenIds = new Set<string>();
      const traceability = Object.fromEntries(
        Object.entries(industry.traceability || {}).map(([layer, layerNodes]) => {
          const nodes = Array.isArray(layerNodes)
            ? layerNodes.map((node) => {
                seenIds.add(node.id);
                return nextNodesMap[node.id] || node;
              })
            : [];
          return [layer, nodes];
        })
      ) as Record<number, TraceabilityNode[]>;

      const unplacedNodes = Object.values(nextNodesMap).filter((node) => node && !seenIds.has(node.id));
      if (unplacedNodes.length > 0) {
        traceability[3] = [...(traceability[3] || []), ...unplacedNodes];
      }

      return normalizeIndustryBundle({
        ...industry,
        traceability,
        nodeMap: nextNodesMap,
        programs: managedPrograms,
        activeDisasters,
        orgDirectory,
        policies
      });
    },
    [industry, managedPrograms, activeDisasters, orgDirectory, policies]
  );

  const currentIndustryBundle = useMemo<IndustryDataBundle>(
    () => buildBundleWithNodes(nodesMap),
    [buildBundleWithNodes, nodesMap]
  );

  const nodesMapRef = useRef<Record<string, TraceabilityNode>>(nodesMap);
  nodesMapRef.current = nodesMap;

  const handleCommitNodesMap = useCallback(
    async (
      updater:
        | Record<string, TraceabilityNode>
        | ((prev: Record<string, TraceabilityNode>) => Record<string, TraceabilityNode>)
    ): Promise<boolean> => {
      const prevMap = nodesMapRef.current;
      const nextMap = typeof updater === 'function' ? updater(prevMap) : updater;
      nodesMapRef.current = nextMap;
      setNodesMap(nextMap);

      const nextBundle = buildBundleWithNodes(nextMap);
      setIndustriesDict((prevDict) => ({
        ...prevDict,
        [selectedIndustry]: nextBundle
      }));

      lastPersistedSnapshotRef.current = JSON.stringify(nextBundle);
      return persistIndustry(nextBundle);
    },
    [buildBundleWithNodes, persistIndustry, selectedIndustry]
  );

  useEffect(() => {
    if (isHydratingRef.current || !selectedIndustry || !currentIndustryBundle?.name) {
      return;
    }
    const serialized = JSON.stringify(currentIndustryBundle);
    if (serialized === lastPersistedSnapshotRef.current) {
      return;
    }
    const timer = setTimeout(() => {
      lastPersistedSnapshotRef.current = serialized;
      void persistIndustry(currentIndustryBundle);
    }, 350);
    return () => clearTimeout(timer);
  }, [selectedIndustry, currentIndustryBundle, persistIndustry]);

  // Subscribe to Event Bus
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('*', (newEvent) => {
      setEvents((prev) => [newEvent, ...prev].slice(0, 80));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    return () => {
      if (orchestrationIntervalRef.current) {
        clearInterval(orchestrationIntervalRef.current);
      }
    };
  }, []);

  // When switching industry, save current bundle snapshot, refresh nodesMap, events, and selected node
  const handleSelectIndustry = useCallback((ind: string) => {
    if (orchestrationIntervalRef.current) {
      clearInterval(orchestrationIntervalRef.current);
      orchestrationIntervalRef.current = null;
      setIsOrchestratingAll(false);
    }
    isHydratingRef.current = true;
    const nextDict = {
      ...industriesDict,
      [selectedIndustry]: currentIndustryBundle
    };
    const normalizedIndustry = normalizeIndustryBundle(nextDict[ind] || nextDict['Banking']);
    setIndustriesDict(nextDict);
    setSelectedIndustry(ind);
    setActiveStageId(1);
    hydrateIndustryState(normalizedIndustry, true);
    setTimeout(() => {
      isHydratingRef.current = false;
    }, 50);
  }, [industriesDict, selectedIndustry, currentIndustryBundle, hydrateIndustryState]);

  // Add custom industry generated by Strategy & Ideation Agent
  const handleAddCustomIndustry = (newIndustry: IndustryDataBundle) => {
    const normalizedIndustry = normalizeIndustryBundle(newIndustry);
    setIndustriesDict((prev) => ({
      ...prev,
      [normalizedIndustry.name]: normalizedIndustry
    }));

    setSelectedIndustry(normalizedIndustry.name);
    setActiveStageId(1);
    hydrateIndustryState(normalizedIndustry, true);

    // Switch to lifecycle view to see the generated strategy
    setActiveView('lifecycle');
  };

  const handleToggleFedPillar = (pillarId: string) => {
    setFedPillars((prev) => {
      const updated = { ...prev, [pillarId]: !prev[pillarId] };
      eventBus.publish({
        topic: 'KNOWLEDGE_BASE_UPDATED',
        sourceAgent: 'Knowledge Base Controller',
        targetAgent: 'Supervisor Agent',
        summary: `${updated[pillarId] ? 'Enabled' : 'Disabled'} agent feed for Pillar ${pillarId}`,
        payload: { pillarId, isFeeding: updated[pillarId] },
        latencyMs: 15,
        severity: 'info'
      });
      return updated;
    });
  };

  const handleUpdateKnowledgeBase = useCallback(
    async (updatedPillars: KnowledgeBasePillar[], preview: ParsedDocumentPreview) => {
      const nextBundle = normalizeIndustryBundle({
        ...currentIndustryBundle,
        knowledgeBase: updatedPillars
      });

      setIndustriesDict((prev) => ({
        ...prev,
        [selectedIndustry]: nextBundle
      }));

      lastPersistedSnapshotRef.current = JSON.stringify(nextBundle);
      await persistIndustry(nextBundle);

      if (isVerifiedFirebaseUser && user) {
        await saveIndustryKnowledgeSnapshotToFirestore(
          user.uid,
          nextBundle.id,
          nextBundle.name,
          updatedPillars,
          nextBundle.organisationalPrerequisites
        );
      }

      eventBus.publish({
        topic: 'KNOWLEDGE_BASE_UPDATED',
        sourceAgent: 'RAG Document Importer',
        targetAgent: '5-Pillar Vector Knowledge Base',
        summary: `Ingested "${preview.fileName}" (${preview.chunks.length} vectors) into ${preview.targetPillarTitle} for ${nextBundle.name}`,
        payload: {
          industry: nextBundle.name,
          pillarId: preview.targetPillarId,
          fileName: preview.fileName,
          chunksAdded: preview.chunks.length,
          engine: preview.engine
        },
        latencyMs: 38,
        severity: 'success'
      });
    },
    [currentIndustryBundle, selectedIndustry, persistIndustry, isVerifiedFirebaseUser, user]
  );

  const handleUpdatePrerequisites = useCallback(
    async (updatedItems: OrganisationalPrerequisiteItem[], actionSummary?: string) => {
      const normalized = normalizeOrganisationalPrerequisites(
        updatedItems,
        currentIndustryBundle
      );
      const nextBundle = normalizeIndustryBundle({
        ...currentIndustryBundle,
        organisationalPrerequisites: normalized
      });

      setIndustriesDict((prev) => ({
        ...prev,
        [selectedIndustry]: nextBundle
      }));

      lastPersistedSnapshotRef.current = JSON.stringify(nextBundle);

      try {
        const resp = await fetch('/api/prerequisites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industry: selectedIndustry,
            prerequisites: normalized,
            actionSummary
          })
        });
        if (resp.ok) {
          const payload = await resp.json();
          setPrerequisitesPersistenceSource(
            payload?.source === 'mongodb' ? 'mongodb' : 'memory'
          );
        }
      } catch {
        // Fallback persisted via industry snapshot below
      }

      await persistIndustry(nextBundle);

      if (isVerifiedFirebaseUser && user) {
        await saveIndustryKnowledgeSnapshotToFirestore(
          user.uid,
          nextBundle.id,
          nextBundle.name,
          nextBundle.knowledgeBase,
          normalized
        );
      }

      eventBus.publish({
        topic: 'KNOWLEDGE_BASE_UPDATED',
        sourceAgent: 'Organisational Pre-Requisites Controller',
        targetAgent: 'Supervisor Agent',
        summary:
          actionSummary ||
          `Updated Organisational/Industry Pre-Requisites knowledge base for ${nextBundle.name}`,
        payload: {
          industry: nextBundle.name,
          enabledCount: normalized.filter((item) => item.enabledForAgents).length,
          totalCount: normalized.length
        },
        latencyMs: 22,
        severity: 'info'
      });
    },
    [currentIndustryBundle, selectedIndustry, persistIndustry, isVerifiedFirebaseUser, user]
  );

  const handleSyncPrerequisitesFromWorkspace = useCallback(async () => {
    const existingCustomItems = (
      currentIndustryBundle.organisationalPrerequisites || []
    ).filter((item) => !item.isCanonical);
    const refreshedCanonical = buildDefaultOrganisationalPrerequisites(currentIndustryBundle);
    await handleUpdatePrerequisites(
      [...refreshedCanonical, ...existingCustomItems],
      `Synchronized Organisational & Industry Pre-Requisites from live ${currentIndustryBundle.name} workspace telemetry`
    );
  }, [currentIndustryBundle, handleUpdatePrerequisites]);

  // Cross-industry live Notification Center collector (Critical OKRs + New Disaster Events + Escalations & Retrospective Owner Alerts)
  const portfolioNotifications = useMemo(() => {
    const derived = collectPortfolioNotifications(industriesDict, selectedIndustry, currentIndustryBundle, events);
    const seen = new Set(persistedNotifications.map((n) => n.id));
    return [...persistedNotifications, ...derived.filter((item) => !seen.has(item.id))];
  }, [persistedNotifications, industriesDict, selectedIndustry, currentIndustryBundle, events]);

  const handleMarkNotificationRead = useCallback((id: string) => {
    setReadNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setReadNotificationIds((prev) => {
      const merged = new Set(prev);
      portfolioNotifications.forEach((n) => merged.add(n.id));
      return Array.from(merged);
    });
  }, [portfolioNotifications]);

  const handleDismissNotification = useCallback((id: string) => {
    setDismissedNotificationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleOpenNotification = useCallback(
    (notification: PortfolioNotification) => {
      handleMarkNotificationRead(notification.id);
      if (notification.industryKey && notification.industryKey !== selectedIndustry && industriesDict[notification.industryKey]) {
        handleSelectIndustry(notification.industryKey);
      }
      setActiveView('studio');
      setRequestedStudioTarget({
        tab: notification.targetTab,
        okrId: notification.targetOkrId,
        nonce: Date.now()
      });
    },
    [handleMarkNotificationRead, handleSelectIndustry, selectedIndustry, industriesDict]
  );

  const handleSendEscalation = useCallback(
    async (payload: {
      targetRole: string;
      targetOwner?: string;
      severity: 'critical' | 'high' | 'warning';
      title: string;
      summary: string;
    }) => {
      try {
        const resp = await fetch('/api/notifications/escalate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industryKey: selectedIndustry,
            organisationName: currentIndustryBundle.name,
            sector: currentIndustryBundle.sector,
            senderRole: activeDemoUser.role,
            senderEmail: activeDemoUser.email,
            ...payload
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          const rec = data?.notification as PersistedNotificationRecord | undefined;
          if (rec) {
            setPersistedNotifications((prev) => [
              {
                id: rec.id,
                category: rec.category,
                severity: rec.severity,
                industryKey: rec.industryKey,
                organisationName: rec.organisationName,
                sector: rec.sector,
                title: rec.title,
                summary: rec.summary,
                detail: rec.detail,
                targetTab: rec.targetTab || 'okrs',
                statusLabel: rec.statusLabel,
                detectedAt: new Date(rec.detectedAt).toLocaleTimeString(),
                targetRole: rec.targetRole,
                targetOwner: rec.targetOwner,
                senderRole: rec.senderRole,
                isNew: true
              },
              ...prev
            ]);
          }
          eventBus.publish({
            topic: 'RISK_SENTINEL_ALERT',
            sourceAgent: `${activeDemoUser.label} (${activeDemoUser.email})`,
            targetAgent: `Role: ${payload.targetRole}`,
            summary: `Escalation sent to ${payload.targetRole}: ${payload.title}`,
            payload,
            latencyMs: 18,
            severity: payload.severity === 'critical' ? 'danger' : 'warning'
          });
        }
      } catch {
        // Non-fatal
      }
    },
    [selectedIndustry, currentIndustryBundle.name, currentIndustryBundle.sector, activeDemoUser]
  );

  const handleRetrospectiveCompleted = useCallback(
    (payload: {
      actionableLesson: string;
      vectorChunk: { id: string; text: string; source: string; sourceDocument?: string; ingestedAt?: string };
      ownerNotification?: PersistedNotificationRecord;
    }) => {
      setIndustriesDict((prev) => {
        const current = prev[selectedIndustry];
        if (!current) return prev;
        const updatedKb = (current.knowledgeBase || []).map((pillar, idx) =>
          pillar.id === 'kb4' || idx === 3
            ? {
                ...pillar,
                vectorChunks: [payload.vectorChunk, ...(pillar.vectorChunks || [])].slice(0, 14)
              }
            : pillar
        );
        return {
          ...prev,
          [selectedIndustry]: normalizeIndustryBundle({
            ...current,
            knowledgeBase: updatedKb
          })
        };
      });

      if (payload.ownerNotification) {
        const rec = payload.ownerNotification;
        setPersistedNotifications((prev) => [
          {
            id: rec.id,
            category: rec.category,
            severity: rec.severity,
            industryKey: rec.industryKey || selectedIndustry,
            organisationName: rec.organisationName || currentIndustryBundle.name,
            sector: rec.sector || currentIndustryBundle.sector,
            title: rec.title,
            summary: rec.summary,
            detail: rec.detail,
            targetTab: rec.targetTab || 'okrs',
            targetOkrId: rec.targetOkrId,
            statusLabel: rec.statusLabel,
            detectedAt: rec.detectedAt ? new Date(rec.detectedAt).toLocaleTimeString() : 'Live',
            targetRole: rec.targetRole,
            targetOwner: rec.targetOwner,
            senderRole: rec.senderRole,
            isNew: true
          },
          ...prev.filter((n) => n.id !== rec.id)
        ]);
      }
    },
    [selectedIndustry, currentIndustryBundle.name, currentIndustryBundle.sector]
  );

  const handleNavigateFromConversationalRoute = useCallback((route: ConversationalRoutedAgent) => {
    setActiveView(route.suggestedView);
    if (route.suggestedView === 'studio' && route.suggestedTab) {
      setRequestedStudioTarget({ tab: route.suggestedTab, nonce: Date.now() });
    } else if (route.agentKey === 'reporting') {
      setActiveStageId(5);
    } else if (route.agentKey === 'risk') {
      setActiveStageId(4);
    } else if (route.agentKey === 'retrospective') {
      setActiveStageId(6);
    }
  }, []);

  // Industry-Level OKR & Program Orchestration Pipeline
  const handleRunFullOrchestration = (mode: OrchestrationMode = 'full-pipeline') => {
    if (isOrchestratingAll) return;

    const result = runIndustryOkrProgramOrchestration(currentIndustryBundle, nodesMap, mode);

    // Apply orchestrated updates to live industry state & dictionary
    nodesMapRef.current = result.updatedNodesMap;
    setNodesMap(result.updatedNodesMap);
    const updatedBundle = normalizeIndustryBundle({
      ...currentIndustryBundle,
      stages: result.updatedStages,
      nodeMap: result.updatedNodesMap,
      attainment: result.updatedAttainment,
      overallHealth: result.updatedHealth
    });

    setIndustriesDict((prev) => ({
      ...prev,
      [selectedIndustry]: updatedBundle
    }));
    setLastOrchestrationSummary(result.summary);

    void fetch('/api/agents/supervisor-orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        industry: selectedIndustry,
        industryName: currentIndustryBundle.name,
        mode,
        totalOkrs: result.summary.totalOkrs,
        criticalOkrCount: result.summary.criticalOkrCount,
        activeProgramCount: result.summary.activeProgramCount,
        activeDisasterCount: result.summary.activeDisasterCount,
        summaryHeadline: result.summary.headline,
        prerequisitesContext: buildPrerequisitesAgentContext(
          currentIndustryBundle.organisationalPrerequisites || [],
          3
        )
      })
    })
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (Array.isArray(data?.runs) && data.runs.length > 0) {
          const normalized = normalizeOrchestrationRuns(data.runs).slice(-10).map((r, i) => ({
            ...r,
            run: `Run ${i + 1}`
          }));
          setOrchestrationRuns(normalized);
          setInsightsPersistenceInfo({
            source: String(data?.persistence || data?.run?.source || '').includes('mongodb') ? 'mongodb' : 'memory',
            savedCount: normalized.length * 6
          });
          if (data?.run?.id) {
            setLastOrchestrationRunId(String(data.run.id));
          }
        } else if (data?.run) {
          if (data.run.id) {
            setLastOrchestrationRunId(String(data.run.id));
          }
          setOrchestrationRuns((prev) => {
            const next = normalizeOrchestrationRuns([...prev, data.run]).slice(-10).map((r, i) => ({
              ...r,
              run: `Run ${i + 1}`
            }));
            setInsightsPersistenceInfo({
              source: String(data?.persistence || data?.run?.source || '').includes('mongodb') ? 'mongodb' : 'memory',
              savedCount: next.length * 6
            });
            return next;
          });
        }
      })
      .catch(() => {});

    eventBus.publish({
      topic: 'ORCHESTRATION_STARTED',
      sourceAgent: 'Supervisor Agent (Anvi)',
      targetAgent: 'All 6 Worker Agents',
      summary: `Initiating industry-level ${mode} OKR & Program orchestration for ${industry.name} (${industry.sector})`,
      payload: {
        industry: industry.name,
        sector: industry.sector,
        quarter: industry.quarter,
        mode,
        totalOkrs: result.summary.totalOkrs,
        criticalOkrs: result.summary.criticalOkrCount,
        activePrograms: result.summary.activeProgramCount,
        activeDisasters: result.summary.activeDisasterCount
      },
      latencyMs: 12,
      severity: result.summary.activeDisasterCount > 0 ? 'warning' : 'info'
    });

    if (mode === 'okr-governance') {
      result.stageEvents
        .filter((ev) => ev.stageId === 2 || ev.stageId === 5)
        .forEach((ev) => {
          eventBus.publish({
            topic: ev.topic,
            sourceAgent: ev.sourceAgent,
            targetAgent: ev.targetAgent,
            summary: ev.summary,
            payload: ev.payload,
            latencyMs: 24,
            severity: ev.severity
          });
        });
      setActiveView('studio');
      setRequestedStudioTarget({
        tab: result.summary.incompleteProblemCount > 0 ? 'health' : 'okrs',
        nonce: Date.now()
      });
      return;
    }

    if (mode === 'program-disaster-sync') {
      result.stageEvents
        .filter((ev) => ev.stageId === 3 || ev.stageId === 4)
        .forEach((ev) => {
          eventBus.publish({
            topic: ev.topic,
            sourceAgent: ev.sourceAgent,
            targetAgent: ev.targetAgent,
            summary: ev.summary,
            payload: ev.payload,
            latencyMs: 24,
            severity: ev.severity
          });
        });
      setActiveView('studio');
      setRequestedStudioTarget({
        tab: result.summary.activeDisasterCount > 0 ? 'disasters' : 'programs',
        nonce: Date.now()
      });
      return;
    }

    // Full 6-Stage Pipeline step-through
    setIsOrchestratingAll(true);
    setActiveView('lifecycle');
    let current = 1;
    setActiveStageId(1);

    const publishStage = (stageNum: number) => {
      const ev = result.stageEvents.find((item) => item.stageId === stageNum);
      if (!ev) return;
      eventBus.publish({
        topic: ev.topic,
        sourceAgent: ev.sourceAgent,
        targetAgent: ev.targetAgent,
        summary: ev.summary,
        payload: ev.payload,
        latencyMs: 26,
        severity: ev.severity
      });
    };

    publishStage(1);

    orchestrationIntervalRef.current = setInterval(() => {
      current++;
      if (current <= 6) {
        setActiveStageId(current);
        publishStage(current);
      } else {
        if (orchestrationIntervalRef.current) {
          clearInterval(orchestrationIntervalRef.current);
          orchestrationIntervalRef.current = null;
        }
        setIsOrchestratingAll(false);
      }
    }, 550);
  };

  // Inject a manual test webhook event
  const handleInjectTestEvent = () => {
    eventBus.publish({
      topic: 'WEBHOOK_PAYLOAD_RECEIVED',
      sourceAgent: 'Jira Software Webhook',
      targetAgent: 'Risk Detection Agent',
      summary: 'Velocity alert: Sprint points closed dipped -12% on Core Delivery Release Train',
      payload: {
        source: 'Jira Cloud',
        event: 'sprint_closed',
        velocityDelta: '-12%',
        impactedKRs: ['Cut Mortgage Approval to 48h']
      },
      latencyMs: 16,
      severity: 'danger'
    });
  };

  const activeFedCount = Object.values(fedPillars).filter(Boolean).length;

  const [orchestrationRuns, setOrchestrationRuns] = useState<OrchestrationRunRecord[]>(() =>
    normalizeOrchestrationRuns([
      { run: 'Run 1', stage: 'Strategy Explorer', successRate: 89.4, latencyMs: 1480, anomalyCount: 3, activeStage: 1, source: 'baseline' },
      { run: 'Run 2', stage: 'OKR Quality', successRate: 91.2, latencyMs: 1390, anomalyCount: 2, activeStage: 2, source: 'baseline' },
      { run: 'Run 3', stage: 'Alignment', successRate: 88.6, latencyMs: 1520, anomalyCount: 4, activeStage: 3, source: 'baseline' },
      { run: 'Run 4', stage: 'Risk Radar', successRate: 93.1, latencyMs: 1290, anomalyCount: 2, activeStage: 4, source: 'baseline' },
      { run: 'Run 5', stage: 'Executive Reporting', successRate: 90.8, latencyMs: 1340, anomalyCount: 3, activeStage: 5, source: 'baseline' },
      { run: 'Run 6', stage: 'Retrospective', successRate: 92.4, latencyMs: 1210, anomalyCount: 1, activeStage: 6, source: 'baseline' },
      { run: 'Run 7', stage: 'Strategy Explorer', successRate: 94.0, latencyMs: 1180, anomalyCount: 1, activeStage: 1, source: 'baseline' },
      { run: 'Run 8', stage: 'OKR Quality', successRate: 91.5, latencyMs: 1260, anomalyCount: 2, activeStage: 2, source: 'baseline' },
      { run: 'Run 9', stage: 'Alignment', successRate: 95.2, latencyMs: 1120, anomalyCount: 1, activeStage: 3, source: 'baseline' },
      { run: 'Run 10', stage: 'Risk Radar', successRate: 96.1, latencyMs: 1085, anomalyCount: 0, activeStage: 4, source: 'baseline' }
    ])
  );
  const [selectedWorkerAgent, setSelectedWorkerAgent] = useState<WorkerAgentStatusSummary | null>(null);
  const [selectedInsightStageId, setSelectedInsightStageId] = useState<number | null>(null);
  const [insightsPersistenceInfo, setInsightsPersistenceInfo] = useState<{
    source: 'mongodb' | 'memory';
    savedCount: number;
  } | null>(null);
  const [agentThresholdConfigs, setAgentThresholdConfigs] = useState<AgentAnomalyThresholdConfig[]>(
    () => buildDefaultAgentThresholdConfigs('Telco')
  );
  const [isThresholdPanelOpen, setIsThresholdPanelOpen] = useState(false);
  const [thresholdPersistenceSource, setThresholdPersistenceSource] = useState<'mongodb' | 'memory' | null>(null);
  const [isSavingThresholds, setIsSavingThresholds] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSelectedInsightStageId(null);
    setLastOrchestrationRunId(null);
    setAgentThresholdConfigs(buildDefaultAgentThresholdConfigs(selectedIndustry));

    void fetch(`/api/orchestration-runs?industry=${encodeURIComponent(selectedIndustry)}`)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.runs) && data.runs.length > 0) {
          const normalized = normalizeOrchestrationRuns(data.runs);
          setOrchestrationRuns(normalized);
          const isMongo = String(data.source || '').startsWith('mongodb');
          setInsightsPersistenceInfo({
            source: isMongo ? 'mongodb' : 'memory',
            savedCount: normalized.length * 6
          });
        }
      })
      .catch(() => {});

    void fetch(`/api/risk-sentinel/thresholds?industry=${encodeURIComponent(selectedIndustry)}`)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.configs) && data.configs.length > 0) {
          setAgentThresholdConfigs(normalizeAgentThresholdConfigs(data.configs, selectedIndustry));
          setThresholdPersistenceSource(String(data.source || '').startsWith('mongodb') ? 'mongodb' : 'memory');
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedIndustry]);

  const persistThresholdConfigs = useCallback(
    async (
      nextConfigs: AgentAnomalyThresholdConfig[],
      meta?: { updatedAgentId?: string; updatedStageId?: number; reset?: boolean }
    ) => {
      setIsSavingThresholds(true);
      try {
        const resp = await fetch('/api/risk-sentinel/thresholds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industry: selectedIndustry,
            configs: nextConfigs,
            updatedAgentId: meta?.updatedAgentId,
            updatedStageId: meta?.updatedStageId,
            reset: Boolean(meta?.reset)
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data?.configs)) {
            setAgentThresholdConfigs(normalizeAgentThresholdConfigs(data.configs, selectedIndustry));
          }
          setThresholdPersistenceSource(String(data?.source || '').startsWith('mongodb') ? 'mongodb' : 'memory');
        }
      } catch {
        // Local threshold state remains active
      } finally {
        setIsSavingThresholds(false);
      }
    },
    [selectedIndustry]
  );

  const handleUpdateStageSensitivity = useCallback(
    (stageId: number, sensitivity: AnomalySensitivityLevel) => {
      const next = applyStageSensitivityPreset(agentThresholdConfigs, stageId, sensitivity);
      setAgentThresholdConfigs(next);
      void persistThresholdConfigs(next, { updatedStageId: stageId });
    },
    [agentThresholdConfigs, persistThresholdConfigs]
  );

  const handleUpdateAgentThreshold = useCallback(
    (
      agentId: string,
      patch: {
        sensitivity?: AnomalySensitivityLevel;
        stdDevMultiplier?: number;
        minAnomalyFloor?: number;
      }
    ) => {
      const next = updateAgentThresholdConfig(agentThresholdConfigs, agentId, patch);
      setAgentThresholdConfigs(next);
      const targetStageId = next.find((c) => c.agentId === agentId)?.stageId;
      void persistThresholdConfigs(next, { updatedAgentId: agentId, updatedStageId: targetStageId });
    },
    [agentThresholdConfigs, persistThresholdConfigs]
  );

  const handleResetThresholds = useCallback(() => {
    const defaults = buildDefaultAgentThresholdConfigs(selectedIndustry);
    setAgentThresholdConfigs(defaults);
    void persistThresholdConfigs(defaults, { reset: true });
  }, [persistThresholdConfigs, selectedIndustry]);

  const orchestrationInsights = useMemo(() => orchestrationRuns.slice(-10), [orchestrationRuns]);

  const overviewAnomalyEvaluation = useMemo(
    () => evaluateOverviewAnomalySeries(orchestrationInsights, agentThresholdConfigs),
    [orchestrationInsights, agentThresholdConfigs]
  );

  const anomalyStats = overviewAnomalyEvaluation.stats;

  const anomalyChartData = useMemo(
    () =>
      overviewAnomalyEvaluation.points.map((pt) => ({
        ...pt.raw,
        anomalyCount: pt.anomalyCount,
        isAnomalySpike: pt.isAnomalySpike,
        stageSensitivity: pt.stageSensitivity,
        stageThreshold: pt.stageThreshold
      })),
    [overviewAnomalyEvaluation]
  );

  const stageOverviewCards = useMemo(
    () => computeAllStagesOverview(orchestrationInsights, agentThresholdConfigs),
    [orchestrationInsights, agentThresholdConfigs]
  );

  const matrixOkrs = useMemo(
    () => extractMatrixOkrs(currentIndustryBundle.traceability, nodesMap),
    [currentIndustryBundle.traceability, nodesMap]
  );

  const stageDrilldown = useMemo(
    () =>
      selectedInsightStageId !== null
        ? filterInsightsByStage(orchestrationInsights, selectedInsightStageId, agentThresholdConfigs)
        : null,
    [orchestrationInsights, selectedInsightStageId, agentThresholdConfigs]
  );

  const displayedInsightsRuns: OrchestrationRunRecord[] = stageDrilldown
    ? stageDrilldown.filteredRuns
    : orchestrationInsights;
  const activeAnomalyStats = stageDrilldown ? stageDrilldown.anomalyStats : anomalyStats;
  const activeAnomalyChartData = stageDrilldown ? stageDrilldown.filteredRuns : anomalyChartData;

  const successYAxisMin = useMemo(() => {
    if (displayedInsightsRuns.length === 0) return 70;
    const minRate = Math.min(...displayedInsightsRuns.map((r) => Number(r.successRate || 70)));
    return Math.max(40, Math.min(70, Math.floor(minRate / 5) * 5 - 5));
  }, [displayedInsightsRuns]);

  const handleSelectInsightStage = useCallback(
    async (stageId: number | null) => {
      if (stageId === null) {
        setSelectedInsightStageId(null);
        return;
      }

      const nextStage = selectedInsightStageId === stageId ? null : stageId;
      setSelectedInsightStageId(nextStage);

      if (nextStage !== null) {
        try {
          const resp = await fetch('/api/orchestration-stage-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              industry: selectedIndustry,
              stageId: nextStage,
              runs: orchestrationInsights
            })
          });
          if (resp.ok) {
            const payload = await resp.json();
            setInsightsPersistenceInfo({
              source: payload.persistence === 'mongodb' ? 'mongodb' : 'memory',
              savedCount: Number(payload.savedCount || orchestrationInsights.length * 6)
            });
          }
        } catch {
          // Non-fatal fallback
        }
      }
    },
    [orchestrationInsights, selectedIndustry, selectedInsightStageId]
  );

  const handleChartDrilldownClick = useCallback(
    (chartState: any) => {
      const payload = chartState?.activePayload?.[0]?.payload;
      if (!payload) return;
      const targetStage = Number(payload.activeStage || 1);
      if (targetStage >= 1 && targetStage <= 6) {
        void handleSelectInsightStage(targetStage);
      }
    },
    [handleSelectInsightStage]
  );

  const [liveWorkerAgentStatuses, setLiveWorkerAgentStatuses] = useState<Array<{
    id: string;
    name: string;
    status: 'active' | 'idle' | 'error';
    label: string;
    reason?: string;
    action?: string;
  }>>([]);

  useEffect(() => {
    let isMounted = true;
    const activeCrisisCount = activeDisasters.filter((d) => d.active).length;

    const loadWorkerAgentStatus = async () => {
      try {
        const response = await fetch(
          `/api/worker-agent-status?industry=${encodeURIComponent(selectedIndustry)}&disasterCount=${activeCrisisCount}`
        );
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        const agentStatuses = Array.isArray(payload?.agentStatuses) ? payload.agentStatuses : [];
        if (!isMounted || agentStatuses.length === 0) {
          return;
        }
        setLiveWorkerAgentStatuses(agentStatuses.map((agent: any) => {
          const status = agent.status === 'error' ? 'error' : agent.status === 'active' ? 'active' : 'idle';
          return {
            id: String(agent.id || agent.name || Math.random()),
            name: String(agent.name || 'Worker Agent'),
            status: status as 'active' | 'idle' | 'error',
            label: String(agent.label || (status === 'error' ? 'Error' : status === 'active' ? 'Active' : 'Idle')),
            reason: typeof agent.reason === 'string' ? agent.reason : undefined,
            action: typeof agent.action === 'string' ? agent.action : undefined
          };
        }));
      } catch {
        // Fallback to the deterministic local status view below.
      }
    };

    void loadWorkerAgentStatus();
    return () => {
      isMounted = false;
    };
  }, [selectedIndustry, activeDisasters, activeStageId, isOrchestratingAll]);

  const workerAgentStatuses = useMemo<Array<{ id: string; name: string; status: 'active' | 'idle' | 'error'; label: string; reason?: string; action?: string }>>(() => {
    const workerNames = [
      'Strategy Explorer',
      'OKR Quality Auditor',
      'Alignment Capacity Agent',
      'Risk Sentinel',
      'Executive Reporter',
      'Retrospective Learner'
    ];
    const activeCrisisCount = activeDisasters.filter((d) => d.active).length;

    const baseStatuses: Array<{
      id: string;
      name: string;
      status: 'active' | 'idle' | 'error';
      label: string;
      reason: string;
      action: string;
    }> = workerNames.map((name, index) => {
      const isInErrorState = activeCrisisCount > 0 && [1, 3, 5].includes(index);
      const isActive = isOrchestratingAll && activeStageId === index + 1;
      const status: 'active' | 'idle' | 'error' = isInErrorState ? 'error' : isActive ? 'active' : 'idle';

      return {
        id: `${index + 1}`,
        name,
        status,
        label: isInErrorState ? 'Error' : isActive ? 'Active' : 'Idle',
        reason: isInErrorState
          ? 'Detected operational drift or a risk signal that requires human review before the next stage continues.'
          : isActive
            ? 'Healthy orchestration path — this agent is actively processing the current stage.'
            : 'Idle; waiting for the next orchestration event or intervention trigger.',
        action: isInErrorState
          ? 'Review the risk alert, collect the current evidence, then authorize the next safe remediation step.'
          : isActive
            ? 'Continue the active workflow and monitor the stage completion signal.'
            : 'Await the next stage trigger and keep the queue ready for execution.'
      };
    });

    if (liveWorkerAgentStatuses.length === 0) {
      return baseStatuses;
    }

    return liveWorkerAgentStatuses.map((agent): {
      id: string;
      name: string;
      status: 'active' | 'idle' | 'error';
      label: string;
      reason?: string;
      action?: string;
    } => ({
      ...agent,
      status: agent.status === 'error' ? 'error' : agent.status === 'active' ? 'active' : 'idle',
      label: agent.label || (agent.status === 'error' ? 'Error' : agent.status === 'active' ? 'Active' : 'Idle'),
      reason: agent.reason || 'Live status retrieved from the active orchestration telemetry.',
      action: agent.action || 'Monitor the current stage and continue the recommended workflow.'
    }));
  }, [activeDisasters, activeStageId, isOrchestratingAll, liveWorkerAgentStatuses]);

  const orderedWorkspaceViews = useMemo(() => {
    const order = normalizeNavOrder(userPreferences.navButtonOrder);
    return order
      .map((viewId) => WORKSPACE_VIEWS.find((view) => view.id === viewId))
      .filter((view): view is (typeof WORKSPACE_VIEWS)[number] => Boolean(view));
  }, [userPreferences.navButtonOrder]);

  const handleReorderLeftNav = useCallback((source: ActiveNavView, target: ActiveNavView) => {
    const nextOrder = reorderSecondaryNavButtons(userPreferences.navButtonOrder, source, target);
    handleUpdateNavButtonOrder(nextOrder);
  }, [handleUpdateNavButtonOrder, userPreferences.navButtonOrder]);

  const isCustomWorkspaceOrder = !areNavOrdersEqual(userPreferences.navButtonOrder, DEFAULT_NAV_ORDER);

  const canCreateOkr = capabilities.canCreateOkr;
  const canExecuteLifecycle = capabilities.canExecuteLifecycle;
  const canMonitor = capabilities.canMonitor;
  const canEscalateNotification = capabilities.canEscalateNotification;
  const canManagePolicy = capabilities.canManagePolicy;
  const canManageDashboards = capabilities.canManageDashboards;

  const handleCreateIndustry = async () => {
    if (!industryDraft.name.trim()) {
      setAdminMessage('Industry name is required.');
      return;
    }
    setIsSubmittingAdmin(true);
    setAdminMessage(null);
    try {
      const id = industryDraft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const response = await fetch('/api/admin/industries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...industryDraft,
          id,
          policies: [policyDraft.name]
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to create industry.');
      }
      const normalizedIndustry = normalizeIndustryBundle({
        ...payload.industry,
        id: payload.industry.id || id,
        name: payload.industry.name,
        sector: payload.industry.sector || 'Enterprise',
        quarter: payload.industry.quarter || 'Q1 2027',
        orgDirectory: payload.industry.orgDirectory || [],
        policies: payload.industry.policies || [],
        programs: payload.industry.programs || [],
        activeDisasters: payload.industry.activeDisasters || [],
        knowledgeBase: payload.industry.knowledgeBase || [],
        traceability: payload.industry.traceability || {},
        nodeMap: payload.industry.nodeMap || {}
      });
      setIndustriesDict((prev) => ({ ...prev, [normalizedIndustry.name]: normalizedIndustry }));
      setSelectedIndustry(normalizedIndustry.name);
      setIndustryDraft({
        name: 'FinTech',
        sector: 'Financial Services',
        quarter: 'Q2 2027',
        description: 'Digital finance operating model with policy-driven risk controls.'
      });
      setAdminMessage(`Industry “${payload.industry.name}” created and saved to MongoDB or in-memory store.`);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Industry could not be created.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!policyDraft.name.trim() || !selectedIndustry.trim()) {
      setAdminMessage('Policy name and an active industry are required.');
      return;
    }
    setIsSubmittingAdmin(true);
    try {
      const response = await fetch('/api/admin/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...policyDraft,
          industry: selectedIndustry,
          id: `${selectedIndustry}-${policyDraft.name}`.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase()
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to add policy.');
      }
      setPolicies((prev) => [
        ...prev,
        {
          id: payload.policy.id,
          ruleName: payload.policy.name,
          category: 'Ownership',
          description: payload.policy.description,
          minMeasurableScore: 70,
          minAmbitionScore: 70,
          maxKrsPerObjective: 3,
          mandatoryMetadataFields: ['owner', 'targetDate', 'metrics'],
          governanceFrequency: 'Monthly',
          status: 'Enforced'
        }
      ]);
      setAdminMessage(`Policy “${payload.policy.name}” was added to ${selectedIndustry}.`);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Policy could not be saved.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteDraft.name.trim() || !inviteDraft.email.trim() || !inviteDraft.industry.trim()) {
      setAdminMessage('Invite requires name, email, and industry.');
      return;
    }
    setIsSubmittingAdmin(true);
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inviteDraft,
          permissions: inviteDraft.permissions.split(',').map((value) => value.trim()).filter(Boolean)
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Invite could not be sent.');
      }
      setRegistrationDraft((prev) => ({
        ...prev,
        name: inviteDraft.name,
        email: inviteDraft.email,
        role: inviteDraft.role,
        industry: inviteDraft.industry
      }));
      setAdminUsers((prev) => [{
        id: payload.invite.id,
        name: payload.invite.name,
        email: payload.invite.email,
        role: payload.invite.role,
        industry: payload.invite.industry,
        permissions: payload.invite.permissions || [],
        status: 'invited',
        firebaseEnabled: true,
        createdAt: payload.invite.createdAt
      }, ...prev]);
      setAdminMessage(`Registration invite sent to ${inviteDraft.email}. Share the registration link or complete onboarding below.`);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Failed to create invitation.');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleCompleteFirebaseRegistration = async () => {
    if (!registrationDraft.email.trim() || !registrationDraft.password.trim()) {
      setAdminMessage('Email and password are required to complete the registration flow.');
      return;
    }
    if (registrationDraft.password !== registrationDraft.confirmPassword) {
      setAdminMessage('Password and confirm password must match.');
      return;
    }
    setIsRegisteringUser(true);
    setAdminMessage(null);
    try {
      let createdUid = `local-${Date.now()}`;
      let firebaseCreated = false;
      try {
        // Use a dedicated secondary Firebase app so registering another user does not overwrite Super Admin's session
        const registrarApp =
          getApps().find((a) => a.name === 'admin-registrar') ||
          initializeApp(auth.app.options, 'admin-registrar');
        const registrarAuth = getAuth(registrarApp);
        const credential = await createUserWithEmailAndPassword(
          registrarAuth,
          registrationDraft.email.trim(),
          registrationDraft.password
        );
        await updateProfile(credential.user, {
          displayName: registrationDraft.name.trim() || registrationDraft.email.trim()
        });
        createdUid = credential.user.uid;
        firebaseCreated = true;
        await signOut(registrarAuth).catch(() => {});
      } catch (fbError: any) {
        const code = String(fbError?.code || '');
        if (code === 'auth/email-already-in-use' || code === 'auth/operation-not-allowed') {
          createdUid = `profile-${Date.now()}`;
        } else {
          throw fbError;
        }
      }

      const defaultPermissions =
        registrationDraft.role === 'super-admin'
          ? ['all']
          : registrationDraft.role === 'monitor'
            ? ['monitor', 'trace', 'notify', 'escalate']
            : registrationDraft.role === 'policy-manager'
              ? ['manage-policy', 'view-dashboards', 'manage-dashboards']
              : ['create-okr', 'execute-lifecycle'];

      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: createdUid,
          name: registrationDraft.name,
          email: registrationDraft.email,
          role: registrationDraft.role,
          industry: registrationDraft.industry,
          permissions: defaultPermissions
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'User profile could not be saved.');
      }
      setAdminUsers((prev) => [{
        id: payload.user.id,
        uid: payload.user.uid,
        name: payload.user.name,
        email: payload.user.email,
        role: payload.user.role,
        industry: payload.user.industry,
        permissions: payload.user.permissions || defaultPermissions,
        status: 'active',
        firebaseEnabled: firebaseCreated,
        createdAt: payload.user.createdAt
      }, ...prev.filter((u) => u.email.toLowerCase() !== payload.user.email.toLowerCase())]);
      setAdminMessage(
        firebaseCreated
          ? `Registered ${registrationDraft.email} in Firebase Auth & MongoDB — now selectable in the User Switcher.`
          : `Registered ${registrationDraft.email} in MongoDB/App Role Directory (selectable in the User Switcher).`
      );
      setRegistrationDraft((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsRegisteringUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Global Navigation & Brand Header */}
      <Header
        industry={industry}
        industriesList={industriesList}
        selectedIndustry={selectedIndustry}
        onSelectIndustry={handleSelectIndustry}
        activeView={activeView}
        onSelectView={setActiveView}
        userPreferences={userPreferences}
        onUpdateNavButtonOrder={handleUpdateNavButtonOrder}
        eventCount={events.length}
        isEventBusOpen={isEventBusOpen}
        onToggleEventBus={() => setIsEventBusOpen((prev) => !prev)}
        onOpenAddCustomIndustry={() => setIsAddCustomIndustryOpen(true)}
        onOpenGovernance={() => setIsGovernanceOpen(true)}
        activeDisasterCount={activeDisasters.filter((d) => d.active).length}
        notifications={portfolioNotifications}
        readNotificationIds={readNotificationIds}
        dismissedNotificationIds={dismissedNotificationIds}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onDismissNotification={handleDismissNotification}
        onOpenNotification={handleOpenNotification}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
        onOpenAgenticValidator={() => setIsAgenticValidatorOpen(true)}
        demoUsers={selectableDemoUsers}
        currentDemoUser={activeDemoUser}
        onSelectDemoUser={setActiveDemoUser}
        workerAgentStatuses={workerAgentStatuses}
        onSelectWorkerAgent={setSelectedWorkerAgent}
        canCreateOkr={canCreateOkr}
        canMonitor={canMonitor}
        canEscalateNotification={canEscalateNotification}
        canManagePolicy={canManagePolicy}
        canManageDashboards={canManageDashboards}
        activeUserRoleSummary={capabilities.roleSummary}
        assignedIndustry={capabilities.assignedIndustry}
        onSendEscalation={handleSendEscalation}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <div className={`grid grid-cols-1 gap-6 ${isNavCollapsed ? 'lg:grid-cols-[88px_minmax(0,1fr)] xl:grid-cols-[88px_minmax(0,1fr)]' : 'lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]'}`}>
          <aside className={`rounded-2xl border border-slate-200 bg-white p-3 shadow-sm h-fit sticky top-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isNavCollapsed ? 'lg:w-[88px]' : 'lg:w-auto'}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              {!isNavCollapsed && (
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">Primary Workspace Views</p>
                  <h2 className="mt-2 text-base font-bold text-slate-900">Workspace Navigation</h2>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsNavCollapsed((prev) => !prev)}
                aria-label={isNavCollapsed ? 'Expand workspace navigation' : 'Collapse workspace navigation'}
                className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900 transition-colors"
              >
                {isNavCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
            <nav className="grid gap-2">
              {orderedWorkspaceViews.map((view) => {
                const selected = activeView === view.id;
                const Icon = WORKSPACE_VIEW_ICONS[view.id];
                return (
                  <button
                    key={view.id}
                    type="button"
                    draggable
                    onDragStart={(event) => {
                      setDraggedNavView(view.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', view.id);
                    }}
                    onDragOver={(event) => {
                      if (!draggedNavView || draggedNavView === view.id) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const source = draggedNavView ?? (event.dataTransfer.getData('text/plain') as ActiveNavView | '');
                      if (!source || source === view.id || source === 'studio') return;
                      handleReorderLeftNav(source, view.id);
                      setDraggedNavView(null);
                    }}
                    onDragEnd={() => setDraggedNavView(null)}
                    onClick={() => setActiveView(view.id)}
                    className={`group relative flex w-full items-center rounded-xl border px-2.5 py-2.5 text-left transition-all duration-200 ease-out ${isNavCollapsed ? 'justify-center' : 'gap-3'} ${
                      selected
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-800 shadow-sm ring-1 ring-indigo-200'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                    }`}
                    aria-label={view.label}
                    title={isNavCollapsed ? view.label : undefined}
                  >
                    {!isNavCollapsed && (
                      <span
                        className="absolute right-2 top-2 flex cursor-grab items-center justify-center rounded-md border border-slate-200 bg-white/90 p-1.5 text-slate-500 opacity-0 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:opacity-100 group-hover:border-slate-300 group-hover:text-slate-700"
                        title="Drag to reorder"
                        aria-label="Drag to reorder"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                          <circle cx="8" cy="6" r="1.5" />
                          <circle cx="8" cy="12" r="1.5" />
                          <circle cx="8" cy="18" r="1.5" />
                          <circle cx="16" cy="6" r="1.5" />
                          <circle cx="16" cy="12" r="1.5" />
                          <circle cx="16" cy="18" r="1.5" />
                        </svg>
                      </span>
                    )}
                    <span className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                      selected
                        ? 'border-indigo-200 bg-indigo-100 text-indigo-700 shadow-inner'
                        : 'border-slate-200 bg-white text-slate-600 group-hover:border-slate-300 group-hover:text-slate-900'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {!isNavCollapsed && (
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-none">{view.label}</span>
                        <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{view.description}</span>
                      </span>
                    )}
                    {!isNavCollapsed && selected && <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-sm" />}
                  </button>
                );
              })}

              {isCustomWorkspaceOrder && (
                <button
                  type="button"
                  onClick={() => handleUpdateNavButtonOrder(DEFAULT_NAV_ORDER)}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition-colors hover:bg-white hover:text-slate-900 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Reset left nav order
                </button>
              )}

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('studio');
                    setIsAdminConsoleOpen(true);
                  }}
                  className={`group relative flex w-full items-center rounded-xl border px-2.5 py-2.5 text-left transition-all duration-200 ease-out ${isNavCollapsed ? 'justify-center' : 'gap-3'} border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100`}
                  aria-label="Admin Console"
                  title={isNavCollapsed ? 'Admin Console' : undefined}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-100 text-amber-700">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  {!isNavCollapsed && (
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-none">Admin Console</span>
                      <span className="mt-1 block text-[10px] leading-relaxed text-amber-700">Policies & user registration</span>
                    </span>
                  )}
                </button>
              )}
            </nav>

            {!isNavCollapsed && isSuperAdmin && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 transition-all duration-200 hover:shadow-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">Super Admin</p>
                <h3 className="mt-2 text-sm font-bold text-slate-900">Industry & User Console</h3>
                <ul className="mt-3 space-y-1.5 text-[11px] text-slate-700">
                  <li>• Create industries and governance policies</li>
                  <li>• Invite and register enterprise users</li>
                  <li>• Link users to role-based permissions</li>
                </ul>
              </div>
            )}
          </aside>

          <div className="space-y-6">
            {!capabilities.industryAccessAllowed && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                <span>
                  <strong className="font-bold">Industry Scope Notice:</strong> {activeDemoUser.name} ({activeDemoUser.label}) is assigned to{' '}
                  <strong>{capabilities.assignedIndustry}</strong> while viewing {selectedIndustry}.
                </span>
                {industriesDict[capabilities.assignedIndustry] && (
                  <button
                    type="button"
                    onClick={() => handleSelectIndustry(capabilities.assignedIndustry)}
                    className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Switch to {capabilities.assignedIndustry}
                  </button>
                )}
              </div>
            )}

            {!canCreateOkr && canManageDashboards && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900">
                <span>
                  <strong className="font-bold">Policy &amp; Reporting Manager Scope:</strong> {capabilities.roleSummary}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGovernanceOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Manage Org Policies
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('performance')}
                    className="px-2.5 py-1 rounded-lg border border-indigo-300 bg-white hover:bg-indigo-100 text-indigo-800 text-[11px] font-semibold cursor-pointer"
                  >
                    Reporting Dashboards
                  </button>
                </div>
              </div>
            )}

            <section
              data-testid="orchestration-insights-card"
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                      Orchestration Insights
                    </p>
                    {stageDrilldown && (
                      <span
                        data-testid="drilldown-stage-badge"
                        className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700"
                      >
                        Drilldown · Stage {stageDrilldown.stageId}
                      </span>
                    )}
                    {insightsPersistenceInfo && (
                      <span
                        data-testid="insights-persistence-badge"
                        className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 tabular-nums"
                      >
                        {insightsPersistenceInfo.source === 'mongodb' ? 'MongoDB Saved' : 'Synced'} ({insightsPersistenceInfo.savedCount} stage snapshots)
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                    {stageDrilldown
                      ? `Stage ${stageDrilldown.stageId}: ${stageDrilldown.stageName} — Constituent Agents`
                      : '6-Stage Multi-Agent Pipeline Health'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {stageDrilldown
                      ? `${stageDrilldown.processFlowAgent} · Showing metrics filtered for ${stageDrilldown.stageName} across the last ${stageDrilldown.runCount} runs.`
                      : 'Click any stage below or any point on a chart to filter metrics for that stage and inspect its constituent agents.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {stageDrilldown && (
                    <button
                      type="button"
                      data-testid="exit-drilldown-btn"
                      onClick={() => void handleSelectInsightStage(null)}
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-[11px] font-semibold text-white cursor-pointer"
                    >
                      All 6 Stages
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="configure-thresholds-btn"
                    aria-expanded={isThresholdPanelOpen}
                    onClick={() => setIsThresholdPanelOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                      isThresholdPanelOpen
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    Thresholds
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 tabular-nums">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    Last {displayedInsightsRuns.length} runs tracked
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInsightsCollapsed((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                  >
                    {isInsightsCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>
              </div>

              {!isInsightsCollapsed && (
                <div className="space-y-4">
                  {isThresholdPanelOpen && (
                    <RiskSentinelThresholdPanel
                      industryName={currentIndustryBundle.name}
                      configs={agentThresholdConfigs}
                      selectedStageId={selectedInsightStageId}
                      persistenceSource={thresholdPersistenceSource}
                      isSaving={isSavingThresholds}
                      onUpdateStagePreset={handleUpdateStageSensitivity}
                      onUpdateAgentConfig={handleUpdateAgentThreshold}
                      onSelectStage={(stageId) => void handleSelectInsightStage(stageId)}
                      onResetDefaults={handleResetThresholds}
                      onClose={() => setIsThresholdPanelOpen(false)}
                    />
                  )}

                  {/* Interactive 6-Stage Drilldown Selector */}
                  <div
                    data-testid="insights-stage-selector"
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
                  >
                    {stageOverviewCards.map((stageCard) => {
                      const isSelected = selectedInsightStageId === stageCard.stageId;
                      const confidenceTextClass =
                        stageCard.confidenceBand === 'high'
                          ? 'text-emerald-700'
                          : stageCard.confidenceBand === 'moderate'
                            ? 'text-amber-700'
                            : 'text-red-700';
                      const confidenceBarClass =
                        stageCard.confidenceBand === 'high'
                          ? 'bg-emerald-500'
                          : stageCard.confidenceBand === 'moderate'
                            ? 'bg-amber-500'
                            : 'bg-red-500';
                      return (
                        <button
                          key={stageCard.stageId}
                          type="button"
                          data-testid={`insight-stage-card-${stageCard.stageId}`}
                          aria-pressed={isSelected}
                          onClick={() => void handleSelectInsightStage(stageCard.stageId)}
                          className={`text-left rounded-xl border p-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/90 ring-1 ring-indigo-500 shadow-xs'
                              : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 ${
                                isSelected ? 'text-indigo-700' : 'text-slate-500'
                              }`}
                            >
                              Stage {stageCard.stageId}
                            </span>
                            <span
                              data-testid={`insight-stage-sensitivity-${stageCard.stageId}`}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border whitespace-nowrap shrink-0 ${
                                stageCard.sensitivity === 'high'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : stageCard.sensitivity === 'balanced'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {stageCard.sensitivity === 'balanced'
                                ? 'Bal'
                                : SENSITIVITY_PRESETS[stageCard.sensitivity].shortLabel}{' '}
                              · ≥{stageCard.minAnomalyFloor}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-bold text-slate-900 truncate">
                            {stageCard.stageName}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-600 tabular-nums">
                            <span>{stageCard.avgSuccessRate.toFixed(1)}%</span>
                            <span className={stageCard.spikeRunCount > 0 ? 'font-bold text-red-700' : 'text-slate-600'}>
                              {stageCard.spikeRunCount} spike{stageCard.spikeRunCount === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-200/70">
                            <div className="flex items-center justify-between text-[10px] leading-tight">
                              <span className="font-medium text-slate-500">Confidence</span>
                              <span
                                data-testid={`stage-confidence-value-${stageCard.stageId}`}
                                className={`font-bold tabular-nums ${confidenceTextClass}`}
                              >
                                {stageCard.confidenceScore}%
                              </span>
                            </div>
                            <div
                              role="progressbar"
                              aria-valuenow={stageCard.confidenceScore}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${stageCard.stageName} confidence score ${stageCard.confidenceScore}%`}
                              data-testid={`stage-confidence-bar-${stageCard.stageId}`}
                              className="mt-1 h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden"
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${confidenceBarClass}`}
                                style={{ width: `${stageCard.confidenceScore}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 3 Filtered Metric Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="h-64 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {stageDrilldown ? `${stageDrilldown.stageName} Success Rate` : 'Success Rate Trend'}
                        </span>
                        {stageDrilldown && (
                          <span className="text-[11px] font-semibold text-indigo-700 tabular-nums whitespace-nowrap">
                            Avg {stageDrilldown.avgSuccessRate.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                        <LineChart
                          data={displayedInsightsRuns}
                          onClick={handleChartDrilldownClick}
                          margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                          className="cursor-pointer"
                        >
                          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="run" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[successYAxisMin, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(value, _name, item) => [
                              `${Number(value ?? 0).toFixed(1)}% (${item?.payload?.stage || 'Pipeline'})`,
                              'Success rate'
                            ]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="successRate"
                            name={stageDrilldown ? `${stageDrilldown.stageName} Success` : 'Success rate'}
                            stroke="#4f46e5"
                            strokeWidth={2.5}
                            dot={{ r: 3.5, cursor: 'pointer' }}
                            activeDot={{ r: 6, cursor: 'pointer' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {stageDrilldown ? `${stageDrilldown.stageName} Latency (ms)` : 'Latency (ms)'}
                        </span>
                        {stageDrilldown && (
                          <span className="text-[11px] font-semibold text-teal-700 tabular-nums whitespace-nowrap">
                            Avg {stageDrilldown.avgLatencyMs} ms
                          </span>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                          data={displayedInsightsRuns}
                          onClick={handleChartDrilldownClick}
                          margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
                          className="cursor-pointer"
                        >
                          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="run" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(value, _name, item) => [
                              `${Number(value ?? 0).toFixed(0)} ms (${item?.payload?.stage || 'Pipeline'})`,
                              'Latency'
                            ]}
                          />
                          <Legend />
                          <Bar
                            dataKey="latencyMs"
                            name={stageDrilldown ? `${stageDrilldown.stageName} Latency` : 'Latency'}
                            fill="#14b8a6"
                            radius={[6, 6, 0, 0]}
                            cursor="pointer"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div
                      data-testid="historical-anomaly-chart"
                      className="h-64 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {stageDrilldown ? `${stageDrilldown.stageName}` : 'Anomaly Frequency'}
                          </span>
                          <span
                            data-testid="anomaly-active-sensitivity-badge"
                            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 ${
                              activeAnomalyStats.sensitivity === 'high'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : activeAnomalyStats.sensitivity === 'balanced'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {SENSITIVITY_PRESETS[activeAnomalyStats.sensitivity].shortLabel}
                          </span>
                        </div>
                        <span
                          data-testid="anomaly-mean-summary"
                          className={`text-[10px] font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                            activeAnomalyStats.spikeRunCount > 0 ? 'text-red-700' : 'text-slate-600'
                          }`}
                        >
                          Mean {activeAnomalyStats.mean.toFixed(1)} · ≥{activeAnomalyStats.effectiveThreshold.toFixed(1)} · {activeAnomalyStats.spikeRunCount} spike{activeAnomalyStats.spikeRunCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height="90%">
                        <AreaChart
                          data={activeAnomalyChartData}
                          onClick={handleChartDrilldownClick}
                          margin={{ top: 18, right: 12, left: -12, bottom: 0 }}
                          className="cursor-pointer"
                        >
                          <defs>
                            <linearGradient id="anomalyFrequencyFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.22} />
                              <stop offset="95%" stopColor="#64748b" stopOpacity={0.04} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="run" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(value, _name, item) => {
                              const count = Number(value ?? 0);
                              const payload = item?.payload || {};
                              const isSpike = Boolean(payload.isAnomalySpike);
                              const sensitivityTag = payload.stageSensitivity
                                ? SENSITIVITY_PRESETS[payload.stageSensitivity as AnomalySensitivityLevel]?.shortLabel || payload.stageSensitivity
                                : SENSITIVITY_PRESETS[activeAnomalyStats.sensitivity].shortLabel;
                              const cutoff = Number(payload.stageThreshold ?? activeAnomalyStats.effectiveThreshold);
                              return [
                                `${count} anomalies (${sensitivityTag} sensitivity · Cutoff ≥ ${cutoff.toFixed(1)} · Mean ${activeAnomalyStats.mean.toFixed(1)})`,
                                isSpike ? `Alert Spike · ${payload.stage || 'Risk Sentinel'}` : `${payload.stage || 'Risk Sentinel'}`
                              ];
                            }}
                          />
                          <Legend />
                          <ReferenceLine
                            y={activeAnomalyStats.mean}
                            stroke="#475569"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            ifOverflow="extendDomain"
                            label={{
                              value: `Mean (${activeAnomalyStats.mean.toFixed(1)})`,
                              position: 'insideBottomRight',
                              dy: 12,
                              fill: '#475569',
                              fontSize: 10,
                              fontWeight: 700
                            }}
                          />
                          <ReferenceLine
                            y={activeAnomalyStats.effectiveThreshold}
                            stroke="#dc2626"
                            strokeDasharray="2 3"
                            strokeWidth={1.5}
                            ifOverflow="extendDomain"
                            label={{
                              value: `Threshold (${activeAnomalyStats.effectiveThreshold.toFixed(1)} · ${SENSITIVITY_PRESETS[activeAnomalyStats.sensitivity].shortLabel})`,
                              position: 'insideTopRight',
                              dy: -14,
                              fill: '#b91c1c',
                              fontSize: 10,
                              fontWeight: 700
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="anomalyCount"
                            name="Anomalies (Red = Spike)"
                            stroke="#64748b"
                            strokeWidth={2}
                            fill="url(#anomalyFrequencyFill)"
                            dot={(dotProps: any) => {
                              const { cx, cy, payload, index } = dotProps;
                              if (typeof cx !== 'number' || typeof cy !== 'number') {
                                return <g key={`empty-dot-${index}`} />;
                              }
                              if (payload?.isAnomalySpike) {
                                return (
                                  <circle
                                    key={`anomaly-spike-dot-${index}`}
                                    cx={cx}
                                    cy={cy}
                                    r={5.5}
                                    fill="#dc2626"
                                    stroke="#fecaca"
                                    strokeWidth={2.5}
                                    data-anomaly-spike="true"
                                  />
                                );
                              }
                              return (
                                <circle
                                  key={`anomaly-normal-dot-${index}`}
                                  cx={cx}
                                  cy={cy}
                                  r={3}
                                  fill="#475569"
                                  stroke="#ffffff"
                                  strokeWidth={1.5}
                                  data-anomaly-spike="false"
                                />
                              );
                            }}
                            activeDot={(dotProps: any) => {
                              const { cx, cy, payload, index } = dotProps;
                              if (typeof cx !== 'number' || typeof cy !== 'number') {
                                return <g key={`empty-active-${index}`} />;
                              }
                              const isSpike = Boolean(payload?.isAnomalySpike);
                              return (
                                <circle
                                  key={`anomaly-active-dot-${index}`}
                                  cx={cx}
                                  cy={cy}
                                  r={isSpike ? 7 : 5}
                                  fill={isSpike ? '#dc2626' : '#334155'}
                                  stroke={isSpike ? '#fee2e2' : '#e2e8f0'}
                                  strokeWidth={2.5}
                                />
                              );
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* D3-based Agent Impact Matrix Heatmap */}
                  <AgentImpactMatrixHeatmap
                    runs={orchestrationInsights}
                    okrs={matrixOkrs}
                    thresholdConfigs={agentThresholdConfigs}
                    selectedStageId={selectedInsightStageId}
                    industryName={currentIndustryBundle.name}
                    onSelectStage={(stageId) => void handleSelectInsightStage(stageId)}
                  />

                  {/* Constituent Agents Drilldown Table */}
                  {stageDrilldown && (
                    <div
                      data-testid="stage-constituent-agents-panel"
                      className="rounded-xl border border-indigo-200 bg-slate-50/70 p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600">
                              Stage {stageDrilldown.stageId} Constituent Agents
                            </p>
                            <span className="rounded border border-indigo-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700 tabular-nums">
                              Stage Sensitivity: {SENSITIVITY_PRESETS[stageDrilldown.thresholdSummary.sensitivity].shortLabel} (+{stageDrilldown.thresholdSummary.stdDevMultiplier.toFixed(2)}σ · Min ≥{stageDrilldown.thresholdSummary.minAnomalyFloor})
                            </span>
                            <span
                              data-testid="stage-drilldown-confidence-badge"
                              className={`rounded border px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                                stageDrilldown.confidenceBand === 'high'
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : stageDrilldown.confidenceBand === 'moderate'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-red-200 bg-red-50 text-red-700'
                              }`}
                            >
                              Confidence: {stageDrilldown.confidenceScore}%
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                            {stageDrilldown.stageName} ({stageDrilldown.processFlowAgent})
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const matchedWorker = workerAgentStatuses.find(
                              (w) =>
                                w.id === stageDrilldown.primaryWorkerId ||
                                w.name.toLowerCase() === stageDrilldown.primaryWorkerName.toLowerCase()
                            );
                            if (matchedWorker) {
                              setSelectedWorkerAgent(matchedWorker);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 cursor-pointer shrink-0"
                        >
                          Inspect {stageDrilldown.primaryWorkerName} Logs
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {stageDrilldown.constituentAgents.map((agent) => (
                          <div
                            key={agent.agentId}
                            data-testid={`constituent-agent-card-${agent.agentId}`}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate">{agent.agentName}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                  {agent.processFlowRole}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 border ${
                                  agent.status === 'critical'
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : agent.status === 'warning'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {agent.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs tabular-nums">
                              <div>
                                <p className="text-[10px] text-slate-500">Success</p>
                                <p className="font-bold text-slate-900">{agent.avgSuccessRate.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500">Latency</p>
                                <p className="font-bold text-slate-900">{agent.avgLatencyMs}ms</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500">Anomalies</p>
                                <p className={`font-bold ${agent.totalAnomalies > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                                  {agent.totalAnomalies}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
                              <span className="text-slate-600 tabular-nums">
                                Threshold:{' '}
                                <strong className="text-slate-800">
                                  +{agent.stdDevMultiplier.toFixed(2)}σ · ≥{agent.minAnomalyFloor}
                                </strong>
                              </span>
                              <select
                                aria-label={`Sensitivity for ${agent.agentName}`}
                                data-testid={`drilldown-agent-sensitivity-${agent.agentId}`}
                                value={agent.sensitivity}
                                onChange={(e) =>
                                  handleUpdateAgentThreshold(agent.agentId, {
                                    sensitivity: e.target.value as AnomalySensitivityLevel
                                  })
                                }
                                className="rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-800 cursor-pointer"
                              >
                                <option value="high">High</option>
                                <option value="balanced">Balanced</option>
                                <option value="low">Low</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
            {lastOrchestrationSummary && (
              <section
                data-testid="orchestration-run-summary"
                aria-label="Latest Industry Orchestration Summary"
                className="rounded-xl border border-indigo-200 bg-white px-4 py-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-indigo-700 uppercase tracking-wide">
                      Industry Orchestration Completed
                    </span>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {lastOrchestrationSummary.headline}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {lastOrchestrationSummary.recommendations[0]}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView('studio');
                      setRequestedStudioTarget({ tab: 'okrs', nonce: Date.now() });
                    }}
                    className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Review in OKR &amp; Program Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setLastOrchestrationSummary(null)}
                    className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </section>
            )}

            {isSuperAdmin && isAdminConsoleOpen && (
              <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">Admin Console</p>
                    <h3 className="text-lg font-bold text-slate-900">Industry Setup, Policies & User Registration</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {adminMessage && (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10px] font-bold">{adminMessage}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsAdminConsoleOpen(false)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    >
                      Close Console
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">Create Industry</h4>
                    <input value={industryDraft.name} onChange={(e) => setIndustryDraft((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Industry name" />
                    <input value={industryDraft.sector} onChange={(e) => setIndustryDraft((prev) => ({ ...prev, sector: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Sector" />
                    <input value={industryDraft.quarter} onChange={(e) => setIndustryDraft((prev) => ({ ...prev, quarter: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Quarter" />
                    <textarea value={industryDraft.description} onChange={(e) => setIndustryDraft((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs min-h-[80px]" placeholder="Industry description" />
                    <button type="button" onClick={handleCreateIndustry} disabled={isSubmittingAdmin} className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 cursor-pointer">{isSubmittingAdmin ? 'Creating...' : 'Create Industry'}</button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">Create Policy</h4>
                    <input value={policyDraft.name} onChange={(e) => setPolicyDraft((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Policy name" />
                    <select value={policyDraft.type} onChange={(e) => setPolicyDraft((prev) => ({ ...prev, type: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
                      <option>Governance</option>
                      <option>Cadence</option>
                      <option>Ownership</option>
                      <option>SMART Threshold</option>
                    </select>
                    <select value={policyDraft.severity} onChange={(e) => setPolicyDraft((prev) => ({ ...prev, severity: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                    <textarea value={policyDraft.description} onChange={(e) => setPolicyDraft((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs min-h-[80px]" placeholder="Policy description" />
                    <button type="button" onClick={handleCreatePolicy} disabled={isSubmittingAdmin} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 cursor-pointer">{isSubmittingAdmin ? 'Saving...' : 'Add Policy'}</button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <h4 className="text-sm font-bold text-slate-900">Invite & Register User</h4>
                    <input value={inviteDraft.name} onChange={(e) => setInviteDraft((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Full name" />
                    <input value={inviteDraft.email} onChange={(e) => setInviteDraft((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Email address" />
                    <select value={inviteDraft.role} onChange={(e) => setInviteDraft((prev) => ({ ...prev, role: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
                      <option value="okr-creator">OKR Creator</option>
                      <option value="monitor">Operations Monitor</option>
                      <option value="policy-manager">Policy Manager</option>
                      <option value="super-admin">Super Admin</option>
                    </select>
                    <select value={inviteDraft.industry} onChange={(e) => setInviteDraft((prev) => ({ ...prev, industry: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs">
                      {industriesList.map((industryName) => (
                        <option key={industryName} value={industryName}>{industryName}</option>
                      ))}
                    </select>
                    <input value={inviteDraft.permissions} onChange={(e) => setInviteDraft((prev) => ({ ...prev, permissions: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="create-okr,monitor,manage-policy" />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={handleInviteUser} disabled={isSubmittingAdmin} className="rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 cursor-pointer">{isSubmittingAdmin ? 'Sending...' : 'Send Invite'}</button>
                      <button type="button" onClick={handleCompleteFirebaseRegistration} disabled={isRegisteringUser} className="rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-2 cursor-pointer">{isRegisteringUser ? 'Registering...' : 'Complete Registration'}</button>
                    </div>
                    <div className="space-y-2 pt-1">
                      <input value={registrationDraft.name} onChange={(e) => setRegistrationDraft((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Registration name" />
                      <input value={registrationDraft.email} onChange={(e) => setRegistrationDraft((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Registration email" />
                      <input type="password" value={registrationDraft.password} onChange={(e) => setRegistrationDraft((prev) => ({ ...prev, password: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Password" />
                      <input type="password" value={registrationDraft.confirmPassword} onChange={(e) => setRegistrationDraft((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Confirm password" />
                    </div>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Email</th>
                        <th className="px-3 py-2 font-semibold">Role</th>
                        <th className="px-3 py-2 font-semibold">Industry</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {adminUsers.length === 0 ? (
                        <tr>
                          <td className="px-3 py-4 text-slate-500" colSpan={5}>No user registrations yet.</td>
                        </tr>
                      ) : (
                        adminUsers.map((user) => (
                          <tr key={`${user.email}-${user.createdAt}`} className="align-top">
                            <td className="px-3 py-2 font-semibold text-slate-800">{user.name}</td>
                            <td className="px-3 py-2 text-slate-600">{user.email}</td>
                            <td className="px-3 py-2 text-slate-600">{user.role}</td>
                            <td className="px-3 py-2 text-slate-600">{user.industry}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 font-bold ${
                                user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : user.status === 'invited' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <Suspense
              fallback={
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-xs font-medium text-slate-500 shadow-xs">
                  Loading module...
                </div>
              }
            >
        {/* Toggleable Supervisor Event Bus Panel */}
        {isEventBusOpen && (
          <SupervisorEventBus
            events={events}
            onClear={() => {
              eventBus.clearHistory();
              setEvents([]);
            }}
            onReseed={() => {
              const seeded = eventBus.seedInitialEvents(industry.name);
              setEvents(seeded);
            }}
            onInjectTestEvent={handleInjectTestEvent}
            onClose={() => setIsEventBusOpen(false)}
          />
        )}

        {/* View 1: 6-Stage Multi-Agent Lifecycle */}
        {activeView === 'lifecycle' && (
          <LifecycleView
            industry={industry}
            industryKey={selectedIndustry}
            activeStageId={activeStageId}
            onSelectStage={setActiveStageId}
            nodesMap={nodesMap}
            onUpdateNodesMap={setNodesMap}
            activeFedCount={activeFedCount}
            canExecuteLifecycle={canExecuteLifecycle}
            isOrchestratingAll={isOrchestratingAll}
            onRunFullOrchestration={handleRunFullOrchestration}
            lastOrchestrationSummary={lastOrchestrationSummary}
            lastOrchestrationRunId={lastOrchestrationRunId}
            onRetrospectiveCompleted={handleRetrospectiveCompleted}
          />
        )}

        {/* View 2: 7-Layer Planview Traceability */}
        {activeView === 'traceability' && (
          <TraceabilityView
            industry={industry}
            nodesMap={nodesMap}
            onUpdateNodesMap={setNodesMap}
            selectedNodeId={selectedNodeId}
            onSelectNodeId={setSelectedNodeId}
          />
        )}

        {/* View 3: Advisory Committee Multi-Agent Outcomes */}
        {activeView === 'advisory' && (
          <AdvisoryCommitteeView
            industry={industry}
            onNavigateToAccuracy={() => setActiveView('performance')}
          />
        )}

        {/* View 4: Advisory Historical Accuracy & R² Analytics (Recharts) */}
        {activeView === 'performance' && (
          <AdvisoryPerformanceAccuracyView
            industry={industry}
            onNavigateToOutcomes={() => setActiveView('advisory')}
          />
        )}

        {/* View 5: 7-Layer Resource Utilisation & Bottleneck Heatmap (Recharts) */}
        {activeView === 'heatmap' && (
          <ResourceUtilisationHeatmapView
            industry={industry}
            nodesMap={nodesMap}
            onUpdateNodesMap={setNodesMap}
            onNavigateToTraceability={(nodeId) => {
              setSelectedNodeId(nodeId);
              setActiveView('traceability');
            }}
          />
        )}

        {/* View 6: Strategic Portfolio Planner */}
        {activeView === 'strategy' && (
          <StrategicPortfolioPlannerView industry={industry} />
        )}
        {/* View 7: 5-Pillar AI Knowledge Base & Organisational Pre-Requisites */}
        {activeView === 'knowledge' && (
          <KnowledgeBaseView
            industry={industry}
            fedPillars={fedPillars}
            onToggleFedPillar={handleToggleFedPillar}
            activeFedCount={activeFedCount}
            onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
            canManagePrerequisites={canManagePolicy || canCreateOkr}
            prerequisitesPersistenceSource={prerequisitesPersistenceSource}
            onUpdatePrerequisites={handleUpdatePrerequisites}
            onSyncPrerequisitesFromWorkspace={handleSyncPrerequisitesFromWorkspace}
          />
        )}
        {/* View 6: OKR Future Attainment Trajectory (Target vs Predicted Recharts) */}
        {activeView === 'trajectory' && (
          <OkrTrajectoryView
            industry={industry}
            nodesMap={nodesMap}
            activeDisasters={activeDisasters}
            managedPrograms={managedPrograms}
            onNavigateToStudio={() => setActiveView('studio')}
          />
        )}

        {/* View 7: OKR & Program Management Studio (HITL & Disaster Events) */}
        {activeView === 'studio' && (
          <OkrProgramStudioView
            industry={industry}
            nodesMap={nodesMap}
            onUpdateNodesMap={setNodesMap}
            onCommitNodesMap={handleCommitNodesMap}
            managedPrograms={managedPrograms}
            onUpdateManagedPrograms={setManagedPrograms}
            activeDisasters={activeDisasters}
            onUpdateActiveDisasters={setActiveDisasters}
            orgDirectory={orgDirectory}
            policies={policies}
            onNavigateToTrajectory={() => setActiveView('trajectory')}
            requestedTarget={requestedStudioTarget}
            canCreateOkr={canCreateOkr}
            canExecuteLifecycle={canExecuteLifecycle}
            onNavigateFromConversationalRoute={handleNavigateFromConversationalRoute}
          />
        )}
        </Suspense>
      </div>
    </div>
    </main>

    <Suspense fallback={null}>
        {/* Enterprise Governance, Policies & Org Data Modal */}
        {isGovernanceOpen && (
          <EnterpriseGovernanceModal
            industry={industry}
            orgDirectory={orgDirectory}
            onUpdateOrgDirectory={setOrgDirectory}
            policies={policies}
            onUpdatePolicies={setPolicies}
            onOpenKnowledgeBase={() => {
              setIsGovernanceOpen(false);
              setActiveView('knowledge');
            }}
            onClose={() => setIsGovernanceOpen(false)}
          />
        )}

        {/* Add Custom Industry Modal */}
        {isAddCustomIndustryOpen && (
          <AddCustomIndustryModal
            onClose={() => setIsAddCustomIndustryOpen(false)}
            onAddIndustry={handleAddCustomIndustry}
          />
        )}

        {/* Gemini Multi-Turn AI Copilot Drawer */}
        {isGeminiChatOpen && (
          <GeminiChatbotDrawer
            isOpen={isGeminiChatOpen}
            onClose={() => setIsGeminiChatOpen(false)}
            industry={industry}
            nodesMap={nodesMap}
            fedPillars={fedPillars}
          />
        )}

        {/* 8-Agent Google Agentic AI & MongoDB Communication Validator */}
        {isAgenticValidatorOpen && (
          <AgenticValidationModal
            industryName={industry.name}
            onClose={() => setIsAgenticValidatorOpen(false)}
          />
        )}

        {/* Interactive Worker Agent Last-5 KB Logs Modal */}
        {selectedWorkerAgent && (
          <WorkerAgentLogsModal
            agent={selectedWorkerAgent}
            industryName={selectedIndustry}
            onClose={() => setSelectedWorkerAgent(null)}
          />
        )}
      </Suspense>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            Planview Anvi • Supervisor-Worker Multi-Agent Orchestration &amp; 7-Layer Traceability Engine
          </p>
          <p className="flex items-center gap-3">
            <span>Asynchronous Event Bus Active</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{industry.name}</span>
            <span>•</span>
            <span>{industry.quarter}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
