/**
 * Planview Anvi Multi-Agent System & Knowledge Base Pipeline
 * Supervisor-Worker Multi-Agent Orchestration Engine over Asynchronous Event Bus
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { INDUSTRY_DATA } from './data/industryData';
import { IndustryKey, TraceabilityNode, BusEvent, IndustryDataBundle } from './types/orchestration';
import { eventBus } from './utils/eventBus';
import { Header, ActiveNavView } from './components/Header';
import { LifecycleView } from './components/LifecycleView';

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
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [isEventBusOpen, setIsEventBusOpen] = useState<boolean>(false);
  const [isOrchestratingAll, setIsOrchestratingAll] = useState<boolean>(false);
  const [isAddCustomIndustryOpen, setIsAddCustomIndustryOpen] = useState<boolean>(false);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState<boolean>(false);

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

  const persistIndustry = useCallback(async (payload: IndustryDataBundle) => {
    try {
      const normalized = normalizeIndustryBundle(payload);
      await fetch('/api/industries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized)
      });
    } catch {
      // Persistence skipped silently if offline
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

  const currentIndustryBundle = useMemo<IndustryDataBundle>(() => {
    const traceability = Object.fromEntries(
      Object.entries(industry.traceability || {}).map(([layer, layerNodes]) => {
        const nodes = Array.isArray(layerNodes) ? layerNodes.map((node) => nodesMap[node.id] || node) : [];
        return [layer, nodes];
      })
    ) as Record<number, TraceabilityNode[]>;

    return normalizeIndustryBundle({
      ...industry,
      traceability,
      nodeMap: nodesMap,
      programs: managedPrograms,
      activeDisasters,
      orgDirectory,
      policies
    });
  }, [industry, nodesMap, managedPrograms, activeDisasters, orgDirectory, policies]);

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

  // When switching industry, save current bundle snapshot, refresh nodesMap, events, and selected node
  const handleSelectIndustry = useCallback((ind: string) => {
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

  // Full Orchestration Pipeline: step sequentially from Stage 1 to Stage 6
  const handleRunFullOrchestration = () => {
    if (isOrchestratingAll) return;
    setIsOrchestratingAll(true);
    setActiveView('lifecycle');

    eventBus.publish({
      topic: 'ORCHESTRATION_STARTED',
      sourceAgent: 'Supervisor Agent (Anvi)',
      targetAgent: 'All 6 Worker Agents',
      summary: `Initiating full end-to-end OKR orchestration cycle across 6 stages for ${industry.name}`,
      payload: { industry: industry.name, quarter: industry.quarter, stagesCount: 6 },
      latencyMs: 10,
      severity: 'info'
    });

    let current = 1;
    setActiveStageId(1);

    const interval = setInterval(() => {
      current++;
      if (current <= 6) {
        setActiveStageId(current);
        const stageObj = industry.stages[current - 1];

        const topics = [
          'STRATEGY_RAG_QUERIED',
          'KR_REGRESSION_PREDICTED',
          'GRAPH_TRAVERSAL_EXECUTED',
          'RISK_SENTINEL_ALERT',
          'EXECUTIVE_PAYLOAD_COMPILED',
          'ROOT_CAUSE_SYNTHESIZED'
        ] as const;

        eventBus.publish({
          topic: topics[current - 1] as any,
          sourceAgent: stageObj.agentName,
          targetAgent: 'Supervisor Agent',
          summary: `Stage ${stageObj.id} verified: ${stageObj.title} (${stageObj.moduleDetail.badge})`,
          payload: {
            stage: stageObj.id,
            status: stageObj.status,
            confidence: stageObj.confidence,
            capability: stageObj.planviewCapability
          },
          latencyMs: 30,
          severity: stageObj.status === 'On Track' ? 'success' : 'warning'
        });
      } else {
        clearInterval(interval);
        setIsOrchestratingAll(false);
      }
    }, 750);
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
        isOrchestratingAll={isOrchestratingAll}
        onRunFullOrchestration={handleRunFullOrchestration}
        eventCount={events.length}
        isEventBusOpen={isEventBusOpen}
        onToggleEventBus={() => setIsEventBusOpen((prev) => !prev)}
        onOpenAddCustomIndustry={() => setIsAddCustomIndustryOpen(true)}
        onOpenGovernance={() => setIsGovernanceOpen(true)}
        activeDisasterCount={activeDisasters.filter((d) => d.active).length}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
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
            managedPrograms={managedPrograms}
            onUpdateManagedPrograms={setManagedPrograms}
            activeDisasters={activeDisasters}
            onUpdateActiveDisasters={setActiveDisasters}
            orgDirectory={orgDirectory}
            policies={policies}
            onNavigateToTrajectory={() => setActiveView('trajectory')}
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
