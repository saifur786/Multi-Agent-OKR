import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  AlertTriangle,
  Clock,
  Crosshair,
  Layers,
  Network,
  RotateCcw,
  Sliders
} from 'lucide-react';
import type { IndustryDataBundle, TraceabilityNode } from '../types/orchestration';
import {
  buildSevenLayerOkrNetwork,
  SEVEN_LAYER_NAMES,
  type TraceabilityGraphLink,
  type TraceabilityGraphNode
} from '../utils/traceabilityNetwork';

interface SevenLayerTraceabilityGraphProps {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  selectedOkrId: string | null;
  onSelectOkr: (okrId: string) => void;
  onJumpToStudioOkr?: (okrId: string) => void;
}

const LAYER_COLORS: Record<number, string> = {
  1: '#312e81', // Corporate Strategy
  2: '#4f46e5', // Objectives
  3: '#0284c7', // Key Results
  4: '#0d9488', // Initiatives
  5: '#059669', // Epics
  6: '#475569', // Teams & Squads
  7: '#15803d'  // Business Outcomes
};

export const SevenLayerTraceabilityGraph: React.FC<SevenLayerTraceabilityGraphProps> = ({
  industry,
  nodesMap,
  selectedOkrId,
  onSelectOkr,
  onJumpToStudioOkr
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [includeProblems, setIncludeProblems] = useState<boolean>(true);
  const [includeTimings, setIncludeTimings] = useState<boolean>(true);
  const [focusActiveOkrOnly, setFocusActiveOkrOnly] = useState<boolean>(false);
  const [visibleLayers, setVisibleLayers] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [inspectedNode, setInspectedNode] = useState<TraceabilityGraphNode | null>(null);

  const network = useMemo(
    () =>
      buildSevenLayerOkrNetwork(industry, nodesMap, {
        visibleLayers,
        includeProblems,
        includeTimings,
        focusOkrId: focusActiveOkrOnly ? selectedOkrId : null
      }),
    [industry, nodesMap, visibleLayers, includeProblems, includeTimings, focusActiveOkrOnly, selectedOkrId]
  );

  const toggleLayer = (layer: number) => {
    setVisibleLayers((prev) => {
      if (prev.includes(layer)) {
        return prev.length > 1 ? prev.filter((l) => l !== layer) : prev;
      }
      return [...prev, layer].sort((a, b) => a - b);
    });
  };

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = 1160;
    const height = 620;
    const marginX = 88;
    const usableWidth = width - marginX * 2;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const rootLayer = svg.append('g').attr('class', 'network-root');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 2.4])
      .on('zoom', (event) => {
        rootLayer.attr('transform', event.transform.toString());
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    const getLayerX = (layer: number): number => {
      const clamped = Math.max(1, Math.min(7, layer));
      return marginX + ((clamped - 1) / 6) * usableWidth;
    };

    // Draw 7-layer vertical guide columns
    const guidesGroup = rootLayer.append('g').attr('class', 'layer-guides');
    [1, 2, 3, 4, 5, 6, 7].forEach((layer) => {
      const lx = getLayerX(layer);
      guidesGroup
        .append('line')
        .attr('x1', lx)
        .attr('y1', 40)
        .attr('x2', lx)
        .attr('y2', height - 22)
        .attr('stroke', visibleLayers.includes(layer) ? '#e2e8f0' : '#f1f5f9')
        .attr('stroke-dasharray', '4 4');

      guidesGroup
        .append('text')
        .attr('x', lx)
        .attr('y', 24)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('font-weight', 700)
        .attr('fill', visibleLayers.includes(layer) ? '#334155' : '#94a3b8')
        .text(`L${layer} · ${SEVEN_LAYER_NAMES[layer].split(' ')[0]}`);
    });

    if (network.nodes.length === 0) return;

    // Group nodes by rounded layer lane so initial y-coordinates distribute evenly top-to-bottom
    const laneBuckets = new Map<string, number>();
    const laneCounts = new Map<string, number>();
    network.nodes.forEach((node) => {
      const laneKey = String(Math.round(node.layer * 10));
      laneCounts.set(laneKey, (laneCounts.get(laneKey) || 0) + 1);
    });

    const simNodes: TraceabilityGraphNode[] = network.nodes.map((node) => {
      const laneKey = String(Math.round(node.layer * 10));
      const idxInLane = laneBuckets.get(laneKey) || 0;
      laneBuckets.set(laneKey, idxInLane + 1);
      const totalInLane = laneCounts.get(laneKey) || 1;
      const spacing = (height - 130) / Math.max(1, totalInLane);
      const initY = 72 + spacing * (idxInLane + 0.5);

      return {
        ...node,
        x: getLayerX(node.layer),
        y: initY
      };
    });

    const simLinks: Array<TraceabilityGraphLink & { source: any; target: any }> = network.links.map((link) => ({
      ...link
    }));

    // Define arrow markers
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'net-arrow-hierarchy')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 16)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#94a3b8');

    const linkSelection = rootLayer
      .append('g')
      .attr('class', 'network-links')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => {
        if (d.kind === 'problem-link') return '#d97706';
        if (d.kind === 'remediation-link') return '#7c3aed';
        return '#cbd5e1';
      })
      .attr('stroke-width', (d) => (d.kind === 'hierarchy' ? 1.5 : 1.75))
      .attr('stroke-dasharray', (d) => (d.kind === 'remediation-link' ? '5 3' : null))
      .attr('stroke-opacity', 0.8)
      .attr('marker-end', 'url(#net-arrow-hierarchy)');

    const nodeGroup = rootLayer
      .append('g')
      .attr('class', 'network-nodes')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .attr('data-network-node', (d) => d.id)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        setInspectedNode(d);
        if (d.kind === 'layer' && (d.layer === 2 || d.layer === 3 || d.id.includes('kr') || d.id.includes('-o'))) {
          onSelectOkr(d.id);
        } else if (d.sourceOkrId) {
          onSelectOkr(d.sourceOkrId);
        }
      });

    // Node geometry: circle for Layer nodes, diamond/rounded-rect for Problem & Timing
    nodeGroup.each(function (d) {
      const g = d3.select(this);
      const isSelected = d.id === selectedOkrId || d.sourceOkrId === selectedOkrId;

      if (d.kind === 'problem') {
        g.append('rect')
          .attr('x', -10)
          .attr('y', -10)
          .attr('width', 20)
          .attr('height', 20)
          .attr('rx', 5)
          .attr('transform', 'rotate(45)')
          .attr('fill', '#fef3c7')
          .attr('stroke', isSelected ? '#b45309' : '#d97706')
          .attr('stroke-width', isSelected ? 2.5 : 1.8);
      } else if (d.kind === 'timing') {
        g.append('rect')
          .attr('x', -14)
          .attr('y', -10)
          .attr('width', 28)
          .attr('height', 20)
          .attr('rx', 6)
          .attr('fill', '#ede9fe')
          .attr('stroke', isSelected ? '#5b21b6' : '#7c3aed')
          .attr('stroke-width', isSelected ? 2.5 : 1.8);
      } else {
        const radius = isSelected ? 14 : d.layer === 3 ? 11 : 10;
        const fill =
          d.status === 'Behind'
            ? '#dc2626'
            : d.status === 'At Risk'
            ? '#d97706'
            : LAYER_COLORS[d.layer] || '#4f46e5';

        g.append('circle')
          .attr('r', radius)
          .attr('fill', fill)
          .attr('stroke', isSelected ? '#0f172a' : '#ffffff')
          .attr('stroke-width', isSelected ? 2.5 : 2);
      }
    });

    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.kind === 'layer' ? -16 : -17))
      .attr('font-size', 9.5)
      .attr('font-weight', (d) => (d.id === selectedOkrId ? 700 : 600))
      .attr('fill', '#0f172a')
      .style('paint-order', 'stroke')
      .style('stroke', '#f8fafc')
      .style('stroke-width', '3.5px')
      .style('stroke-linejoin', 'round')
      .text((d) => (d.label.length > 22 ? `${d.label.slice(0, 20)}…` : d.label));

    const simulation = d3
      .forceSimulation(simNodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(simLinks as any)
          .id((d: any) => d.id)
          .distance((d: any) => (d.kind === 'hierarchy' ? 96 : 74))
          .strength(0.28)
      )
      .force('charge', d3.forceManyBody().strength(-240))
      .force('x', d3.forceX((d: any) => getLayerX(d.layer)).strength(0.85))
      .force('y', d3.forceY(height / 2 + 10).strength(0.05))
      .force('collision', d3.forceCollide().radius(36));

    const dragBehavior = d3
      .drag<SVGGElement, TraceabilityGraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(dragBehavior as any);

    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => {
        const clampedX = Math.max(46, Math.min(width - 46, d.x ?? width / 2));
        const clampedY = Math.max(52, Math.min(height - 28, d.y ?? height / 2));
        d.x = clampedX;
        d.y = clampedY;
        return `translate(${clampedX}, ${clampedY})`;
      });
    });

    // Run initial settling ticks synchronously so initial render is readable right away
    simulation.tick(55);
    linkSelection
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);
    nodeGroup.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);

    return () => {
      simulation.stop();
    };
  }, [network, visibleLayers, selectedOkrId, onSelectOkr]);

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  return (
    <div
      data-testid="seven-layer-traceability-graph"
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
    >
      {/* Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-4.5 h-4.5 text-indigo-600 shrink-0" />
            <h3 className="text-base font-bold text-slate-900">
              7-Layer Traceability, Business Problem &amp; Remediation Network
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
            {network.nodes.length} nodes · {network.links.length} dependency edges across Layers 1–7,{' '}
            {network.problemNodeCount} business problems, and {network.timingNodeCount} remediation timings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            data-testid="toggle-problem-nodes-btn"
            onClick={() => setIncludeProblems((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-colors ${
              includeProblems
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Business Problems ({network.problemNodeCount})</span>
          </button>

          <button
            type="button"
            data-testid="toggle-timing-nodes-btn"
            onClick={() => setIncludeTimings((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-colors ${
              includeTimings
                ? 'bg-violet-50 text-violet-800 border-violet-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Remediation Timings ({network.timingNodeCount})</span>
          </button>

          <button
            type="button"
            data-testid="toggle-focus-okr-btn"
            onClick={() => setFocusActiveOkrOnly((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold cursor-pointer transition-colors ${
              focusActiveOkrOnly
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{focusActiveOkrOnly ? 'Focused on Active OKR' : 'All 7 Layers'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* 7-Layer Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 inline-flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5" />
            Layers:
          </span>
          {[1, 2, 3, 4, 5, 6, 7].map((layer) => {
            const active = visibleLayers.includes(layer);
            return (
              <button
                key={layer}
                type="button"
                data-layer-filter={layer}
                onClick={() => toggleLayer(layer)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer tabular-nums transition-colors ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                L{layer} · {SEVEN_LAYER_NAMES[layer]} ({network.layerCounts[layer] || 0})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
            Planview L1–L7 Node
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-amber-400 border border-amber-700 inline-block" />
            Business Problem
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-2 rounded-xs bg-violet-200 border border-violet-700 inline-block" />
            Remediation Timing
          </span>
        </div>
      </div>

      {/* Canvas + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-9 rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
          <svg
            ref={svgRef}
            viewBox="0 0 1160 620"
            className="w-full h-[560px] block select-none"
            aria-label="7-Layer OKR, Business Problem and Remediation Timing Force-Directed Graph"
          />
        </div>

        <aside className="lg:col-span-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-900">Node Inspector</span>
            <span className="text-[11px] text-slate-500">Click or drag nodes</span>
          </div>

          {inspectedNode ? (
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-indigo-700 block">
                  {inspectedNode.layerLabel}
                </span>
                <h4 className="font-bold text-slate-900 mt-0.5 leading-snug">
                  {inspectedNode.fullTitle}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums">
                <div>
                  <span className="text-slate-500 block">Status</span>
                  <span className="font-semibold text-slate-800">{inspectedNode.status}</span>
                </div>
                {typeof inspectedNode.progress === 'number' && (
                  <div>
                    <span className="text-slate-500 block">Progress</span>
                    <span className="font-semibold text-slate-800">{inspectedNode.progress}%</span>
                  </div>
                )}
              </div>

              {inspectedNode.owner && (
                <div className="text-[11px]">
                  <span className="text-slate-500 block">Owner</span>
                  <span className="font-semibold text-slate-800">{inspectedNode.owner}</span>
                </div>
              )}

              {inspectedNode.detailText && (
                <div className="text-[11px]">
                  <span className="text-slate-500 block">Traceability &amp; Causal Context</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{inspectedNode.detailText}</p>
                </div>
              )}

              {(inspectedNode.sourceOkrId ||
                inspectedNode.kind === 'layer' &&
                  (inspectedNode.layer === 2 || inspectedNode.layer === 3)) &&
                onJumpToStudioOkr && (
                  <button
                    type="button"
                    onClick={() =>
                      onJumpToStudioOkr(inspectedNode.sourceOkrId || inspectedNode.id)
                    }
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Edit Linked OKR in Studio</span>
                  </button>
                )}
            </div>
          ) : (
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                Select any node in the 7-layer force network to inspect its upstream Strategic Themes, downstream Epics/Teams, and linked Business Problem or Remediation Timing milestones.
              </p>
              <p className="text-[11px] text-slate-500">
                Scroll to zoom, drag background to pan, or drag individual nodes to inspect overlapping dependencies.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
