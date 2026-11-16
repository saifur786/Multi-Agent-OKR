import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  Gauge,
  Zap
} from 'lucide-react';
import type { LifecycleStage } from '../types/orchestration';
import type { TimelineStageEntry } from '../utils/orchestrationTimeline';
import {
  buildStageDependencyGraph,
  type BottleneckSensitivity,
  type BottleneckSeverity,
  type HandoffChannelType,
  type StageFlowEdge,
  type StageFlowNode
} from '../utils/stageDependencyFlow';

interface StageDependencyFlowDiagramProps {
  industryName: string;
  stages: LifecycleStage[];
  timelineStages?: TimelineStageEntry[] | null;
  activeStageId: number;
  isOrchestratingAll?: boolean;
  onSelectStage: (stageId: number) => void;
}

type PathFilter = 'all' | 'primary' | 'async';

type InspectedTarget =
  | { type: 'node'; stageId: number }
  | { type: 'edge'; edgeId: string };

const SEVERITY_COLORS: Record<
  BottleneckSeverity,
  {
    stroke: string;
    edgeStroke: string;
    headerFill: string;
    badgeBg: string;
    badgeText: string;
    label: string;
  }
> = {
  critical: {
    stroke: '#dc2626',
    edgeStroke: '#dc2626',
    headerFill: '#fef2f2',
    badgeBg: '#fee2e2',
    badgeText: '#991b1b',
    label: 'Bottleneck'
  },
  elevated: {
    stroke: '#d97706',
    edgeStroke: '#d97706',
    headerFill: '#fffbeb',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
    label: 'Watch'
  },
  optimal: {
    stroke: '#cbd5e1',
    edgeStroke: '#64748b',
    headerFill: '#f8fafc',
    badgeBg: '#ecfdf5',
    badgeText: '#065f46',
    label: 'Nominal'
  }
};

export const StageDependencyFlowDiagram: React.FC<StageDependencyFlowDiagramProps> = ({
  industryName,
  stages,
  timelineStages,
  activeStageId,
  isOrchestratingAll = false,
  onSelectStage
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [sensitivity, setSensitivity] = useState<BottleneckSensitivity>('balanced');
  const [pathFilter, setPathFilter] = useState<PathFilter>('all');
  const [inspectedTarget, setInspectedTarget] = useState<InspectedTarget>({
    type: 'node',
    stageId: activeStageId
  });

  const graph = useMemo(
    () =>
      buildStageDependencyGraph({
        stages,
        timelineStages,
        sensitivity
      }),
    [stages, timelineStages, sensitivity]
  );

  useEffect(() => {
    setInspectedTarget((prev) =>
      prev.type === 'node' ? { type: 'node', stageId: activeStageId } : prev
    );
  }, [activeStageId]);

  const visibleEdges = useMemo(() => {
    if (pathFilter === 'primary') {
      return graph.edges.filter((e) => e.channelType === 'primary-stream');
    }
    if (pathFilter === 'async') {
      return graph.edges.filter((e) => e.channelType !== 'primary-stream');
    }
    return graph.edges;
  }, [graph.edges, pathFilter]);

  const inspectedNode = useMemo(() => {
    if (inspectedTarget.type !== 'node') return null;
    return (
      graph.nodes.find((n) => n.stageId === inspectedTarget.stageId) ||
      graph.nodes.find((n) => n.stageId === activeStageId) ||
      graph.nodes[0] ||
      null
    );
  }, [inspectedTarget, graph.nodes, activeStageId]);

  const inspectedEdge = useMemo(() => {
    if (inspectedTarget.type !== 'edge') return null;
    return graph.edges.find((e) => e.id === inspectedTarget.edgeId) || null;
  }, [inspectedTarget, graph.edges]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const width = 1040;
    const height = 374;
    const cardWidth = 126;
    const cardHeight = 100;
    const nodeCenterY = 172;
    const cardTop = nodeCenterY - cardHeight / 2;
    const cardBottom = nodeCenterY + cardHeight / 2;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const xPoint = d3
      .scalePoint<number>()
      .domain([1, 2, 3, 4, 5, 6])
      .range([76, 964]);

    const edgeStrokeWidth = d3
      .scaleLinear()
      .domain([12, Math.max(60, Math.round(graph.summary.bottleneckCutoffMs * 0.35))])
      .range([1.75, 3.4])
      .clamp(true);

    // Arrowhead markers per semantic color
    const defs = svg.append('defs');
    const markers = [
      { id: 'arrow-critical', color: '#dc2626' },
      { id: 'arrow-elevated', color: '#d97706' },
      { id: 'arrow-optimal', color: '#64748b' },
      { id: 'arrow-selected', color: '#4f46e5' }
    ];
    markers.forEach((m) => {
      defs
        .append('marker')
        .attr('id', m.id)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4.5L9,0L0,4.5Z')
        .attr('fill', m.color);
    });

    // Subtle background swimlane band for the main spine
    svg
      .append('rect')
      .attr('x', 8)
      .attr('y', cardTop - 16)
      .attr('width', width - 16)
      .attr('height', cardHeight + 32)
      .attr('rx', 12)
      .attr('fill', '#f8fafc')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1);

    // Overhead & feedback zone labels
    svg
      .append('text')
      .attr('x', 16)
      .attr('y', 18)
      .attr('font-size', 10)
      .attr('font-weight', 700)
      .attr('fill', '#64748b')
      .text('PARALLEL ASYNC DATA STREAM');

    svg
      .append('text')
      .attr('x', 16)
      .attr('y', 362)
      .attr('font-size', 10)
      .attr('font-weight', 700)
      .attr('fill', '#64748b')
      .text('CLOSED-LOOP & CONTINGENCY FEEDBACK CHANNELS');

    const computeEdgePath = (edge: StageFlowEdge): {
      d: string;
      labelX: number;
      labelY: number;
    } => {
      const sx = xPoint(edge.sourceStageId) ?? 76;
      const tx = xPoint(edge.targetStageId) ?? 254;

      if (edge.channelType === 'primary-stream') {
        const startX = sx + cardWidth / 2;
        const endX = tx - cardWidth / 2 - 3;
        return {
          d: `M ${startX} ${nodeCenterY} L ${endX} ${nodeCenterY}`,
          labelX: (startX + endX) / 2,
          labelY: nodeCenterY - 16
        };
      }

      if (edge.id === 'handoff-2-5') {
        const startY = cardTop;
        const endY = cardTop - 2;
        const midX = (sx + tx) / 2;
        return {
          d: `M ${sx} ${startY} C ${sx} 42, ${tx} 42, ${tx} ${endY}`,
          labelX: midX,
          labelY: 40
        };
      }

      if (edge.id === 'handoff-4-3') {
        const startX = sx - 16;
        const endX = tx + 16;
        const startY = cardBottom;
        const endY = cardBottom + 2;
        const midX = (startX + endX) / 2;
        return {
          d: `M ${startX} ${startY} C ${startX} 272, ${endX} 272, ${endX} ${endY}`,
          labelX: midX,
          labelY: 268
        };
      }

      // Closed-loop 6 -> 1
      const startY = cardBottom;
      const endY = cardBottom + 2;
      const midX = (sx + tx) / 2;
      return {
        d: `M ${sx} ${startY} C ${sx} 336, ${tx} 336, ${tx} ${endY}`,
        labelX: midX,
        labelY: 332
      };
    };

    // Draw edges first
    const edgeLayer = svg.append('g').attr('class', 'dependency-edges-layer');

    const edgeGroups = edgeLayer
      .selectAll<SVGGElement, StageFlowEdge>('g.stage-flow-edge')
      .data(graph.edges, (d) => d.id)
      .join('g')
      .attr('class', 'stage-flow-edge')
      .attr('data-testid', (d) => `flow-edge-${d.id}`)
      .style('cursor', 'pointer')
      .attr('opacity', (d) => {
        if (pathFilter === 'all') return 1;
        if (pathFilter === 'primary') return d.channelType === 'primary-stream' ? 1 : 0.16;
        return d.channelType !== 'primary-stream' ? 1 : 0.16;
      })
      .on('click', (_event, d) => {
        setInspectedTarget({ type: 'edge', edgeId: d.id });
      });

    edgeGroups.each(function (edge) {
      const g = d3.select(this);
      const geom = computeEdgePath(edge);
      const isSelected =
        inspectedTarget.type === 'edge' && inspectedTarget.edgeId === edge.id;
      const severityMeta = SEVERITY_COLORS[edge.edgeSeverity];
      const strokeColor = isSelected ? '#4f46e5' : severityMeta.edgeStroke;
      const markerId = isSelected
        ? 'url(#arrow-selected)'
        : edge.edgeSeverity === 'critical'
          ? 'url(#arrow-critical)'
          : edge.edgeSeverity === 'elevated'
            ? 'url(#arrow-elevated)'
            : 'url(#arrow-optimal)';

      // Invisible wide hit target for comfortable clicking (stroke-only so Bezier interiors never overlap)
      g.append('path')
        .attr('d', geom.d)
        .attr('fill', 'none')
        .attr('stroke', 'transparent')
        .attr('stroke-width', 14)
        .style('pointer-events', 'stroke');

      g.append('path')
        .attr('d', geom.d)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', isSelected ? 3.5 : edgeStrokeWidth(edge.transferLatencyMs))
        .attr(
          'stroke-dasharray',
          edge.channelType === 'primary-stream' ? null : '5 4'
        )
        .attr('marker-end', markerId)
        .style('pointer-events', 'stroke');

      // Clean latency / topic tag on edge
      const labelText =
        edge.channelType === 'primary-stream'
          ? `${edge.transferLatencyMs}ms`
          : `${edge.eventTopic} · ${edge.transferLatencyMs}ms`;

      const pillWidth = edge.channelType === 'primary-stream' ? 36 : labelText.length * 5.6 + 14;
      const badgeGroup = g
        .append('g')
        .attr('class', 'edge-label-badge')
        .attr('data-testid', `flow-edge-label-${edge.id}`)
        .style('pointer-events', 'all');

      badgeGroup
        .append('rect')
        .attr('x', geom.labelX - pillWidth / 2)
        .attr('y', geom.labelY - 10)
        .attr('width', pillWidth)
        .attr('height', 18)
        .attr('rx', 5)
        .attr('fill', edge.isBottleneckEdge ? '#fef2f2' : '#ffffff')
        .attr('stroke', isSelected ? '#4f46e5' : edge.isBottleneckEdge ? '#fecaca' : '#cbd5e1')
        .attr('stroke-width', isSelected ? 1.5 : 1);

      badgeGroup
        .append('text')
        .attr('x', geom.labelX)
        .attr('y', geom.labelY + 2.5)
        .attr('text-anchor', 'middle')
        .attr('font-size', 9.5)
        .attr('font-weight', 700)
        .style('font-variant-numeric', 'tabular-nums')
        .attr('fill', isSelected ? '#4338ca' : edge.isBottleneckEdge ? '#b91c1c' : '#334155')
        .text(labelText);

      g.append('title').text(
        `${edge.eventTopic}: Stage ${edge.sourceStageId} -> Stage ${edge.targetStageId} (${edge.transferLatencyMs} ms hand-off) — ${edge.payloadSummary}`
      );
    });

    // Draw the 6 stage nodes
    const nodeLayer = svg.append('g').attr('class', 'dependency-nodes-layer');

    const nodeGroups = nodeLayer
      .selectAll<SVGGElement, StageFlowNode>('g.stage-flow-node')
      .data(graph.nodes, (d) => String(d.stageId))
      .join('g')
      .attr('class', 'stage-flow-node')
      .attr('data-testid', (d) => `flow-node-stage-${d.stageId}`)
      .attr('data-bottleneck', (d) => String(d.isBottleneck))
      .style('cursor', 'pointer')
      .attr('transform', (d) => {
        const cx = xPoint(d.stageId) ?? 76;
        return `translate(${cx - cardWidth / 2}, ${cardTop})`;
      })
      .on('click', (_event, d) => {
        setInspectedTarget({ type: 'node', stageId: d.stageId });
        onSelectStage(d.stageId);
      });

    nodeGroups.each(function (node) {
      const g = d3.select(this);
      const isSelected = node.stageId === activeStageId;
      const isExecuting = isOrchestratingAll && isSelected;
      const meta = SEVERITY_COLORS[node.bottleneckSeverity];

      // Bottleneck outer warning halo or active selection halo
      if (node.isBottleneck || isSelected) {
        g.append('rect')
          .attr('x', -4)
          .attr('y', -4)
          .attr('width', cardWidth + 8)
          .attr('height', cardHeight + 8)
          .attr('rx', 14)
          .attr('fill', 'none')
          .attr('stroke', isSelected ? '#4f46e5' : '#fecaca')
          .attr('stroke-width', isSelected ? 2 : 3);
      }

      // Main card container
      g.append('rect')
        .attr('width', cardWidth)
        .attr('height', cardHeight)
        .attr('rx', 10)
        .attr('fill', '#ffffff')
        .attr('stroke', isSelected ? '#4f46e5' : meta.stroke)
        .attr('stroke-width', node.isBottleneck || isSelected ? 2 : 1.25);

      // Card header tint strip
      g.append('rect')
        .attr('x', 1)
        .attr('y', 1)
        .attr('width', cardWidth - 2)
        .attr('height', 25)
        .attr('rx', 9)
        .attr('fill', isExecuting ? '#eef2ff' : meta.headerFill);

      // Stage index label
      g.append('text')
        .attr('x', 9)
        .attr('y', 17)
        .attr('font-size', 10)
        .attr('font-weight', 700)
        .style('font-variant-numeric', 'tabular-nums')
        .attr('fill', isSelected ? '#4338ca' : '#334155')
        .text(`S${node.stageId}`);

      // Semantic state label (text paired with color, never color alone)
      g.append('rect')
        .attr('x', cardWidth - 62)
        .attr('y', 5)
        .attr('width', 55)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', meta.badgeBg);

      g.append('text')
        .attr('x', cardWidth - 34.5)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('font-size', 8.75)
        .attr('font-weight', 700)
        .attr('fill', meta.badgeText)
        .text(meta.label);

      // Stage Title
      g.append('text')
        .attr('x', 9)
        .attr('y', 41)
        .attr('font-size', 10.75)
        .attr('font-weight', 700)
        .attr('fill', '#0f172a')
        .text(
          node.stageName.length > 16
            ? `${node.stageName.slice(0, 15).trimEnd()}…`
            : node.stageName
        );

      // Agent name subtitle
      g.append('text')
        .attr('x', 9)
        .attr('y', 54)
        .attr('font-size', 9)
        .attr('font-weight', 500)
        .attr('fill', '#64748b')
        .text(
          node.agentName.length > 19
            ? `${node.agentName.slice(0, 18).trimEnd()}…`
            : node.agentName
        );

      // Latency metric + share bar inside card
      g.append('text')
        .attr('x', 9)
        .attr('y', 75)
        .attr('font-size', 11.5)
        .attr('font-weight', 800)
        .style('font-variant-numeric', 'tabular-nums')
        .attr('fill', node.isBottleneck ? '#b91c1c' : '#0f172a')
        .text(`${node.latencyMs} ms`);

      g.append('text')
        .attr('x', cardWidth - 9)
        .attr('y', 75)
        .attr('text-anchor', 'end')
        .attr('font-size', 9)
        .attr('font-weight', 600)
        .style('font-variant-numeric', 'tabular-nums')
        .attr('fill', '#64748b')
        .text(`${node.latencySharePct}% share`);

      // Latency share bar track + fill
      const barWidth = cardWidth - 18;
      g.append('rect')
        .attr('x', 9)
        .attr('y', 83)
        .attr('width', barWidth)
        .attr('height', 6)
        .attr('rx', 3)
        .attr('fill', '#e2e8f0');

      const fillWidth = Math.max(
        6,
        Math.min(barWidth, Math.round((node.latencySharePct / 38) * barWidth))
      );
      g.append('rect')
        .attr('x', 9)
        .attr('y', 83)
        .attr('width', fillWidth)
        .attr('height', 6)
        .attr('rx', 3)
        .attr(
          'fill',
          node.isBottleneck ? '#dc2626' : node.bottleneckSeverity === 'elevated' ? '#d97706' : '#059669'
        );

      g.append('title').text(
        `Stage ${node.stageId} (${node.stageName}) — ${node.agentName}\nLatency: ${node.latencyMs} ms (${node.latencySharePct}% share)\nSuccess: ${node.successRate}% | Anomalies: ${node.anomalyCount}\n${node.bottleneckReason}`
      );
    });
  }, [graph, activeStageId, isOrchestratingAll, pathFilter, inspectedTarget, onSelectStage]);

  const edgeSourceNode = inspectedEdge
    ? graph.nodes.find((n) => n.stageId === inspectedEdge.sourceStageId)
    : null;
  const edgeTargetNode = inspectedEdge
    ? graph.nodes.find((n) => n.stageId === inspectedEdge.targetStageId)
    : null;

  const channelLabel = (channelType: HandoffChannelType): string => {
    if (channelType === 'primary-stream') return 'Primary Sequential Stream';
    if (channelType === 'parallel-feed') return 'Parallel Telemetry Feed';
    return 'Closed-Loop Feedback';
  };

  return (
    <section
      data-testid="stage-dependency-flow-section"
      aria-label="Stage Dependency Flow Diagram"
      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 scroll-mt-4"
    >
      {/* Header Row */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Stage Dependency Flow
            </h3>
            <span className="text-xs text-slate-400" aria-hidden="true">·</span>
            <span className="text-xs font-medium text-slate-600">{industryName}</span>
            <span className="text-xs text-slate-400" aria-hidden="true">·</span>
            <span
              data-testid="flow-bottleneck-summary"
              className={`text-xs font-semibold tabular-nums ${
                graph.summary.bottleneckCount > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {graph.summary.bottleneckCount > 0
                ? `${graph.summary.bottleneckCount} Bottleneck${graph.summary.bottleneckCount > 1 ? 's' : ''} (Peak: S${graph.summary.peakBottleneckStageId} ${graph.summary.peakBottleneckLatencyMs} ms)`
                : `No Critical Bottlenecks (Cutoff ≥ ${graph.summary.bottleneckCutoffMs} ms)`}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            D3 asynchronous data hand-off graph across all 6 agents highlighting queue overhead and latency bottlenecks (cutoff ≥{' '}
            <strong className="text-slate-700 tabular-nums">{graph.summary.bottleneckCutoffMs} ms</strong>
            , critical path{' '}
            <strong className="text-slate-700 tabular-nums">{graph.summary.criticalPathLatencyMs} ms</strong>).
          </p>
        </div>

        {/* Interactive Controls: Path Filter & Bottleneck Threshold Sensitivity */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="group"
            aria-label="Filter dependency flow channels"
            className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200"
          >
            {(
              [
                { id: 'all', label: 'All Handoffs' },
                { id: 'primary', label: 'Primary Spine' },
                { id: 'async', label: 'Parallel & Feedback' }
              ] as Array<{ id: PathFilter; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`flow-filter-${opt.id}`}
                onClick={() => setPathFilter(opt.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  pathFilter === opt.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Bottleneck detection threshold sensitivity"
            className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200"
          >
            <span className="px-2 text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1 whitespace-nowrap">
              <Gauge className="w-3.5 h-3.5" />
              Cutoff:
            </span>
            {(['strict', 'balanced', 'relaxed'] as BottleneckSensitivity[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                data-testid={`flow-sensitivity-${lvl}`}
                onClick={() => setSensitivity(lvl)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  sensitivity === lvl
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* D3 SVG Flow Diagram */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 overflow-x-auto">
        <svg
          ref={svgRef}
          data-testid="stage-dependency-flow-svg"
          role="img"
          aria-label={`D3 Stage Dependency Flow illustrating ${visibleEdges.length} asynchronous agent hand-offs across 6 stages for ${industryName}`}
          className="w-full h-auto min-w-[780px] block select-none"
        />
      </div>

      {/* Legend + Live Bottleneck & Hand-Off Inspector */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded border-2 border-red-600 bg-red-50" aria-hidden="true" />
            Bottleneck (≥ {graph.summary.bottleneckCutoffMs} ms)
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded border-2 border-amber-600 bg-amber-50" aria-hidden="true" />
            Watch (≥ {graph.summary.elevatedCutoffMs} ms)
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-3 h-3 rounded border border-slate-300 bg-emerald-50" aria-hidden="true" />
            Nominal
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <span className="w-5 border-t-2 border-dashed border-slate-500" aria-hidden="true" />
            Parallel / Feedback Async Channel
          </span>
        </div>
        <span className="text-slate-500 tabular-nums">
          Mean Stage Latency: <strong className="text-slate-800">{graph.summary.meanStageLatencyMs} ms</strong> · Total:{' '}
          <strong className="text-slate-800">{graph.summary.totalPipelineLatencyMs} ms</strong>
        </span>
      </div>

      {/* Interactive Inspector */}
      {inspectedEdge && edgeSourceNode && edgeTargetNode ? (
        <div
          data-testid="flow-inspector-panel"
          className="rounded-xl border border-slate-200 bg-slate-50/75 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-mono font-bold text-slate-900">
                {inspectedEdge.eventTopic}
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="font-semibold text-indigo-700">
                S{edgeSourceNode.stageId} ({edgeSourceNode.shortName}) <ArrowRight className="inline w-3 h-3" /> S{edgeTargetNode.stageId} ({edgeTargetNode.shortName})
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="text-slate-600">{channelLabel(inspectedEdge.channelType)}</span>
            </div>
            <p className="text-[11px] text-slate-600">{inspectedEdge.payloadSummary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0 tabular-nums">
            <div className="text-right">
              <span className="block text-[10px] text-slate-500">Handoff Queue</span>
              <strong className={inspectedEdge.isBottleneckEdge ? 'text-red-700' : 'text-slate-900'}>
                {inspectedEdge.transferLatencyMs} ms
              </strong>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-500">Status</span>
              <strong className={inspectedEdge.isBottleneckEdge ? 'text-red-700' : 'text-emerald-700'}>
                {inspectedEdge.isBottleneckEdge ? 'Congested Link' : 'Healthy Flow'}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setInspectedTarget({ type: 'node', stageId: edgeTargetNode.stageId });
                onSelectStage(edgeTargetNode.stageId);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold text-[11px] cursor-pointer whitespace-nowrap"
            >
              Inspect Stage {edgeTargetNode.stageId}
            </button>
          </div>
        </div>
      ) : inspectedNode ? (
        <div
          data-testid="flow-inspector-panel"
          className="rounded-xl border border-slate-200 bg-slate-50/75 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {inspectedNode.isBottleneck ? (
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              )}
              <span className="font-bold text-slate-900">
                Stage {inspectedNode.stageId}: {inspectedNode.stageName}
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="text-slate-600">{inspectedNode.agentName}</span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span
                className={
                  inspectedNode.isBottleneck
                    ? 'font-bold text-red-700'
                    : inspectedNode.bottleneckSeverity === 'elevated'
                      ? 'font-bold text-amber-700'
                      : 'font-bold text-emerald-700'
                }
              >
                {SEVERITY_COLORS[inspectedNode.bottleneckSeverity].label}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">{inspectedNode.bottleneckReason}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0 tabular-nums">
            <div className="text-right">
              <span className="block text-[10px] text-slate-500">Stage Latency</span>
              <strong className={inspectedNode.isBottleneck ? 'text-red-700' : 'text-slate-900'}>
                {inspectedNode.latencyMs} ms ({inspectedNode.latencySharePct}%)
              </strong>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-500">Upstream Wait</span>
              <strong className="text-slate-900">{inspectedNode.upstreamWaitMs} ms</strong>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-500">Success / Anomalies</span>
              <strong className="text-slate-900">
                {inspectedNode.successRate}% · {inspectedNode.anomalyCount}
              </strong>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
