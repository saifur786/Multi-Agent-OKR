/**
 * Planview Anvi - Resource Utilisation Heatmap View
 * Uses Recharts to render a 2D Heatmap and Layer-by-Layer Capacity Analytics
 * across all 7 layers of traceability nodes, highlighting bottlenecks in red.
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';
import {
  Flame,
  AlertTriangle,
  Layers,
  Users,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Filter,
  Sliders,
  DollarSign,
  Activity,
  Info
} from 'lucide-react';
import { IndustryDataBundle, TraceabilityNode } from '../types/orchestration';
import { eventBus } from '../utils/eventBus';
import {
  calculate7LayerNodeUtilisation,
  calculateLayerUtilisationAggregates,
  simulateRebalanceBottleneck,
  getUtilisationColor,
  HeatmapNodeData,
  LAYER_METADATA
} from '../utils/heatmapCalculations';

interface ResourceUtilisationHeatmapViewProps {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  onUpdateNodesMap: React.Dispatch<React.SetStateAction<Record<string, TraceabilityNode>>>;
  onNavigateToTraceability?: (nodeId: string) => void;
}

export const ResourceUtilisationHeatmapView: React.FC<ResourceUtilisationHeatmapViewProps> = ({
  industry,
  nodesMap,
  onUpdateNodesMap,
  onNavigateToTraceability
}) => {
  // Filters & State
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<number | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'stressed' | 'optimal'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rebalanceFeedback, setRebalanceFeedback] = useState<string | null>(null);

  // Derive 7-layer node utilisation data
  const allHeatmapNodes: HeatmapNodeData[] = useMemo(() => {
    return calculate7LayerNodeUtilisation(nodesMap, industry.traceability);
  }, [nodesMap, industry.traceability]);

  // Layer aggregates for the companion ComposedChart
  const layerAggregates = useMemo(() => {
    return calculateLayerUtilisationAggregates(allHeatmapNodes);
  }, [allHeatmapNodes]);

  // Filtered heatmap nodes for display
  const filteredNodes = useMemo(() => {
    return allHeatmapNodes.filter((node) => {
      if (selectedLayerFilter !== 'all' && node.layerNum !== selectedLayerFilter) {
        return false;
      }
      if (severityFilter === 'critical' && !node.isBottleneck) return false;
      if (severityFilter === 'stressed' && node.severity !== 'stressed') return false;
      if (severityFilter === 'optimal' && (node.isBottleneck || node.severity === 'stressed')) return false;
      return true;
    });
  }, [allHeatmapNodes, selectedLayerFilter, severityFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalNodes = allHeatmapNodes.length;
    const bottlenecks = allHeatmapNodes.filter((n) => n.isBottleneck);
    const stressed = allHeatmapNodes.filter((n) => n.severity === 'stressed');
    const avgUtil = Math.round(
      allHeatmapNodes.reduce((sum, n) => sum + n.utilisationPct, 0) / (totalNodes || 1)
    );
    const totalAllocatedFte = Math.round(allHeatmapNodes.reduce((sum, n) => sum + n.allocatedFte, 0) * 10) / 10;
    const totalCapacityFte = Math.round(allHeatmapNodes.reduce((sum, n) => sum + n.capacityFte, 0) * 10) / 10;
    const deficitFte = Math.max(0, Math.round((totalAllocatedFte - totalCapacityFte) * 10) / 10);

    // Sum capital tied to bottleneck nodes
    let bottleneckSpend = 0;
    bottlenecks.forEach((b) => {
      const parsed = parseFloat(b.budget.replace(/[^0-9.]/g, '')) || 0;
      bottleneckSpend += parsed;
    });

    return {
      totalNodes,
      bottleneckCount: bottlenecks.length,
      stressedCount: stressed.length,
      avgUtil,
      totalAllocatedFte,
      totalCapacityFte,
      deficitFte,
      bottleneckSpend: Math.round(bottleneckSpend * 10) / 10
    };
  }, [allHeatmapNodes]);

  // Default selection to first bottleneck node if not selected
  const activeSelectedNode = useMemo(() => {
    if (selectedNodeId) {
      return allHeatmapNodes.find((n) => n.id === selectedNodeId) || null;
    }
    // Find highest bottleneck
    const topBottleneck = [...allHeatmapNodes].sort((a, b) => b.utilisationPct - a.utilisationPct)[0];
    return topBottleneck || allHeatmapNodes[0] || null;
  }, [selectedNodeId, allHeatmapNodes]);

  // Handle AI Capacity Rebalancing
  const handleRebalanceNode = (nodeId: string) => {
    const targetNode = allHeatmapNodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const updated = simulateRebalanceBottleneck(nodesMap, nodeId, 22);
    onUpdateNodesMap(updated);

    // Publish event to Event Bus
    eventBus.publish({
      topic: 'INTERVENTION_APPLIED',
      sourceAgent: 'Alignment & Capacity Agent',
      targetAgent: 'Supervisor Agent',
      summary: `AI Burst Capacity Applied: Rebalanced 3.2 FTE to relieve bottleneck on ${targetNode.title} (${targetNode.squadName})`,
      payload: {
        nodeId,
        previousLoadPct: targetNode.utilisationPct,
        newLoadPct: Math.round(targetNode.utilisationPct * 0.8),
        squadName: targetNode.squadName,
        layer: targetNode.layerName
      },
      latencyMs: 24,
      severity: 'success'
    });

    setRebalanceFeedback(`Capacity rebalanced for ${targetNode.title}: load reduced from ${targetNode.utilisationPct}% to 82%!`);
    setTimeout(() => setRebalanceFeedback(null), 4500);
  };

  // Custom Recharts Heatmap Cell Shape
  const renderHeatmapCell = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || cx === undefined || cy === undefined) return null;

    const node: HeatmapNodeData = payload;
    const isSelected = activeSelectedNode?.id === node.id;
    const isBottleneck = node.isBottleneck;
    const color = getUtilisationColor(node.utilisationPct);

    const cellWidth = 110;
    const cellHeight = 44;
    const x = cx - cellWidth / 2;
    const y = cy - cellHeight / 2;

    const truncatedTitle =
      node.title.length > 18 ? node.title.substring(0, 16) + '…' : node.title;

    return (
      <g
        className="cursor-pointer transition-all duration-150 select-none"
        onClick={() => setSelectedNodeId(node.id)}
      >
        {/* Glow filter if bottleneck */}
        {isBottleneck && (
          <rect
            x={x - 2}
            y={y - 2}
            width={cellWidth + 4}
            height={cellHeight + 4}
            rx={8}
            fill="#ef4444"
            opacity={0.35}
            className="animate-pulse"
          />
        )}

        {/* Main Cell Body */}
        <rect
          x={x}
          y={y}
          width={cellWidth}
          height={cellHeight}
          rx={6}
          fill={color}
          stroke={isSelected ? '#1e1b4b' : isBottleneck ? '#b91c1c' : 'rgba(255,255,255,0.3)'}
          strokeWidth={isSelected ? 3 : isBottleneck ? 2 : 1}
        />

        {/* Bottleneck Warning Indicator Dot */}
        {isBottleneck && (
          <circle cx={x + cellWidth - 8} cy={y + 8} r={3.5} fill="#ffffff" />
        )}

        {/* Utilisation Percentage */}
        <text
          x={x + 10}
          y={y + 19}
          fill="#ffffff"
          fontSize={13}
          fontWeight={800}
          letterSpacing="-0.02em"
        >
          {node.utilisationPct}%
        </text>

        {/* Status / Severity Marker */}
        <text
          x={x + cellWidth - (isBottleneck ? 16 : 8)}
          y={y + 18}
          textAnchor="end"
          fill="rgba(255,255,255,0.85)"
          fontSize={9}
          fontWeight={600}
        >
          {node.allocatedFte} FTE
        </text>

        {/* Node Short Title */}
        <text
          x={x + 10}
          y={y + 34}
          fill="rgba(255,255,255,0.95)"
          fontSize={9.5}
          fontWeight={500}
        >
          {truncatedTitle}
        </text>
      </g>
    );
  };

  // Custom Heatmap Tooltip
  const HeatmapTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const node: HeatmapNodeData = payload[0].payload;
    if (!node) return null;

    const isBottleneck = node.isBottleneck;

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 max-w-xs z-50 text-xs space-y-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1.5">
          <span className="text-[11px] font-semibold text-slate-400">{node.layerName}</span>
          <span
            className={`font-bold text-[10px] uppercase px-1.5 py-0.5 rounded ${
              isBottleneck
                ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                : node.severity === 'stressed'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isBottleneck ? 'Bottleneck' : node.severity}
          </span>
        </div>

        <div>
          <p className="font-semibold text-white text-sm leading-tight">{node.title}</p>
          <p className="text-slate-300 text-[11px] mt-0.5">Owner: {node.owner}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-800/70 p-2 rounded-lg border border-slate-700/50">
          <div>
            <p className="text-[10px] text-slate-400">Utilisation</p>
            <p
              className={`text-base font-extrabold ${
                isBottleneck ? 'text-red-400' : node.severity === 'stressed' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {node.utilisationPct}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Headcount</p>
            <p className="text-xs font-semibold text-white">
              {node.allocatedFte} / {node.capacityFte} FTE
            </p>
          </div>
        </div>

        {node.bottleneckReason && (
          <div className="border-t border-slate-700/60 pt-1.5">
            <p className="text-[10px] font-semibold text-red-300 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
              Constraint Alert:
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{node.bottleneckReason}</p>
          </div>
        )}

        <p className="text-[10px] text-indigo-300 pt-1 border-t border-slate-700/40 flex items-center gap-1">
          <Info className="w-3 h-3" /> Click cell to inspect full lineage &amp; remediate
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header & Executive Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-100 text-red-700">
                <Flame className="w-5 h-5 text-red-600" />
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    7-Layer Resource Utilisation &amp; Bottleneck Heatmap
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    • {industry.name} ({industry.quarter})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Visualising capacity stress across all 7 Planview traceability layers. Potential bottlenecks (load &ge; 100%) are highlighted in red.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
              <span className="px-2 text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Severity:
              </span>
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  severityFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({allHeatmapNodes.length})
              </button>
              <button
                onClick={() => setSeverityFilter('critical')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  severityFilter === 'critical'
                    ? 'bg-red-600 text-white shadow-xs font-semibold'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Bottlenecks ({stats.bottleneckCount})
              </button>
              <button
                onClick={() => setSeverityFilter('stressed')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  severityFilter === 'stressed'
                    ? 'bg-amber-500 text-white shadow-xs font-semibold'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                Stressed ({stats.stressedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alert on Remediation */}
        {rebalanceFeedback && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{rebalanceFeedback}</span>
          </div>
        )}

        {/* 5 Executive KPI Metrics Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
          <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-red-700 font-medium">
              <span>Active Bottlenecks</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <p className="text-2xl font-extrabold text-red-700 mt-1">{stats.bottleneckCount}</p>
            <p className="text-[11px] text-red-600/80 mt-0.5">&ge; 100% utilisation load</p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-amber-700 font-medium">
              <span>Stressed Nodes</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-800 mt-1">{stats.stressedCount}</p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">85% – 99% capacity stress</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Fleet Avg Utilisation</span>
              <Activity className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.avgUtil}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across {stats.totalNodes} nodes</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Capital at Bottleneck</span>
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">${stats.bottleneckSpend}M</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Tied to overloaded work</p>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-indigo-700 font-medium">
              <span>Total Headcount</span>
              <Users className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-900 mt-1">{stats.totalAllocatedFte} FTE</p>
            <p className="text-[11px] text-indigo-700/80 mt-0.5">Cap: {stats.totalCapacityFte} FTE</p>
          </div>
        </div>
      </div>

      {/* Primary Recharts Heatmap Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              2D Utilisation Heatmap Matrix (Layers 1 through 7)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each cell represents a traceable Planview entity. Red cells indicate over-allocated bottlenecks requiring intervention.
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
            <span className="font-semibold text-slate-700">Utilisation:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-600 inline-block shadow-xs" />
              &ge; 100% (Bottleneck)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
              85–99%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
              70–84%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
              &lt; 70%
            </span>
          </div>
        </div>

        {/* Recharts ScatterChart Heatmap */}
        <div className="w-full h-[400px] bg-slate-900/95 rounded-xl p-3 border border-slate-800 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 35, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />

              <XAxis
                dataKey="x"
                type="number"
                domain={[0.5, 7.5]}
                ticks={[1, 2, 3, 4, 5, 6, 7]}
                tickFormatter={(val: number) => {
                  const shorts: Record<number, string> = {
                    1: 'L1: Strategy',
                    2: 'L2: Portfolios',
                    3: 'L3: OKRs',
                    4: 'L4: Initiatives',
                    5: 'L5: Epics',
                    6: 'L6: Squads',
                    7: 'L7: Outcomes'
                  };
                  return shorts[val] || `L${val}`;
                }}
                stroke="#94a3b8"
                fontSize={11}
                tickLine={{ stroke: '#475569' }}
              />

              <YAxis
                dataKey="y"
                type="number"
                domain={[0.5, 5.5]}
                ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(val: number) => `Node #${val}`}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />

              <ZAxis dataKey="utilisationPct" range={[1400, 1400]} />

              <Tooltip
                content={<HeatmapTooltip />}
                cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1', strokeWidth: 1 }}
              />

              <Scatter
                name="7-Layer Nodes"
                data={filteredNodes}
                shape={renderHeatmapCell}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Layer Selector Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-500 font-medium mr-1">Filter by Layer:</span>
          <button
            onClick={() => setSelectedLayerFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedLayerFilter === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All 7 Layers
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map((l) => {
            const count = allHeatmapNodes.filter((n) => n.layerNum === l).length;
            const hasBottleneck = allHeatmapNodes.some((n) => n.layerNum === l && n.isBottleneck);
            return (
              <button
                key={l}
                onClick={() => setSelectedLayerFilter(l)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 ${
                  selectedLayerFilter === l
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {LAYER_METADATA[l]?.short || `L${l}`} ({count})
                {hasBottleneck && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Analytics: Layer Aggregates (Recharts ComposedChart) & Node Lineage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recharts Layer Capacity & Peak Utilisation Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Layer-by-Layer Peak vs Average Utilisation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Red bars indicate layers where at least one node has breached the 100% capacity threshold.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
              Threshold: 100%
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={layerAggregates}
                margin={{ top: 15, right: 20, bottom: 25, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                <XAxis
                  dataKey="layerShort"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />

                <YAxis
                  yAxisId="left"
                  domain={[0, 130]}
                  ticks={[0, 25, 50, 75, 100, 125]}
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => `${v}%`}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 45]}
                  stroke="#94a3b8"
                  fontSize={10}
                  tickFormatter={(v) => `${v}FTE`}
                />

                {/* Over-allocation Threshold Reference Line */}
                <ReferenceLine
                  yAxisId="left"
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: '100% Limit',
                    fill: '#dc2626',
                    position: 'top',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />

                {/* Peak Utilisation Bar (Colored red if >= 100%) */}
                <Bar
                  yAxisId="left"
                  dataKey="peakUtilisation"
                  name="Peak Utilisation %"
                  radius={[4, 4, 0, 0]}
                >
                  {layerAggregates.map((entry, index) => (
                    <Cell
                      key={`peak-${index}`}
                      fill={entry.peakUtilisation >= 100 ? '#ef4444' : '#f97316'}
                    />
                  ))}
                </Bar>

                {/* Average Utilisation Bar */}
                <Bar
                  yAxisId="left"
                  dataKey="avgUtilisation"
                  name="Avg Utilisation %"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />

                {/* Total Allocated FTE Line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalAllocatedFte"
                  name="Allocated FTE"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0f172a' }}
                />

                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />

                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'Allocated FTE') return [`${value} FTE`, name];
                    return [`${value}%`, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column (5 cols): Interactive Node Inspector & AI Remediation Drawer */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeSelectedNode?.isBottleneck
                      ? 'bg-red-500 animate-pulse'
                      : activeSelectedNode?.severity === 'stressed'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <h3 className="text-sm font-bold text-slate-900">Node Resource Inspector</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {activeSelectedNode?.layerName || 'Layer'}
              </span>
            </div>

            {activeSelectedNode ? (
              <div className="space-y-4 mt-3">
                {/* Node Title & Owner */}
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {activeSelectedNode.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Owner: <strong className="text-slate-700">{activeSelectedNode.owner}</strong></span>
                    <span>•</span>
                    <span>Squad: <strong className="text-slate-700">{activeSelectedNode.squadName}</strong></span>
                  </div>
                </div>

                {/* Utilisation Gauge Card */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    activeSelectedNode.isBottleneck
                      ? 'bg-red-50/70 border-red-200 text-red-900'
                      : activeSelectedNode.severity === 'stressed'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Current Utilisation</span>
                    <span
                      className={`text-lg font-black ${
                        activeSelectedNode.isBottleneck ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {activeSelectedNode.utilisationPct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        activeSelectedNode.isBottleneck
                          ? 'bg-red-600'
                          : activeSelectedNode.severity === 'stressed'
                          ? 'bg-amber-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, activeSelectedNode.utilisationPct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>Demand: {activeSelectedNode.allocatedFte} FTE</span>
                    <span>Capacity: {activeSelectedNode.capacityFte} FTE</span>
                    <span className="font-semibold text-slate-700">Budget: {activeSelectedNode.budget}</span>
                  </div>
                </div>

                {/* Constraint Reason */}
                {activeSelectedNode.bottleneckReason ? (
                  <div className="bg-red-50/50 border border-red-200/60 p-3 rounded-xl text-xs space-y-1">
                    <p className="font-semibold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      Detected Root Cause:
                    </p>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      {activeSelectedNode.bottleneckReason}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600">
                    <p className="font-medium text-slate-700">Healthy Resource Allocation</p>
                    <p className="text-[11px] mt-0.5">
                      Squad velocity and capacity are within standard Planview thresholds.
                    </p>
                  </div>
                )}

                {/* Upstream & Downstream Lineage */}
                <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                  <p className="font-semibold text-slate-800">Topological Dependencies:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Upstream (Parents)</span>
                      <span className="font-semibold text-slate-700">
                        {activeSelectedNode.parentIds.length > 0
                          ? `${activeSelectedNode.parentIds.length} connected parent(s)`
                          : 'Root strategy node'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Downstream (Children)</span>
                      <span className="font-semibold text-slate-700">
                        {activeSelectedNode.childIds.length > 0
                          ? `${activeSelectedNode.childIds.length} dependent child(ren)`
                          : 'Terminal leaf node'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Select any cell in the heatmap matrix to inspect its resource allocation.
              </div>
            )}
          </div>

          {/* Action Bar */}
          {activeSelectedNode && (
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
              {activeSelectedNode.isBottleneck ? (
                <button
                  onClick={() => handleRebalanceNode(activeSelectedNode.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-200" />
                  Simulate AI Capacity Rebalance (-20% Load)
                </button>
              ) : (
                <button
                  onClick={() => handleRebalanceNode(activeSelectedNode.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Optimise Squad Load Balance
                </button>
              )}

              {onNavigateToTraceability && (
                <button
                  onClick={() => onNavigateToTraceability(activeSelectedNode.id)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
                >
                  View in 7-Layer Tree
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
