import React, { useState } from 'react';
import {
  Layers,
  Users,
  DollarSign,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Cpu,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { IndustryDataBundle, TraceabilityNode } from '../types/orchestration';
import { StatusBadge } from './StatusBadge';
import { computeLineage, remediateOrphanNode } from '../utils/algorithms';
import { eventBus } from '../utils/eventBus';

interface TraceabilityViewProps {
  industry: IndustryDataBundle;
  nodesMap: Record<string, TraceabilityNode>;
  onUpdateNodesMap: (updated: Record<string, TraceabilityNode>) => void;
  selectedNodeId: string;
  onSelectNodeId: (id: string) => void;
}

const LAYER_NAMES: Record<number, string> = {
  1: '1. Corporate Strategy',
  2: '2. Objectives',
  3: '3. Key Results',
  4: '4. Initiatives',
  5: '5. Projects & Epics',
  6: '6. Team & Resources',
  7: '7. Business Outcomes'
};

const AI_PILLAR_META = [
  { key: 'analyse' as const, label: 'Analyse', icon: BarChart3, color: 'text-blue-600 bg-blue-50/70 border-blue-200' },
  { key: 'predict' as const, label: 'Predict', icon: TrendingUp, color: 'text-purple-600 bg-purple-50/70 border-purple-200' },
  { key: 'recommend' as const, label: 'Recommend', icon: Lightbulb, color: 'text-amber-600 bg-amber-50/70 border-amber-200' },
  { key: 'automate' as const, label: 'Automate', icon: Cpu, color: 'text-emerald-600 bg-emerald-50/70 border-emerald-200' },
  { key: 'optimise' as const, label: 'Optimise', icon: Sliders, color: 'text-indigo-600 bg-indigo-50/70 border-indigo-200' }
];

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({
  industry,
  nodesMap,
  onUpdateNodesMap,
  selectedNodeId,
  onSelectNodeId
}) => {
  const [filterLayer, setFilterLayer] = useState<number | 'ALL'>('ALL');

  const { upstream, downstream, allHighlighted } = computeLineage(selectedNodeId, nodesMap);
  const selectedNode = nodesMap[selectedNodeId] || Object.values(nodesMap)[0];

  const handleRemediate = (orphanId: string) => {
    // Connect to first Initiative in Layer 4
    const firstLayer4Node = Object.values(nodesMap).find(n => n.id.includes('-i')) || Object.values(nodesMap)[0];
    const updated = remediateOrphanNode(nodesMap, orphanId, firstLayer4Node.id);
    onUpdateNodesMap(updated);

    eventBus.publish({
      topic: 'INTERVENTION_APPLIED',
      sourceAgent: 'Alignment & Capacity Agent',
      targetAgent: 'Supervisor Agent',
      summary: `Remediated orphan node ${orphanId} -> linked to initiative ${firstLayer4Node.title}`,
      payload: { orphanId, targetParent: firstLayer4Node.id },
      latencyMs: 18,
      severity: 'success'
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Columns: 7-Layer Lineage Explorer */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                7-Layer Planview Traceability Graph
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any node to highlight upstream strategic drivers and downstream delivery outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              {allHighlighted.size} Connected Nodes Highlighted
            </span>
          </div>
        </div>

        {/* Quick Layer Filter Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2">
          <button
            onClick={() => setFilterLayer('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterLayer === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 7 Layers
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map((layerIdx) => (
            <button
              key={layerIdx}
              onClick={() => setFilterLayer(layerIdx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterLayer === layerIdx
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              L{layerIdx}: {LAYER_NAMES[layerIdx].split('. ')[1]}
            </button>
          ))}
        </div>

        {/* 7 Layers Stack */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((layerIdx) => {
            if (filterLayer !== 'ALL' && filterLayer !== layerIdx) return null;

            // Get nodes belonging to this layer
            const layerNodes = (industry.traceability[layerIdx] || []).map(
              (n) => nodesMap[n.id] || n
            );

            return (
              <div key={layerIdx} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{LAYER_NAMES[layerIdx]}</span>
                  <span className="font-normal lowercase">{layerNodes.length} elements</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {layerNodes.map((node) => {
                    const isSelected = node.id === selectedNodeId;
                    const isHighlighted = allHighlighted.has(node.id);
                    const isUpstream = upstream.has(node.id);
                    const isDownstream = downstream.has(node.id);

                    return (
                      <button
                        key={node.id}
                        onClick={() => onSelectNodeId(node.id)}
                        aria-label={`Select node ${node.title}`}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400 z-10'
                            : isHighlighted
                            ? 'bg-indigo-50/90 border-indigo-300 text-slate-900 shadow-2xs ring-1 ring-indigo-200'
                            : 'bg-slate-50/60 border-slate-200 text-slate-500 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {/* Upstream/Downstream marker tag */}
                        {isUpstream && !isSelected && (
                          <span className="absolute -top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-900">
                            Upstream Driver
                          </span>
                        )}
                        {isDownstream && !isSelected && (
                          <span className="absolute -top-2 right-2 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                            Downstream Impact
                          </span>
                        )}

                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold leading-snug line-clamp-2">{node.title}</p>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : node.status === 'On Track'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {node.progress}%
                          </span>
                        </div>

                        {/* Owner & Budget / Squad load */}
                        <div
                          className={`mt-2 flex items-center justify-between text-[11px] ${
                            isSelected ? 'text-indigo-100' : 'text-slate-500'
                          }`}
                        >
                          <span className="truncate">{node.owner}</span>
                          <span className="font-semibold shrink-0">{node.budget}</span>
                        </div>

                        {/* Squad load tag if Layer 6 */}
                        {node.squadLoad && (
                          <div className="mt-1.5 pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px]">
                            <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>
                              {node.squadLoad.squadName}
                            </span>
                            <span
                              className={`font-bold px-1 rounded ${
                                node.squadLoad.loadPct > 100
                                  ? 'bg-rose-100 text-rose-800'
                                  : isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {node.squadLoad.loadPct}% Load
                            </span>
                          </div>
                        )}

                        {/* Orphan Epic warning */}
                        {node.isOrphan && (
                          <div className="mt-1.5 p-1 bg-amber-100 text-amber-900 rounded text-[10px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                            <span>Orphan Epic (0 OKR link)</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Layer Inspector & 5 Agentic AI Actions */}
      <div className="space-y-5">
        {selectedNode && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs sticky top-28 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Planview Node Inspector
              </span>
              <StatusBadge status={selectedNode.status} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 leading-snug">{selectedNode.title}</h3>

            <div className="flex items-center gap-4 text-xs text-slate-500 pb-3 border-b border-slate-100">
              <span className="flex items-center gap-1 truncate">
                <Users className="w-3.5 h-3.5 text-slate-400" /> {selectedNode.owner}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> {selectedNode.budget}
              </span>
            </div>

            {/* Progress / Attainment Bar */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Attainment Progress</span>
                <span className="text-slate-900 font-bold">{selectedNode.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    selectedNode.status === 'On Track' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${selectedNode.progress}%` }}
                />
              </div>
            </div>

            {/* Orphan Action Banner */}
            {selectedNode.isOrphan && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Orphan Epic Detected</span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  This Epic consumes {selectedNode.budget} but lacks linkage to any Strategic Objective or Key Result.
                </p>
                <button
                  onClick={() => handleRemediate(selectedNode.id)}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  Auto-Remediate &amp; Connect to Strategic Initiative
                </button>
              </div>
            )}

            {/* Squad Load Alert */}
            {selectedNode.squadLoad && selectedNode.squadLoad.loadPct > 100 && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-1">
                <p className="text-rose-900 font-bold flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Capacity Overload: {selectedNode.squadLoad.loadPct}% Load
                </p>
                <p className="text-rose-800 text-[11px]">
                  {selectedNode.squadLoad.squadName} is {selectedNode.squadLoad.loadPct - 100}% over sustainable capacity.
                </p>
              </div>
            )}

            {/* 5 Agentic AI Actions for Selected Node */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Anvi Agentic AI Analysis
              </h4>
              {AI_PILLAR_META.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.key} className={`p-3 rounded-xl border ${pillar.color} space-y-0.5`}>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                      <Icon className="w-3.5 h-3.5" />
                      {pillar.label}
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">
                      {selectedNode.ai[pillar.key]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
