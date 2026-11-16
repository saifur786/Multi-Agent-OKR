import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Grid3X3, ArrowUpRight } from 'lucide-react';
import {
  buildAgentImpactMatrix,
  type AgentImpactMatrixCell,
  type MatrixOkrInput,
  type MatrixRunInput
} from '../utils/agentImpactMatrix';
import type { AgentAnomalyThresholdConfig } from '../utils/riskSentinelThresholds';

interface AgentImpactMatrixHeatmapProps {
  runs: MatrixRunInput[];
  okrs: MatrixOkrInput[];
  thresholdConfigs: AgentAnomalyThresholdConfig[];
  selectedStageId: number | null;
  industryName: string;
  onSelectStage: (stageId: number) => void;
}

type MatrixDisplayMode = 'correlation' | 'impactDelta';

const CORRELATION_SCALE = d3
  .scaleLinear<string>()
  .domain([-1, -0.55, 0, 0.45, 1])
  .range(['#b91c1c', '#fecaca', '#f1f5f9', '#bbf7d0', '#047857'])
  .interpolate(d3.interpolateRgb)
  .clamp(true);

function formatCorrelation(value: number): string {
  const fixed = value.toFixed(2);
  return value > 0 ? `+${fixed}` : fixed;
}

function formatImpactDelta(value: number): string {
  const fixed = value.toFixed(1);
  return value > 0 ? `+${fixed}%` : `${fixed}%`;
}

function getImpactBandLabel(band: AgentImpactMatrixCell['impactBand']): {
  label: string;
  className: string;
} {
  switch (band) {
    case 'critical-drag':
      return {
        label: 'Strong Negative Drag',
        className: 'bg-red-50 text-red-700 border-red-200'
      };
    case 'moderate-drag':
      return {
        label: 'Moderate Drag',
        className: 'bg-amber-50 text-amber-800 border-amber-200'
      };
    case 'positive-lift':
      return {
        label: 'Remediation Lift',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    default:
      return {
        label: 'Low Coupling',
        className: 'bg-slate-100 text-slate-700 border-slate-200'
      };
  }
}

export const AgentImpactMatrixHeatmap: React.FC<AgentImpactMatrixHeatmapProps> = ({
  runs,
  okrs,
  thresholdConfigs,
  selectedStageId,
  industryName,
  onSelectStage
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [displayMode, setDisplayMode] = useState<MatrixDisplayMode>('correlation');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);

  const matrix = useMemo(
    () =>
      buildAgentImpactMatrix({
        runs,
        okrs,
        thresholdConfigs
      }),
    [runs, okrs, thresholdConfigs]
  );

  // Keep inspected cell valid across industry/stage switches; default to strongest negative impact cell
  const activeCell = useMemo(() => {
    const targetId = hoveredCellId || selectedCellId;
    if (targetId) {
      const found = matrix.cells.find((c) => c.id === targetId);
      if (found) return found;
    }
    if (selectedStageId !== null) {
      const stageCells = matrix.cells.filter((c) => c.stageId === selectedStageId);
      if (stageCells.length > 0) {
        return [...stageCells].sort((a, b) => a.correlation - b.correlation)[0];
      }
    }
    return matrix.summary.strongestNegativeCell || matrix.cells[0] || null;
  }, [hoveredCellId, selectedCellId, matrix.cells, matrix.summary.strongestNegativeCell, selectedStageId]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    if (matrix.okrs.length === 0 || matrix.stages.length === 0) {
      return;
    }

    const margin = { top: 68, right: 20, bottom: 48, left: 186 };
    const colCount = matrix.okrs.length;
    const width = Math.max(760, margin.left + colCount * 145 + margin.right);
    const height = 408;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Gradient definition for legend
    const defs = svg.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', 'agent-impact-matrix-legend-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#b91c1c');
    grad.append('stop').attr('offset', '23%').attr('stop-color', '#fecaca');
    grad.append('stop').attr('offset', '50%').attr('stop-color', '#f1f5f9');
    grad.append('stop').attr('offset', '72%').attr('stop-color', '#bbf7d0');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#047857');

    const root = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand<string>()
      .domain(matrix.okrs.map((o) => o.okrId))
      .range([0, innerWidth])
      .paddingInner(0.08)
      .paddingOuter(0.03);

    const yScale = d3
      .scaleBand<string>()
      .domain(matrix.stages.map((s) => String(s.stageId)))
      .range([0, innerHeight])
      .paddingInner(0.14)
      .paddingOuter(0.04);

    // Subtle row bands + highlight for active drilldown stage
    root
      .selectAll<SVGRectElement, (typeof matrix.stages)[number]>('rect.stage-row-bg')
      .data(matrix.stages)
      .join('rect')
      .attr('class', 'stage-row-bg')
      .attr('x', -margin.left + 4)
      .attr('y', (d) => (yScale(String(d.stageId)) ?? 0) - 2)
      .attr('width', innerWidth + margin.left - 4)
      .attr('height', yScale.bandwidth() + 4)
      .attr('rx', 6)
      .attr('fill', (d) =>
        selectedStageId === d.stageId ? 'rgba(79, 70, 229, 0.08)' : 'transparent'
      )
      .attr('stroke', (d) =>
        selectedStageId === d.stageId ? 'rgba(79, 70, 229, 0.45)' : 'transparent'
      )
      .attr('stroke-width', 1);

    // X-axis OKR column headers
    const xHeaders = root
      .selectAll<SVGGElement, (typeof matrix.okrs)[number]>('g.okr-col-header')
      .data(matrix.okrs)
      .join('g')
      .attr('class', 'okr-col-header')
      .attr(
        'transform',
        (d) => `translate(${(xScale(d.okrId) ?? 0) + xScale.bandwidth() / 2}, -10)`
      );

    xHeaders
      .append('text')
      .attr('y', -36)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('font-weight', 700)
      .attr('fill', (d) =>
        d.status === 'At Risk' || d.status === 'Behind' ? '#b91c1c' : '#047857'
      )
      .text((d) => `${d.code} · ${d.attainmentPct}% (${d.status})`);

    xHeaders
      .append('text')
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('font-weight', 600)
      .attr('fill', '#0f172a')
      .text((d) => {
        const maxChars = Math.max(12, Math.floor(xScale.bandwidth() / 6.8));
        return d.title.length > maxChars ? `${d.title.slice(0, maxChars - 1).trimEnd()}…` : d.title;
      })
      .append('title')
      .text((d) => `${d.title} (${d.attainmentPct}% attainment · ${d.owner})`);

    xHeaders
      .append('text')
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9.5)
      .attr('font-weight', 500)
      .attr('fill', '#64748b')
      .text((d) => {
        const owner = d.owner.length > 22 ? `${d.owner.slice(0, 21)}…` : d.owner;
        return owner;
      });

    // Y-axis Stage row headers (clickable to toggle stage drilldown)
    const yHeaders = root
      .selectAll<SVGGElement, (typeof matrix.stages)[number]>('g.stage-row-header')
      .data(matrix.stages)
      .join('g')
      .attr('class', 'stage-row-header')
      .attr('data-stage-id', (d) => d.stageId)
      .style('cursor', 'pointer')
      .attr(
        'transform',
        (d) => `translate(-12, ${(yScale(String(d.stageId)) ?? 0) + yScale.bandwidth() / 2})`
      )
      .on('click', (_event, d) => {
        onSelectStage(d.stageId);
      });

    yHeaders
      .append('text')
      .attr('y', -3)
      .attr('text-anchor', 'end')
      .attr('font-size', 11)
      .attr('font-weight', 700)
      .attr('fill', (d) => (selectedStageId === d.stageId ? '#4338ca' : '#0f172a'))
      .text((d) => `S${d.stageId} · ${d.shortName}`);

    yHeaders
      .append('text')
      .attr('y', 11)
      .attr('text-anchor', 'end')
      .attr('font-size', 9.5)
      .attr('font-weight', 500)
      .attr('fill', (d) => (d.spikeCount > 0 ? '#b91c1c' : '#64748b'))
      .text((d) => `${d.totalAnomalies} triggers · ${d.spikeCount} spike${d.spikeCount === 1 ? '' : 's'}`);

    // Heatmap grid cells
    const cellWidth = xScale.bandwidth();
    const cellHeight = yScale.bandwidth();

    const cellGroups = root
      .selectAll<SVGGElement, AgentImpactMatrixCell>('g.impact-matrix-cell')
      .data(matrix.cells, (d) => d.id)
      .join('g')
      .attr('class', 'impact-matrix-cell')
      .attr('data-testid', (d) => d.id)
      .attr('data-stage-id', (d) => String(d.stageId))
      .attr('data-okr-id', (d) => d.okrId)
      .attr('data-correlation', (d) => String(d.correlation))
      .style('cursor', 'pointer')
      .attr(
        'transform',
        (d) => `translate(${xScale(d.okrId) ?? 0}, ${yScale(String(d.stageId)) ?? 0})`
      )
      .on('mouseenter', (_event, d) => {
        setHoveredCellId(d.id);
      })
      .on('mouseleave', () => {
        setHoveredCellId(null);
      })
      .on('click', (_event, d) => {
        setSelectedCellId(d.id);
      });

    cellGroups
      .append('rect')
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('rx', 6)
      .attr('fill', (d) => CORRELATION_SCALE(d.correlation))
      .attr('opacity', (d) =>
        selectedStageId !== null && selectedStageId !== d.stageId ? 0.62 : 1
      )
      .attr('stroke', (d) => {
        if (activeCell?.id === d.id) return '#1e1b4b';
        if (d.impactBand === 'critical-drag') return '#991b1b';
        return 'rgba(15, 23, 42, 0.08)';
      })
      .attr('stroke-width', (d) => (activeCell?.id === d.id ? 2.25 : 1));

    const getCellTextColor = (d: AgentImpactMatrixCell) =>
      d.correlation <= -0.76 || d.correlation >= 0.76 ? '#ffffff' : '#0f172a';

    const getCellSubTextColor = (d: AgentImpactMatrixCell) =>
      d.correlation <= -0.76 || d.correlation >= 0.76
        ? 'rgba(255,255,255,0.92)'
        : '#334155';

    // Primary metric value inside cell
    cellGroups
      .append('text')
      .attr('x', cellWidth / 2)
      .attr('y', cellHeight / 2 - 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .style('font-variant-numeric', 'tabular-nums')
      .attr('fill', getCellTextColor)
      .text((d) =>
        displayMode === 'correlation'
          ? `r = ${formatCorrelation(d.correlation)}`
          : formatImpactDelta(d.impactDeltaPct)
      );

    // Secondary metric subline inside cell
    cellGroups
      .append('text')
      .attr('x', cellWidth / 2)
      .attr('y', cellHeight / 2 + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9.5)
      .attr('font-weight', 500)
      .style('font-variant-numeric', 'tabular-nums')
      .attr('fill', getCellSubTextColor)
      .text((d) =>
        displayMode === 'correlation'
          ? `${formatImpactDelta(d.impactDeltaPct)} est.`
          : `r = ${formatCorrelation(d.correlation)}`
      );

    cellGroups
      .append('title')
      .text(
        (d) =>
          `Stage ${d.stageId} (${d.stageName}) × ${d.okrCode}: Pearson r=${formatCorrelation(
            d.correlation
          )}, Est. Attainment Δ ${formatImpactDelta(d.impactDeltaPct)}, ${d.anomalyCount} triggers (${
            d.spikeCount
          } spikes)`
      );

    // D3 continuous diverging color scale legend along bottom of chart
    const legendWidth = Math.min(260, innerWidth);
    const legendGroup = svg
      .append('g')
      .attr('class', 'matrix-legend')
      .attr('transform', `translate(${margin.left}, ${height - 30})`);

    legendGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 10)
      .attr('font-size', 10)
      .attr('font-weight', 600)
      .attr('fill', '#475569')
      .text('Correlation (r):');

    const barX = 88;
    legendGroup
      .append('rect')
      .attr('x', barX)
      .attr('y', 2)
      .attr('width', legendWidth)
      .attr('height', 10)
      .attr('rx', 5)
      .attr('fill', 'url(#agent-impact-matrix-legend-grad)')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 0.75);

    const legendLabels = [
      { x: barX, anchor: 'start', text: '-1.0 Drag', color: '#b91c1c' },
      { x: barX + legendWidth / 2, anchor: 'middle', text: '0.0 Neutral', color: '#475569' },
      { x: barX + legendWidth, anchor: 'end', text: '+1.0 Lift', color: '#047857' }
    ];

    legendLabels.forEach((lbl) => {
      legendGroup
        .append('text')
        .attr('x', lbl.x)
        .attr('y', 21)
        .attr('text-anchor', lbl.anchor)
        .attr('font-size', 9.5)
        .attr('font-weight', 600)
        .attr('fill', lbl.color)
        .text(lbl.text);
    });
  }, [matrix, displayMode, selectedStageId, activeCell?.id, onSelectStage]);

  const strongestDrag = matrix.summary.strongestNegativeCell;

  return (
    <div
      data-testid="agent-impact-matrix"
      className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
              <Grid3X3 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              Agent Impact Matrix
            </span>
            <span className="text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-600">{industryName}</span>
            {strongestDrag && (
              <>
                <span className="text-slate-400" aria-hidden="true">
                  ·
                </span>
                <span
                  data-testid="matrix-peak-drag-summary"
                  className="font-semibold text-red-700 tabular-nums"
                >
                  Peak Drag: S{strongestDrag.stageId} × {strongestDrag.okrCode} (r ={' '}
                  {formatCorrelation(strongestDrag.correlation)})
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            D3 correlation heatmap linking stage-specific anomaly triggers over the last {runs.length} runs to Key Result attainment outcomes. Click any cell to inspect or any stage label to filter.
          </p>
        </div>

        {/* Interactive Display Mode Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0 self-start lg:self-auto">
          <button
            type="button"
            data-testid="matrix-mode-correlation"
            onClick={() => setDisplayMode('correlation')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              displayMode === 'correlation'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Correlation (r)
          </button>
          <button
            type="button"
            data-testid="matrix-mode-delta"
            onClick={() => setDisplayMode('impactDelta')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              displayMode === 'impactDelta'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attainment Δ (%)
          </button>
        </div>
      </div>

      {matrix.okrs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
          No Key Results or Objectives are currently defined for {industryName}. Add an OKR in OKR &amp; Program Studio to compute stage anomaly correlations.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-3 overflow-x-auto">
            <svg
              ref={svgRef}
              data-testid="agent-impact-matrix-svg"
              role="img"
              aria-label={`Agent Impact Matrix D3 heatmap correlating 6 pipeline stage anomaly triggers with ${matrix.okrs.length} OKR attainment outcomes for ${industryName}`}
              className="w-full h-auto min-w-[680px] block select-none"
            />
          </div>

          {activeCell && (
            <div
              data-testid="agent-impact-cell-inspector"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5 text-xs"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-slate-900 whitespace-nowrap shrink-0">
                    Stage {activeCell.stageId}: {activeCell.stageName}
                  </span>
                  <span className="text-slate-400 shrink-0" aria-hidden="true">
                    ·
                  </span>
                  <span
                    className="font-semibold text-indigo-700 truncate min-w-0"
                    title={`${activeCell.okrCode}: ${activeCell.okrTitle}`}
                  >
                    {activeCell.okrCode}: {activeCell.okrTitle}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0 ${
                      getImpactBandLabel(activeCell.impactBand).className
                    }`}
                  >
                    {getImpactBandLabel(activeCell.impactBand).label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {activeCell.rationale}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0 tabular-nums">
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500">Pearson r</span>
                  <span
                    data-testid="inspector-correlation-value"
                    className={`text-xs font-bold ${
                      activeCell.correlation <= -0.2
                        ? 'text-red-700'
                        : activeCell.correlation >= 0.25
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                    }`}
                  >
                    {formatCorrelation(activeCell.correlation)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500">Est. Attainment Δ</span>
                  <span className="text-xs font-bold text-slate-900">
                    {formatImpactDelta(activeCell.impactDeltaPct)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500">Triggers / Spikes</span>
                  <span className="text-xs font-bold text-slate-900">
                    {activeCell.anomalyCount} / {activeCell.spikeCount}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-slate-500">KR Attainment</span>
                  <span className="text-xs font-bold text-slate-900">
                    {activeCell.attainmentPct}%
                  </span>
                </div>
                <button
                  type="button"
                  data-testid="inspector-focus-stage-btn"
                  onClick={() => onSelectStage(activeCell.stageId)}
                  className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {selectedStageId === activeCell.stageId
                    ? `Clear Stage ${activeCell.stageId} Filter`
                    : `Drill Into Stage ${activeCell.stageId}`}
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
