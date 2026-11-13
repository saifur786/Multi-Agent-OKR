/**
 * Planview Anvi - OKR & Program Management Studio (HITL & Disaster Console)
 * Enables Human-in-the-Loop manual prioritisation over AI, structured 6-attribute
 * business problems, program termination & initiation, and catastrophic event simulation.
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Sliders,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  Activity,
  Layers,
  Edit3,
  X,
  Flame,
  BookOpen,
  Save,
  RotateCcw,
  TrendingUp,
  FileText,
  MessageSquare,
  Bot,
  Send
} from 'lucide-react';
import {
  IndustryDataBundle,
  TraceabilityNode,
  HumanPriority,
  PriorityLevel,
  StructuredBusinessProblem,
  ManagedProgram,
  SignificantDisasterEvent,
  OrgDirectoryMember,
  OkrEnterprisePolicy,
  BusinessMetricIndicator,
  EventTopic
} from '../types/orchestration';
import { eventBus } from '../utils/eventBus';
import { validateOkrStructuralAdequacy } from '../utils/trajectoryCalculations';
import { evaluateAdvisoryCommittee, evaluateSmartCriteria } from '../utils/algorithms';
import {
  getAvailableBusinessProblemsForIndustry,
  parseRawProblemText,
  BusinessProblemTemplate
} from '../utils/businessProblemLibrary';
import {
  buildStructuredBusinessProblemFromDraft,
  ConversationIntent,
  ConversationalOkrDraft,
  ConversationalParseResult,
  mergeConversationalDrafts,
  MissingAttributeDetail,
  MissingAttributeKey,
  parseConversationalOkrInput
} from '../utils/conversationalOkrParser';
import { BusinessProblemManager } from './BusinessProblemManager';

interface OkrProgramStudioViewProps {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  onUpdateNodesMap: React.Dispatch<React.SetStateAction<Record<string, TraceabilityNode>>>;
  managedPrograms: ManagedProgram[];
  onUpdateManagedPrograms: React.Dispatch<React.SetStateAction<ManagedProgram[]>>;
  activeDisasters: SignificantDisasterEvent[];
  onUpdateActiveDisasters: React.Dispatch<React.SetStateAction<SignificantDisasterEvent[]>>;
  orgDirectory: OrgDirectoryMember[];
  policies: OkrEnterprisePolicy[];
  onNavigateToTrajectory?: () => void;
}

type ConversationalResponse = ConversationalParseResult;

interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  intent?: ConversationIntent;
  confidence?: number;
  actionPlan?: string[];
  questions?: string[];
  nextExpectedField?: MissingAttributeKey | null;
}

export const OkrProgramStudioView: React.FC<OkrProgramStudioViewProps> = ({
  industry,
  nodesMap,
  onUpdateNodesMap,
  managedPrograms,
  onUpdateManagedPrograms,
  activeDisasters,
  onUpdateActiveDisasters,
  orgDirectory,
  policies,
  onNavigateToTrajectory
}) => {
  // Tabs: 'okrs' | 'programs' | 'disasters' | 'supervisor'
  const [activeTab, setActiveTab] = useState<'okrs' | 'programs' | 'disasters' | 'supervisor'>('okrs');

  // Selected OKR for editing or problem drill-down
  const [selectedOkrId, setSelectedOkrId] = useState<string | null>(null);
  const [isEditingProblem, setIsEditingProblem] = useState<boolean>(false);
  const [isAddingNewOkr, setIsAddingNewOkr] = useState<boolean>(false);
  const [isBusinessProblemManagerOpen, setIsBusinessProblemManagerOpen] = useState<boolean>(false);
  const [isConversationalAgentOpen, setIsConversationalAgentOpen] = useState<boolean>(false);
  const [isInitiatingProgram, setIsInitiatingProgram] = useState<boolean>(false);
  const [terminatingProgramId, setTerminatingProgramId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [conversationInput, setConversationInput] = useState('');
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isReconnectingConversationalBackend, setIsReconnectingConversationalBackend] = useState(false);
  const [isConversationalBackendOffline, setIsConversationalBackendOffline] = useState(false);
  const [preferredConversationalOrigin, setPreferredConversationalOrigin] = useState<string | null>(null);
  const [isDraftPendingReview, setIsDraftPendingReview] = useState(false);
  const [newOkrValidationError, setNewOkrValidationError] = useState<string | null>(null);
  const [conversationDraft, setConversationDraft] = useState<ConversationalOkrDraft | null>(null);
  const [conversationBusinessProblem, setConversationBusinessProblem] = useState<StructuredBusinessProblem | null>(null);
  const [conversationGapReport, setConversationGapReport] = useState<{
    missingAttributes: MissingAttributeDetail[];
    capturedAttributes: string[];
    readinessPct: number;
    isDraftComplete: boolean;
    nextExpectedField: MissingAttributeKey | null;
  }>({
    missingAttributes: [],
    capturedAttributes: [],
    readinessPct: 0,
    isDraftComplete: false,
    nextExpectedField: null
  });
  const [conversationTurns, setConversationTurns] = useState<ConversationTurn[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      text: 'Hi, I am the OKR Conversational Agent. Describe the outcome you want — I will detect missing OKR & 6-dimension Business Problem attributes, ask targeted questions, and construct a Supervisor-ready draft for Apply Draft to Form.'
    }
  ]);
  const dependencyGraphRef = useRef<SVGSVGElement | null>(null);

  // Filter OKR level nodes (Layer 3)
  const okrNodes = useMemo(() => {
    return Object.values(nodesMap).filter((n) => n.id.includes('kr') || n.id.includes('-o'));
  }, [nodesMap]);

  const activeOkr = useMemo(() => {
    if (!selectedOkrId) return okrNodes[0] || null;
    return nodesMap[selectedOkrId] || okrNodes[0] || null;
  }, [selectedOkrId, nodesMap, okrNodes]);

  const dependencyGraphData = useMemo(() => {
    if (!activeOkr) return { nodes: [] as Array<{ id: string; label: string; status: string; x?: number; y?: number; fx?: number; fy?: number }>, links: [] as Array<{ source: string; target: string }> };

    const relatedIds = new Set<string>([activeOkr.id]);
    [...activeOkr.parentIds, ...activeOkr.childIds].forEach((id) => {
      if (id) relatedIds.add(id);
    });

    const upstream = Array.from(relatedIds).flatMap((id) => {
      const node = nodesMap[id];
      return node ? [...(node.parentIds || []), ...(node.childIds || [])] : [];
    });

    upstream.forEach((id) => {
      if (id) relatedIds.add(id);
    });

    const nodes = Array.from(relatedIds).map((id) => {
      const node = nodesMap[id];
      return {
        id,
        label: node?.title || id,
        status: node?.status || 'On Track'
      };
    });

    const links = nodes.flatMap((node) => {
      const currentNode = nodesMap[node.id];
      if (!currentNode) return [];
      return currentNode.parentIds
        .filter((parentId) => relatedIds.has(parentId))
        .map((parentId) => ({ source: parentId, target: node.id }));
    });

    return { nodes, links };
  }, [activeOkr, nodesMap]);

  useEffect(() => {
    if (!dependencyGraphRef.current || dependencyGraphData.nodes.length === 0) return;

    const width = 620;
    const height = 320;
    const svg = d3.select(dependencyGraphRef.current);
    svg.selectAll('*').remove();

    const graphLinks = dependencyGraphData.links.map((link) => ({ ...link }));
    const graphNodes = dependencyGraphData.nodes.map((node) => ({ ...node }));

    const linkSelection = svg
      .append('g')
      .selectAll('line')
      .data(graphLinks)
      .join('line')
      .attr('stroke', '#a5b4fc')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8);

    const nodeSelection = svg
      .append('g')
      .selectAll('circle')
      .data(graphNodes)
      .join('circle')
      .attr('r', (d: { id: string; label: string; status: string }) => (d.id === activeOkr?.id ? 14 : 11))
      .attr('fill', (d: { id: string; label: string; status: string }) => {
        const node = nodesMap[d.id];
        if (d.id === activeOkr?.id) return '#4f46e5';
        if (node?.status === 'At Risk') return '#f59e0b';
        if (node?.status === 'Behind') return '#ef4444';
        return '#22c55e';
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_: unknown, d: { id: string; label: string; status: string }) => {
        setSelectedOkrId(d.id);
      });

    const labelSelection = svg
      .append('g')
      .selectAll('text')
      .data(graphNodes)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -18)
      .attr('font-size', 9)
      .attr('fill', '#1e293b')
      .text((d: { id: string; label: string; status: string }) => d.label.slice(0, 18));

    const simulation = d3
      .forceSimulation(graphNodes as any)
      .force('link', d3.forceLink(graphLinks as any).id((d: any) => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.id === activeOkr?.id ? 22 : 18)))
      .on('tick', () => {
        linkSelection
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        nodeSelection
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y);

        labelSelection
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y);
      });

    return () => {
      simulation.stop();
    };
  }, [activeOkr, dependencyGraphData, nodesMap]);

  // Available business problems in this industry (curated + runtime)
  const availableProblems = useMemo(() => {
    return getAvailableBusinessProblemsForIndustry(industry, nodesMap);
  }, [industry, nodesMap]);

  // Potential parent nodes in hierarchy
  const potentialParents = useMemo(() => {
    return Object.values(nodesMap).filter(
      (n) => n.id.includes('theme') || n.id.includes('-o') || n.id.includes('theme-')
    );
  }, [nodesMap]);

  // -------------------------------------------------------------
  // INLINE EDITING STATE FOR ACTIVE OKR BUSINESS PROBLEM
  // -------------------------------------------------------------
  const [editProblemDesc, setEditProblemDesc] = useState('');
  const [editStakeholders, setEditStakeholders] = useState('');
  const [editCausalChain, setEditCausalChain] = useState('');
  const [editRootCause, setEditRootCause] = useState('');
  const [editRemediationTiming, setEditRemediationTiming] = useState('');
  const [editMetrics, setEditMetrics] = useState<BusinessMetricIndicator[]>([]);

  // Effective 6-attribute problem for active OKR (including seeded defaults when undefined)
  const effectiveActiveBusinessProblem = useMemo<StructuredBusinessProblem | null>(() => {
    if (!activeOkr) return null;
    const bp = activeOkr.businessProblem;
    const rootCauseVal = bp?.rootCause || 'Constrained specialized engineering headcount and legacy architectural debt.';
    const timingVal = bp?.targetRemediationTiming || activeOkr.targetDate || 'Q2 2027 Sprint 4';
    return {
      problemDescription:
        bp?.problemDescription || `Operational bottleneck in ${industry.name} delaying execution against benchmark growth targets.`,
      impactedStakeholders:
        bp?.impactedStakeholders && bp.impactedStakeholders.length > 0
          ? bp.impactedStakeholders
          : ['Executive Leadership', 'Core Customers', 'Field Squads'],
      causalChainToDollarImpact:
        bp?.causalChainToDollarImpact || 'Execution friction -> 14% delivery slippage -> $6.2M annualised revenue degradation.',
      rootCause: rootCauseVal,
      rootCauses:
        bp?.rootCauses && bp.rootCauses.length > 0 ? bp.rootCauses : [rootCauseVal],
      targetRemediationTiming: timingVal,
      remediationTimings:
        bp?.remediationTimings && bp.remediationTimings.length > 0 ? bp.remediationTimings : [timingVal],
      metrics:
        bp?.metrics && bp.metrics.length > 0
          ? bp.metrics
          : [
              { indicator: 'Key Operational Metric', baselineValue: '90%', targetValue: '< 65%', metricType: 'Leading' },
              { indicator: 'Financial Dollar Impact', baselineValue: '$12.0M loss rate', targetValue: '$0', metricType: 'Lagging' }
            ]
    };
  }, [activeOkr, industry.name]);

  // Initialize or synchronize inline editor values when active OKR changes or editor opens
  const handleStartEditingProblem = () => {
    if (!activeOkr) return;
    const bp = activeOkr.businessProblem;
    setEditProblemDesc(
      bp?.problemDescription || `Operational bottleneck in ${industry.name} delaying execution against benchmark growth targets.`
    );
    setEditStakeholders(
      (bp?.impactedStakeholders && bp.impactedStakeholders.length > 0
        ? bp.impactedStakeholders
        : ['Executive Leadership', 'Core Customers', 'Field Squads']
      ).join(', ')
    );
    setEditCausalChain(
      bp?.causalChainToDollarImpact || 'Execution friction -> 14% delivery slippage -> $6.2M annualised revenue degradation.'
    );
    setEditRootCause(bp?.rootCause || 'Constrained specialized engineering headcount and legacy architectural debt.');
    setEditRemediationTiming(bp?.targetRemediationTiming || activeOkr.targetDate || 'Q2 2027 Sprint 4');
    setEditMetrics(
      bp?.metrics && bp.metrics.length > 0
        ? JSON.parse(JSON.stringify(bp.metrics))
        : [
            { indicator: 'Key Operational Metric', baselineValue: '90%', targetValue: '< 65%', metricType: 'Leading' },
            { indicator: 'Financial Dollar Impact', baselineValue: '$12.0M loss rate', targetValue: '$0', metricType: 'Lagging' }
          ]
    );
    setIsEditingProblem(true);
  };

  // Auto-fill inline editor from existing industry template
  const handleApplyTemplateToInline = (templateId: string) => {
    const tmpl = availableProblems.find((p) => p.id === templateId);
    if (!tmpl) return;
    setEditProblemDesc(tmpl.problem.problemDescription);
    setEditStakeholders(tmpl.problem.impactedStakeholders.join(', '));
    setEditCausalChain(tmpl.problem.causalChainToDollarImpact);
    setEditRootCause(tmpl.problem.rootCause);
    setEditRemediationTiming(tmpl.problem.targetRemediationTiming);
    setEditMetrics(JSON.parse(JSON.stringify(tmpl.problem.metrics)));
  };

  // Add / remove / update metrics in inline editor
  const handleAddEditMetric = () => {
    setEditMetrics((prev) => [
      ...prev,
      { indicator: 'New Performance Indicator', baselineValue: '50%', targetValue: '90%', metricType: 'Leading' }
    ]);
  };

  const handleRemoveEditMetric = (index: number) => {
    setEditMetrics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEditMetric = (index: number, field: keyof BusinessMetricIndicator, value: string) => {
    setEditMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  // Save inline edited business problem
  const handleSaveBusinessProblem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeOkr) return;

    const stakeholdersList = editStakeholders
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updatedProblem: StructuredBusinessProblem = {
      problemDescription: editProblemDesc.trim() || 'Operational execution bottleneck.',
      impactedStakeholders: stakeholdersList.length > 0 ? stakeholdersList : ['Executive Leadership', 'Core Customers'],
      causalChainToDollarImpact: editCausalChain.trim() || 'Friction -> delay -> $4.5M revenue leakage.',
      rootCause: editRootCause.trim() || 'Architectural debt and specialized capacity constraints.',
      targetRemediationTiming: editRemediationTiming.trim() || 'Q2 2027 Sprint 4',
      metrics: editMetrics.length > 0 ? editMetrics : [
        { indicator: 'Operational Throughput', baselineValue: '70%', targetValue: '> 90%', metricType: 'Leading' },
        { indicator: 'Annual Financial Impact', baselineValue: '$5.0M', targetValue: '$0', metricType: 'Lagging' }
      ]
    };

    const updatedNode: TraceabilityNode = {
      ...activeOkr,
      targetDate: editRemediationTiming.trim() || activeOkr.targetDate,
      businessProblem: updatedProblem
    };

    if (!enforceSupervisorPolicy(updatedNode)) {
      return;
    }

    onUpdateNodesMap((prev) => ({
      ...prev,
      [activeOkr.id]: updatedNode
    }));

    eventBus.publish({
      topic: 'OKR_CREATED_OR_EDITED',
      sourceAgent: 'Human Executive (HITL)',
      targetAgent: 'Supervisor & Advisory Committee',
      summary: `Business Problem Updated for OKR: "${activeOkr.title}" (All 6 dimensions structured)`,
      payload: {
        nodeId: activeOkr.id,
        title: activeOkr.title,
        problemDescription: updatedProblem.problemDescription,
        timing: updatedProblem.targetRemediationTiming
      },
      latencyMs: 19,
      severity: 'info'
    });

    setIsEditingProblem(false);
    setFeedbackMessage({
      text: `Business problem for "${activeOkr.title}" successfully saved with all 6 dimensions! Supervisor Agent verified compliance.`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const enforceSupervisorPolicy = (candidate: TraceabilityNode, showModalInline = false) => {
    const audit = validateOkrStructuralAdequacy(candidate, policies, orgDirectory);
    if (audit.enforcementBlocked) {
      const issueSummary = audit.complianceIssues.length > 0
        ? audit.complianceIssues.join('; ')
        : 'Missing required enterprise control fields';

      const msg = `Supervisor Agent blocked the save for "${candidate.title}". Policy gaps: ${issueSummary}`;
      setFeedbackMessage({
        text: msg,
        type: 'error'
      });
      if (showModalInline) {
        setNewOkrValidationError(msg);
      }
      setTimeout(() => setFeedbackMessage(null), 6000);

      eventBus.publish({
        topic: 'GOVERNANCE_POLICY_VALIDATED',
        sourceAgent: 'Supervisor Agent',
        targetAgent: 'Human Executive (HITL)',
        summary: `Policy enforcement blocked OKR save: "${candidate.title}"`,
        payload: {
          okrId: candidate.id,
          title: candidate.title,
          isAdequate: false,
          complianceIssues: audit.complianceIssues,
          requiredFieldsMissing: audit.requiredFieldsMissing,
          measurabilityScore: audit.measurabilityScore,
          ambitionScore: audit.ambitionScore
        },
        latencyMs: 16,
        severity: 'warning'
      });

      return false;
    }

    if (showModalInline) {
      setNewOkrValidationError(null);
    }
    return true;
  };

  const handleBusinessProblemSave = (problem: StructuredBusinessProblem) => {
    if (!activeOkr) return;

    const normalized = {
      ...problem,
      impactedStakeholders: Array.isArray(problem.impactedStakeholders)
        ? Array.from(new Set(problem.impactedStakeholders.map((value) => String(value).trim()).filter(Boolean)))
        : [],
      rootCauses: Array.isArray(problem.rootCauses)
        ? Array.from(new Set(problem.rootCauses.map((value) => String(value).trim()).filter(Boolean)))
        : problem.rootCause
          ? [String(problem.rootCause).trim()]
          : [],
      remediationTimings: Array.isArray(problem.remediationTimings)
        ? Array.from(new Set(problem.remediationTimings.map((value) => String(value).trim()).filter(Boolean)))
        : problem.targetRemediationTiming
          ? [String(problem.targetRemediationTiming).trim()]
          : [],
      rootCause: problem.rootCause?.trim() || (problem.rootCauses?.[0] ?? ''),
      targetRemediationTiming: problem.targetRemediationTiming?.trim() || (problem.remediationTimings?.[0] ?? ''),
      metrics: Array.isArray(problem.metrics) ? problem.metrics.filter((metric) => metric && typeof metric.indicator === 'string' && metric.indicator.trim()) : []
    };

    const updatedNode: TraceabilityNode = {
      ...activeOkr,
      targetDate: normalized.targetRemediationTiming || activeOkr.targetDate,
      businessProblem: normalized
    };

    if (!enforceSupervisorPolicy(updatedNode)) {
      return;
    }

    onUpdateNodesMap((prev) => ({
      ...prev,
      [activeOkr.id]: updatedNode
    }));

    eventBus.publish({
      topic: 'OKR_CREATED_OR_EDITED',
      sourceAgent: 'Human Executive (HITL)',
      targetAgent: 'Supervisor & Advisory Committee',
      summary: `Business Problem Updated for OKR: "${activeOkr.title}" using BusinessProblemManager`,
      payload: {
        nodeId: activeOkr.id,
        title: activeOkr.title,
        problemDescription: normalized.problemDescription,
        impactedStakeholders: normalized.impactedStakeholders,
        timing: normalized.targetRemediationTiming
      },
      latencyMs: 14,
      severity: 'success'
    });

    setFeedbackMessage({
      text: `Business problem for "${activeOkr.title}" was structured and saved from the manager modal.`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // NEW OKR FORM STATE (WITH INDUSTRY TEMPLATE SELECTION & AI PARSER)
  // -------------------------------------------------------------
  const [newOkrMode, setNewOkrMode] = useState<'template' | 'parse' | 'manual'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [rawProblemTextInput, setRawProblemTextInput] = useState<string>('');

  const [newOkrTitle, setNewOkrTitle] = useState('');
  const [newOkrParentId, setNewOkrParentId] = useState('');
  const [newOkrOwner, setNewOkrOwner] = useState(orgDirectory[0]?.name || 'Executive Lead');
  const [newOkrBudget, setNewOkrBudget] = useState('$6.5M');
  const [newOkrPriority, setNewOkrPriority] = useState<PriorityLevel>('P0 - Critical');
  const [newOkrTargetDate, setNewOkrTargetDate] = useState('Q2 2027');

  // The 6 structured attributes for new OKR
  const [newOkrProblemDesc, setNewOkrProblemDesc] = useState('');
  const [newOkrStakeholders, setNewOkrStakeholders] = useState('Executive Leadership, Core Customers, Field Squads');
  const [newOkrCausalChain, setNewOkrCausalChain] = useState('');
  const [newOkrRootCause, setNewOkrRootCause] = useState('');
  const [newOkrRemediationTiming, setNewOkrRemediationTiming] = useState('Q2 2027 Sprint 4');
  const [newOkrRemediationTimings, setNewOkrRemediationTimings] = useState<string[]>(['Q2 2027 Sprint 4']);
  const [newOkrTimingDraft, setNewOkrTimingDraft] = useState('');
  const [newOkrMetrics, setNewOkrMetrics] = useState<BusinessMetricIndicator[]>([
    { indicator: 'Operational Throughput', baselineValue: '65%', targetValue: '> 88%', metricType: 'Leading' },
    { indicator: 'Financial Degradation Impact', baselineValue: '$5.5M', targetValue: '$0', metricType: 'Lagging' }
  ]);

  const normalizedMetricCount = useMemo(() => {
    return newOkrMetrics.filter((metric) => String(metric.indicator || '').trim()).length;
  }, [newOkrMetrics]);

  const addOkrSectionCompletion = useMemo(() => {
    const getStatus = (filled: number, total: number): 'empty' | 'review' | 'complete' => {
      if (filled <= 0) return 'empty';
      if (filled >= total) return 'complete';
      return 'review';
    };

    const basicsFilled = [
      newOkrTitle.trim(),
      newOkrOwner.trim(),
      newOkrParentId.trim(),
      newOkrBudget.trim(),
      newOkrPriority
    ].filter(Boolean).length;
    const basicsStatus = getStatus(basicsFilled, 5);

    const problemSourceFilled = newOkrMode === 'manual'
      ? 1
      : newOkrMode === 'template'
        ? (selectedTemplateId ? 1 : 0)
        : (rawProblemTextInput.trim() ? 1 : 0);
    const problemSourceStatus = getStatus(problemSourceFilled, 1);

    const attributesFilled = [
      newOkrProblemDesc.trim(),
      newOkrStakeholders.trim(),
      newOkrCausalChain.trim(),
      newOkrRootCause.trim(),
      newOkrRemediationTimings.length > 0 ? 'timings' : ''
    ].filter(Boolean).length;
    const attributesStatus = getStatus(attributesFilled, 5);

    const metricsStatus = getStatus(normalizedMetricCount > 0 ? 1 : 0, 1);

    const completedSections = [basicsStatus, problemSourceStatus, attributesStatus, metricsStatus]
      .filter((status) => status === 'complete').length;
    return {
      basics: basicsStatus,
      problemSource: problemSourceStatus,
      attributes: attributesStatus,
      metrics: metricsStatus,
      completedSections,
      totalSections: 4
    };
  }, [
    newOkrTitle,
    newOkrOwner,
    newOkrParentId,
    newOkrMode,
    selectedTemplateId,
    rawProblemTextInput,
    newOkrProblemDesc,
    newOkrStakeholders,
    newOkrCausalChain,
    newOkrRootCause,
    newOkrRemediationTimings,
    normalizedMetricCount
  ]);

  // Open "Add OKR" modal and initialize defaults
  const handleOpenAddOkrModal = () => {
    setIsAddingNewOkr(true);
    setNewOkrMode('template');
    setIsDraftPendingReview(false);
    setNewOkrValidationError(null);
    setNewOkrTimingDraft('');
    if (availableProblems.length > 0 && availableProblems[0]) {
      handleSelectIndustryProblem(availableProblems[0].id);
    }
  };

  // Handler: Select Existing Industry Business Problem for Add OKR
  const handleSelectIndustryProblem = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = availableProblems.find((p) => p.id === templateId);
    if (!tmpl) return;

    setNewOkrProblemDesc(tmpl.problem.problemDescription);
    setNewOkrStakeholders(tmpl.problem.impactedStakeholders.join(', '));
    setNewOkrCausalChain(tmpl.problem.causalChainToDollarImpact);
    setNewOkrRootCause(tmpl.problem.rootCause);
    const nextTimings = Array.from(new Set(
      ((tmpl.problem.remediationTimings && tmpl.problem.remediationTimings.length > 0)
        ? tmpl.problem.remediationTimings
        : [tmpl.problem.targetRemediationTiming]
      ).map((value) => String(value || '').trim()).filter(Boolean)
    ));
    const primaryTiming = nextTimings[0] || tmpl.problem.targetRemediationTiming || 'Q2 2027 Sprint 4';
    setNewOkrRemediationTimings(nextTimings.length > 0 ? nextTimings : [primaryTiming]);
    setNewOkrRemediationTiming(primaryTiming);
    setNewOkrTargetDate(primaryTiming);
    setNewOkrTimingDraft('');
    setNewOkrMetrics(JSON.parse(JSON.stringify(tmpl.problem.metrics)));

    if (!newOkrTitle.trim() || newOkrTitle.startsWith('Resolve') || newOkrTitle.startsWith('Remediate')) {
      setNewOkrTitle(`Resolve ${tmpl.title}`);
    }
  };

  // Handler: AI Smart Text Parser for Add OKR
  const handleRunAiSmartParser = () => {
    if (!rawProblemTextInput.trim()) return;
    const parsed = parseRawProblemText(rawProblemTextInput, industry.sector);

    setNewOkrProblemDesc(parsed.problemDescription);
    setNewOkrStakeholders(parsed.impactedStakeholders.join(', '));
    setNewOkrCausalChain(parsed.causalChainToDollarImpact);
    setNewOkrRootCause(parsed.rootCause);
    const primaryTiming = parsed.targetRemediationTiming || 'Q2 2027 Sprint 4';
    setNewOkrRemediationTimings([primaryTiming]);
    setNewOkrRemediationTiming(primaryTiming);
    setNewOkrTargetDate(primaryTiming);
    setNewOkrTimingDraft('');
    setNewOkrMetrics(parsed.metrics);

    if (!newOkrTitle.trim() || newOkrTitle.startsWith('Resolve') || newOkrTitle.startsWith('Remediate')) {
      setNewOkrTitle(`Remediate ${parsed.problemDescription.slice(0, 45)}...`);
    }

    setFeedbackMessage({
      text: 'AI parsed all 6 structured business problem attributes from text! Ready for review.',
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Handle Add Metric in New OKR Form
  const handleAddNewOkrMetric = () => {
    setNewOkrMetrics((prev) => [
      ...prev,
      { indicator: 'New Operational Metric', baselineValue: '50%', targetValue: '90%', metricType: 'Leading' }
    ]);
  };

  const handleRemoveNewOkrMetric = (index: number) => {
    setNewOkrMetrics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateNewOkrMetric = (index: number, field: keyof BusinessMetricIndicator, value: string) => {
    setNewOkrMetrics((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const applyConversationalDraftToForm = useCallback((draft: ConversationalOkrDraft) => {
    setNewOkrMode('manual');
    if (draft.title) setNewOkrTitle(draft.title);
    const resolvedParentId = draft.parentId || potentialParents[0]?.id || '';
    if (resolvedParentId) setNewOkrParentId(resolvedParentId);
    if (draft.owner) setNewOkrOwner(draft.owner);
    if (draft.priority) setNewOkrPriority(draft.priority);
    if (draft.budget) setNewOkrBudget(draft.budget);
    if (draft.problemDescription) setNewOkrProblemDesc(draft.problemDescription);
    if (Array.isArray(draft.impactedStakeholders) && draft.impactedStakeholders.length > 0) {
      setNewOkrStakeholders(draft.impactedStakeholders.join(', '));
    }
    if (draft.causalChainToDollarImpact) setNewOkrCausalChain(draft.causalChainToDollarImpact);
    const resolvedRootCause = draft.rootCause || draft.rootCauses?.[0];
    if (resolvedRootCause) setNewOkrRootCause(resolvedRootCause);

    const rawTimings =
      Array.isArray(draft.remediationTimings) && draft.remediationTimings.length > 0
        ? draft.remediationTimings
        : draft.targetRemediationTiming
          ? [draft.targetRemediationTiming]
          : draft.targetDate
            ? [draft.targetDate]
            : [];
    if (rawTimings.length > 0) {
      const timings = rawTimings.map((value) => String(value).trim()).filter(Boolean);
      if (timings.length > 0) {
        setNewOkrRemediationTimings(timings);
        setNewOkrRemediationTiming(timings[0]);
        setNewOkrTargetDate(draft.targetDate || timings[0]);
      }
    }

    if (Array.isArray(draft.metrics) && draft.metrics.length > 0) {
      const cleaned = draft.metrics
        .map((metric) => ({
          indicator: String(metric.indicator || '').trim(),
          baselineValue: String(metric.baselineValue || '').trim(),
          targetValue: String(metric.targetValue || '').trim(),
          metricType: (metric.metricType === 'Lagging' ? 'Lagging' : 'Leading') as 'Leading' | 'Lagging'
        }))
        .filter((metric) => metric.indicator);
      if (cleaned.length > 0) {
        setNewOkrMetrics(cleaned);
      }
    }

    setIsConversationalAgentOpen(false);
    setIsAddingNewOkr(true);
    setIsDraftPendingReview(true);
    setNewOkrValidationError(null);
    setFeedbackMessage({
      text: 'Conversational draft applied. Review the populated Add OKR form and click Publish OKR & Execute Remaining Stages.',
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 3500);
  }, [potentialParents]);

  const applyConversationalBusinessProblemToActiveOkr = useCallback(() => {
    if (!activeOkr || (!conversationBusinessProblem && !conversationDraft)) return;
    const problem =
      conversationBusinessProblem ||
      buildStructuredBusinessProblemFromDraft(conversationDraft || {}, industry.sector, '');
    handleBusinessProblemSave(problem);
    setIsConversationalAgentOpen(false);
  }, [activeOkr, conversationBusinessProblem, conversationDraft, industry.sector]);

  const runConversationalOrchestration = useCallback((response: ConversationalResponse) => {
    if (!Array.isArray(response.orchestrationEvents) || response.orchestrationEvents.length === 0) return;
    response.orchestrationEvents.slice(0, 4).forEach((entry, idx) => {
      eventBus.publish({
        topic: entry.topic,
        sourceAgent: entry.sourceAgent || 'Conversational Agent',
        targetAgent: entry.targetAgent || 'Supervisor Agent',
        summary: entry.summary || `Conversational orchestration action ${idx + 1}`,
        payload: {
          origin: 'conversational-agent',
          confidence: response.confidence,
          intent: response.intent
        },
        latencyMs: 20 + idx * 3,
        severity: entry.severity || 'info'
      });
    });
  }, []);

  const getConversationalCandidateOrigins = useCallback(() => {
    const currentOrigin = window.location.origin;
    const currentUrl = new URL(currentOrigin);
    const nextOrigins: string[] = [];

    if (preferredConversationalOrigin) nextOrigins.push(preferredConversationalOrigin);
    nextOrigins.push(currentOrigin);
    if (currentUrl.port === '3000') nextOrigins.push(`${currentUrl.protocol}//${currentUrl.hostname}:3001`);
    if (currentUrl.port === '3001') nextOrigins.push(`${currentUrl.protocol}//${currentUrl.hostname}:3000`);

    return Array.from(new Set(nextOrigins));
  }, [preferredConversationalOrigin]);

  const reconnectConversationalBackend = useCallback(async () => {
    if (isReconnectingConversationalBackend) return;
    setIsReconnectingConversationalBackend(true);
    try {
      const candidateOrigins = getConversationalCandidateOrigins();
      for (const origin of candidateOrigins) {
        try {
          const probe = await fetch(`${origin}/api/health`, { method: 'GET' });
          if (probe.ok) {
            setPreferredConversationalOrigin(origin);
            setIsConversationalBackendOffline(false);
            setFeedbackMessage({
              text: `Conversational backend reconnected at ${origin}.`,
              type: 'success'
            });
            setTimeout(() => setFeedbackMessage(null), 2500);
            return;
          }
        } catch {
          // Continue trying other candidate origins.
        }
      }

      setIsConversationalBackendOffline(true);
      setFeedbackMessage({
        text: 'Backend still offline. Keep using local conversational fallback or restart the server.',
        type: 'warning'
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsReconnectingConversationalBackend(false);
    }
  }, [getConversationalCandidateOrigins, isReconnectingConversationalBackend]);

  const buildLocalConversationalFallback = useCallback(
    (
      message: string,
      history: Array<{ role: string; text: string; nextExpectedField?: MissingAttributeKey | null }> = [],
      currentDraft: ConversationalOkrDraft | null = null,
      autoCompleteRemaining = false
    ): ConversationalResponse => {
      return parseConversationalOkrInput(
        message,
        {
          industryName: industry.name,
          sector: industry.sector,
          quarter: industry.quarter,
          owners: orgDirectory.map((member) => member.name).filter(Boolean),
          parentOptions: potentialParents.map((parent) => ({ id: parent.id, title: parent.title })),
          existingOkrTitles: okrNodes.map((node) => node.title),
          priorityOptions: ['P0 - Critical', 'P1 - High', 'P2 - Medium', 'AI_RECOMMENDED'],
          autoCompleteRemaining
        },
        history,
        currentDraft
      );
    },
    [industry.name, industry.sector, industry.quarter, orgDirectory, potentialParents, okrNodes]
  );

  const resetConversationalSession = useCallback(() => {
    setConversationDraft(null);
    setConversationBusinessProblem(null);
    setConversationGapReport({
      missingAttributes: [],
      capturedAttributes: [],
      readinessPct: 0,
      isDraftComplete: false,
      nextExpectedField: null
    });
    setConversationTurns([
      {
        id: `assistant-reset-${Date.now()}`,
        role: 'assistant',
        text: 'Started a fresh OKR drafting session. Describe your desired outcome or share details (owner, timeline, root cause, causal chain, metrics), and I will identify any missing attributes.'
      }
    ]);
  }, []);

  const handleConversationalSend = async (overrideMessage?: string, autoCompleteRemaining = false) => {
    const trimmed = (overrideMessage ?? conversationInput).trim();
    if (!trimmed || isConversationLoading) return;

    const userTurn: ConversationTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed
    };
    const priorTurns = conversationTurns.slice(-10).map((turn) => ({
      role: turn.role,
      text: turn.text,
      nextExpectedField: turn.nextExpectedField
    }));
    const activeDraftSnapshot = conversationDraft;
    setConversationTurns((prev) => [...prev, userTurn]);
    if (!overrideMessage) {
      setConversationInput('');
    }
    setIsConversationLoading(true);

    const applyParsedResponse = (payload: ConversationalResponse) => {
      const mergedDraft = payload.okrDraft
        ? mergeConversationalDrafts(activeDraftSnapshot, payload.okrDraft)
        : null;
      const resolvedProblem =
        payload.businessProblem ||
        (mergedDraft ? buildStructuredBusinessProblemFromDraft(mergedDraft, industry.sector, trimmed) : null);

      const missingAttributes = Array.isArray(payload.missingAttributes) ? payload.missingAttributes : [];
      const capturedAttributes = Array.isArray(payload.capturedAttributes) ? payload.capturedAttributes : [];
      const readinessPct = typeof payload.readinessPct === 'number' ? payload.readinessPct : (mergedDraft ? 100 : 0);
      const isDraftComplete = typeof payload.isDraftComplete === 'boolean' ? payload.isDraftComplete : missingAttributes.length === 0;
      const nextExpectedField = payload.nextExpectedField ?? missingAttributes[0]?.key ?? null;

      const assistantTurn: ConversationTurn = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: payload.assistantMessage || 'Parsed your input into an OKR & Business Problem draft.',
        intent: payload.intent,
        confidence: payload.confidence,
        actionPlan: payload.actionPlan,
        questions: payload.questions,
        nextExpectedField
      };
      setConversationTurns((prev) => [...prev, assistantTurn]);
      setConversationDraft(mergedDraft ? { ...mergedDraft, lastAskedField: nextExpectedField } : null);
      setConversationBusinessProblem(resolvedProblem);
      setConversationGapReport({
        missingAttributes,
        capturedAttributes,
        readinessPct,
        isDraftComplete,
        nextExpectedField
      });
      runConversationalOrchestration(payload);
    };

    try {
      const requestPayload = {
        message: trimmed,
        history: priorTurns,
        currentDraft: activeDraftSnapshot,
        autoCompleteRemaining,
        context: {
          industryName: industry.name,
          sector: industry.sector,
          quarter: industry.quarter,
          owners: orgDirectory.map((member) => member.name).filter(Boolean).slice(0, 20),
          parentOptions: potentialParents.slice(0, 20).map((parent) => ({ id: parent.id, title: parent.title })),
          existingOkrTitles: okrNodes.slice(0, 20).map((node) => node.title),
          priorityOptions: ['P0 - Critical', 'P1 - High', 'P2 - Medium', 'AI_RECOMMENDED'],
          autoCompleteRemaining
        }
      };

      const candidateOrigins = getConversationalCandidateOrigins();

      let response: Response | null = null;
      let responseOrigin: string | null = null;
      let lastErrorStatus: number | null = null;
      let networkFailure = false;

      for (const origin of candidateOrigins) {
        const endpoint = `${origin}/api/okr-conversational-agent`;
        let attempt: Response;
        try {
          attempt = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
          });
        } catch (requestError) {
          networkFailure = true;
          void requestError;
          continue;
        }

        if (attempt.ok) {
          response = attempt;
          responseOrigin = origin;
          break;
        }

        lastErrorStatus = attempt.status;
        if (attempt.status !== 404) {
          response = attempt;
          break;
        }
      }

      if (!response && networkFailure) {
        setIsConversationalBackendOffline(true);
        const fallbackPayload = buildLocalConversationalFallback(
          trimmed,
          priorTurns,
          activeDraftSnapshot,
          autoCompleteRemaining
        );
        applyParsedResponse(fallbackPayload);
        setFeedbackMessage({
          text: 'Conversational backend is offline. Local parser generated your OKR & Business Problem draft.',
          type: 'warning'
        });
        setTimeout(() => setFeedbackMessage(null), 3500);
        return;
      }

      if (!response || !response.ok) {
        setIsConversationalBackendOffline(true);
        throw new Error(`Conversational endpoint returned ${lastErrorStatus ?? response?.status ?? 'unknown'}`);
      }

      const payload = (await response.json()) as ConversationalResponse & { success?: boolean };
      if (responseOrigin) {
        setPreferredConversationalOrigin(responseOrigin);
      }
      setIsConversationalBackendOffline(false);
      applyParsedResponse(payload);
    } catch (error) {
      setIsConversationalBackendOffline(true);
      const fallbackPayload = buildLocalConversationalFallback(
        trimmed,
        priorTurns,
        activeDraftSnapshot,
        autoCompleteRemaining
      );
      applyParsedResponse(fallbackPayload);
      setFeedbackMessage({
        text: 'Backend request failed. Local conversational parser generated your draft.',
        type: 'warning'
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
      void error;
    } finally {
      setIsConversationLoading(false);
    }
  };

  const handleAddNewOkrTiming = () => {
    const value = newOkrTimingDraft.trim();
    if (!value) return;
    setNewOkrRemediationTimings((prev) => {
      const next = Array.from(new Set([...prev, value]));
      setNewOkrRemediationTiming(next[0] || value);
      setNewOkrTargetDate(next[0] || value);
      return next;
    });
    setNewOkrTimingDraft('');
  };

  const handleRemoveNewOkrTiming = (value: string) => {
    setNewOkrRemediationTimings((prev) => {
      const next = prev.filter((entry) => entry !== value);
      const fallback = next[0] || '';
      setNewOkrRemediationTiming(fallback);
      setNewOkrTargetDate(fallback || newOkrTargetDate);
      return next;
    });
  };

  // Terminate Program Form state
  const [terminationReason, setTerminationReason] = useState(
    'Strategic reprioritisation: Reclaiming budget & squad headcount for critical 5G C-Band expansion.'
  );

  // Initiate New Program Form state
  const [progTitle, setProgTitle] = useState('');
  const [progIssues, setProgIssues] = useState('');
  const [progIntent, setProgIntent] = useState('');
  const [progGrowthVision, setProgGrowthVision] = useState('');
  const [progSquadName, setProgSquadName] = useState('Dedicated Cloud Infrastructure ART');
  const [progFte, setProgFte] = useState(14);
  const [progBudget, setProgBudget] = useState('$5.0M');

  // Handle Manual Prioritisation Override
  const handleSetManualPriority = (nodeId: string, priority: PriorityLevel) => {
    const target = nodesMap[nodeId];
    if (!target) return;

    const manualPriority: HumanPriority = {
      priority,
      overrideReason: `Human-in-the-Loop decision: elevated focus based on executive growth mandate.`,
      overriddenBy: orgDirectory[0]?.name || 'Executive Steering Committee',
      overrideTimestamp: new Date().toISOString()
    };

    const updatedNode: TraceabilityNode = {
      ...target,
      manualPriority
    };

    onUpdateNodesMap((prev) => ({
      ...prev,
      [nodeId]: updatedNode
    }));

    eventBus.publish({
      topic: 'MANUAL_PRIORITY_OVERRIDDEN',
      sourceAgent: 'Human Executive (HITL)',
      targetAgent: 'Advisory Committee & Supervisor',
      summary: `Manual Prioritisation Applied: ${target.title} set to ${priority}`,
      payload: {
        nodeId,
        previousPriority: target.manualPriority?.priority || 'AI_RECOMMENDED',
        newPriority: priority,
        overriddenBy: manualPriority.overriddenBy
      },
      latencyMs: 18,
      severity: 'info'
    });

    setFeedbackMessage({
      text: `Priority set to ${priority} for "${target.title}". Advisory agent recomputed future trajectory!`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle Add New OKR
  const handleCreateNewOkr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOkrTitle.trim()) return;

    const newId = `custom-kr-${Date.now()}`;
    const stakeholdersList = newOkrStakeholders
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const normalizedRemediationTimings = Array.from(
      new Set(
        (newOkrRemediationTimings.length > 0 ? newOkrRemediationTimings : [newOkrRemediationTiming, newOkrTargetDate])
          .map((value) => String(value || '').trim())
          .filter(Boolean)
      )
    );
    const primaryTiming = normalizedRemediationTimings[0] || newOkrRemediationTiming || newOkrTargetDate || 'Q2 2027 Sprint 4';

    const structuredProblem: StructuredBusinessProblem = {
      problemDescription: newOkrProblemDesc || `Strategic gap in ${industry.sector} execution identified by executive leadership.`,
      impactedStakeholders: stakeholdersList.length > 0 ? stakeholdersList : ['Executive Board', 'Customer Base', 'Agile Delivery Squads'],
      causalChainToDollarImpact: newOkrCausalChain || 'Execution friction -> 12% schedule slippage -> revenue opportunity loss of $4.5M.',
      rootCause: newOkrRootCause || 'Under-resourced specialized engineering headcount and competing dependencies.',
      targetRemediationTiming: primaryTiming,
      remediationTimings: normalizedRemediationTimings,
      metrics: newOkrMetrics.length > 0 ? newOkrMetrics : [
        { indicator: 'Operational Efficiency', baselineValue: '65%', targetValue: '> 88%', metricType: 'Leading' },
        { indicator: 'Financial Degradation', baselineValue: '$5.0M', targetValue: '$0', metricType: 'Lagging' }
      ]
    };

    const parentId = newOkrParentId || potentialParents[0]?.id || Object.keys(nodesMap)[0] || 'root';

    const smartEval = evaluateSmartCriteria(newOkrTitle);
    const advisoryEval = evaluateAdvisoryCommittee(newOkrTitle, [42, 49, 57, 64, 72], 5);

    const newNode: TraceabilityNode = {
      id: newId,
      title: newOkrTitle,
      owner: newOkrOwner,
      status: 'On Track',
      progress: 35,
      budget: newOkrBudget,
      parentIds: [parentId],
      childIds: [],
      targetDate: primaryTiming,
      manualPriority: {
        priority: newOkrPriority,
        overrideReason: 'Newly initiated strategic OKR created with priority and 6-dimension business problem.',
        overriddenBy: newOkrOwner,
        overrideTimestamp: new Date().toISOString()
      },
      businessProblem: structuredProblem,
      ai: {
        analyse: `SMART composite ${smartEval.compositeScore}/100 validated against enterprise policies and HR directory.`,
        predict: `Projected ${Math.min(96, Math.max(68, Math.round(advisoryEval.consensusScore)))}% attainment probability across ${normalizedRemediationTimings.join(', ')}.`,
        recommend: `Advisory consensus (${advisoryEval.consensusScore.toFixed(0)}%) recommends dedicated squad alignment to unblock "${structuredProblem.rootCause}".`,
        automate: 'Continuous webhook sync established with Planview AgilePlace.',
        optimise: 'Resource allocation and causal impact verified across org directory.'
      }
    };

    if (!enforceSupervisorPolicy(newNode, true)) {
      return;
    }

    // Update parent node childIds as well
    onUpdateNodesMap((prev) => {
      const parent = prev[parentId];
      const updatedParent = parent
        ? { ...parent, childIds: Array.from(new Set([...parent.childIds, newId])) }
        : null;

      return {
        ...prev,
        [newId]: newNode,
        ...(updatedParent ? { [parentId]: updatedParent } : {})
      };
    });

    eventBus.publish({
      topic: 'OKR_CREATED_OR_EDITED',
      sourceAgent: 'Human Executive (HITL)',
      targetAgent: 'Supervisor & Advisory Committee',
      summary: `New OKR Published: "${newOkrTitle}" (${newOkrPriority}) with 6 structured Business Problem attributes`,
      payload: {
        id: newId,
        title: newOkrTitle,
        priority: newOkrPriority,
        owner: newOkrOwner,
        problemDescription: structuredProblem.problemDescription
      },
      latencyMs: 24,
      severity: 'success'
    });

    eventBus.publish({
      topic: 'KR_REGRESSION_PREDICTED',
      sourceAgent: 'OKR Quality & Prediction Agent',
      targetAgent: 'Trajectory Engine',
      summary: `Stage 2 Executed for "${newOkrTitle}": SMART score ${smartEval.compositeScore}/100`,
      payload: {
        okrId: newId,
        smartCompositeScore: smartEval.compositeScore,
        targetTiming: primaryTiming
      },
      latencyMs: 18,
      severity: 'info'
    });

    eventBus.publish({
      topic: 'ADVISORY_COMMITTEE_EVALUATED',
      sourceAgent: 'Advisory Committee (5 Agents)',
      targetAgent: 'Supervisor Agent',
      summary: `Remaining Stages Executed for "${newOkrTitle}": Consensus ${advisoryEval.consensusScore.toFixed(0)}% • Bottleneck & $ impact verified`,
      payload: {
        okrId: newId,
        consensusScore: advisoryEval.consensusScore,
        causalChain: structuredProblem.causalChainToDollarImpact
      },
      latencyMs: 29,
      severity: 'success'
    });

    setIsAddingNewOkr(false);
    setIsDraftPendingReview(false);
    setNewOkrValidationError(null);
    setSelectedOkrId(newId);
    setFeedbackMessage({
      text: `Published "${newOkrTitle}" & executed remaining stages (SMART: ${smartEval.compositeScore}/100, Advisory Consensus: ${advisoryEval.consensusScore.toFixed(0)}%)!`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Handle Terminate Program
  const handleTerminateProgram = (progId: string) => {
    const targetProg = managedPrograms.find((p) => p.id === progId);
    if (!targetProg) return;

    const updated = managedPrograms.map((p) => {
      if (p.id === progId) {
        return {
          ...p,
          status: 'Terminated' as const,
          terminationReason,
          terminationDate: new Date().toISOString().split('T')[0],
          reallocatedHeadcount: 12,
          reallocatedBudget: '$3.5M'
        };
      }
      return p;
    });

    onUpdateManagedPrograms(updated);
    setTerminatingProgramId(null);

    eventBus.publish({
      topic: 'PROGRAM_TERMINATED',
      sourceAgent: 'Human Executive (HITL)',
      targetAgent: 'Alignment & Capacity Agent',
      summary: `Program Terminated: "${targetProg.title}". Reallocated $3.5M budget and 12 FTE to high-impact OKRs.`,
      payload: {
        programId: progId,
        title: targetProg.title,
        reason: terminationReason
      },
      latencyMs: 30,
      severity: 'warning'
    });

    setFeedbackMessage({
      text: `Terminated program "${targetProg.title}". Budget ($3.5M) and 12 FTE reallocated to unblock critical bottlenecks!`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle Initiate New Program
  const handleInitiateNewProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) return;

    const newProg: ManagedProgram = {
      id: `prog-${Date.now()}`,
      title: progTitle,
      status: 'Active',
      strategicStatement: {
        issues: progIssues || 'Capacity bottlenecks and unmitigated architectural dependencies.',
        intent: progIntent || 'Accelerate delivery by forming dedicated specialist delivery squad.',
        growthVision: progGrowthVision || `Achieve benchmark leadership in ${industry.sector}.`
      },
      businessProblem: {
        problemDescription: progIssues || 'Operational friction in enterprise value stream.',
        impactedStakeholders: ['Executive Board', 'Customer Experience Tribe'],
        causalChainToDollarImpact: 'Operational delay -> customer churn -> $4.2M annual revenue impact.',
        rootCause: 'Under-resourced agile delivery squads.',
        targetRemediationTiming: 'Q2 2027',
        metrics: [
          { indicator: 'Squad Velocity Throughput', baselineValue: '32 pts/sprint', targetValue: '55 pts/sprint', metricType: 'Leading' }
        ]
      },
      roadmap: [
        { milestone: 'Squad Mobilisation & Backlog Definition', targetQuarter: 'Q4 2026', deliverables: ['Team staffed', 'Architecture blueprint'], status: 'In Progress' },
        { milestone: 'MVP Deployment & Alpha Customers', targetQuarter: 'Q1 2027', deliverables: ['Alpha release', 'SLA validation'], status: 'Upcoming' }
      ],
      resourceAssignments: [
        { squadId: `squad-${Date.now()}`, squadName: progSquadName, assignedFte: progFte, budgetAllocation: progBudget }
      ]
    };

    onUpdateManagedPrograms([newProg, ...managedPrograms]);
    setIsInitiatingProgram(false);

    eventBus.publish({
      topic: 'PROGRAM_INITIATED',
      sourceAgent: 'Human Executive (HITL)',
      targetAgent: 'Advisory Committee & Alignment Agent',
      summary: `New Program Initiated: "${progTitle}" with ${progFte} FTE and ${progBudget} budget`,
      payload: {
        id: newProg.id,
        title: progTitle,
        assignedFte: progFte,
        budget: progBudget
      },
      latencyMs: 32,
      severity: 'success'
    });

    setFeedbackMessage({
      text: `Successfully initiated program "${progTitle}". Advisory agent re-evaluated capacity across all 7 layers!`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Handle Disaster Simulation Trigger / Resolve
  const handleToggleDisaster = (disasterId: string) => {
    const updated = activeDisasters.map((d) => {
      if (d.id === disasterId) {
        const nextState = !d.active;
        eventBus.publish({
          topic: nextState ? 'SIGNIFICANT_EVENT_TRIGGERED' : 'SIGNIFICANT_EVENT_RESOLVED',
          sourceAgent: 'Disaster Simulator Radar',
          targetAgent: 'Risk Sentinel & Executive Reporter',
          summary: `${nextState ? 'CATASTROPHIC EVENT TRIGGERED' : 'DISASTER RESOLVED'}: ${d.title} (Severity: ${d.severity})`,
          payload: {
            disasterId: d.id,
            title: d.title,
            type: d.type,
            active: nextState,
            impactDrop: d.impacts.attainmentDropPct,
            mitigation: d.impacts.mitigationAction
          },
          latencyMs: 15,
          severity: nextState ? 'danger' : 'success'
        });
        return { ...d, active: nextState };
      }
      return d;
    });

    onUpdateActiveDisasters(updated);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-violet-100 text-violet-700">
                <Sliders className="w-5 h-5 text-violet-600" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  OKR &amp; Program Management Studio
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Human-in-the-Loop manual prioritisation, 6-attribute business problem definitions, program lifecycle termination, and disaster event simulation.
                </p>
              </div>
            </div>
          </div>

          {/* Action Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('okrs')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'okrs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual OKRs ({okrNodes.length})
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'programs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Programs ({managedPrograms.length})
            </button>
            <button
              onClick={() => setActiveTab('disasters')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'disasters'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-700 hover:bg-red-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Disaster Simulation ({activeDisasters.filter((d) => d.active).length} Active)</span>
            </button>
            <button
              onClick={() => setActiveTab('supervisor')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'supervisor'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Supervisor Validation
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackMessage.text}</span>
          </div>
        )}
      </div>

      {/* TAB 1: MANUAL OKR PRIORITISATION & 6-ATTRIBUTE BUSINESS PROBLEMS */}
      {activeTab === 'okrs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): OKR List with Human-in-the-Loop Priority Selectors */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Enterprise OKRs</h3>
                <p className="text-xs text-slate-500">Override AI priority with manual Human-in-the-Loop authority.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsConversationalAgentOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold shadow-xs cursor-pointer transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Conversational Agent</span>
                </button>
                <button
                  onClick={handleOpenAddOkrModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add OKR</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">
              {okrNodes.map((okr) => {
                const isSelected = activeOkr?.id === okr.id;
                const manualPriority = okr.manualPriority?.priority || 'AI_RECOMMENDED';

                return (
                  <div
                    key={okr.id}
                    onClick={() => {
                      setSelectedOkrId(okr.id);
                      setIsEditingProblem(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{okr.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          manualPriority === 'P0 - Critical'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : manualPriority === 'P1 - High'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : manualPriority === 'P2 - Medium'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : manualPriority === 'P3 - Deferred'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {manualPriority}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-2">{okr.title}</h4>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>Owner: <strong className="text-slate-700">{okr.owner}</strong></span>
                      <span>Budget: <strong className="text-slate-700">{okr.budget}</strong></span>
                      <span>Progress: <strong className="text-slate-700">{okr.progress}%</strong></span>
                    </div>

                    {/* Quick Manual Priority Override Select Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-semibold text-slate-400 mr-1">Override:</span>
                      {(['P0 - Critical', 'P1 - High', 'P2 - Medium', 'AI_RECOMMENDED'] as PriorityLevel[]).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => handleSetManualPriority(okr.id, lvl)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                            manualPriority === lvl
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {lvl === 'P0 - Critical' ? 'P0' : lvl === 'P1 - High' ? 'P1' : lvl === 'P2 - Medium' ? 'P2' : 'AI'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (7 cols): Structured 6-Attribute Business Problem Viewer & Editor */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            {activeOkr ? (
              <div className="space-y-4">
                {/* OKR Header with Toggle Button */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase whitespace-nowrap">{activeOkr.id}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 whitespace-nowrap">Owner: <strong>{activeOkr.owner}</strong></span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 whitespace-nowrap">Timing: <strong>{activeOkr.targetDate || 'Q2 2027'}</strong></span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeOkr.title}</h3>
                  </div>

                  {!isEditingProblem ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleStartEditingProblem}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold cursor-pointer transition-all shadow-2xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit Business Problem</span>
                      </button>
                      <button
                        onClick={() => setIsBusinessProblemManagerOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-all"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-600" />
                        <span>BusinessProblemManager</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsEditingProblem(false)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBusinessProblem}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* INLINE EDITING FORM (WHEN isEditingProblem === true)              */}
                {/* ----------------------------------------------------------------- */}
                {isEditingProblem ? (
                  <form onSubmit={handleSaveBusinessProblem} className="space-y-4">
                    {/* Auto-fill from Industry Library Helper */}
                    <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 text-indigo-900 text-xs font-semibold">
                        <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Scaffold from {industry.sector} Business Problems:</span>
                      </div>
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleApplyTemplateToInline(e.target.value);
                        }}
                        defaultValue=""
                        className="px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="" disabled>-- Select Existing Problem --</option>
                        {availableProblems.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* 1. Problem Description */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        1. Problem Description *
                        <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                          (Core operational issue, bottlenecks, customer pain points)
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={editProblemDesc}
                        onChange={(e) => setEditProblemDesc(e.target.value)}
                        placeholder="Define operational friction and customer impact..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    {/* 2. Impacted Stakeholders */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        2. Impacted Stakeholders *
                        <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                          (Comma-separated list of affected customer, executive, or squad groups)
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editStakeholders}
                        onChange={(e) => setEditStakeholders(e.target.value)}
                        placeholder="e.g. 14.8M Mobile Subscribers, Field Maintenance Crews, Executive Board"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    {/* 3. Causal Chain to $ Impact */}
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1 text-red-700">
                        3. Causal Chain to $ Impact *
                        <span className="text-[11px] font-normal text-slate-500 ml-1.5">
                          (Technical root cause &rarr; operational symptom &rarr; dollar financial impact)
                        </span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={editCausalChain}
                        onChange={(e) => setEditCausalChain(e.target.value)}
                        placeholder="e.g. Saturated optical fiber backhaul -> 4.2% packet drop -> streaming buffering -> 2.1% subscriber churn -> $18.4M annual ARPU loss."
                        className="w-full px-3 py-2 border border-red-200 bg-red-50/40 rounded-xl text-xs text-red-950 font-medium focus:ring-2 focus:ring-red-400"
                      />
                    </div>

                    {/* 4. Root Cause & 5. Target Remediation Timing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          4. Root Cause *
                        </label>
                        <input
                          type="text"
                          required
                          value={editRootCause}
                          onChange={(e) => setEditRootCause(e.target.value)}
                          placeholder="e.g. Legacy 10Gbps optical interfaces and municipal permitting delays"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          5. Target Remediation Timing *
                        </label>
                        <input
                          type="text"
                          required
                          value={editRemediationTiming}
                          onChange={(e) => setEditRemediationTiming(e.target.value)}
                          placeholder="e.g. Q1 2027 Sprint 6"
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                        />
                      </div>
                    </div>

                    {/* 6. Measurable Indicators & Metrics */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-800 block">
                            6. Leading &amp; Lagging Metrics (Measurability Indicators) *
                          </label>
                          <span className="text-[11px] text-slate-500">
                            Evaluated by Supervisor Agent against enterprise SMART measurability thresholds (&ge; 70%)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddEditMetric}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Metric</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {editMetrics.map((metric, idx) => (
                          <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-12 sm:col-span-2">
                              <select
                                value={metric.metricType}
                                onChange={(e) => handleUpdateEditMetric(idx, 'metricType', e.target.value)}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-[11px] font-bold text-slate-700 bg-slate-50"
                              >
                                <option value="Leading">Leading</option>
                                <option value="Lagging">Lagging</option>
                              </select>
                            </div>
                            <div className="col-span-12 sm:col-span-4">
                              <input
                                type="text"
                                value={metric.indicator}
                                onChange={(e) => handleUpdateEditMetric(idx, 'indicator', e.target.value)}
                                placeholder="Metric name / indicator"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                              />
                            </div>
                            <div className="col-span-6 sm:col-span-2">
                              <input
                                type="text"
                                value={metric.baselineValue}
                                onChange={(e) => handleUpdateEditMetric(idx, 'baselineValue', e.target.value)}
                                placeholder="Baseline"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-slate-800"
                              />
                            </div>
                            <div className="col-span-5 sm:col-span-3">
                              <input
                                type="text"
                                value={metric.targetValue}
                                onChange={(e) => handleUpdateEditMetric(idx, 'targetValue', e.target.value)}
                                placeholder="Target"
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs text-emerald-800 font-bold"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveEditMetric(idx)}
                                className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                                title="Remove Metric"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-2 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingProblem(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Business Problem</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ----------------------------------------------------------------- */
                  /* READ-ONLY PRESENTATION (WHEN isEditingProblem === false)          */
                  /* ----------------------------------------------------------------- */
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      Structured Business Problem &amp; Strategic Alignment (6 Dimensions)
                    </h4>

                    {/* 1. Problem Description */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">1. Problem Description</span>
                      <p className="text-xs text-slate-800 mt-1 leading-relaxed">
                        {activeOkr.businessProblem?.problemDescription ||
                          'Operational bottleneck causing delayed execution against baseline market growth targets.'}
                      </p>
                    </div>

                    {/* 2. Impacted Stakeholders */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">2. Impacted Stakeholders</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {(activeOkr.businessProblem?.impactedStakeholders || ['Executive Leadership', 'Core Customers', 'Field Squads']).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 3. Causal Chain to $ Impact */}
                    <div className="p-3.5 bg-red-50/70 rounded-xl border border-red-200/80">
                      <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">3. Causal Chain to $ Impact</span>
                      <p className="text-xs text-red-900 mt-1 font-medium leading-relaxed">
                        {activeOkr.businessProblem?.causalChainToDollarImpact ||
                          'Latency bottleneck -> customer attrition -> $6.2M annualised revenue degradation.'}
                      </p>
                    </div>

                    {/* 4. Root Cause & 5. Target Remediation Timing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">4. Root Cause</span>
                        <p className="text-xs text-slate-800 mt-1">
                          {activeOkr.businessProblem?.rootCause || 'Constrained specialized headcount and legacy architectural debt.'}
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">5. Target Remediation Timing</span>
                        <p className="text-xs text-slate-800 font-semibold mt-1">
                          {activeOkr.businessProblem?.targetRemediationTiming || activeOkr.targetDate || 'Q1 2027 Sprint 4'}
                        </p>
                      </div>
                    </div>

                    {/* 6. Measurable Indicators & Metrics */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">6. Leading &amp; Lagging Metrics</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {(activeOkr.businessProblem?.metrics || [
                          { indicator: 'Key Operational Metric', baselineValue: '92%', targetValue: '< 70%', metricType: 'Leading' as const },
                          { indicator: 'Financial Dollar Impact', baselineValue: '$18M loss rate', targetValue: '$0', metricType: 'Lagging' as const }
                        ]).map((m, idx) => (
                          <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{m.metricType} Metric</span>
                              <span className="text-[10px] font-semibold text-indigo-600">{m.indicator}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1.5">
                              <span className="text-slate-500">Base: <strong className="text-slate-700">{m.baselineValue}</strong></span>
                              <span className="text-slate-400">&rarr;</span>
                              <span className="text-slate-500">Target: <strong className="text-emerald-700">{m.targetValue}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Select an OKR from the left column to view its structured business problem.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM LIFECYCLE MANAGEMENT (TERMINATE & INITIATE) */}
      {activeTab === 'programs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Enterprise Program &amp; Project Portfolio Lifecycle
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Terminate running programs to reclaim budget and headcount, or initiate new strategic programs with roadmaps and squad assignments.
              </p>
            </div>

            <button
              onClick={() => setIsInitiatingProgram(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Initiate New Program</span>
            </button>
          </div>

          {/* Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {managedPrograms.map((prog) => {
              const isTerminated = prog.status === 'Terminated';

              return (
                <div
                  key={prog.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isTerminated
                      ? 'bg-slate-50 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isTerminated
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {prog.status}
                      </span>
                      {prog.linkedOkrId && (
                        <span className="text-[10px] font-bold text-slate-400">OKR: {prog.linkedOkrId}</span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">{prog.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                      {prog.strategicStatement.intent}
                    </p>

                    {/* Growth Vision */}
                    <div className="mt-2.5 p-2 bg-indigo-50/60 rounded-lg text-[11px] text-indigo-900">
                      <strong>Vision:</strong> {prog.strategicStatement.growthVision}
                    </div>

                    {/* Resources */}
                    <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                      {prog.resourceAssignments.map((res, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{res.squadName}:</span>
                          <strong>{res.assignedFte} FTE ({res.budgetAllocation})</strong>
                        </div>
                      ))}
                    </div>

                    {/* Termination Note */}
                    {isTerminated && prog.terminationReason && (
                      <div className="mt-2.5 p-2 bg-red-50 rounded-lg text-[11px] text-red-800 border border-red-200/60">
                        <strong>Terminated:</strong> {prog.terminationReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {!isTerminated ? (
                      <button
                        onClick={() => setTerminatingProgramId(prog.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Terminate Program</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Reallocated: {prog.reallocatedBudget} &bull; {prog.reallocatedHeadcount} FTE</span>
                    )}

                    <span className="text-[11px] text-slate-400">{prog.roadmap.length} Milestones</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SIGNIFICANT EVENT / DISASTER SIMULATION CONSOLE */}
      {activeTab === 'disasters' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              Global &amp; Industry Significant Event / Disaster Trigger Console
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate black-swan catastrophic shocks (Cyberattacks, Data Centre Outages, Subsea Fiber Severance, Superstorms) to evaluate OKR resilience and trigger automated failovers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {activeDisasters.map((disaster) => (
              <div
                key={disaster.id}
                className={`p-4 rounded-xl border transition-all ${
                  disaster.active
                    ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        disaster.active ? 'bg-red-600 animate-ping' : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-xs font-bold uppercase text-slate-700">{disaster.type}</span>
                    <span className="text-xs text-slate-400">&bull;</span>
                    <span className="text-xs text-slate-500">{disaster.industry}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      disaster.severity === 'Critical'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {disaster.severity}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">{disaster.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{disaster.description}</p>

                {/* Impact Specs */}
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200/60">
                  <div className="flex justify-between text-red-700 font-bold">
                    <span>Projected Attainment Shock:</span>
                    <span>{disaster.impacts.attainmentDropPct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Direct Cost Impact:</span>
                    <span className="font-semibold text-slate-800">{disaster.impacts.costImpact}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <strong>Contingency Action:</strong> {disaster.impacts.mitigationAction}
                  </div>
                </div>

                {/* Toggle Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Status: <strong className={disaster.active ? 'text-red-600' : 'text-slate-700'}>{disaster.active ? 'ACTIVE CRISIS' : 'Dormant (Ready to Trigger)'}</strong>
                  </span>

                  <button
                    onClick={() => handleToggleDisaster(disaster.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs ${
                      disaster.active
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {disaster.active ? 'Resolve Event' : 'Trigger Crisis'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUPERVISOR AGENT VALIDATION AUDIT */}
      {activeTab === 'supervisor' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Supervisor Agent: Enterprise OKR Policy &amp; HR Validation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated audit confirming owner identities against organizational HR directory, verifying measurability &amp; ambition scores, and checking mandatory causal chains.
            </p>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">OKR Entity</th>
                  <th className="px-3 py-2.5">Owner / HR Verified</th>
                  <th className="px-3 py-2.5">Measurability Score</th>
                  <th className="px-3 py-2.5">Ambition Score</th>
                  <th className="px-3 py-2.5">Checkpoints Passed</th>
                  <th className="px-3 py-2.5">Policy Adequacy Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {okrNodes.map((okr) => {
                  const audit = validateOkrStructuralAdequacy(okr, policies, orgDirectory);
                  return (
                    <tr key={okr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {okr.title}
                        <span className="block text-[10px] font-mono text-slate-400">{okr.id}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-800">{audit.assignedOwnerName}</span>
                        {audit.ownershipVerified ? (
                          <span className="block text-[10px] text-emerald-600 font-medium">&check; HR Directory Match</span>
                        ) : (
                          <span className="block text-[10px] text-amber-600 font-medium">&bull; Pending Org Sync</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{audit.measurabilityScore}%</span>
                          <span className="text-[10px] text-slate-400">(&ge; 70%)</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{audit.ambitionScore}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-700">
                        {audit.structuralCheckpointsPassed} / {audit.totalCheckpoints}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            audit.isAdequate
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {audit.isAdequate ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {audit.isAdequate ? 'Adequate & Enforced' : 'Needs Restructuring'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CONVERSATIONAL OKR AGENT */}
      {isConversationalAgentOpen && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-5 shadow-2xl border border-slate-200 overflow-hidden gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                  <Bot className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Conversational OKR Agent</h3>
                  <p className="text-xs text-slate-500">
                    Describe goals in free text. Agent interprets intent, drafts OKRs, and suggests orchestration actions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetConversationalSession}
                  className="px-2 py-0.5 rounded-full border border-slate-300 bg-white text-[10px] font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Start a fresh OKR conversation"
                >
                  New Session
                </button>
                <button
                  type="button"
                  onClick={reconnectConversationalBackend}
                  disabled={isReconnectingConversationalBackend}
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold transition-all ${
                    isConversationalBackendOffline
                      ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  } ${isReconnectingConversationalBackend ? 'opacity-70 cursor-not-allowed' : ''}`}
                  title={isConversationalBackendOffline ? 'Backend offline. Click to reconnect.' : 'Backend online. Click to re-check connection.'}
                >
                  {isReconnectingConversationalBackend
                    ? 'Checking...'
                    : isConversationalBackendOffline
                      ? 'Backend offline'
                      : 'Backend online'}
                </button>
                <button
                  type="button"
                  aria-label="Close Conversational Agent"
                  onClick={() => setIsConversationalAgentOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-[11px] font-semibold text-slate-700">Try prompts:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Create a P1 OKR to reduce onboarding time from 9 days to 3 days by Q2 2027.',
                  'Draft a business problem for rising churn caused by 5G streaming issues.',
                  'Suggest orchestration actions for a critical reliability incident.'
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setConversationInput(prompt)}
                    className="px-2.5 py-1 rounded-full border border-slate-300 bg-white text-[11px] text-slate-700 hover:bg-slate-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {(conversationTurns.length > 1 || conversationDraft) && (
              <div className={`rounded-xl border p-2.5 space-y-2 ${
                conversationGapReport.isDraftComplete
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-amber-200 bg-amber-50/70'
              }`}>
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className={`font-bold ${conversationGapReport.isDraftComplete ? 'text-emerald-800' : 'text-amber-900'}`}>
                    {conversationGapReport.isDraftComplete
                      ? 'OKR & 6-Dimension Business Problem Ready (100%)'
                      : `Attribute Completeness: ${conversationGapReport.readinessPct}% (${conversationGapReport.missingAttributes.length} missing)`}
                  </span>
                  {!conversationGapReport.isDraftComplete && conversationDraft && (
                    <button
                      type="button"
                      disabled={isConversationLoading}
                      onClick={() => void handleConversationalSend('Construct complete draft with recommended defaults for remaining attributes', true)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold cursor-pointer disabled:opacity-60"
                    >
                      Construct Complete Draft
                    </button>
                  )}
                </div>

                {conversationGapReport.missingAttributes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {conversationGapReport.missingAttributes.map((missing) => (
                        <button
                          key={missing.key}
                          type="button"
                          onClick={() => setConversationInput(missing.example)}
                          title={`Click to pre-fill ${missing.label} answer`}
                          className="px-2 py-0.5 rounded-md border border-amber-300 bg-white hover:bg-amber-100 text-[10px] font-semibold text-amber-900 cursor-pointer"
                        >
                          + {missing.label}
                        </button>
                      ))}
                    </div>
                    {conversationGapReport.missingAttributes.some((m) => m.key === 'owner' || m.key === 'ownerVerification') &&
                      orgDirectory.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[10px] font-semibold text-slate-600">HR Owners:</span>
                          {orgDirectory.slice(0, 4).map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              disabled={isConversationLoading}
                              onClick={() => void handleConversationalSend(`owner: ${member.name}`)}
                              className="px-2 py-0.5 rounded-md border border-indigo-200 bg-white hover:bg-indigo-50 text-[10px] font-semibold text-indigo-700 cursor-pointer"
                            >
                              Assign {member.name}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-3 h-[280px] overflow-y-auto space-y-3">
              {conversationTurns.map((turn) => (
                <div key={turn.id} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    turn.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}>
                    <p className="whitespace-pre-wrap">{turn.text}</p>
                    {turn.role === 'assistant' && (turn.intent || turn.actionPlan?.length || turn.questions?.length) && (
                      <div className="mt-2 space-y-1.5 text-[10px]">
                        {turn.intent && (
                          <p>
                            <span className="font-bold">Intent:</span> {turn.intent}
                            {typeof turn.confidence === 'number' && (
                              <span className="ml-1">({Math.round(turn.confidence * 100)}%)</span>
                            )}
                          </p>
                        )}
                        {Array.isArray(turn.actionPlan) && turn.actionPlan.length > 0 && (
                          <div>
                            <p className="font-bold mb-0.5">Action Plan</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {turn.actionPlan.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                        {Array.isArray(turn.questions) && turn.questions.length > 0 && (
                          <div>
                            <p className="font-bold mb-0.5">Questions to Complete Draft</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {turn.questions.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isConversationLoading && (
                <div className="text-xs text-slate-500">Agent is analyzing OKR &amp; Business Problem gaps...</div>
              )}
            </div>

            {conversationDraft && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-emerald-800">
                      {conversationGapReport.isDraftComplete
                        ? 'Constructed Complete OKR & 6-Dimension Business Problem'
                        : 'Progressive Draft OKR & Business Problem'}
                    </p>
                    <p className="text-[11px] text-emerald-900">
                      {conversationGapReport.isDraftComplete
                        ? 'All attributes captured. Click "Apply Draft to Form" for final review and Publish OKR & Execute Remaining Stages.'
                        : 'Continue answering questions above or click "Apply Draft to Form" to review and complete remaining fields.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {activeOkr && conversationBusinessProblem && (
                      <button
                        type="button"
                        onClick={applyConversationalBusinessProblemToActiveOkr}
                        className="px-3 py-1.5 rounded-lg border border-emerald-600 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer"
                      >
                        Apply to Active OKR Problem
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => applyConversationalDraftToForm(conversationDraft)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Apply Draft to Form
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-emerald-200 bg-white p-2.5 text-[11px] text-slate-700">
                  <div>
                    <span className="font-bold text-slate-900">Outcome / Title:</span>{' '}
                    <span>{conversationDraft.title || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Owner:</span>{' '}
                    <span>{conversationDraft.owner || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Timeline:</span>{' '}
                    <span>
                      {(conversationDraft.remediationTimings && conversationDraft.remediationTimings.join(', ')) ||
                        conversationDraft.targetRemediationTiming ||
                        conversationDraft.targetDate ||
                        'Q2 2027 Sprint 4'}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Priority / Budget:</span>{' '}
                    <span>{conversationDraft.priority || 'P1 - High'} • {conversationDraft.budget || '$4.5M'}</span>
                  </div>
                  {Array.isArray(conversationDraft.metrics) && conversationDraft.metrics.length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="font-bold text-slate-900 block mb-1">Parsed Metrics:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {conversationDraft.metrics.map((metric, idx) => (
                          <span
                            key={`${metric.indicator}-${idx}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-800"
                          >
                            <span className={metric.metricType === 'Lagging' ? 'text-amber-700' : 'text-indigo-700'}>
                              {metric.metricType}
                            </span>
                            <span>• {metric.indicator}: {metric.baselineValue} → {metric.targetValue}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {conversationBusinessProblem && (
                    <div className="sm:col-span-2 border-t border-slate-100 pt-1.5 space-y-0.5 text-[10px] text-slate-600">
                      <p>
                        <span className="font-bold text-slate-800">Business Problem:</span>{' '}
                        {conversationBusinessProblem.problemDescription}
                      </p>
                      <p>
                        <span className="font-bold text-slate-800">Root Cause:</span>{' '}
                        {conversationBusinessProblem.rootCause}
                      </p>
                      <p>
                        <span className="font-bold text-slate-800">Causal Chain:</span>{' '}
                        {conversationBusinessProblem.causalChainToDollarImpact}
                      </p>
                      <p>
                        <span className="font-bold text-slate-800">Stakeholders:</span>{' '}
                        {conversationBusinessProblem.impactedStakeholders.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            </div>

            <div className="flex items-end gap-2 shrink-0 pt-2 border-t border-slate-100">
              <textarea
                rows={2}
                value={conversationInput}
                onChange={(e) => setConversationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleConversationalSend();
                  }
                }}
                placeholder="Describe your goal or answer the agent's question (e.g. 'Legacy manual provisioning bottlenecks' or 'owner: Dr. Elena Vance')..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
              />
              <button
                type="button"
                onClick={() => void handleConversationalSend()}
                disabled={isConversationLoading || !conversationInput.trim()}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW OKR (ENHANCED WITH 6 ATTRIBUTES & INDUSTRY DB) */}
      {/* ------------------------------------------------------------- */}
      {isAddingNewOkr && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Plus className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Define &amp; Structure New Enterprise OKR</h3>
                  <p className="text-xs text-slate-500">
                    Preserves strategic intent and maps 6 business problem dimensions to {industry.name}.
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsAddingNewOkr(false); setIsDraftPendingReview(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OKR Form */}
            <form onSubmit={handleCreateNewOkr} className="text-xs">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <aside className="xl:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 h-fit">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Form Navigation</p>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Completion: <span className="font-bold text-indigo-700">{addOkrSectionCompletion.completedSections}/{addOkrSectionCompletion.totalSections}</span>
                  </p>
                  {isDraftPendingReview && (
                    <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Review required</p>
                      <p className="text-[11px] text-amber-900 mt-0.5">Draft was applied from conversational agent. Review amber sections, then mark reviewed and publish.</p>
                      <button
                        type="button"
                        onClick={() => setIsDraftPendingReview(false)}
                        className="mt-1.5 px-2 py-1 rounded-md border border-amber-300 bg-white text-[10px] font-bold text-amber-700 hover:bg-amber-100"
                      >
                        Mark draft reviewed
                      </button>
                    </div>
                  )}
                  <nav className="space-y-1.5">
                    <a href="#okr-basics" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-200">
                      <span>1. OKR Basics</span>
                      {addOkrSectionCompletion.basics === 'complete' && !isDraftPendingReview ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : addOkrSectionCompletion.basics === 'empty' ? (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </a>
                    <a href="#problem-source" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-200">
                      <span>2. Problem Source</span>
                      {addOkrSectionCompletion.problemSource === 'complete' && !isDraftPendingReview ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : addOkrSectionCompletion.problemSource === 'empty' ? (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </a>
                    <a href="#structured-attributes" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-200">
                      <span>3. Structured Attributes</span>
                      {addOkrSectionCompletion.attributes === 'complete' && !isDraftPendingReview ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : addOkrSectionCompletion.attributes === 'empty' ? (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </a>
                    <a href="#metric-definitions" className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-slate-200">
                      <span>4. Metric Definitions</span>
                      {addOkrSectionCompletion.metrics === 'complete' && !isDraftPendingReview ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : addOkrSectionCompletion.metrics === 'empty' ? (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </a>
                  </nav>
                  <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Tip</p>
                    <p className="text-[11px] text-indigo-800 mt-0.5">
                      Fill sections top-to-bottom. Use AI parser for fast drafting, then refine causal chain and timings.
                    </p>
                  </div>
                </aside>

                <div className="xl:col-span-6 space-y-4 max-h-[62vh] overflow-y-auto pr-1">
                  <section id="okr-basics" className="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. OKR Basics</h4>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Key Result Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Expand 5G C-Band Coverage to 88% Population"
                        value={newOkrTitle}
                        onChange={(e) => setNewOkrTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Parent Objective / Theme *</label>
                        <select
                          value={newOkrParentId}
                          onChange={(e) => setNewOkrParentId(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                        >
                          {potentialParents.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.id}] {p.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Owner (HR Directory) *</label>
                        <select
                          value={newOkrOwner}
                          onChange={(e) => setNewOkrOwner(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                        >
                          {newOkrOwner && !orgDirectory.some((m) => m.name === newOkrOwner) && (
                            <option value={newOkrOwner}>
                              {newOkrOwner} (Custom Owner — Not in HR Directory)
                            </option>
                          )}
                          {orgDirectory.map((m) => (
                            <option key={m.id} value={m.name}>
                              {m.name} ({m.title})
                            </option>
                          ))}
                        </select>
                        {newOkrOwner && !orgDirectory.some((m) => m.name === newOkrOwner) && (
                          <p className="text-[10px] text-amber-700 mt-1">
                            Parsed owner &ldquo;{newOkrOwner}&rdquo; is preserved; switch to an HR directory member if strict owner verification blocks publishing.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Priority *</label>
                        <select
                          value={newOkrPriority}
                          onChange={(e) => setNewOkrPriority(e.target.value as PriorityLevel)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        >
                          <option value="P0 - Critical">P0 - Critical</option>
                          <option value="P1 - High">P1 - High</option>
                          <option value="P2 - Medium">P2 - Medium</option>
                          <option value="AI_RECOMMENDED">AI_RECOMMENDED</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Allocated Budget *</label>
                        <input
                          type="text"
                          value={newOkrBudget}
                          onChange={(e) => setNewOkrBudget(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Target Timing Snapshot</label>
                        <input
                          type="text"
                          value={newOkrRemediationTimings[0] || newOkrTargetDate}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600"
                        />
                      </div>
                    </div>
                  </section>

                  <section id="problem-source" className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Business Problem Source</h4>
                    <span className="text-[11px] text-slate-600 block">
                      Choose how to populate the 6-dimension business problem model.
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setNewOkrMode('template')}
                        className={`p-2 rounded-lg border flex items-center gap-2 justify-center cursor-pointer transition-all ${
                          newOkrMode === 'template'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Select Industry Problem</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOkrMode('parse')}
                        className={`p-2 rounded-lg border flex items-center gap-2 justify-center cursor-pointer transition-all ${
                          newOkrMode === 'parse'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Smart Text Parser</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOkrMode('manual')}
                        className={`p-2 rounded-lg border flex items-center gap-2 justify-center cursor-pointer transition-all ${
                          newOkrMode === 'manual'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Manual Entry</span>
                      </button>
                    </div>

                    {newOkrMode === 'template' && (
                      <div className="pt-1 space-y-1.5 animate-in fade-in">
                        <label className="text-[11px] font-bold text-slate-600 block">
                          Available Business Problems for {industry.name} ({availableProblems.length} available):
                        </label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => handleSelectIndustryProblem(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                        >
                          {availableProblems.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {newOkrMode === 'parse' && (
                      <div className="pt-1 space-y-2 animate-in fade-in">
                        <label className="text-[11px] font-bold text-slate-600 block">
                          Paste raw operational problem, issues report, or strategic friction:
                        </label>
                        <textarea
                          rows={2}
                          value={rawProblemTextInput}
                          onChange={(e) => setRawProblemTextInput(e.target.value)}
                          placeholder="e.g. During peak hours, 5G video buffering triggers 3.5% subscriber churn..."
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleRunAiSmartParser}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Parse into 6 Dimensions</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  <section id="structured-attributes" className="space-y-3 rounded-xl border border-slate-200 bg-white p-3.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">3. Structured Attributes Data Entry</h4>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">1. Problem Description *</label>
                      <textarea
                        rows={2}
                        required
                        value={newOkrProblemDesc}
                        onChange={(e) => setNewOkrProblemDesc(e.target.value)}
                        placeholder="Underlying operational friction and intent..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">2. Impacted Stakeholders *</label>
                      <input
                        type="text"
                        required
                        value={newOkrStakeholders}
                        onChange={(e) => setNewOkrStakeholders(e.target.value)}
                        placeholder="e.g. 14.8M Mobile Subscribers, Field Operations, Executive Board"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-red-700 block mb-1">3. Causal Chain to $ Impact *</label>
                      <p className="text-[11px] text-slate-500 mb-1.5">
                        Use this format: <span className="font-semibold">Root trigger → Operational effect → Financial impact</span>
                      </p>
                      <textarea
                        rows={2}
                        required
                        value={newOkrCausalChain}
                        onChange={(e) => setNewOkrCausalChain(e.target.value)}
                        placeholder="e.g. Backhaul congestion → increased video buffering → +3.5% churn and $14.5M annual revenue loss"
                        className="w-full px-3 py-1.5 border border-red-200 bg-red-50/50 rounded-lg text-xs text-red-950 font-medium"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setNewOkrCausalChain('Infrastructure bottleneck → service degradation → revenue leakage and cost-to-serve escalation')}
                          className="px-2 py-1 rounded-md border border-red-200 bg-white text-[10px] font-semibold text-red-700 hover:bg-red-50"
                        >
                          Use quick template
                        </button>
                        <span className="text-[10px] text-slate-500 self-center">Keep one clear chain. Avoid multiple unrelated causes here.</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">4. Root Cause *</label>
                        <input
                          type="text"
                          required
                          value={newOkrRootCause}
                          onChange={(e) => setNewOkrRootCause(e.target.value)}
                          placeholder="e.g. Saturated optical transport and permit delays"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-slate-700 block mb-1">5. Remediation Timings *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newOkrTimingDraft}
                            onChange={(e) => setNewOkrTimingDraft(e.target.value)}
                            placeholder="e.g. Q2 2027 Sprint 4"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                          />
                          <button
                            type="button"
                            onClick={handleAddNewOkrTiming}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {newOkrRemediationTimings.length > 0 ? newOkrRemediationTimings.map((timing) => (
                            <span key={timing} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700">
                              {timing}
                              <button
                                type="button"
                                onClick={() => handleRemoveNewOkrTiming(timing)}
                                className="text-slate-500 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )) : (
                            <span className="text-[10px] text-slate-500">No timings added yet.</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">First timing is treated as primary target date.</p>
                      </div>
                    </div>
                  </section>

                  <section id="metric-definitions" className="pt-1 space-y-2 rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 text-xs">4. Metric Definitions</label>
                      <button
                        type="button"
                        onClick={handleAddNewOkrMetric}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        + Add Metric
                      </button>
                    </div>

                    {newOkrMetrics.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                        <div className="col-span-3">
                          <select
                            value={m.metricType}
                            onChange={(e) => handleUpdateNewOkrMetric(idx, 'metricType', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-200 rounded text-[10px] font-bold text-slate-700"
                          >
                            <option value="Leading">Leading</option>
                            <option value="Lagging">Lagging</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={m.indicator}
                            onChange={(e) => handleUpdateNewOkrMetric(idx, 'indicator', e.target.value)}
                            placeholder="Indicator name"
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={m.baselineValue}
                            onChange={(e) => handleUpdateNewOkrMetric(idx, 'baselineValue', e.target.value)}
                            placeholder="Base"
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={m.targetValue}
                            onChange={(e) => handleUpdateNewOkrMetric(idx, 'targetValue', e.target.value)}
                            placeholder="Target"
                            className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bold text-emerald-700"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveNewOkrMetric(idx)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>

                <aside className="xl:col-span-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 h-fit xl:sticky xl:top-4 self-start">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">6 Structured Attributes Preview</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {addOkrSectionCompletion.completedSections}/{addOkrSectionCompletion.totalSections} complete
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Selection status</p>
                    <p className="text-[11px] text-slate-700 mt-0.5">
                      Active source: <span className="font-semibold text-indigo-700">{newOkrMode === 'template' ? 'Industry Problem' : newOkrMode === 'parse' ? 'AI Smart Text Parser' : 'Manual Entry'}</span>
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Primary timing: <span className="font-semibold text-slate-800">{newOkrRemediationTimings[0] || newOkrTargetDate || 'Not set'}</span>
                    </p>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-700">
                    <div><span className="font-bold text-slate-900">Title:</span> {newOkrTitle || 'Not set'}</div>
                    <div><span className="font-bold text-slate-900">Owner:</span> {newOkrOwner || 'Not set'}</div>
                    <div><span className="font-bold text-slate-900">Priority:</span> {newOkrPriority}</div>
                    <div><span className="font-bold text-slate-900">1. Description:</span> {newOkrProblemDesc || 'Not set'}</div>
                    <div><span className="font-bold text-slate-900">2. Stakeholders:</span> {newOkrStakeholders || 'Not set'}</div>
                    <div><span className="font-bold text-slate-900">3. Causal Chain:</span> {newOkrCausalChain || 'Not set'}</div>
                    <div><span className="font-bold text-slate-900">4. Root Cause:</span> {newOkrRootCause || 'Not set'}</div>
                    <div>
                      <span className="font-bold text-slate-900">5. Remediation Timings:</span>
                      <ul className="mt-1 space-y-1">
                        {newOkrRemediationTimings.length > 0 ? newOkrRemediationTimings.map((timing) => (
                          <li key={timing} className="rounded-md border border-slate-200 bg-white px-2 py-0.5">{timing}</li>
                        )) : (
                          <li className="text-slate-500">Not set</li>
                        )}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-bold text-slate-900 mb-1">6. Metrics</p>
                      <ul className="space-y-1">
                        {newOkrMetrics.length > 0 ? newOkrMetrics.map((metric, idx) => (
                          <li key={`${metric.indicator}-${idx}`} className="rounded-lg border border-slate-200 bg-white px-2 py-1">
                            <span className="font-semibold">{metric.metricType}</span> • {metric.indicator || 'Unnamed'}: {metric.baselineValue || '-'} → {metric.targetValue || '-'}
                          </li>
                        )) : (
                          <li className="text-slate-500">No metrics added yet.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Help context</p>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-amber-900 list-disc pl-4">
                      <li>Use one causal chain statement with measurable impact.</li>
                      <li>Add multiple remediation timings for phased delivery plans.</li>
                      <li>Add at least one leading or lagging metric.</li>
                    </ul>
                  </div>
                </aside>
              </div>

              {newOkrValidationError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-red-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{newOkrValidationError}</span>
                  </div>
                  {newOkrValidationError.toLowerCase().includes('hr directory') && orgDirectory[0] && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewOkrOwner(orgDirectory[0].name);
                        setNewOkrValidationError(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-[11px] font-semibold text-red-800 shrink-0 cursor-pointer"
                    >
                      Assign {orgDirectory[0].name}
                    </button>
                  )}
                </div>
              )}

              <div className="pt-3 mt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddingNewOkr(false); setIsDraftPendingReview(false); setNewOkrValidationError(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Publish OKR &amp; Execute Remaining Stages
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INITIATE NEW PROGRAM */}
      {isInitiatingProgram && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Initiate New Strategic Program</h3>
              <button onClick={() => setIsInitiatingProgram(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInitiateNewProgram} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Program Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous Edge Cloud Orchestration Program"
                  value={progTitle}
                  onChange={(e) => setProgTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Strategic Statement: Issues &amp; Intent</label>
                <textarea
                  rows={2}
                  placeholder="Describe operational friction and executive intent..."
                  value={progIssues}
                  onChange={(e) => setProgIssues(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Growth Vision Statement</label>
                <input
                  type="text"
                  placeholder="e.g. Capture 35% of industrial edge slicing market share."
                  value={progGrowthVision}
                  onChange={(e) => setProgGrowthVision(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Squad</label>
                  <input
                    type="text"
                    value={progSquadName}
                    onChange={(e) => setProgSquadName(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned FTE</label>
                  <input
                    type="number"
                    value={progFte}
                    onChange={(e) => setProgFte(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget Allocation</label>
                  <input
                    type="text"
                    value={progBudget}
                    onChange={(e) => setProgBudget(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInitiatingProgram(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Initiate Program &amp; Launch Execution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUSINESS PROBLEM MANAGER */}
      <BusinessProblemManager
        isOpen={isBusinessProblemManagerOpen}
        onClose={() => setIsBusinessProblemManagerOpen(false)}
        problem={effectiveActiveBusinessProblem}
        orgDirectory={orgDirectory}
        onSave={handleBusinessProblemSave}
      />

      {/* MODAL: TERMINATE PROGRAM CONFIRMATION */}
      {terminatingProgramId && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Confirm Program Termination</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Terminating this program will halt running release trains, reclaim allocated budget, and release squad headcount to resolve critical bottlenecks in remaining stages.
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Termination Reason *</label>
              <textarea
                rows={2}
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTerminatingProgramId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTerminateProgram(terminatingProgramId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                Confirm Termination &amp; Reallocate Resources
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
