import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Cpu,
  Layers,
  ShieldAlert,
  BarChart3,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  TrendingUp,
  Sliders,
  DollarSign,
  ArrowRight,
  Database,
  Terminal,
  Clock,
  Play,
  Download,
  FileText,
  Table,
  FileSpreadsheet
} from 'lucide-react';
import { IndustryDataBundle, LifecycleStage, TraceabilityNode } from '../types/orchestration';
import { evaluateSmartCriteria, calculateRegressionPrediction, computeVectorCosineSimilarity, remediateOrphanNode } from '../utils/algorithms';
import { eventBus } from '../utils/eventBus';
import {
  generateExecutiveReportCSV,
  generateBusinessRequirementDocument,
  generateRequirementTraceabilityMatrixCSV,
  triggerFileDownload
} from '../utils/documentGenerators';

interface AgentDeepDiveModalProps {
  stage: LifecycleStage;
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  onUpdateNodesMap: (updated: Record<string, TraceabilityNode>) => void;
  onRetrospectiveCompleted?: (payload: {
    actionableLesson: string;
    vectorChunk: { id: string; text: string; source: string; sourceDocument?: string; ingestedAt?: string };
    ownerNotification?: any;
  }) => void;
  onClose: () => void;
}

export const AgentDeepDiveModal: React.FC<AgentDeepDiveModalProps> = ({
  stage,
  industry,
  nodesMap,
  onUpdateNodesMap,
  onRetrospectiveCompleted,
  onClose
}) => {
  // STAGE 1 (Strategy RAG) state
  const [ragQuery, setRagQuery] = useState('regulatory compliance and digital self service adoption');
  const [ragResults, setRagResults] = useState<{ text: string; source: string; score: number }[]>([
    { text: industry.knowledgeBase[0].vectorChunks[0]?.text || 'Digital channel initiatives delivered 84% attainment.', source: 'Historical Performance Vectors', score: 0.94 },
    { text: industry.knowledgeBase[1].vectorChunks[0]?.text || 'Market benchmark: Open banking & self service growth.', source: 'Market Data Vectors', score: 0.88 },
    { text: industry.knowledgeBase[2].vectorChunks[0]?.text || 'Customer feedback NPS shows appetite for instant digital self-service.', source: 'Customer Feedback Vectors', score: 0.82 }
  ]);

  // STAGE 2 (SMART & Regression) state
  const [customKr, setCustomKr] = useState('Cut mortgage approval turnaround from 9 days to 48 hours');
  const smartEval = evaluateSmartCriteria(customKr);
  const regressionEval = calculateRegressionPrediction(
    industry.regressionModel.historicalDataPoints.map(p => p.actual),
    65,
    8,
    12
  );

  // STAGE 3 (Graph & Capacity) state
  const [remediatedIds, setRemediatedIds] = useState<Set<string>>(new Set());
  const [rebalancedSquads, setRebalancedSquads] = useState<Set<string>>(new Set());
  const [alignmentAiPlan, setAlignmentAiPlan] = useState<{ summaryPlan: string; recommendations: string[]; source: string } | null>(null);
  const [isLoadingAlignmentAi, setIsLoadingAlignmentAi] = useState(false);

  // STAGE 4 (Cron, Webhooks & ServiceNow / Jira Connectors) state
  const [simulatedWebhookFiring, setSimulatedWebhookFiring] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState(industry.recentWebhooks);
  const [connectorProvider, setConnectorProvider] = useState<'ServiceNow' | 'Jira'>('ServiceNow');
  const [connectorUrl, setConnectorUrl] = useState('https://enterprise.service-now.com/api/now/table/incident');
  const [connectorAuthMode, setConnectorAuthMode] = useState<'simulator' | 'bearer' | 'api-key'>('simulator');
  const [connectorToken, setConnectorToken] = useState('');
  const [connectorStatusMsg, setConnectorStatusMsg] = useState<string | null>(null);
  const [riskAiResult, setRiskAiResult] = useState<{ anomalySummary: string; source: string; persistence?: string } | null>(null);

  // STAGE 5 (Executive JSON & Document Exports) state
  const [copiedJson, setCopiedJson] = useState(false);
  const [exportedCsv, setExportedCsv] = useState(false);
  const [downloadedBrd, setDownloadedBrd] = useState(false);
  const [downloadedRtm, setDownloadedRtm] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState<'none' | 'brd' | 'rtm'>('none');
  const [executiveAiBrief, setExecutiveAiBrief] = useState<{ executiveNarrative: string; highlights: string[]; source: string } | null>(null);
  const [isGeneratingExecBrief, setIsGeneratingExecBrief] = useState(false);

  // STAGE 6 (Retro & Vector Ingestion) state
  const [vectorIngested, setVectorIngested] = useState(industry.retrospective.ingestedIntoKnowledgeBase);
  const [isRunningRetro, setIsRunningRetro] = useState(false);
  const [retroResult, setRetroResult] = useState<{
    fiveWhys: string[];
    actionableLesson: string;
    kbPersistMode: string;
    source: string;
    ownerNotification?: any;
  } | null>(null);

  // STAGE 1 Handler: Run RAG Search
  const handleRunRAG = () => {
    const allChunks = industry.knowledgeBase.flatMap(k => k.vectorChunks);
    const scored = allChunks.map(chunk => {
      const queryWords = ragQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const chunkWords = chunk.text.toLowerCase().split(/\s+/);
      const matches = queryWords.filter(w => chunkWords.some(cw => cw.includes(w))).length;
      const baseScore = matches > 0 ? 0.75 + (matches * 0.08) : 0.55;
      const score = Math.min(0.98, +baseScore.toFixed(2));
      return { text: chunk.text, source: chunk.source, score };
    }).sort((a, b) => b.score - a.score).slice(0, 3);

    setRagResults(scored);

    eventBus.publish({
      topic: 'STRATEGY_RAG_QUERIED',
      sourceAgent: 'Strategy & Ideation Agent',
      targetAgent: 'Vector Knowledge Base',
      summary: `RAG search executed for query: "${ragQuery.slice(0, 40)}..."`,
      payload: { query: ragQuery, matchesRetrieved: scored.length, topScore: scored[0]?.score || 0.9 },
      latencyMs: 38,
      severity: 'info'
    });
  };

  // STAGE 3 Handler: Remediate Orphan & AI Alignment Analysis
  const handleRemediateOrphan = async (orphanId: string, parentId: string) => {
    const updated = remediateOrphanNode(nodesMap, orphanId, parentId);
    onUpdateNodesMap(updated);
    setRemediatedIds(prev => new Set([...prev, orphanId]));

    eventBus.publish({
      topic: 'INTERVENTION_APPLIED',
      sourceAgent: 'Alignment & Capacity Agent',
      targetAgent: 'Supervisor Agent',
      summary: `Remediated orphan node ${orphanId} by reconnecting to parent initiative ${parentId}`,
      payload: { orphanId, parentId, status: 'Reconnected' },
      latencyMs: 24,
      severity: 'success'
    });
  };

  const handleRebalanceSquad = (squadName: string) => {
    setRebalancedSquads(prev => new Set([...prev, squadName]));

    eventBus.publish({
      topic: 'INTERVENTION_APPLIED',
      sourceAgent: 'Alignment & Capacity Agent',
      targetAgent: 'Supervisor Agent',
      summary: `Rebalanced capacity for ${squadName}: shifted 2 FTEs from buffer team, load normalized to 92%`,
      payload: { squad: squadName, previousLoad: '108%', newLoad: '92%', status: 'Balanced' },
      latencyMs: 19,
      severity: 'success'
    });
  };

  const handleRunAlignmentAi = async () => {
    setIsLoadingAlignmentAi(true);
    try {
      const resp = await fetch('/api/agents/alignment-capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryName: industry.name,
          orphanEpics: industry.graphDiagnostics.orphanEpics,
          overAllocatedSquads: industry.graphDiagnostics.overAllocatedSquads,
          action: 'synthesize-remediation'
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setAlignmentAiPlan({
          summaryPlan: data.summaryPlan,
          recommendations: data.recommendations || [],
          source: data.source || 'gemini-4-hydrogen'
        });
      }
    } finally {
      setIsLoadingAlignmentAi(false);
    }
  };

  // STAGE 4 Handler: Save/Test ServiceNow or Jira Connector + Evaluate with Risk Agent
  const handleTestConnectorAndRisk = async () => {
    setSimulatedWebhookFiring(true);
    setConnectorStatusMsg(null);
    try {
      // 1. Save endpoint configuration
      await fetch('/api/integrations/risk-endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: connectorProvider,
          name: `${connectorProvider} (${industry.name})`,
          endpointUrl: connectorUrl,
          authMode: connectorAuthMode,
          industry: industry.name,
          enabled: true
        })
      }).catch(() => {});

      // 2. Test / pull signal from ServiceNow or Jira
      const testResp = await fetch('/api/integrations/risk-endpoints/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: connectorProvider,
          endpointUrl: connectorUrl,
          authMode: connectorAuthMode,
          authToken: connectorToken,
          industryName: industry.name
        })
      });

      if (testResp.ok) {
        const testData = await testResp.json();
        const signal = testData.normalizedSignal;
        setConnectorStatusMsg(
          `${connectorProvider} (${testData.connectionMode}) ingested: ${signal.title}`
        );

        const newWebhook = {
          source: (connectorProvider === 'ServiceNow' ? 'ServiceNow GRC' : 'Jira Software') as 'ServiceNow GRC' | 'Jira Software',
          event: signal.title,
          triggerTime: 'Just now',
          payload: testData.rawPayload
        };
        setWebhookLogs(prev => [newWebhook, ...prev]);

        // 3. Pass ingested signal through Google Agentic Risk Detection
        const riskResp = await fetch('/api/agents/risk-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industryName: industry.name,
            provider: connectorProvider,
            signalTitle: signal.title,
            signalType: signal.severity,
            description: signal.summary,
            knowledgeChunks: industry.knowledgeBase.flatMap(k => k.vectorChunks).slice(0, 4)
          })
        });
        if (riskResp.ok) {
          const riskData = await riskResp.json();
          setRiskAiResult({
            anomalySummary: riskData.anomalySummary,
            source: riskData.source,
            persistence: riskData.persistence
          });
        }

        eventBus.publish({
          topic: signal.topic || 'WEBHOOK_PAYLOAD_RECEIVED',
          sourceAgent: `${connectorProvider} Connector`,
          targetAgent: 'Risk Detection Agent',
          summary: signal.summary,
          payload: testData.rawPayload,
          latencyMs: 24,
          severity: 'danger'
        });
      }
    } finally {
      setSimulatedWebhookFiring(false);
    }
  };

  // STAGE 4 Handler: Quick Trigger Simulated Jira Webhook
  const handleTriggerWebhook = async () => {
    setSimulatedWebhookFiring(true);
    const newWebhook = {
      source: 'Jira Software' as const,
      event: 'sprint.velocity.dip',
      triggerTime: 'Just now',
      payload: {
        squad: 'Credit Engine Backend',
        velocityDelta: '-11.4%',
        blockerIssue: 'PAY-892 Mainframe API timeout',
        status: 'Triggered'
      }
    };

    setWebhookLogs(prev => [newWebhook, ...prev]);

    try {
      const riskResp = await fetch('/api/agents/risk-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryName: industry.name,
          provider: 'Jira Webhook',
          signalTitle: 'Sprint velocity dip -11.4% (PAY-892)',
          signalType: 'sprint_velocity_anomaly',
          description: JSON.stringify(newWebhook.payload)
        })
      });
      if (riskResp.ok) {
        const riskData = await riskResp.json();
        setRiskAiResult({
          anomalySummary: riskData.anomalySummary,
          source: riskData.source,
          persistence: riskData.persistence
        });
      }
    } catch {
      // Non-fatal
    }

    eventBus.publish({
      topic: 'WEBHOOK_PAYLOAD_RECEIVED',
      sourceAgent: 'Jira Webhook Listener',
      targetAgent: 'Risk Detection Agent',
      summary: 'Incoming webhook: Sprint velocity drop of 11.4% detected on Credit Engine Backend',
      payload: newWebhook.payload,
      latencyMs: 14,
      severity: 'danger'
    });

    setSimulatedWebhookFiring(false);
  };

  // STAGE 5 Handler: Copy JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(industry.executivePayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // STAGE 5 Handler: Export Node Health & Traceability to CSV
  const handleExportCSV = () => {
    const csv = generateExecutiveReportCSV(industry, nodesMap);
    const filename = `${industry.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_executive_traceability_health.csv`;
    triggerFileDownload(csv, filename, 'text/csv;charset=utf-8;');
    setExportedCsv(true);
    setTimeout(() => setExportedCsv(false), 2500);

    eventBus.publish({
      topic: 'EXECUTIVE_REPORT_EXPORTED',
      sourceAgent: 'Executive Reporting Agent',
      targetAgent: 'Supervisor Agent',
      summary: `Exported comprehensive 7-layer node health and OKR traceability CSV for ${industry.name}`,
      payload: { filename, totalNodes: Object.keys(nodesMap).length, quarter: industry.quarter },
      latencyMs: 18,
      severity: 'success'
    });
  };

  // STAGE 5 Handler: Download Business Requirement Document (BRD)
  const handleDownloadBRD = () => {
    const brd = generateBusinessRequirementDocument(industry);
    const filename = `Planview_Anvi_Business_Requirement_Document_${industry.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    triggerFileDownload(brd, filename, 'text/markdown;charset=utf-8;');
    setDownloadedBrd(true);
    setTimeout(() => setDownloadedBrd(false), 2500);

    eventBus.publish({
      topic: 'GOVERNANCE_DOC_EXPORTED',
      sourceAgent: 'Executive Reporting Agent',
      targetAgent: 'Enterprise Architecture Board',
      summary: `Generated and downloaded formal Business Requirement Document (BRD) for ${industry.name}`,
      payload: { filename, docType: 'BRD', standard: 'BRD-PV-ANVI-2026-V2.4' },
      latencyMs: 22,
      severity: 'info'
    });
  };

  // STAGE 5 Handler: Download Requirement Traceability Matrix (RTM)
  const handleDownloadRTM = () => {
    const rtm = generateRequirementTraceabilityMatrixCSV();
    const filename = `Planview_Anvi_Requirement_Traceability_Matrix_RTM_${industry.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    triggerFileDownload(rtm, filename, 'text/csv;charset=utf-8;');
    setDownloadedRtm(true);
    setTimeout(() => setDownloadedRtm(false), 2500);

    eventBus.publish({
      topic: 'GOVERNANCE_DOC_EXPORTED',
      sourceAgent: 'Executive Reporting Agent',
      targetAgent: 'Quality & Governance Auditor',
      summary: `Generated and downloaded formal Requirement Traceability Matrix (RTM) CSV for ${industry.name}`,
      payload: { filename, docType: 'RTM', mappingsCount: 18 },
      latencyMs: 20,
      severity: 'info'
    });
  };

  // STAGE 5 Handler: AI Executive Synthesis
  const handleGenerateExecutiveBrief = async () => {
    setIsGeneratingExecBrief(true);
    try {
      const resp = await fetch('/api/agents/executive-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryName: industry.name,
          quarter: industry.quarter,
          attainment: industry.attainment,
          totalBudget: industry.totalBudget,
          criticalCount: Object.values(nodesMap).filter((n) => n.status !== 'On Track').length,
          nodeSummary: { totalNodes: Object.keys(nodesMap).length }
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setExecutiveAiBrief({
          executiveNarrative: data.executiveNarrative,
          highlights: data.highlights || [],
          source: data.source || 'gemini-4-hydrogen'
        });
        eventBus.publish({
          topic: 'EXECUTIVE_PAYLOAD_COMPILED',
          sourceAgent: `Executive Reporting Agent (${data.source})`,
          targetAgent: 'Executive Portfolio',
          summary: data.executiveNarrative,
          payload: { source: data.source, persistence: data.persistence },
          latencyMs: Number(data.latencyMs || 35),
          severity: 'success'
        });
      }
    } finally {
      setIsGeneratingExecBrief(false);
    }
  };

  // STAGE 6 Handler: Closed-Loop Retrospective -> Persist KB to MongoDB + Alert OKR Owner
  const handleIngestVector = async () => {
    setIsRunningRetro(true);
    try {
      const sampleOkr = Object.values(nodesMap).find((n) => n.status !== 'On Track') || Object.values(nodesMap)[0];
      const resp = await fetch('/api/agents/retrospective-learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryId: industry.id,
          industryName: industry.name,
          sector: industry.sector,
          okrId: sampleOkr?.id || industry.retrospective.incidentId,
          okrTitle: sampleOkr?.title || industry.retrospective.krOrEpicName,
          okrOwner: sampleOkr?.owner || 'OKR Owner',
          symptom: industry.retrospective.symptom
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setVectorIngested(true);
        setRetroResult({
          fiveWhys: data.fiveWhys || industry.retrospective.fiveWhys,
          actionableLesson: data.actionableLesson || industry.retrospective.actionableLesson,
          kbPersistMode: data.kbPersistMode || 'mongodb',
          source: data.source || 'gemini-4-hydrogen',
          ownerNotification: data.ownerNotification
        });
        onRetrospectiveCompleted?.({
          actionableLesson: data.actionableLesson,
          vectorChunk: data.vectorChunk,
          ownerNotification: data.ownerNotification
        });
        eventBus.publish({
          topic: 'KNOWLEDGE_BASE_UPDATED',
          sourceAgent: `Retrospective & Learning Agent (${data.source})`,
          targetAgent: 'Vector Knowledge Base & OKR Owner',
          summary: `Closed-loop lesson persisted to ${data.kbPersistMode} KB & notified ${sampleOkr?.owner || 'OKR Owner'}`,
          payload: {
            incidentId: industry.retrospective.incidentId,
            kbPersistMode: data.kbPersistMode,
            ownerNotificationId: data.ownerNotification?.id,
            source: data.source
          },
          latencyMs: Number(data.latencyMs || 42),
          severity: 'success'
        });
        return;
      }
    } catch {
      // Fallback local completion below
    } finally {
      setIsRunningRetro(false);
    }

    setVectorIngested(true);
    eventBus.publish({
      topic: 'KNOWLEDGE_BASE_UPDATED',
      sourceAgent: 'Retrospective & Learning Agent',
      targetAgent: 'Vector Knowledge Base',
      summary: `Ingested 5 Whys root-cause lessons from ${industry.retrospective.incidentId} into Knowledge Base RAG embeddings`,
      payload: {
        incidentId: industry.retrospective.incidentId,
        dimensions: 1536,
        category: 'Project Runner Post-Mortem',
        status: 'Ingested & Indexed'
      },
      latencyMs: 42,
      severity: 'success'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  Worker Agent Deep Dive • Stage {stage.id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-200 border border-indigo-700/50">
                  {stage.moduleDetail.badge}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">{stage.agentName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Agent Deep Dive Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Top Stage Context Banner */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-indigo-700 uppercase">Assigned Mission</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{stage.goal}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stage.moduleDetail.description}</p>
            </div>
            <div className="shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500">Planview Engine:</span>{' '}
              <strong className="text-slate-800">{stage.planviewCapability}</strong>
            </div>
          </div>

          {/* ===============================================================
              STAGE 1: STRATEGY & IDEATION AGENT (RAG & VECTORS)
             =============================================================== */}
          {stage.id === 1 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    RAG Vector Query &amp; Retrieval Engine
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">Index: 5 Knowledge Pillars</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={ragQuery}
                      onChange={(e) => setRagQuery(e.target.value)}
                      placeholder="Enter strategy or market context query..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={handleRunRAG}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    Query Vector DB
                  </button>
                </div>

                {/* Retrieved Vector Chunks */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Top Retrieved Chunks (Cosine Similarity Score)
                  </p>
                  {ragResults.map((chunk, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-700">{chunk.source}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200">
                          cos sim: {chunk.score}
                        </span>
                      </div>
                      <p className="text-slate-700">{chunk.text}</p>
                    </div>
                  ))}
                </div>

                {/* Proposed Strategic Theme Synthesis */}
                <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 uppercase">Agent Synthesis: Proposed Strategic Themes</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                      92% Confidence
                    </span>
                  </div>
                  <p className="text-indigo-950 font-medium">
                    &quot;Consolidate branch servicing into Cloud-Native Self-Service &amp; Instant Payments to meet APRA CPS 230 operational resilience requirements.&quot;
                  </p>
                  <div className="flex gap-4 pt-1 text-[11px] text-indigo-800">
                    <span>Target ROI: <strong>2.9x</strong></span>
                    <span>Capex Rebalanced: <strong>18% from Mainframe</strong></span>
                    <span>Risk-Weighted Mix: <strong>55% Growth / 30% Reg</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 2: OKR QUALITY & PREDICTION AGENT (SMART & REGRESSION)
             =============================================================== */}
          {stage.id === 2 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    SMART Criteria Evaluator &amp; Historical KR Regression
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Composite Score: {smartEval.compositeScore}/100
                  </span>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Key Result Formulation (Edit to test real-time SMART scoring):
                  </label>
                  <input
                    type="text"
                    value={customKr}
                    onChange={(e) => setCustomKr(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                {/* 5 SMART Criteria Rubric Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {[
                    { key: 'Specific', data: smartEval.specific },
                    { key: 'Measurable', data: smartEval.measurable },
                    { key: 'Achievable', data: smartEval.achievable },
                    { key: 'Relevant', data: smartEval.relevant },
                    { key: 'Time-Bound', data: smartEval.timeBound }
                  ].map((item) => (
                    <div key={item.key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{item.key}</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            item.data.score >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.data.score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-3">{item.data.feedback}</p>
                    </div>
                  ))}
                </div>

                {/* Historical Regression Model Prediction */}
                <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 uppercase flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Historical Regression Fit (Last 4 Quarters)
                    </span>
                    <span className="font-mono text-purple-800 font-bold">
                      R² = {industry.regressionModel.rSquared} (High Predictability)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800">
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <p className="text-[10px] text-slate-500">Regression Slope</p>
                      <p className="text-xs font-bold text-purple-900">{regressionEval.regressionSlope}x / week</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <p className="text-[10px] text-slate-500">Predicted Attainment</p>
                      <p className="text-xs font-bold text-emerald-700">{regressionEval.predictedFinalPct}%</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <p className="text-[10px] text-slate-500">Attainment Probability</p>
                      <p className="text-xs font-bold text-purple-900">{industry.regressionModel.predictedProbability}%</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-purple-200">
                      <p className="text-[10px] text-slate-500">Confidence Interval</p>
                      <p className="text-xs font-bold text-slate-900">
                        [{industry.regressionModel.confidenceInterval[0]}%, {industry.regressionModel.confidenceInterval[1]}%]
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-900 font-mono">
                    Model: {industry.regressionModel.regressionEquation} (Stretch factor: {industry.regressionModel.stretchFactor}x)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 3: ALIGNMENT & CAPACITY AGENT (GRAPH & ORPHANS)
             =============================================================== */}
          {stage.id === 3 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    7-Layer Graph Traversal Diagnostics
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Traversed: {industry.graphDiagnostics.totalNodesTraversed} Nodes across 7 Layers
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleRunAlignmentAi()}
                      disabled={isLoadingAlignmentAi}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-60"
                    >
                      {isLoadingAlignmentAi ? 'Analyzing...' : 'Run Alignment AI Diagnosis'}
                    </button>
                  </div>
                </div>
                {alignmentAiPlan && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900">Alignment &amp; Capacity AI Plan</span>
                      <span className="text-[10px] font-mono text-indigo-700">{alignmentAiPlan.source}</span>
                    </div>
                    <p className="text-indigo-950">{alignmentAiPlan.summaryPlan}</p>
                    <ul className="list-disc pl-4 text-[11px] text-indigo-900 space-y-0.5">
                      {alignmentAiPlan.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                  </div>
                )}

                {/* Orphan Epics Detection */}
                <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      Orphan Epics Detected (0 OKR Alignment)
                    </span>
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      {industry.graphDiagnostics.unalignedSpend} Unaligned Spend
                    </span>
                  </div>

                  {industry.graphDiagnostics.orphanEpics.length === 0 ? (
                    <p className="text-emerald-700 font-medium">No orphan Epics detected. All Epics are connected to Strategic Initiatives.</p>
                  ) : (
                    industry.graphDiagnostics.orphanEpics.map((orphan) => {
                      const isRemediated = remediatedIds.has(orphan.id);
                      return (
                        <div
                          key={orphan.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white rounded-lg border border-amber-200"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{orphan.title}</p>
                            <p className="text-[11px] text-slate-500">
                              Budget: <strong className="text-slate-800">{orphan.budget}</strong> • Recommended Target: Initiative {orphan.recommendedParentId}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemediateOrphan(orphan.id, orphan.recommendedParentId)}
                            disabled={isRemediated}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isRemediated
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                            }`}
                          >
                            {isRemediated ? '✓ Reconnected to OKR' : 'Auto-Remediate & Attach'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Squad Over-Allocation Diagnostics */}
                <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-700" />
                      Over-Allocated Squads (&gt; 100% Load)
                    </span>
                    <span className="text-rose-700 font-semibold text-[11px]">Planview Resource Management</span>
                  </div>

                  {industry.graphDiagnostics.overAllocatedSquads.map((squad) => {
                    const isRebalanced = rebalancedSquads.has(squad.name);
                    return (
                      <div
                        key={squad.squadId}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white rounded-lg border border-rose-200"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{squad.name}</p>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              {isRebalanced ? '92% Balanced' : `${squad.currentLoad}% Load`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{squad.bottleneckReason}</p>
                        </div>
                        <button
                          onClick={() => handleRebalanceSquad(squad.name)}
                          disabled={isRebalanced}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isRebalanced
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          }`}
                        >
                          {isRebalanced ? '✓ 2 FTEs Reallocated' : 'Rebalance Squad (Shift 2 FTEs)'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 4: RISK DETECTION AGENT (CRON & WEBHOOKS)
             =============================================================== */}
          {stage.id === 4 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Scheduled Cron Jobs &amp; Inbound Webhook Radar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Evaluates sprint velocity, capex burn rate, and resource utilisation continuous telemetry.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerWebhook}
                    disabled={simulatedWebhookFiring}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Fire Simulated Jira Webhook</span>
                  </button>
                </div>

                {/* ServiceNow & Jira Live Endpoint Connector + Simulator */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-900">ServiceNow &amp; Jira Telemetry Connector</p>
                      <p className="text-[11px] text-slate-500">
                        Connect external REST endpoints or simulate inbound P1 incidents &amp; sprint velocity dips into the Risk Detection Agent.
                      </p>
                    </div>
                    <button
                      type="button"
                      data-testid="test-risk-connector-btn"
                      onClick={() => void handleTestConnectorAndRisk()}
                      disabled={simulatedWebhookFiring}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60 shrink-0"
                    >
                      {simulatedWebhookFiring ? 'Connecting...' : `Test & Pull ${connectorProvider} Signal`}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <select
                      aria-label="Risk Connector Provider"
                      value={connectorProvider}
                      onChange={(e) => {
                        const next = e.target.value === 'ServiceNow' ? 'ServiceNow' : 'Jira';
                        setConnectorProvider(next);
                        setConnectorUrl(
                          next === 'ServiceNow'
                            ? 'https://enterprise.service-now.com/api/now/table/incident'
                            : 'https://enterprise.atlassian.net/rest/api/3/search'
                        );
                      }}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                    >
                      <option value="ServiceNow">ServiceNow ITSM/GRC</option>
                      <option value="Jira">Jira Software</option>
                    </select>
                    <input
                      type="text"
                      aria-label="Connector Endpoint URL"
                      value={connectorUrl}
                      onChange={(e) => setConnectorUrl(e.target.value)}
                      placeholder="https://..."
                      className="sm:col-span-2 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                    />
                    <select
                      aria-label="Connector Mode"
                      value={connectorAuthMode}
                      onChange={(e) => setConnectorAuthMode(e.target.value as 'simulator' | 'bearer' | 'api-key')}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="simulator">Local Simulator</option>
                      <option value="bearer">Live REST (Bearer)</option>
                      <option value="api-key">Live REST (API Key)</option>
                    </select>
                  </div>

                  {connectorAuthMode !== 'simulator' && (
                    <input
                      type="password"
                      value={connectorToken}
                      onChange={(e) => setConnectorToken(e.target.value)}
                      placeholder="Optional Bearer token / API credential for live probe"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    />
                  )}

                  {connectorStatusMsg && (
                    <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 text-[11px] text-emerald-900 font-medium">
                      {connectorStatusMsg}
                    </div>
                  )}

                  {riskAiResult && (
                    <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-amber-800">
                        <span>Risk Detection AI Synthesis</span>
                        <span>Engine: {riskAiResult.source} · {riskAiResult.persistence}</span>
                      </div>
                      <p className="text-amber-950 font-medium">{riskAiResult.anomalySummary}</p>
                    </div>
                  )}
                </div>

                {/* Scheduled Cron Jobs Table */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Configured Autonomous Cron Jobs</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {industry.cronJobs.map((cron) => (
                      <div key={cron.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-indigo-700 font-semibold">{cron.cronExpression}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {cron.status}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">{cron.name}</p>
                        <p className="text-[11px] text-slate-500">Threshold: {cron.threshold}</p>
                        <p className="text-[10px] text-slate-400">Next check: {cron.nextRun}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inbound Webhooks Stream */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Recent Inbound Delivery Signals (Webhooks)</p>
                  <div className="space-y-2">
                    {webhookLogs.map((wh, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-amber-400">{wh.source} • {wh.event}</span>
                          <span className="text-slate-400">{wh.triggerTime}</span>
                        </div>
                        <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto bg-slate-950 p-2 rounded">
                          {JSON.stringify(wh.payload, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 5: EXECUTIVE REPORTING AGENT (JSON PAYLOAD & EXPORTS)
             =============================================================== */}
          {stage.id === 5 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      Executive Scorecard &amp; Aggregated Reporting
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aggregates KR health, portfolio contribution ROI, squad impact, and 7-layer traceability metrics into auditable formats.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleGenerateExecutiveBrief()}
                      disabled={isGeneratingExecBrief}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingExecBrief ? 'Synthesizing...' : 'Generate AI Portfolio Brief'}</span>
                    </button>
                    {/* Export to CSV Button */}
                    <button
                      onClick={handleExportCSV}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer ${
                        exportedCsv
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title="Download 7-layer node health, OKR status, and traceability metrics as CSV"
                    >
                      {exportedCsv ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>CSV Exported</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Export to CSV</span>
                        </>
                      )}
                    </button>

                    {/* Copy JSON Payload Button */}
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied JSON</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy JSON Payload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {executiveAiBrief && (
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 uppercase text-[10px]">
                        AI Executive Portfolio Synthesis
                      </span>
                      <span className="font-mono text-[10px] text-indigo-700">{executiveAiBrief.source}</span>
                    </div>
                    <p className="text-indigo-950 font-medium">{executiveAiBrief.executiveNarrative}</p>
                    <ul className="list-disc pl-4 text-[11px] text-indigo-900 space-y-0.5">
                      {executiveAiBrief.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  </div>
                )}

                {/* Executive Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-slate-500 text-[11px]">Attainment Score</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {industry.executivePayload.executiveSummary.attainmentScore}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-slate-500 text-[11px]">Capital at Risk</p>
                    <p className="text-base font-bold text-rose-600 mt-0.5">
                      {industry.executivePayload.executiveSummary.totalCapitalAtRisk}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-slate-500 text-[11px]">Portfolio Contribution</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">
                      {industry.executivePayload.executiveSummary.portfolioContributionROI}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-slate-500 text-[11px]">Critical Interventions</p>
                    <p className="text-base font-bold text-amber-600 mt-0.5">
                      {industry.executivePayload.executiveSummary.criticalInterventionsRequired} Pending
                    </p>
                  </div>
                </div>

                {/* Downloadable Enterprise Governance & Traceability Documents Suite */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Enterprise Governance &amp; Traceability Documentation Suite
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Download formal audit documents: Business Requirement Document (BRD) &amp; Requirement Traceability Matrix (RTM).
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                      Audit Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* BRD Card */}
                    <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            Business Requirement Document (BRD)
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            BRD-PV-ANVI-2026
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Enterprise architectural specification: 6-stage supervisor-worker agents, vector KB pipelines, quadratic regression models, and SMART scoring rubrics.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={handleDownloadBRD}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadedBrd ? '✓ BRD Downloaded' : 'Download BRD (.md)'}</span>
                        </button>
                        <button
                          onClick={() => setActiveDocPreview(activeDocPreview === 'brd' ? 'none' : 'brd')}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          {activeDocPreview === 'brd' ? 'Hide' : 'Preview'}
                        </button>
                      </div>
                    </div>

                    {/* RTM Card */}
                    <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <Table className="w-4 h-4 text-emerald-600" />
                            Requirement Traceability Matrix (RTM)
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                            18 Mappings
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Bidirectional matrix mapping requirements (REQ-STRAT, REQ-OKR, REQ-GRAPH, REQ-RISK) to 7-layer lineage nodes, verification test cases, and verification states.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={handleDownloadRTM}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadedRtm ? '✓ RTM Downloaded' : 'Download RTM (.csv)'}</span>
                        </button>
                        <button
                          onClick={() => setActiveDocPreview(activeDocPreview === 'rtm' ? 'none' : 'rtm')}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          {activeDocPreview === 'rtm' ? 'Hide' : 'Preview'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Inline Document Previews */}
                  {activeDocPreview === 'brd' && (
                    <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs max-h-72 overflow-y-auto space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                        <span className="font-bold text-indigo-400">BRD Preview (Markdown)</span>
                        <button onClick={() => setActiveDocPreview('none')} className="text-slate-400 hover:text-white cursor-pointer">✕ Close</button>
                      </div>
                      <pre className="whitespace-pre-wrap text-[11px] text-slate-300">
                        {generateBusinessRequirementDocument(industry).slice(0, 1800)}...
                      </pre>
                    </div>
                  )}

                  {activeDocPreview === 'rtm' && (
                    <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs max-h-72 overflow-y-auto space-y-2 border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                        <span className="font-bold text-emerald-400">RTM Preview (CSV Raw View)</span>
                        <button onClick={() => setActiveDocPreview('none')} className="text-slate-400 hover:text-white cursor-pointer">✕ Close</button>
                      </div>
                      <pre className="whitespace-pre-wrap text-[10px] text-slate-300">
                        {generateRequirementTraceabilityMatrixCSV()}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Formatted JSON Payload for React Dashboards */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Live React Dashboard Payload (schema: Planview Executive Telemetry v2)
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {Object.keys(nodesMap).length} Active Nodes Monitored
                    </span>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
                    {JSON.stringify(industry.executivePayload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              STAGE 6: RETROSPECTIVE & LEARNING AGENT (ROOT CAUSE & KB)
             =============================================================== */}
          {stage.id === 6 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-600" />
                      Retrospective &amp; Root-Cause Analysis (5 Whys &amp; Fishbone)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Synthesises Project Runner logs and Customer Feedback into reusable lessons learned.
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="retro-close-loop-btn"
                    onClick={() => void handleIngestVector()}
                    disabled={isRunningRetro}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 ${
                      vectorIngested
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>
                      {isRunningRetro
                        ? 'Persisting Lesson & Notifying Owner...'
                        : vectorIngested
                          ? '✓ Persisted to KB & Owner Notified (Re-Run)'
                          : 'Close Loop: Persist Lesson to KB & Notify OKR Owner'}
                    </span>
                  </button>
                </div>

                {retroResult && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-indigo-800">
                      <span>Closed-Loop Knowledge Base &amp; Owner Alert Dispatched</span>
                      <span>Engine: {retroResult.source} · Store: {retroResult.kbPersistMode}</span>
                    </div>
                    <p className="text-indigo-950 font-medium">{retroResult.actionableLesson}</p>
                    {retroResult.ownerNotification && (
                      <p className="text-[11px] text-emerald-800 font-semibold">
                        Alert sent to {retroResult.ownerNotification.targetOwner}: &ldquo;{retroResult.ownerNotification.summary}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Incident Statement */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 uppercase text-[10px]">Case Study Target</span>
                    <span className="font-mono text-indigo-700">{industry.retrospective.incidentId}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{industry.retrospective.krOrEpicName}</p>
                  <p className="text-slate-600 mt-1">{industry.retrospective.symptom}</p>
                </div>

                {/* 5 Whys Chain */}
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-500 uppercase">5 Whys Root-Cause Chain</p>
                  <div className="space-y-1.5">
                    {(retroResult?.fiveWhys || industry.retrospective.fiveWhys).map((why, idx) => (
                      <div key={idx} className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-950 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{why}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Lesson Learned */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <span className="font-bold text-emerald-900 uppercase text-[10px]">
                    Actionable Lesson for Next Cycle (Q1 2027)
                  </span>
                  <p className="text-emerald-950 font-medium">
                    {retroResult?.actionableLesson || industry.retrospective.actionableLesson}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Powered by Planview Anvi Multi-Agent System Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            Close Workbench
          </button>
        </div>
      </div>
    </div>
  );
};
