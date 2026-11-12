/**
 * Planview Anvi - OKR & Program Management Studio (HITL & Disaster Console)
 * Enables Human-in-the-Loop manual prioritisation over AI, structured 6-attribute
 * business problems, program termination & initiation, and catastrophic event simulation.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Activity,
  Layers,
  Edit3,
  X,
  Flame,
  BookOpen,
  Save,
  RotateCcw,
  TrendingUp,
  FileText
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
  BusinessMetricIndicator
} from '../types/orchestration';
import { eventBus } from '../utils/eventBus';
import { validateOkrStructuralAdequacy } from '../utils/trajectoryCalculations';
import {
  getAvailableBusinessProblemsForIndustry,
  parseRawProblemText,
  BusinessProblemTemplate
} from '../utils/businessProblemLibrary';

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
  const [isInitiatingProgram, setIsInitiatingProgram] = useState<boolean>(false);
  const [terminatingProgramId, setTerminatingProgramId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);

  // Filter OKR level nodes (Layer 3)
  const okrNodes = useMemo(() => {
    return Object.values(nodesMap).filter((n) => n.id.includes('kr') || n.id.includes('-o'));
  }, [nodesMap]);

  const activeOkr = useMemo(() => {
    if (!selectedOkrId) return okrNodes[0] || null;
    return nodesMap[selectedOkrId] || okrNodes[0] || null;
  }, [selectedOkrId, nodesMap, okrNodes]);

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
  const [newOkrMetrics, setNewOkrMetrics] = useState<BusinessMetricIndicator[]>([
    { indicator: 'Operational Throughput', baselineValue: '65%', targetValue: '> 88%', metricType: 'Leading' },
    { indicator: 'Financial Degradation Impact', baselineValue: '$5.5M', targetValue: '$0', metricType: 'Lagging' }
  ]);

  // Open "Add OKR" modal and initialize defaults
  const handleOpenAddOkrModal = () => {
    setIsAddingNewOkr(true);
    setNewOkrMode('template');
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
    setNewOkrRemediationTiming(tmpl.problem.targetRemediationTiming);
    setNewOkrTargetDate(tmpl.problem.targetRemediationTiming);
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
    setNewOkrRemediationTiming(parsed.targetRemediationTiming);
    setNewOkrTargetDate(parsed.targetRemediationTiming);
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
      text: `Human-in-the-Loop priority set to ${priority} for "${target.title}". Advisory agent recomputed future trajectory!`,
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

    const structuredProblem: StructuredBusinessProblem = {
      problemDescription: newOkrProblemDesc || `Strategic gap in ${industry.sector} execution identified by executive leadership.`,
      impactedStakeholders: stakeholdersList.length > 0 ? stakeholdersList : ['Executive Board', 'Customer Base', 'Agile Delivery Squads'],
      causalChainToDollarImpact: newOkrCausalChain || 'Execution friction -> 12% schedule slippage -> revenue opportunity loss of $4.5M.',
      rootCause: newOkrRootCause || 'Under-resourced specialized engineering headcount and competing dependencies.',
      targetRemediationTiming: newOkrRemediationTiming || newOkrTargetDate,
      metrics: newOkrMetrics.length > 0 ? newOkrMetrics : [
        { indicator: 'Operational Efficiency', baselineValue: '65%', targetValue: '> 88%', metricType: 'Leading' },
        { indicator: 'Financial Degradation', baselineValue: '$5.0M', targetValue: '$0', metricType: 'Lagging' }
      ]
    };

    const parentId = newOkrParentId || potentialParents[0]?.id || Object.keys(nodesMap)[0] || 'root';

    const newNode: TraceabilityNode = {
      id: newId,
      title: newOkrTitle,
      owner: newOkrOwner,
      status: 'On Track',
      progress: 35,
      budget: newOkrBudget,
      parentIds: [parentId],
      childIds: [],
      targetDate: newOkrRemediationTiming || newOkrTargetDate,
      manualPriority: {
        priority: newOkrPriority,
        overrideReason: 'Newly initiated strategic OKR created with human-in-the-loop priority and 6-dimension business problem.',
        overriddenBy: newOkrOwner,
        overrideTimestamp: new Date().toISOString()
      },
      businessProblem: structuredProblem,
      ai: {
        analyse: `Newly structured OKR for ${industry.sector} validated against enterprise SMART criteria and HR directory.`,
        predict: 'Projected 84% attainment probability under current capacity profile.',
        recommend: 'Pair dedicated agile release train to unblock dependencies.',
        automate: 'Continuous webhook sync established with Planview AgilePlace.',
        optimise: 'Resource allocation verified across org directory.'
      }
    };

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
      targetAgent: 'Advisory Committee & Supervisor',
      summary: `New OKR Added: "${newOkrTitle}" (${newOkrPriority}) with 6 structured problem attributes`,
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

    setIsAddingNewOkr(false);
    setSelectedOkrId(newId);
    setFeedbackMessage({
      text: `Successfully created and published new OKR "${newOkrTitle}"! All 6 business problem dimensions structured & validated.`,
      type: 'success'
    });
    setTimeout(() => setFeedbackMessage(null), 4000);
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
              <button
                onClick={handleOpenAddOkrModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add OKR</span>
              </button>
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-600 uppercase">{activeOkr.id}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">Owner: <strong>{activeOkr.owner}</strong></span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600">Timing: <strong>{activeOkr.targetDate || 'Q2 2027'}</strong></span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeOkr.title}</h3>
                  </div>

                  {!isEditingProblem ? (
                    <button
                      onClick={handleStartEditingProblem}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 text-xs font-semibold cursor-pointer transition-all shrink-0 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Edit Business Problem</span>
                    </button>
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW OKR (ENHANCED WITH 6 ATTRIBUTES & INDUSTRY DB) */}
      {/* ------------------------------------------------------------- */}
      {isAddingNewOkr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 my-8">
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
              <button onClick={() => setIsAddingNewOkr(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Business Problem Setup Mode Selector */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block">
                How would you like to define the 6-dimension Business Problem?
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

              {/* Mode A: Select Existing Problem */}
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

              {/* Mode B: AI Smart Text Parser */}
              {newOkrMode === 'parse' && (
                <div className="pt-1 space-y-2 animate-in fade-in">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Paste raw operational problem, issues report, or strategic friction:
                  </label>
                  <textarea
                    rows={2}
                    value={rawProblemTextInput}
                    onChange={(e) => setRawProblemTextInput(e.target.value)}
                    placeholder="e.g. During peak hours, 5G video buffering triggers 3.5% subscriber churn, costing $12.4M in annual ARPU due to saturated optical links; target fix by Q2 2027."
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
            </div>

            {/* OKR Form */}
            <form onSubmit={handleCreateNewOkr} className="space-y-3.5 text-xs">
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
                    {orgDirectory.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Human-in-the-Loop Priority *</label>
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
                  <label className="font-bold text-slate-700 block mb-1">Target Remediation Timing *</label>
                  <input
                    type="text"
                    value={newOkrRemediationTiming}
                    onChange={(e) => {
                      setNewOkrRemediationTiming(e.target.value);
                      setNewOkrTargetDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              {/* 6 Structured Attributes Preview / Edit Container */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  6-Dimension Business Problem Attributes
                </span>

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
                  <input
                    type="text"
                    required
                    value={newOkrCausalChain}
                    onChange={(e) => setNewOkrCausalChain(e.target.value)}
                    placeholder="e.g. Backhaul congestion -> customer churn -> $14.5M revenue loss"
                    className="w-full px-3 py-1.5 border border-red-200 bg-red-50/50 rounded-lg text-xs text-red-950 font-medium"
                  />
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
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">5. Remediation Timing *</label>
                    <input
                      type="text"
                      required
                      value={newOkrRemediationTiming}
                      onChange={(e) => setNewOkrRemediationTiming(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-xs">6. Measurable Indicators (Metrics) *</label>
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
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNewOkr(false)}
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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

      {/* MODAL: TERMINATE PROGRAM CONFIRMATION */}
      {terminatingProgramId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
