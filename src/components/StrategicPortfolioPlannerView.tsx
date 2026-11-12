import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Gauge,
  Layers3,
  Play,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  Users,
  Zap
} from 'lucide-react';
import {
  IndustryDataBundle,
  IndustryEventTrigger,
  OkrPriority,
  ProgramPlan,
  StrategicProblem
} from '../types/orchestration';
import { evaluateAdvisoryCommittee, evaluateSmartCriteria } from '../utils/algorithms';
import { eventBus } from '../utils/eventBus';

interface StrategicPortfolioPlannerViewProps {
  industry: IndustryDataBundle;
}

const formatPct = (value: number) => `${Math.max(0, Math.min(100, value)).toFixed(0)}%`;

function buildDefaultProblems(industry: IndustryDataBundle): StrategicProblem[] {
  const titleBase = industry.name.includes('Bank') ? 'Customer onboarding friction' : 'Strategic execution drag';

  return [
    {
      id: 'problem-1',
      title: `${titleBase} in digital service delivery`,
      description: 'Critical business problem: workflow latency and fragmented policy decisions slow customer-facing service completion and reduce the ability to deliver strategic outcomes.',
      cause: 'Legacy integration and fragmented approval ownership create backlog at the operating model boundary, raising rework and delaying the next best action.',
      causalChainToDollarImpact: 'Latency -> lower conversion -> lower retention -> lost revenue -> incremental cost to recover customers and service outages.',
      remediationTiming: '0-8 weeks: stabilise the bottleneck; 8-16 weeks: automate the approval and integration layer.',
      impactedStakeholders: ['Customers', 'Operations teams', 'Sales leaders', 'Compliance officers', 'Executive sponsors'],
      leadingIndicators: ['Network utilisation > 75%', 'Approval queue volume', 'Customer retry rates', 'Service-api latency'],
      laggingIndicators: ['Customer churn', 'Revenue leakage', 'Operational cost per service', 'Policy compliance exceptions'],
      targetMetrics: [
        { label: 'Network utilisation', value: '< 70%' },
        { label: 'Churn risk', value: '< 4.5%' },
        { label: 'Service latency', value: '< 220ms' }
      ]
    },
    {
      id: 'problem-2',
      title: 'Platform resilience and continuity risk',
      description: 'The operating model remains susceptible to a single point of failure in core platforms, causing customer friction and high recovery cost in disruption scenarios.',
      cause: 'Infrastructure concentration, constrained redundancy, and insufficient event-response playbooks create recovery drag after a significant incident.',
      causalChainToDollarImpact: 'Service outage -> adoption drop -> revenue interruption -> SLA penalties and incident recovery burn.',
      remediationTiming: 'Immediate response within 72 hours; full remediation within 30-60 days.',
      impactedStakeholders: ['Network operations', 'Customer support', 'Executive risk committee', 'Regulators'],
      leadingIndicators: ['Failover readiness', 'Data center utilisation', 'Backup verification success'],
      laggingIndicators: ['Service downtime minutes', 'Customer escalations', 'Revenue impact', 'Regulatory findings'],
      targetMetrics: [
        { label: 'Resilience coverage', value: '> 99.95%' },
        { label: 'Recovery time', value: '< 90 mins' },
        { label: 'Critical SLA breach', value: '0' }
      ]
    }
  ];
}

function buildDefaultPriorities(industry: IndustryDataBundle): OkrPriority[] {
  const itemsFromTrace = industry.traceability[3]?.slice(0, 4) ?? [
    { id: 'okr-1', title: 'Reduce service cycle time from 9 days to 48 hours', owner: 'Chief Digital Officer' },
    { id: 'okr-2', title: 'Lift customer adoption of digital channels from 54% to 78%', owner: 'VP Growth' },
    { id: 'okr-3', title: 'Modernize resilience and data continuity for critical services', owner: 'Head of Platform' }
  ];

  return itemsFromTrace.map((item, index) => {
    const aiScore = 72 + index * 8;
    const smart = evaluateSmartCriteria(item.title);
    const summary = evaluateAdvisoryCommittee(item.title, [58, 64, 70, 78, 82], 5);

    return {
      id: item.id,
      title: item.title,
      owner: item.owner,
      aiPriorityScore: aiScore,
      manualPriorityScore: aiScore,
      status: index === 2 ? 'At Risk' : 'On Track',
      strategicProblemId: index === 2 ? 'problem-2' : 'problem-1',
      notes: `${summary.consensusScore.toFixed(0)}% consensus score; SMART composite ${smart.compositeScore}/100; expected execution constraint: ${index === 2 ? 'resilience capacity' : 'dependency sequencing'}.`
    };
  });
}

function buildDefaultPrograms(industry: IndustryDataBundle): ProgramPlan[] {
  return [
    {
      id: 'program-1',
      name: 'Digital Outcome Acceleration',
      strategicStatement: `Increase customer-serving capacity and reduce time-to-value for ${industry.name} while preserving service quality and compliance posture.`,
      definition: 'This program addresses execution drag in the operating model by re-sequencing work, clarifying ownership, and aligning technology to strategic outcomes.',
      status: 'Active',
      roadmap: [
        { phase: 'Discovery', outcome: 'Map process bottlenecks and owners', due: 'Week 2' },
        { phase: 'Remediation', outcome: 'Automate approvals and decouple legacy dependencies', due: 'Week 8' },
        { phase: 'Scale', outcome: 'Track time-to-value and impact on revenue and churn', due: 'Week 16' }
      ],
      resources: [
        { owner: 'Chief Digital Officer', team: 'Customer Experience', fte: 8, allocationPct: 88 },
        { owner: 'Platform Lead', team: 'Integration & APIs', fte: 6, allocationPct: 82 },
        { owner: 'Compliance Lead', team: 'Risk & Controls', fte: 3, allocationPct: 65 }
      ],
      launchPlan: {
        start: '2026-11-20',
        goLive: '2026-12-18',
        owner: 'Operations Transformation Office',
        risk: 'Bridge dependency on legacy data contracts' }
    },
    {
      id: 'program-2',
      name: 'Resilience Recovery & Critical Infrastructure',
      strategicStatement: `Protect ${industry.name} from service interruption and support continuity during global or sector-level shocks while maintaining customer trust.`,
      definition: 'This program reduces single points of failure and improves failover readiness, with clear roles for response and recovery.',
      status: 'Active',
      roadmap: [
        { phase: 'Assess', outcome: 'Confirm resilience gaps and incident blast radius', due: 'Week 1' },
        { phase: 'Rebuild', outcome: 'Remediate failover, backup validation, and communications', due: 'Week 6' },
        { phase: 'Exercise', outcome: 'Run incident simulation and board reporting', due: 'Week 12' }
      ],
      resources: [
        { owner: 'VP Infrastructure', team: 'Network & Compute', fte: 7, allocationPct: 90 },
        { owner: 'Head of Security', team: 'Cyber & Resilience', fte: 5, allocationPct: 78 },
        { owner: 'Customer Operations Lead', team: 'Service Recovery', fte: 4, allocationPct: 68 }
      ],
      launchPlan: {
        start: '2026-11-15',
        goLive: '2026-12-15',
        owner: 'Business Continuity Council',
        risk: 'High dependency on external colocation capacity' }
    }
  ];
}

function buildDefaultEvents(industry: IndustryDataBundle): IndustryEventTrigger[] {
  return [
    {
      id: 'evt-1',
      scope: 'Industry',
      title: 'Regional data-center thermal event',
      severity: 'High',
      description: 'A heat-related outage created brief latency spikes and forced customer traffic to secondary regions.',
      impact: 'Elevated latency, reduced conversion conversion, and elevated support demand for service continuity.',
      affectedSegments: ['Enterprise customers', 'Regional service teams'],
      triggeredAt: '2026-11-11T09:00:00Z'
    },
    {
      id: 'evt-2',
      scope: 'Global',
      title: 'Global cyber incident simulation',
      severity: 'Critical',
      description: 'The business triggers a cyber response simulation affecting customer identity, network reachability, and support queues.',
      impact: 'Immediate need for incident command, communications, and failover readiness across the portfolio.',
      affectedSegments: ['Digital channels', 'Support stack', 'Operations leadership'],
      triggeredAt: '2026-11-11T10:30:00Z'
    }
  ];
}

export const StrategicPortfolioPlannerView: React.FC<StrategicPortfolioPlannerViewProps> = ({ industry }) => {
  const [priorities, setPriorities] = useState<OkrPriority[]>(() => buildDefaultPriorities(industry));
  const [problems, setProblems] = useState<StrategicProblem[]>(() => buildDefaultProblems(industry));
  const [programs, setPrograms] = useState<ProgramPlan[]>(() => buildDefaultPrograms(industry));
  const [events, setEvents] = useState<IndustryEventTrigger[]>(() => buildDefaultEvents(industry));
  const [selectedProblemId, setSelectedProblemId] = useState<string>('problem-1');
  const [newProgram, setNewProgram] = useState({ name: '', strategicStatement: '', definition: 'New strategic initiative' });
  const [eventScope, setEventScope] = useState<'Global' | 'Industry'>('Industry');
  const [eventTitle, setEventTitle] = useState('Cyber attack');
  const [advisoryReasoning, setAdvisoryReasoning] = useState('No recalculation yet.');

  useEffect(() => {
    setPriorities(buildDefaultPriorities(industry));
    setProblems(buildDefaultProblems(industry));
    setPrograms(buildDefaultPrograms(industry));
    setEvents(buildDefaultEvents(industry));
    setSelectedProblemId('problem-1');
  }, [industry]);

  const selectedProblem = problems.find((problem) => problem.id === selectedProblemId) ?? problems[0];

  const trajectoryData = useMemo(() => {
    const historical = industry.regressionModel.historicalDataPoints;
    const lastPoint = historical[historical.length - 1] ?? { actual: 58, predicted: 60 };
    const startingPoint = historical[0] ?? { actual: 40, predicted: 42 };
    const slope = lastPoint.actual - startingPoint.actual;

    return Array.from({ length: 7 }, (_, index) => {
      const month = index + 1;
      const target = Math.min(100, Math.max(35, lastPoint.actual + (slope * 0.35) + (index * 8.5)));
      const predicted = Math.min(100, Math.max(30, lastPoint.predicted + (index * 6.25) + (industry.regressionModel.stretchFactor * 2.4)));
      const margin = Math.abs(target - predicted);

      return {
        month: `M${month}`,
        target: Number(target.toFixed(1)),
        predicted: Number(predicted.toFixed(1)),
        delta: Number(margin.toFixed(1))
      };
    });
  }, [industry]);

  const okrSummary = useMemo(() => {
    const totalManual = priorities.reduce((sum, item) => sum + item.manualPriorityScore, 0) / Math.max(priorities.length, 1);
    const totalAi = priorities.reduce((sum, item) => sum + item.aiPriorityScore, 0) / Math.max(priorities.length, 1);
    const recommendation = totalManual >= totalAi ? 'Manual override improves strategic alignment.' : 'AI weighting remains stronger than the user override.';

    return {
      totalManual: Number(totalManual.toFixed(0)),
      totalAi: Number(totalAi.toFixed(0)),
      recommendation
    };
  }, [priorities]);

  const handlePriorityUpdate = (id: string, value: number) => {
    setPriorities((prev) => prev.map((item) => item.id === id ? { ...item, manualPriorityScore: value } : item));
  };

  const handleTerminateProgram = (programId: string) => {
    setPrograms((prev) => prev.map((program) => program.id === programId ? { ...program, status: 'Terminated' } : program));
    eventBus.publish({
      topic: 'INTERVENTION_APPLIED',
      sourceAgent: 'Advisory Agent',
      targetAgent: 'Program Portfolio Board',
      summary: `Terminated program ${programId} and reallocated focus to the next highest-priority OKR stream.`,
      payload: { programId, action: 'terminate', timestamp: new Date().toISOString() },
      latencyMs: 18,
      severity: 'warning'
    });
  };

  const handleAddProgram = () => {
    if (!newProgram.name.trim()) return;

    const program: ProgramPlan = {
      id: `program-${Date.now()}`,
      name: newProgram.name,
      strategicStatement: newProgram.strategicStatement || `Deliver profitable improvement across ${industry.name} with disciplined execution and measurable business impact.`,
      definition: newProgram.definition,
      status: 'Active',
      roadmap: [
        { phase: 'Concept', outcome: 'Confirm business value and ownership', due: 'Week 2' },
        { phase: 'Execution', outcome: 'Deliver milestone-based outcomes', due: 'Week 8' },
        { phase: 'Stabilise', outcome: 'Measure KPI improvement and optimise resources', due: 'Week 20' }
      ],
      resources: [
        { owner: 'Program Sponsor', team: 'Transformation Office', fte: 4, allocationPct: 72 },
        { owner: 'Domain Lead', team: 'Delivery', fte: 5, allocationPct: 78 },
        { owner: 'Support Lead', team: 'Operations', fte: 2, allocationPct: 50 }
      ],
      launchPlan: {
        start: new Date().toISOString().slice(0, 10),
        goLive: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString().slice(0, 10),
        owner: 'Portfolio Management Office',
        risk: 'Needs clear escalation and decision rights.' }
    };

    setPrograms((prev) => [program, ...prev]);
    setNewProgram({ name: '', strategicStatement: '', definition: 'New strategic initiative' });
  };

  const handleTriggerEvent = () => {
    const created: IndustryEventTrigger = {
      id: `evt-${Date.now()}`,
      scope: eventScope,
      title: eventTitle || 'Significant operation disruption',
      severity: 'High',
      description: `The ${eventScope.toLowerCase()} organisation has triggered a significant disruption scenario with impact across the ${industry.name} portfolio.`,
      impact: 'Increased consumer friction, capacity stress, and elevated need for executive intervention and re-prioritisation.',
      affectedSegments: ['Leadership team', 'Operations', 'Customer support'],
      triggeredAt: new Date().toISOString()
    };

    setEvents((prev) => [created, ...prev]);
    eventBus.publish({
      topic: 'RISK_SENTINEL_ALERT',
      sourceAgent: 'Enterprise Risk Sentinel',
      targetAgent: 'Advisory Agent',
      summary: `Triggered ${eventScope.toLowerCase()} contingency for ${eventTitle}.`,
      payload: { event: created, industry: industry.name },
      latencyMs: 20,
      severity: 'danger'
    });
  };

  const handleAdvisoryRecalc = () => {
    const currentProblem = selectedProblem ?? problems[0];
    const scoreModel = priorities.reduce((acc, item) => acc + item.manualPriorityScore, 0) / priorities.length;
    const statement = `Human priority override is ${scoreModel.toFixed(0)}/100 across the selected OKR set. Given ${currentProblem.title}, the advisory engine prioritises the sequence: ${priorities
      .slice()
      .sort((a, b) => b.manualPriorityScore - a.manualPriorityScore)
      .map((item) => item.title)
      .slice(0, 2)
      .join(' and ')}, while the constraint watchlist remains ${currentProblem.cause.toLowerCase()}.`;

    setAdvisoryReasoning(statement);
    eventBus.publish({
      topic: 'ADVISORY_COMMITTEE_EVALUATED',
      sourceAgent: 'Advisory Agent',
      targetAgent: 'Program Portfolio Board',
      summary: 'Recalculated priority logic after manual human override and amended execution sequence.',
      payload: { priorities: priorities.map((item) => ({ id: item.id, title: item.title, manualPriorityScore: item.manualPriorityScore })), reason: statement },
      latencyMs: 28,
      severity: 'success'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Strategic Portfolio Planner & Human Priority Override</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Align each OKR to a business problem, overlay a human decision, and validate constraints before the next execution wave.
            </p>
          </div>

          <button
            onClick={handleAdvisoryRecalc}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Recalculate Advisory Scores
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">AI Priority</span>
              <Zap className="w-4 h-4 text-violet-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{okrSummary.totalAi}%</div>
            <p className="text-[11px] text-slate-500 mt-1">Current AI recommendation across active OKRs.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Human Override</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{okrSummary.totalManual}%</div>
            <p className="text-[11px] text-slate-500 mt-1">User-prioritised weighting after manual review.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Forecast Signal</span>
              <Gauge className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-lg font-black text-slate-900">{okrSummary.recommendation}</div>
            <p className="text-[11px] text-slate-500 mt-1">Advisory reasoning after latest operator intervention.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseBusiness className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Manual OKR Priority Board</h3>
            </div>

            <div className="space-y-3">
              {priorities.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50/70">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-500">Owner: {item.owner}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-500">AI</div>
                        <div className="font-bold text-indigo-700">{item.aiPriorityScore}%</div>
                      </div>
                      <label className="flex items-center gap-2 text-[11px] text-slate-600">
                        <span>Human priority</span>
                        <input
                          type="range"
                          min={40}
                          max={100}
                          value={item.manualPriorityScore}
                          onChange={(event) => handlePriorityUpdate(item.id, Number(event.target.value))}
                          className="accent-indigo-600"
                        />
                        <span className="font-bold text-slate-900 w-10 text-right">{item.manualPriorityScore}</span>
                      </label>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2">{item.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <Layers3 className="w-4 h-4 text-violet-600" />
              <h3 className="text-base font-bold text-slate-900">Business Problem Definition & Remediation Lens</h3>
            </div>

            <div className="space-y-3">
              {problems.map((problem) => (
                <button
                  key={problem.id}
                  type="button"
                  onClick={() => setSelectedProblemId(problem.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${selectedProblemId === problem.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{problem.title}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>

            {selectedProblem && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p><span className="font-semibold text-slate-700">Description:</span> {selectedProblem.description}</p>
                <p><span className="font-semibold text-slate-700">Cause:</span> {selectedProblem.cause}</p>
                <p><span className="font-semibold text-slate-700">Causal chain to $ impact:</span> {selectedProblem.causalChainToDollarImpact}</p>
                <p><span className="font-semibold text-slate-700">Target remediation timing:</span> {selectedProblem.remediationTiming}</p>
                <p><span className="font-semibold text-slate-700">Impacted stakeholders:</span> {selectedProblem.impactedStakeholders.join(', ')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Leading indicators</p>
                    <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                      {selectedProblem.leadingIndicators.map((indicator) => <li key={indicator}>{indicator}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Lagging indicators</p>
                    <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                      {selectedProblem.laggingIndicators.map((indicator) => <li key={indicator}>{indicator}</li>)}
                    </ul>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Target metrics</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProblem.targetMetrics.map((metric) => (
                      <span key={metric.label} className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                        {metric.label}: {metric.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-base font-bold text-slate-900">Trigger significant event / disaster</h3>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                {(['Global', 'Industry'] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setEventScope(scope)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${eventScope === scope ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                  >
                    {scope}
                  </button>
                ))}
              </div>

              <input
                value={eventTitle}
                onChange={(event) => setEventTitle(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Cyber attack, data-center outage, natural disaster..."
              />

              <button
                type="button"
                onClick={handleTriggerEvent}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                Trigger event response
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {events.map((event) => (
                <div key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{event.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${event.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : event.severity === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {event.severity}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">{event.scope} • {new Date(event.triggeredAt).toLocaleString()}</div>
                  <p className="mt-2 text-[11px] text-slate-600">{event.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-4">
              <Play className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Program launch & execution management</h3>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[10px] uppercase font-bold text-slate-500">Add new program</p>
                <input
                  value={newProgram.name}
                  onChange={(event) => setNewProgram((prev) => ({ ...prev, name: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Program name"
                />
                <textarea
                  value={newProgram.strategicStatement}
                  onChange={(event) => setNewProgram((prev) => ({ ...prev, strategicStatement: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Strategic statement"
                />
                <button
                  type="button"
                  onClick={handleAddProgram}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Initiate new plan
                </button>
              </div>

              {programs.map((program) => (
                <div key={program.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{program.name}</p>
                      <p className="text-[10px] text-slate-500">{program.status}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTerminateProgram(program.id)}
                      className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Terminate
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600">{program.strategicStatement}</p>
                  <div className="mt-3 space-y-2">
                    {program.roadmap.map((step) => (
                      <div key={`${program.id}-${step.phase}`} className="flex items-start gap-2 text-[11px] text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5" />
                        <span><span className="font-semibold text-slate-700">{step.phase}</span> • {step.outcome} • Due {step.due}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Launch owner:</span> {program.launchPlan.owner}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-4 h-4 text-cyan-600" />
          <h3 className="text-base font-bold text-slate-900">Target vs Predicted OKR Attainment Forecast</h3>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis domain={[30, 100]} tick={{ fontSize: 12, fill: '#475569' }} />
              <Tooltip formatter={(value: number) => [`${value}%`, 'Achievement']} />
              <Legend />
              <ReferenceLine y={80} stroke="#cbd5e1" strokeDasharray="5 5" label={{ value: 'target', position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="target" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} name="Target" />
              <Line type="monotone" dataKey="predicted" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} name="Predicted" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-700">Advisory explanation:</span> {advisoryReasoning || 'The model uses current regression fit to compare target attainment against model-based projection and highlights where forecast variance is material.'}
        </div>
      </div>
    </div>
  );
};
