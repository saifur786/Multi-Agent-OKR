/**
 * Planview Anvi Multi-Agent System & Knowledge Base Pipeline
 * Supervisor-Worker Multi-Agent Orchestration Engine over Asynchronous Event Bus
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { INDUSTRY_DATA } from './data/industryData';
import {
  IndustryKey,
  TraceabilityNode,
  BusEvent,
  IndustryDataBundle,
  KnowledgeBasePillar
} from './types/orchestration';
import { eventBus } from './utils/eventBus';
import { useFirebase } from './context/FirebaseContext';
import {
  loadIndustryKnowledgeSnapshotFromFirestore,
  loadUserPreferencesFromFirestore,
  saveIndustryKnowledgeSnapshotToFirestore,
  saveUserPreferencesToFirestore
} from './services/firestorePersistence';
import type { ParsedDocumentPreview } from './utils/ragIngestion';
import { Header, ActiveNavView } from './components/Header';
import { LifecycleView } from './components/LifecycleView';
import {
  UserPreferences,
  DEFAULT_NAV_ORDER,
  areNavOrdersEqual,
  loadPersistedUserPreferences,
  normalizeUserPreferences,
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
    traceability: hasTraceabilityNodes(incomingIndustry.traceability) ? incomingIndustry.traceability : baseIndustry.traceability
  });
};

export default function App() {
  // Dynamic Industries Dictionary (includes defaults + user-created custom industries)
  const [industriesDict, setIndustriesDict] = useState<Record<string, IndustryDataBundle>>(
    () => ({ ...INDUSTRY_DATA })
  );

  const industriesList = useMemo(() => Object.keys(industriesDict), [industriesDict]);

  const [selectedIndustry, setSelectedIndustry] = useState<string>('Telco');
  const [activeView, setActiveView] = useState<ActiveNavView>('lifecycle');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => loadPersistedUserPreferences());
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [isEventBusOpen, setIsEventBusOpen] = useState<boolean>(false);
  const [isOrchestratingAll, setIsOrchestratingAll] = useState<boolean>(false);
  const { user, authReady } = useFirebase();
  const isVerifiedFirebaseUser = Boolean(authReady && user && user.emailVerified);
  const [isAddCustomIndustryOpen, setIsAddCustomIndustryOpen] = useState<boolean>(false);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState<boolean>(false);
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState<boolean>(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [lastOrchestrationSummary, setLastOrchestrationSummary] = useState<IndustryOrchestrationSummary | null>(null);
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

  // Load signed-in user's Firestore Knowledge Base snapshot for the active industry
  useEffect(() => {
    if (!isVerifiedFirebaseUser || !user || !industry?.id) return;
    let cancelled = false;
    void loadIndustryKnowledgeSnapshotFromFirestore(user.uid, industry.id)
      .then((savedKnowledgeBase) => {
        if (cancelled || !savedKnowledgeBase || savedKnowledgeBase.length === 0) return;
        setIndustriesDict((prev) => {
          const target = prev[selectedIndustry];
          if (!target) return prev;
          return {
            ...prev,
            [selectedIndustry]: normalizeIndustryBundle({
              ...target,
              knowledgeBase: savedKnowledgeBase
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
          updatedPillars
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

  // Cross-industry live Notification Center collector (Critical OKRs + New Disaster Events)
  const portfolioNotifications = useMemo(
    () => collectPortfolioNotifications(industriesDict, selectedIndustry, currentIndustryBundle, events),
    [industriesDict, selectedIndustry, currentIndustryBundle, events]
  );

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
      if (notification.industryKey && notification.industryKey !== selectedIndustry) {
        handleSelectIndustry(notification.industryKey);
      }
      setActiveView('studio');
      setRequestedStudioTarget({
        tab: notification.targetTab,
        okrId: notification.targetOkrId,
        nonce: Date.now()
      });
    },
    [handleMarkNotificationRead, handleSelectIndustry, selectedIndustry]
  );

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
        isOrchestratingAll={isOrchestratingAll}
        onRunFullOrchestration={handleRunFullOrchestration}
        lastOrchestrationSummary={lastOrchestrationSummary}
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
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
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
            activeStageId={activeStageId}
            onSelectStage={setActiveStageId}
            nodesMap={nodesMap}
            onUpdateNodesMap={setNodesMap}
            activeFedCount={activeFedCount}
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
        {/* View 7: 5-Pillar AI Knowledge Base */}
        {activeView === 'knowledge' && (
          <KnowledgeBaseView
            industry={industry}
            fedPillars={fedPillars}
            onToggleFedPillar={handleToggleFedPillar}
            activeFedCount={activeFedCount}
            onUpdateKnowledgeBase={handleUpdateKnowledgeBase}
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
          />
        )}
        </Suspense>
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
