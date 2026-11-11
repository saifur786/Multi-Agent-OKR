/**
 * Planview Anvi Multi-Agent System & Knowledge Base Pipeline
 * Supervisor-Worker Multi-Agent Orchestration Engine over Asynchronous Event Bus
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { INDUSTRY_DATA } from './data/industryData';
import { IndustryKey, TraceabilityNode, BusEvent } from './types/orchestration';
import { eventBus } from './utils/eventBus';
import { Header } from './components/Header';
import { LifecycleView } from './components/LifecycleView';
import { TraceabilityView } from './components/TraceabilityView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { SupervisorEventBus } from './components/SupervisorEventBus';

export default function App() {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey>('Banking');
  const [activeView, setActiveView] = useState<'lifecycle' | 'traceability' | 'knowledge'>('lifecycle');
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [isEventBusOpen, setIsEventBusOpen] = useState<boolean>(false);
  const [isOrchestratingAll, setIsOrchestratingAll] = useState<boolean>(false);

  const [fedPillars, setFedPillars] = useState<Record<string, boolean>>({
    kb1: true,
    kb2: true,
    kb3: true,
    kb4: true,
    kb5: true
  });

  const [events, setEvents] = useState<BusEvent[]>(() =>
    eventBus.seedInitialEvents(INDUSTRY_DATA['Banking'].name)
  );

  const industry = INDUSTRY_DATA[selectedIndustry];

  // Flatten nodes for the selected industry into state for live manipulation
  const [nodesMap, setNodesMap] = useState<Record<string, TraceabilityNode>>(() => {
    const map: Record<string, TraceabilityNode> = {};
    Object.values(industry.traceability).forEach((layerNodes) => {
      layerNodes.forEach((node) => {
        map[node.id] = { ...node };
      });
    });
    return map;
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string>(() => {
    return industry.traceability[2]?.[0]?.id || industry.traceability[1][0].id;
  });

  // Subscribe to Event Bus
  useEffect(() => {
    const unsubscribe = eventBus.subscribe('*', (newEvent) => {
      setEvents((prev) => [newEvent, ...prev].slice(0, 80));
    });
    return () => unsubscribe();
  }, []);

  // When switching industry, refresh nodesMap, events, and selected node
  const handleSelectIndustry = useCallback((ind: IndustryKey) => {
    setSelectedIndustry(ind);
    setActiveStageId(1);
    const newInd = INDUSTRY_DATA[ind];

    const map: Record<string, TraceabilityNode> = {};
    Object.values(newInd.traceability).forEach((layerNodes) => {
      layerNodes.forEach((node) => {
        map[node.id] = { ...node };
      });
    });
    setNodesMap(map);

    const firstL2 = newInd.traceability[2]?.[0]?.id || newInd.traceability[1][0].id;
    setSelectedNodeId(firstL2);

    const seeded = eventBus.seedInitialEvents(newInd.name);
    setEvents(seeded);
  }, []);

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

        // Emit corresponding stage event
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
        selectedIndustry={selectedIndustry}
        onSelectIndustry={handleSelectIndustry}
        activeView={activeView}
        onSelectView={setActiveView}
        isOrchestratingAll={isOrchestratingAll}
        onRunFullOrchestration={handleRunFullOrchestration}
        eventCount={events.length}
        isEventBusOpen={isEventBusOpen}
        onToggleEventBus={() => setIsEventBusOpen((prev) => !prev)}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
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

        {/* View 3: 5-Pillar AI Knowledge Base */}
        {activeView === 'knowledge' && (
          <KnowledgeBaseView
            industry={industry}
            fedPillars={fedPillars}
            onToggleFedPillar={handleToggleFedPillar}
            activeFedCount={activeFedCount}
          />
        )}
      </main>

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
