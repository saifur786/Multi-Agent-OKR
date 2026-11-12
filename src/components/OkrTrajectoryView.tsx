/**
 * Planview Anvi - OKR Future Attainment Trajectory View (Recharts)
 * Visualises 'Target vs. Predicted' OKR attainment trajectory curves based on
 * current polynomial regression coefficients, Human-in-the-Loop priority overrides,
 * confidence interval spread, and disaster shock wave impacts.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Target,
  Sparkles,
  ShieldAlert,
  Sliders,
  RotateCcw,
  Info,
  Calendar,
  Layers,
  Flame,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import {
  IndustryDataBundle,
  TraceabilityNode,
  SignificantDisasterEvent,
  ManagedProgram
} from '../types/orchestration';
import { computeFutureAttainmentTrajectory } from '../utils/trajectoryCalculations';

interface OkrTrajectoryViewProps {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  activeDisasters?: SignificantDisasterEvent[];
  managedPrograms?: ManagedProgram[];
  onNavigateToStudio?: () => void;
}

export const OkrTrajectoryView: React.FC<OkrTrajectoryViewProps> = ({
  industry,
  nodesMap,
  activeDisasters = [],
  managedPrograms = [],
  onNavigateToStudio
}) => {
  // Display curve toggles
  const [showTarget, setShowTarget] = useState<boolean>(true);
  const [showAiPredicted, setShowAiPredicted] = useState<boolean>(true);
  const [showHumanPrioritised, setShowHumanPrioritised] = useState<boolean>(true);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState<boolean>(true);
  const [showDisasterShock, setShowDisasterShock] = useState<boolean>(true);
  const [selectedKrId, setSelectedKrId] = useState<string>('all');

  // Filter OKR level nodes (Layer 3)
  const krNodes = useMemo(() => {
    return Object.values(nodesMap).filter(
      (n) => n.id.includes('kr') || n.id.includes('-o') || n.parentIds.some((p) => p.includes('-s'))
    );
  }, [nodesMap]);

  // Compute future trajectory points
  const trajectoryData = useMemo(() => {
    return computeFutureAttainmentTrajectory(
      industry.attainment,
      industry.regressionModel,
      Object.values(nodesMap),
      activeDisasters,
      managedPrograms
    );
  }, [industry.attainment, industry.regressionModel, nodesMap, activeDisasters, managedPrograms]);

  // Summary Metrics
  const summary = useMemo(() => {
    const finalPoint = trajectoryData[trajectoryData.length - 1];
    const targetDelta = finalPoint.humanPrioritisedTrajectory - finalPoint.targetTrajectory;
    const hasDisaster = activeDisasters.some((d) => d.active);

    return {
      currentAttainment: industry.attainment,
      projectedAiFinal: finalPoint.aiPredictedTrajectory,
      projectedHumanFinal: finalPoint.humanPrioritisedTrajectory,
      targetDelta,
      rSquared: industry.regressionModel.rSquared,
      equation: industry.regressionModel.regressionEquation,
      hasDisaster
    };
  }, [trajectoryData, industry.attainment, industry.regressionModel, activeDisasters]);

  return (
    <div className="space-y-6">
      {/* View Header & Executive Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Future OKR Attainment Trajectory (Target vs. Predicted)
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    • {industry.name} ({industry.quarter})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Extrapolating 5-quarter attainment paths using closed-form quadratic polynomial regression, Human-in-the-Loop overrides, and black-swan event simulation.
                </p>
              </div>
            </div>
          </div>

          {onNavigateToStudio && (
            <button
              onClick={onNavigateToStudio}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Sliders className="w-4 h-4 text-indigo-200" />
              <span>Manage OKRs &amp; Disaster Events</span>
            </button>
          )}
        </div>

        {/* 4 Key Mathematical KPI Cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Current Attainment</span>
              <Target className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.currentAttainment}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Baseline Q4 2026</p>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-indigo-700 font-medium">
              <span>Human-Prioritised Final</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-900 mt-1">{summary.projectedHumanFinal}%</p>
            <p className="text-[11px] text-indigo-700/80 mt-0.5">Q4 2027 Projected</p>
          </div>

          <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-sky-700 font-medium">
              <span>Model Goodness of Fit</span>
              <span className="font-bold text-sky-800">R²</span>
            </div>
            <p className="text-2xl font-extrabold text-sky-900 mt-1">{summary.rSquared}</p>
            <p className="text-[11px] text-sky-700/80 mt-0.5">Polynomial Quadratic Fit</p>
          </div>

          <div className={`p-3 rounded-xl border ${summary.hasDisaster ? 'bg-red-50/70 border-red-200 text-red-900' : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'}`}>
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Variance vs 100% Target</span>
              {summary.hasDisaster ? <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <p className={`text-2xl font-extrabold mt-1 ${summary.hasDisaster ? 'text-red-700' : 'text-emerald-800'}`}>
              {summary.targetDelta >= 0 ? `+${summary.targetDelta}%` : `${summary.targetDelta}%`}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              {summary.hasDisaster ? 'Active Disaster Shock' : 'On Track to Target'}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Recharts Trajectory Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Target vs. Predicted Attainment Trajectory Curves
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Closed-form quadratic regression: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px]">{summary.equation}</code>
            </p>
          </div>

          {/* Interactive Curve Visibility Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setShowTarget((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                showTarget
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400 line-through'
              }`}
            >
              Target (100%)
            </button>
            <button
              onClick={() => setShowAiPredicted((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                showAiPredicted
                  ? 'bg-sky-50 border-sky-300 text-sky-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400 line-through'
              }`}
            >
              AI Predicted
            </button>
            <button
              onClick={() => setShowHumanPrioritised((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                showHumanPrioritised
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400 line-through'
              }`}
            >
              Human Prioritised
            </button>
            <button
              onClick={() => setShowConfidenceInterval((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                showConfidenceInterval
                  ? 'bg-slate-100 border-slate-300 text-slate-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400 line-through'
              }`}
            >
              95% CI Band
            </button>
            {summary.hasDisaster && (
              <button
                onClick={() => setShowDisasterShock((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all ${
                  showDisasterShock
                    ? 'bg-red-50 border-red-300 text-red-800 font-semibold'
                    : 'bg-white border-slate-200 text-slate-400 line-through'
                }`}
              >
                Disaster Shock
              </button>
            )}
          </div>
        </div>

        {/* Recharts ComposedChart */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={trajectoryData}
              margin={{ top: 20, right: 30, bottom: 20, left: 0 }}
            >
              <defs>
                <linearGradient id="ciBandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="period"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />

              <YAxis
                domain={[20, 110]}
                ticks={[20, 40, 60, 80, 100]}
                stroke="#64748b"
                fontSize={11}
                tickFormatter={(val) => `${val}%`}
              />

              {/* 100% Target Reference Line */}
              <ReferenceLine
                y={100}
                stroke="#4f46e5"
                strokeDasharray="4 4"
                label={{ value: '100% Target Goal', fill: '#4f46e5', position: 'top', fontSize: 10, fontWeight: 700 }}
              />

              {/* 95% Confidence Interval Area Band */}
              {showConfidenceInterval && (
                <Area
                  type="monotone"
                  dataKey="ciUpper"
                  stroke="none"
                  fill="url(#ciBandGradient)"
                  name="95% Confidence Interval Upper"
                />
              )}

              {/* Target Line */}
              {showTarget && (
                <Line
                  type="monotone"
                  dataKey="targetTrajectory"
                  name="Target Trajectory"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  strokeDasharray="6 6"
                  dot={{ r: 4, fill: '#4f46e5' }}
                />
              )}

              {/* AI Predicted Line */}
              {showAiPredicted && (
                <Line
                  type="monotone"
                  dataKey="aiPredictedTrajectory"
                  name="AI Regression Predicted"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7' }}
                />
              )}

              {/* Human-in-the-Loop Line */}
              {showHumanPrioritised && (
                <Line
                  type="monotone"
                  dataKey="humanPrioritisedTrajectory"
                  name="Human-Prioritised (+ Reclaimed Focus)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                />
              )}

              {/* Disaster Shock Line (When Active) */}
              {showDisasterShock && summary.hasDisaster && (
                <Line
                  type="monotone"
                  dataKey="disasterShockTrajectory"
                  name="Disaster Shock Wave"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444' }}
                />
              )}

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
                      <div className="border-b border-slate-700 pb-1 flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{label}</span>
                        {data.milestoneEvent && (
                          <span className="text-[10px] text-indigo-300 font-semibold">{data.milestoneEvent}</span>
                        )}
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-indigo-300">
                          <span>Target:</span>
                          <strong>{data.targetTrajectory}%</strong>
                        </div>
                        <div className="flex justify-between text-sky-300">
                          <span>AI Predicted:</span>
                          <strong>{data.aiPredictedTrajectory}%</strong>
                        </div>
                        <div className="flex justify-between text-emerald-300">
                          <span>Human-Prioritised:</span>
                          <strong>{data.humanPrioritisedTrajectory}%</strong>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>95% CI Range:</span>
                          <span>[{data.ciLower}%, {data.ciUpper}%]</span>
                        </div>
                        {data.disasterShockTrajectory !== undefined && (
                          <div className="flex justify-between text-red-400 border-t border-slate-700 pt-1">
                            <span>Disaster Impact:</span>
                            <strong>{data.disasterShockTrajectory}%</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trajectory Breakdown & Checkpoint Milestones Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Quarterly Trajectory Checkpoints &amp; Governance Schedule
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Horizon Period</th>
                <th className="px-3 py-2.5">Target</th>
                <th className="px-3 py-2.5">AI Predicted (Regression)</th>
                <th className="px-3 py-2.5">95% CI Spread</th>
                <th className="px-3 py-2.5">Human Prioritised</th>
                <th className="px-3 py-2.5">Active Disaster Curve</th>
                <th className="px-3 py-2.5">Milestone Checkpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trajectoryData.map((pt, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-slate-900">{pt.period}</td>
                  <td className="px-3 py-2.5 font-semibold text-indigo-700">{pt.targetTrajectory}%</td>
                  <td className="px-3 py-2.5 font-semibold text-sky-700">{pt.aiPredictedTrajectory}%</td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">
                    [{pt.ciLower}% – {pt.ciUpper}%] (&plusmn;{Math.round((pt.ciUpper - pt.ciLower) / 2)}%)
                  </td>
                  <td className="px-3 py-2.5 font-bold text-emerald-700">{pt.humanPrioritisedTrajectory}%</td>
                  <td className="px-3 py-2.5 font-bold">
                    {pt.disasterShockTrajectory !== undefined ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-red-500" />
                        {pt.disasterShockTrajectory}%
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">Normal Ops</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {pt.milestoneEvent || 'Quarterly Review'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
