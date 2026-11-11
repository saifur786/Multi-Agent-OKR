import React, { useState, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Sliders,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  BarChart3,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Info,
  Check,
  ShieldCheck,
  Gauge
} from 'lucide-react';
import { IndustryDataBundle, AdvisoryAgentOutcome } from '../types/orchestration';
import { evaluateAdvisoryCommittee } from '../utils/algorithms';
import { eventBus } from '../utils/eventBus';

interface AdvisoryCommitteeViewProps {
  industry: IndustryDataBundle;
}

export const AdvisoryCommitteeView: React.FC<AdvisoryCommitteeViewProps> = ({ industry }) => {
  // Configurable Agent Count N (minimum 3, up to user input e.g. 16)
  const [agentCount, setAgentCount] = useState<number>(5);

  // Extract initial KR statement from current industry
  const defaultKR = useMemo(() => {
    const layer3 = industry.traceability[3];
    return layer3?.[0]?.title || 'Cut mortgage approval turnaround from 9 days to 48 hours';
  }, [industry]);

  const [selectedKR, setSelectedKR] = useState<string>(defaultKR);
  const [customKRInput, setCustomKRInput] = useState<string>(defaultKR);
  const [activeTab, setActiveTab] = useState<'cards' | 'table' | 'regression'>('cards');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Historical points for regression
  const historicalPoints = useMemo(() => {
    return industry.regressionModel.historicalDataPoints.map((p) => p.actual);
  }, [industry]);

  // Compute multi-agent committee outcomes
  const committeeSummary = useMemo(() => {
    return evaluateAdvisoryCommittee(selectedKR, historicalPoints, agentCount);
  }, [selectedKR, historicalPoints, agentCount]);

  const handleRunEvaluation = () => {
    setIsEvaluating(true);
    setSelectedKR(customKRInput);

    eventBus.publish({
      topic: 'ADVISORY_COMMITTEE_EVALUATED',
      sourceAgent: 'Advisory Committee Controller',
      targetAgent: 'Supervisor Agent',
      summary: `Evaluated OKR with ${agentCount} advisory agents across Quality, Novelty, SMART and Polynomial Regression`,
      payload: {
        kr: customKRInput,
        agentsCount: agentCount,
        consensusScore: committeeSummary.consensusScore,
        consensusAttainment: committeeSummary.consensusAttainmentProbability,
        rSquared: committeeSummary.overallRSquared,
        divergenceIndex: committeeSummary.divergenceIndex
      },
      latencyMs: 35,
      severity: 'info'
    });

    setTimeout(() => {
      setIsEvaluating(false);
    }, 400);
  };

  const getVerdictBadge = (verdict: AdvisoryAgentOutcome['verdict']) => {
    switch (verdict) {
      case 'Exceeds Bar':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Approved with Conditions':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Needs Restructuring':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Multi-Agent Advisory Committee &amp; Outcomes
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {agentCount} Autonomous Advisory Agents
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Multi-dimensional evaluation across <strong>Quality</strong>, <strong>Novelty</strong>,{' '}
              <strong>SMART Score</strong>, and <strong>Polynomial Regression Attainment</strong>.
            </p>
          </div>

          {/* User Input: Number of Advisory Agents N (min 3, up to user input n) */}
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Advisory Agents (n)</span>
                <span className="text-[10px] text-slate-400 font-medium">Min: 3 • Max: 16</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setAgentCount((prev) => Math.max(3, prev - 1))}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  title="Decrease agents"
                  aria-label="Decrease advisory agents"
                >
                  -
                </button>
                <input
                  type="range"
                  min="3"
                  max="16"
                  value={agentCount}
                  onChange={(e) => setAgentCount(parseInt(e.target.value, 10))}
                  aria-label="Number of Advisory Agents"
                  className="w-20 sm:w-28 accent-indigo-600 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setAgentCount((prev) => Math.min(16, prev + 1))}
                  className="w-6 h-6 flex items-center justify-center rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  title="Increase agents"
                  aria-label="Increase advisory agents"
                >
                  +
                </button>
                <input
                  type="number"
                  min="3"
                  max="16"
                  value={agentCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setAgentCount(Math.max(3, Math.min(16, val)));
                    }
                  }}
                  className="w-12 text-sm font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  aria-label="Direct input for advisory agent count"
                />
              </div>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1 sm:border-l sm:border-slate-200 sm:pl-3 pt-1 sm:pt-0">
              {[3, 5, 8, 12].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAgentCount(preset)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    agentCount === preset
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OKR Selection & Custom Formulation Input */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700">
              Evaluated Key Result / Outcome Statement:
            </label>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Quick Select from {industry.name}:</span>
              <select
                value={selectedKR}
                onChange={(e) => {
                  setSelectedKR(e.target.value);
                  setCustomKRInput(e.target.value);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {industry.traceability[3]?.map((kr) => (
                  <option key={kr.id} value={kr.title}>
                    {kr.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customKRInput}
              onChange={(e) => setCustomKRInput(e.target.value)}
              placeholder="Enter or edit any OKR statement to evaluate across Quality, Novelty, and Regression..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <button
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer shrink-0"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluate with Committee</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Consensus Summary Banner (4 Dimensions + Regression Goodness of Fit) */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-indigo-800/60">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Committee Consensus Verdict ({agentCount} Advisory Agents)
              </h3>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Aggregated across all advisory perspectives • Divergence Index: {committeeSummary.divergenceIndex}{' '}
              {committeeSummary.divergenceIndex < 5 ? '(High Alignment)' : '(Healthy Debate)'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-indigo-800/60 px-3.5 py-1.5 rounded-xl border border-indigo-700 text-xs shrink-0">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Composite Consensus: <strong className="text-white text-sm">{committeeSummary.consensusScore}%</strong></span>
          </div>
        </div>

        {/* 4 Multi-Dimensional Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-indigo-900/60 rounded-xl border border-indigo-700/60">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Dimension 1: Quality</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{committeeSummary.averageQuality}%</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Anti-activity trap &amp; leading clarity</p>
          </div>

          <div className="p-3 bg-indigo-900/60 rounded-xl border border-indigo-700/60">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Dimension 2: Novelty</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{committeeSummary.averageNovelty}%</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Market disruption &amp; non-incrementalism</p>
          </div>

          <div className="p-3 bg-indigo-900/60 rounded-xl border border-indigo-700/60">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Dimension 3: SMART Score</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{committeeSummary.averageSmart}%</p>
            <p className="text-[10px] text-indigo-300 mt-0.5">Specific, Measurable, Time-Bound</p>
          </div>

          <div className="p-3 bg-indigo-900/60 rounded-xl border border-indigo-700/60">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Attainment Probability</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <p className="text-xl font-extrabold text-emerald-400">
                {committeeSummary.consensusAttainmentProbability}%
              </p>
              <span className="text-[10px] text-indigo-200">
                [{committeeSummary.confidenceInterval[0]}%, {committeeSummary.confidenceInterval[1]}%] CI
              </span>
            </div>
            <p className="text-[10px] text-indigo-300 mt-0.5">
              R² = {committeeSummary.overallRSquared} ({committeeSummary.polynomialModel.curveType})
            </p>
          </div>
        </div>

        {/* Polynomial Equation Info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-indigo-200 pt-1 font-mono">
          <span>Polynomial Model (deg-2): {committeeSummary.polynomialModel.equation}</span>
          <span>Linear Baseline: {committeeSummary.polynomialModel.linearEquation}</span>
        </div>
      </div>

      {/* Tabs: Agent Cards vs Comparative Table vs Trajectory Chart */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Advisory Agent Cards ({agentCount})
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'table'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Comparative Matrix Table
          </button>
          <button
            onClick={() => setActiveTab('regression')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'regression'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Polynomial Regression Visualizer
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Planview Advisory Multi-Agent Protocol
        </span>
      </div>

      {/* ====================================================================
          TAB 1: ADVISORY AGENT CARDS
         ==================================================================== */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {committeeSummary.agentOutcomes.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Advisory Agent
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{agent.name}</h4>
                    <p className="text-[11px] text-slate-500">{agent.specialty}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getVerdictBadge(
                      agent.verdict
                    )}`}
                  >
                    {agent.verdict}
                  </span>
                </div>

                {/* 4 Dimension Progress Bars */}
                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                      <span>Quality</span>
                      <strong className="text-slate-900">{agent.qualityScore}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${agent.qualityScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                      <span>Novelty</span>
                      <strong className="text-slate-900">{agent.noveltyScore}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${agent.noveltyScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                      <span>SMART Score</span>
                      <strong className="text-slate-900">{agent.smartScore}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${agent.smartScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-0.5">
                      <span>Predicted Attainment</span>
                      <strong className="text-emerald-700">
                        {agent.regressionAttainment}%{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          [{agent.confidenceInterval[0]}%, {agent.confidenceInterval[1]}%]
                        </span>
                      </strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${agent.regressionAttainment}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Agent Qualitative Rationale */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <p className="font-semibold text-slate-900 text-[11px] mb-1">Advisor Rationale:</p>
                  <p className="text-[11px]">{agent.rationale}</p>
                </div>
              </div>

              {/* Recommended Enhancement */}
              <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-[11px] text-indigo-950">
                <p className="font-bold text-indigo-900 mb-0.5">Actionable Enhancement:</p>
                <p>{agent.recommendedEnhancement}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          TAB 2: COMPARATIVE MATRIX TABLE
         ==================================================================== */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Advisory Agent</th>
                  <th className="py-3 px-4">Specialty</th>
                  <th className="py-3 px-4 text-center">Quality</th>
                  <th className="py-3 px-4 text-center">Novelty</th>
                  <th className="py-3 px-4 text-center">SMART Score</th>
                  <th className="py-3 px-4 text-center">Attainment %</th>
                  <th className="py-3 px-4 text-center">Confidence Interval</th>
                  <th className="py-3 px-4 text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {committeeSummary.agentOutcomes.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900">{agent.role}</td>
                    <td className="py-3 px-4 text-slate-600">{agent.specialty}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{agent.qualityScore}%</td>
                    <td className="py-3 px-4 text-center font-semibold text-purple-700">{agent.noveltyScore}%</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">{agent.smartScore}%</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{agent.regressionAttainment}%</td>
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                      [{agent.confidenceInterval[0]}%, {agent.confidenceInterval[1]}%]
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getVerdictBadge(agent.verdict)}`}>
                        {agent.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: POLYNOMIAL REGRESSION VISUALIZER
         ==================================================================== */}
      {activeTab === 'regression' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Historical Polynomial (Deg-2) &amp; Linear Regression Trajectory
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Empirical extrapolation over 12-week quarter with shaded confidence interval bands.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-slate-600">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                R² = {committeeSummary.polynomialModel.rSquaredPolynomial}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {committeeSummary.polynomialModel.curveType}
              </span>
            </div>
          </div>

          {/* Interactive Trajectory Chart / Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {committeeSummary.polynomialModel.trajectory.map((point) => (
              <div
                key={point.week}
                className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                  point.week === 8
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-300'
                    : point.week > 8
                    ? 'bg-slate-50/70 border-dashed border-slate-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800">{point.label}</span>
                  {point.actual !== undefined ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                      Actual
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                      Forecast
                    </span>
                  )}
                </div>

                <div className="text-base font-extrabold text-slate-900">
                  {point.actual !== undefined ? `${point.actual}%` : `${point.predictedPolynomial}%`}
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                  <p>Linear: {point.predictedLinear}%</p>
                  <p>
                    CI: [{point.ciLower}%, {point.ciUpper}%]
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Formula & Curvature Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Polynomial Equation</p>
              <p className="font-mono text-sm font-bold text-indigo-700 mt-0.5">
                {committeeSummary.polynomialModel.equation}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Linear Equation</p>
              <p className="font-mono text-sm font-bold text-slate-800 mt-0.5">
                {committeeSummary.polynomialModel.linearEquation}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Inflection Point</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {committeeSummary.polynomialModel.inflectionWeek
                  ? `Week ${committeeSummary.polynomialModel.inflectionWeek}`
                  : 'Monotonic (No Intra-Quarter Inflection)'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
