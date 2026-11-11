import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  ShieldCheck,
  Target,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { IndustryDataBundle, HistoricalAccuracyCohort } from '../types/orchestration';
import {
  generateHistoricalAccuracyCohorts,
  generateAgentAccuracyProfiles
} from '../utils/algorithms';

interface AdvisoryPerformanceAccuracyViewProps {
  industry: IndustryDataBundle;
  onNavigateToOutcomes?: () => void;
}

export const AdvisoryPerformanceAccuracyView: React.FC<AdvisoryPerformanceAccuracyViewProps> = ({
  industry,
  onNavigateToOutcomes
}) => {
  const [timeframe, setTimeframe] = useState<'quarters' | 'sprints'>('quarters');
  const [chartFocus, setChartFocus] = useState<'composite' | 'rSquared' | 'ciBand' | 'agents'>('composite');
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number>(0);
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);

  const cohorts: HistoricalAccuracyCohort[] = useMemo(() => {
    return generateHistoricalAccuracyCohorts(timeframe);
  }, [timeframe]);

  const agentProfiles = useMemo(() => {
    return generateAgentAccuracyProfiles();
  }, []);

  const selectedAgent = agentProfiles[selectedAgentIndex] || agentProfiles[0];

  // Derived KPI Stats
  const latestCohort = cohorts[cohorts.length - 1];
  const earliestCohort = cohorts[0];

  const rSquaredDelta = Math.round((latestCohort.rSquaredPolynomial - earliestCohort.rSquaredPolynomial) * 100);
  const spreadReductionPct = Math.round(
    ((earliestCohort.ciSpread - latestCohort.ciSpread) / earliestCohort.ciSpread) * 100
  );
  const maeReductionPct = Math.round(
    ((earliestCohort.meanAbsoluteError - latestCohort.meanAbsoluteError) / earliestCohort.meanAbsoluteError) * 100
  );

  // Formatted data for the Confidence Interval Band
  // In Recharts, to render a filled band between ciLower and ciUpper in a ComposedChart:
  // We can pass ciLower and [ciLower, ciUpper] range
  const chartData = useMemo(() => {
    return cohorts.map((c) => ({
      ...c,
      ciBand: [c.ciLower, c.ciUpper],
      ciHalfSpread: +(c.ciSpread / 2).toFixed(1),
      rSquaredPercent: +(c.rSquaredPolynomial * 100).toFixed(1),
      rSquaredLinearPercent: +(c.rSquaredLinear * 100).toFixed(1),
      errorMargin: Math.abs(c.actualAttainment - c.predictedAttainment)
    }));
  }, [cohorts]);

  return (
    <div className="space-y-6">
      {/* View Header with Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Advisory Committee Accuracy &amp; Calibration Analytics
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Recharts Powered
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Visualising empirical regression fit (<strong className="text-slate-700">R²</strong>), 
              confidence interval growth (<strong className="text-slate-700">[ciLower, ciUpper]</strong>), 
              and multi-agent prediction calibration across historical cohorts for {industry.name}.
            </p>
          </div>

          {/* Granularity & Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Timeframe Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTimeframe('quarters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === 'quarters'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                8 Quarters (2025–2026)
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('sprints')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === 'sprints'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                12 Sprints (Annual Cycle)
              </button>
            </div>

            {onNavigateToOutcomes && (
              <button
                type="button"
                onClick={onNavigateToOutcomes}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <span>Live Committee Outcomes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 4 Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Current Model R²</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                +{rSquaredDelta}% lift
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">
                {latestCohort.rSquaredPolynomial.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500">
                from {earliestCohort.rSquaredPolynomial.toFixed(2)} baseline
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Polynomial regression goodness of fit against actual KR attainment.
            </p>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">CI Margin of Error</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                -{spreadReductionPct}% spread
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-700">
                &plusmn;{(latestCohort.ciSpread / 2).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">
                [{latestCohort.ciLower}%, {latestCohort.ciUpper}%]
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              5x precision tightening via multi-agent consensus divergence pruning.
            </p>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Mean Abs Error (MAE)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-800">
                -{maeReductionPct}% error
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">
                {latestCohort.meanAbsoluteError.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">
                from {earliestCohort.meanAbsoluteError.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Average residual difference between predicted vs final attainment.
            </p>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Empirical Hit Rate</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                Calibration 98%
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700">97.6%</span>
              <span className="text-xs text-slate-500">
                {latestCohort.sampleSizeKRs} KRs evaluated
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Actual attainment fell strictly within the Advisory Committee CI bounds.
            </p>
          </div>
        </div>

        {/* Chart View Modes */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1">Chart Focus:</span>
            <button
              type="button"
              onClick={() => setChartFocus('composite')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartFocus === 'composite'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Dual Analysis (R² &amp; CI)
            </button>
            <button
              type="button"
              onClick={() => setChartFocus('ciBand')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartFocus === 'ciBand'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Confidence Interval Band (Growth &amp; Tightening)
            </button>
            <button
              type="button"
              onClick={() => setChartFocus('rSquared')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartFocus === 'rSquared'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              R² Regression Fit Over Time
            </button>
            <button
              type="button"
              onClick={() => setChartFocus('agents')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                chartFocus === 'agents'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Advisor Persona Calibration
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Actual Attainment
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
              Predicted Attainment
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-200 inline-block" />
              CI Band
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      {chartFocus === 'composite' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Confidence Interval Growth & Shrinkage Band */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Confidence Interval Growth &amp; Calibration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Predicted vs Actual Attainment bounded by [ciLower, ciUpper] envelope
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                &plusmn;{(latestCohort.ciSpread / 2).toFixed(1)}% CI Width
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ciBandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip content={<CustomCITooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  
                  {/* CI Upper & Lower lines with shaded envelope */}
                  <Area
                    type="monotone"
                    dataKey="ciUpper"
                    name="CI Upper Bound"
                    stroke="#818cf8"
                    strokeDasharray="2 2"
                    fillOpacity={1}
                    fill="url(#ciBandFill)"
                  />
                  <Line
                    type="monotone"
                    dataKey="ciLower"
                    name="CI Lower Bound"
                    stroke="#818cf8"
                    strokeDasharray="2 2"
                    strokeWidth={1.5}
                    dot={false}
                  />

                  {/* Predicted vs Actual */}
                  <Line
                    type="monotone"
                    dataKey="predictedAttainment"
                    name="Committee Predicted"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#4f46e5' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actualAttainment"
                    name="Actual Attainment"
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: '#059669' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Uncertainty spread narrowed from 40% (Q1 25) to 8% (Q4 26)</span>
              <span className="font-semibold text-emerald-700">97.6% Inside Bounds</span>
            </div>
          </div>

          {/* Card 2: R² Goodness of Fit Over Time */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  R² Goodness of Fit Progression
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Polynomial (deg-2) vs Linear regression accuracy scaling
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                R² = {latestCohort.rSquaredPolynomial.toFixed(2)}
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip content={<CustomR2Tooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <ReferenceLine y={90} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Target 90% Fit', position: 'top', fill: '#94a3b8', fontSize: 10 }} />

                  <Line
                    type="monotone"
                    dataKey="rSquaredPercent"
                    name="Polynomial (Deg-2) R²"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#059669' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rSquaredLinearPercent"
                    name="Linear Baseline R²"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Polynomial model captures quadratic acceleration/deceleration</span>
              <span className="font-semibold text-indigo-700">+10.2% superior fit to Linear</span>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode: Confidence Interval Band Expanded */}
      {chartFocus === 'ciBand' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Confidence Interval Growth, Envelope Spread &amp; Calibration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Displays the tightening confidence ribbon [ciLower, ciUpper] as the multi-agent committee ingests historical regression vectors.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                Initial Spread: {earliestCohort.ciSpread}% &rarr; Final Spread: {latestCohort.ciSpread}%
              </span>
            </div>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
                <defs>
                  <linearGradient id="expandedBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis domain={[35, 105]} tick={{ fontSize: 12, fill: '#475569' }} unit="%" />
                <Tooltip content={<CustomCITooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />

                {/* Shaded ribbon */}
                <Area
                  type="monotone"
                  dataKey="ciUpper"
                  name="CI Upper Bound"
                  stroke="#4f46e5"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#expandedBand)"
                />
                <Line
                  type="monotone"
                  dataKey="ciLower"
                  name="CI Lower Bound"
                  stroke="#4f46e5"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  dot={false}
                />

                {/* Attainment lines */}
                <Line
                  type="monotone"
                  dataKey="predictedAttainment"
                  name="Predicted Attainment %"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="actualAttainment"
                  name="Actual Attainment %"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669' }}
                  activeDot={{ r: 7 }}
                />

                {/* CI Spread bar at bottom to show uncertainty magnitude */}
                <Bar
                  dataKey="ciSpread"
                  name="Uncertainty Spread (&plusmn; %)"
                  fill="#c7d2fe"
                  opacity={0.6}
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-800 block">Why does the CI band narrow?</strong>
              <p className="text-slate-500 mt-1">
                As additional sprint cohorts execute, variance in team velocity decreases. The polynomial regression coefficients stabilize with tighter asymptotic confidence bounds.
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-800 block">Divergence Index Correlation</strong>
              <p className="text-slate-500 mt-1">
                Advisory consensus divergence declined from {earliestCohort.consensusDivergence} to {latestCohort.consensusDivergence}, producing high agreement on boundary limits.
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-800 block">Attainment Residual Precision</strong>
              <p className="text-slate-500 mt-1">
                Prediction error margin shrunk from {earliestCohort.meanAbsoluteError}% down to {latestCohort.meanAbsoluteError}%, ensuring reliable C-suite budget allocations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode: R² Goodness of Fit Expanded */}
      {chartFocus === 'rSquared' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Empirical R² Goodness of Fit Trajectory &amp; Model Comparison
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation of regression coefficient of determination across 8 sequential planning iterations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                Peak Polynomial R²: {latestCohort.rSquaredPolynomial.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis domain={[55, 100]} tick={{ fontSize: 12, fill: '#475569' }} unit="%" />
                <Tooltip content={<CustomR2Tooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                
                <ReferenceLine y={90} stroke="#cbd5e1" strokeDasharray="4 4" label={{ value: '90% Benchmark', position: 'insideTopLeft', fill: '#64748b', fontSize: 11 }} />
                <ReferenceLine y={95} stroke="#10b981" strokeDasharray="3 3" label={{ value: '95% Gold Standard', position: 'insideTopLeft', fill: '#059669', fontSize: 11 }} />

                <Line
                  type="monotone"
                  dataKey="rSquaredPercent"
                  name="Polynomial (Deg-2) R²"
                  stroke="#059669"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: '#059669' }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="rSquaredLinearPercent"
                  name="Linear Standard R²"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#6366f1' }}
                />
                <Line
                  type="monotone"
                  dataKey="brierScore"
                  name="Brier Calibration Score (Lower is Better)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <strong className="text-slate-800">Mathematical Model Advantage:</strong>
              <p className="text-slate-600 mt-0.5">
                Quadratic degree-2 polynomial formulation <code>y = ax² + bx + c</code> reliably models non-linear delivery headwinds (dependency latency, deployment freeze, integration spikes) that linear extrapolation misses.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                Formula: y = {industry.regressionModel.regressionEquation}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode: Agent Persona Accuracy Comparison */}
      {chartFocus === 'agents' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-indigo-600" />
                Advisory Agent Persona Historical Accuracy Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of predictive accuracy, Mean Absolute Error (MAE), and calibration hit rates across advisory personas.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {agentProfiles.length} Autonomous Personas Analyzed
            </span>
          </div>

          {/* Bar Chart comparing personas */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agentProfiles.map((p) => ({
                  name: p.agentName.split(' ')[0] + ' ' + (p.agentName.split(' ')[1] || ''),
                  fullName: p.agentName,
                  rSquared: +(p.historicalRSquared * 100).toFixed(1),
                  mae: p.averageMAE,
                  calibration: p.ciCalibrationRate,
                  color: p.color
                }))}
                margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip content={<CustomAgentTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="rSquared" name="Historical R² Fit %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calibration" name="CI Calibration Hit Rate %" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mae" name="Average MAE % (Lower is Better)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Persona selector tabs & drilldown trend */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-600 block">Inspect Individual Advisor Historical Trajectory:</span>
            <div className="flex flex-wrap gap-1.5">
              {agentProfiles.map((agent, idx) => (
                <button
                  key={agent.agentName}
                  type="button"
                  onClick={() => setSelectedAgentIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedAgentIndex === idx
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {agent.agentName}
                </button>
              ))}
            </div>

            {/* Drilldown trend for selected agent */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedAgent.agentName}</h4>
                  <span className="text-xs text-slate-500">{selectedAgent.role}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-semibold text-slate-700">
                    R² Fit: <strong>{(selectedAgent.historicalRSquared * 100).toFixed(1)}%</strong>
                  </span>
                  <span className="bg-white px-2.5 py-1 rounded border border-slate-200 font-semibold text-slate-700">
                    Calibration Rate: <strong>{selectedAgent.ciCalibrationRate}%</strong>
                  </span>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedAgent.historicalTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="rSquared" name="R² Fit" stroke={selectedAgent.color} strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="mae" name="MAE Error %" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="spread" name="CI Spread Width" stroke="#94a3b8" strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Density Statistical Inspection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Historical Cohort Accuracy &amp; Attainment Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable breakdown of each historical planning cohort showing R², CI bounds, and MAE precision.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Showing {cohorts.length} Historical Planning Periods
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 font-bold">Period</th>
                <th className="py-2.5 px-3 font-bold">Polynomial R²</th>
                <th className="py-2.5 px-3 font-bold">Linear R²</th>
                <th className="py-2.5 px-3 font-bold">Predicted %</th>
                <th className="py-2.5 px-3 font-bold">Actual %</th>
                <th className="py-2.5 px-3 font-bold">CI Bounds</th>
                <th className="py-2.5 px-3 font-bold">Spread (&plusmn;)</th>
                <th className="py-2.5 px-3 font-bold">MAE</th>
                <th className="py-2.5 px-3 font-bold">Divergence</th>
                <th className="py-2.5 px-3 font-bold">Sample KRs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cohorts.map((cohort) => {
                const isCurrent = cohort.period === latestCohort.period;
                const isHovered = hoveredPeriod === cohort.period;

                return (
                  <tr
                    key={cohort.period}
                    onMouseEnter={() => setHoveredPeriod(cohort.period)}
                    onMouseLeave={() => setHoveredPeriod(null)}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50/50 font-medium'
                        : isHovered
                        ? 'bg-slate-50'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                      {cohort.period}
                      {isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">
                      {cohort.rSquaredPolynomial.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {cohort.rSquaredLinear.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-indigo-700">
                      {cohort.predictedAttainment}%
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {cohort.actualAttainment}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      [{cohort.ciLower}%, {cohort.ciUpper}%]
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      &plusmn;{(cohort.ciSpread / 2).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {cohort.meanAbsoluteError.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {cohort.consensusDivergence.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {cohort.sampleSizeKRs} KRs ({cohort.agentCount} agents)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Custom Tooltip for Confidence Interval Charts
const CustomCITooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as HistoricalAccuracyCohort;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[210px] backdrop-blur-sm">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-bold">
          <span>{label} Cohort</span>
          <span className="text-emerald-400">R² {data.rSquaredPolynomial.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Actual Attainment:</span>
          <strong className="text-emerald-400">{data.actualAttainment}%</strong>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Predicted Attainment:</span>
          <strong className="text-indigo-300">{data.predictedAttainment}%</strong>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Confidence Interval:</span>
          <strong className="text-amber-300">[{data.ciLower}%, {data.ciUpper}%]</strong>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Uncertainty Width:</span>
          <span className="text-slate-400">&plusmn;{(data.ciSpread / 2).toFixed(1)}% ({data.ciSpread} pts)</span>
        </div>
        <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
          <span>Residual Error (MAE):</span>
          <span className="text-rose-300 font-semibold">{data.meanAbsoluteError.toFixed(1)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for R² Chart
const CustomR2Tooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as HistoricalAccuracyCohort;
    if (!data) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[210px] backdrop-blur-sm">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800 font-bold">
          <span>{label} Regression</span>
          <span className="text-indigo-300">{data.sampleSizeKRs} KRs</span>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Polynomial (Deg-2) R²:</span>
          <strong className="text-emerald-400">{(data.rSquaredPolynomial * 100).toFixed(1)}% ({data.rSquaredPolynomial.toFixed(2)})</strong>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Linear Baseline R²:</span>
          <strong className="text-slate-400">{(data.rSquaredLinear * 100).toFixed(1)}% ({data.rSquaredLinear.toFixed(2)})</strong>
        </div>
        <div className="flex justify-between items-center text-slate-300">
          <span>Brier Score (Calibration):</span>
          <strong className="text-amber-400">{data.brierScore.toFixed(3)}</strong>
        </div>
        <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
          <span>Committee Consensus Div:</span>
          <span className="text-slate-400">{data.consensusDivergence.toFixed(1)} index</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Agent Personas
const CustomAgentTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload;
    if (!item) return null;

    return (
      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 min-w-[200px] backdrop-blur-sm">
        <span className="font-bold block text-white border-b border-slate-800 pb-1">{item.fullName}</span>
        <div className="flex justify-between text-slate-300">
          <span>R² Goodness of Fit:</span>
          <strong className="text-indigo-400">{item.rSquared}%</strong>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>CI Calibration Hit Rate:</span>
          <strong className="text-emerald-400">{item.calibration}%</strong>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Mean Absolute Error:</span>
          <strong className="text-amber-400">{item.mae}%</strong>
        </div>
      </div>
    );
  }
  return null;
};

// Helper Icon for Users
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
