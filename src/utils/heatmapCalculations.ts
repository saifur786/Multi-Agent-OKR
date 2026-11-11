/**
 * Planview Anvi - 7-Layer Resource Utilisation & Bottleneck Calculations
 * Derives resource load %, FTE allocation, capacity constraints, and bottleneck severity
 * across the 7-layer traceability hierarchy.
 */

import { TraceabilityNode } from '../types/orchestration';

export interface HeatmapNodeData {
  id: string;
  layerNum: number;
  layerName: string;
  title: string;
  owner: string;
  budget: string;
  progress: number;
  status: 'On Track' | 'At Risk' | 'Behind';
  utilisationPct: number;
  capacityFte: number;
  allocatedFte: number;
  isBottleneck: boolean;
  severity: 'critical' | 'stressed' | 'optimal' | 'under';
  bottleneckReason?: string;
  recommendedAction?: string;
  squadName: string;
  parentIds: string[];
  childIds: string[];
  isOrphan: boolean;
  x: number; // Layer 1..7
  y: number; // 1-based index within layer
}

export interface LayerUtilisationAggregate {
  layerNum: number;
  layerName: string;
  layerShort: string;
  avgUtilisation: number;
  peakUtilisation: number;
  bottleneckCount: number;
  stressedCount: number;
  totalNodes: number;
  totalAllocatedFte: number;
  totalCapacityFte: number;
  isLayerBottlenecked: boolean;
}

export const LAYER_METADATA: Record<number, { name: string; short: string; defaultFteRatio: number }> = {
  1: { name: 'Layer 1: Corporate Strategy', short: 'Strategy', defaultFteRatio: 1.0 },
  2: { name: 'Layer 2: Strategic Themes & Portfolios', short: 'Portfolios', defaultFteRatio: 1.05 },
  3: { name: 'Layer 3: Objectives & Key Results (OKRs)', short: 'OKRs', defaultFteRatio: 1.08 },
  4: { name: 'Layer 4: Strategic Initiatives & Programs', short: 'Initiatives', defaultFteRatio: 1.1 },
  5: { name: 'Layer 5: Delivery Epics & Features', short: 'Epics', defaultFteRatio: 1.15 },
  6: { name: 'Layer 6: Agile Teams & Release Trains', short: 'Teams', defaultFteRatio: 1.2 },
  7: { name: 'Layer 7: Business & Customer Outcomes', short: 'Outcomes', defaultFteRatio: 1.0 }
};

/**
 * Calculates resource utilisation for every node across the 7 layers
 */
export function calculate7LayerNodeUtilisation(
  nodesMap: Record<string, TraceabilityNode>,
  traceabilityHierarchy: Record<number, TraceabilityNode[]>
): HeatmapNodeData[] {
  const result: HeatmapNodeData[] = [];

  for (let layer = 1; layer <= 7; layer++) {
    const rawNodes = traceabilityHierarchy[layer] || [];
    const meta = LAYER_METADATA[layer] || { name: `Layer ${layer}`, short: `L${layer}`, defaultFteRatio: 1.0 };

    rawNodes.forEach((rawNode, idx) => {
      // Fetch latest live state from nodesMap if available
      const node = nodesMap[rawNode.id] || rawNode;

      let squadName = 'Strategic Leadership';
      let capacityFte = 10;
      let allocatedFte = 9.5;
      let utilisationPct = 95;
      let reason: string | undefined;
      let action: string | undefined;

      // 1. If explicit squadLoad exists (common on Layer 6)
      if (node.squadLoad) {
        squadName = node.squadLoad.squadName;
        allocatedFte = node.squadLoad.fte;
        utilisationPct = node.squadLoad.loadPct;
        capacityFte = Math.round((allocatedFte / (utilisationPct / 100)) * 10) / 10;
        if (utilisationPct >= 100) {
          reason = `${squadName} is overloaded at ${utilisationPct}% capacity due to heavy technical debt and concurrent releases.`;
          action = 'Reallocate 2.5 FTE or descope secondary backlog items to avoid burnout.';
        }
      } else {
        // 2. Derive realistic utilisation based on layer, status, orphan status, and progress
        const isOrphan = Boolean(node.isOrphan);
        const isAtRisk = node.status === 'At Risk';
        const isBehind = node.status === 'Behind';

        // Base squads per layer
        if (layer === 1) {
          squadName = 'Executive Strategy Board';
          capacityFte = 12;
          allocatedFte = isAtRisk ? 11.8 : 10.2;
          utilisationPct = Math.round((allocatedFte / capacityFte) * 100);
          if (utilisationPct >= 100) {
            reason = 'Executive governance bandwidth saturated across concurrent multi-million capex portfolios.';
            action = 'Delegate steering committee approvals to portfolio stream leads.';
          }
        } else if (layer === 2) {
          squadName = node.owner || 'Portfolio Steering Team';
          capacityFte = 16;
          // E.g., Digital Mortgage Portfolio has high stress
          if (node.id.includes('o1') || node.title.toLowerCase().includes('mortgage') || isAtRisk) {
            allocatedFte = 16.6;
            utilisationPct = 104; // Bottleneck!
            reason = 'Portfolio capital and shared architects exceeded available headcount allocation by 4%.';
            action = 'Borrow senior architects from Digital Wealth stream.';
          } else {
            allocatedFte = 12.8;
            utilisationPct = 80;
          }
        } else if (layer === 3) {
          squadName = 'Tribe Delivery Core';
          capacityFte = 18;
          // KR 1 (Mortgage speed) is at risk
          if (node.id.includes('kr1') || node.title.toLowerCase().includes('mortgage') || isAtRisk) {
            allocatedFte = 19.8;
            utilisationPct = 110; // Critical bottleneck!
            reason = 'Backend loan origination and compliance validation squads running at 110% load.';
            action = 'Inject burst contract engineers for API verification automation.';
          } else {
            allocatedFte = 14.4;
            utilisationPct = 80;
          }
        } else if (layer === 4) {
          squadName = 'Initiative Program Office';
          capacityFte = 22;
          if (node.id.includes('i1') || node.title.toLowerCase().includes('decision') || isAtRisk) {
            allocatedFte = 23.3;
            utilisationPct = 106; // Bottleneck!
            reason = 'Mainframe integration stream blocked by legacy vendor dependencies.';
            action = 'Implement virtual test harnesses to unblock downstream squads.';
          } else {
            allocatedFte = 17.6;
            utilisationPct = 80;
          }
        } else if (layer === 5) {
          squadName = node.owner || 'Feature Squad Alpha';
          capacityFte = 14;
          if (isOrphan) {
            allocatedFte = 13.7;
            utilisationPct = 98;
            reason = 'Orphan Epic consumes $1.4M budget and 13.7 FTE with zero direct OKR lineage.';
            action = 'Decommission batch pipeline or align directly under AI Decisioning Initiative.';
          } else if (node.id.includes('p1') || node.title.toLowerCase().includes('credit') || isAtRisk) {
            allocatedFte = 15.7;
            utilisationPct = 112; // Critical bottleneck!
            reason = 'Credit Engine API v3 has 6 blocked dependencies and failing regression test suites.';
            action = 'Pair senior dev-ops engineer to stabilise CI/CD deploy pipeline.';
          } else if (node.id.includes('p4')) {
            allocatedFte = 12.5;
            utilisationPct = 89;
          } else {
            allocatedFte = 11.2;
            utilisationPct = 80;
          }
        } else if (layer === 6) {
          squadName = node.title;
          capacityFte = 20;
          allocatedFte = isAtRisk ? 21.6 : 17.6;
          utilisationPct = isAtRisk ? 108 : 88;
        } else {
          // Layer 7
          squadName = 'Outcome Operations';
          capacityFte = 15;
          if (node.status === 'At Risk' || node.title.toLowerCase().includes('mortgage')) {
            allocatedFte = 15.0;
            utilisationPct = 100; // Bottleneck at boundary!
            reason = 'Net new mortgage sales operations operating at maximum capacity limit.';
            action = 'Expand automated self-service broker onboarding pipeline.';
          } else {
            allocatedFte = 11.4;
            utilisationPct = 76;
          }
        }
      }

      // If status is behind or at risk without override, ensure realistic floor
      if (node.status === 'Behind' && utilisationPct < 100) {
        utilisationPct = 105;
        allocatedFte = Math.round(capacityFte * 1.05 * 10) / 10;
        reason = reason || 'Delivery throughput severely constrained by missing staff and blocking dependencies.';
        action = action || 'Escalate capacity gap to Program Steering Committee.';
      }

      const isBottleneck = utilisationPct >= 100;
      let severity: 'critical' | 'stressed' | 'optimal' | 'under';
      if (utilisationPct >= 100) {
        severity = 'critical';
      } else if (utilisationPct >= 85) {
        severity = 'stressed';
      } else if (utilisationPct >= 70) {
        severity = 'optimal';
      } else {
        severity = 'under';
      }

      result.push({
        id: node.id,
        layerNum: layer,
        layerName: meta.name,
        title: node.title,
        owner: node.owner,
        budget: node.budget,
        progress: node.progress,
        status: node.status,
        utilisationPct,
        capacityFte: Math.round(capacityFte * 10) / 10,
        allocatedFte: Math.round(allocatedFte * 10) / 10,
        isBottleneck,
        severity,
        bottleneckReason: reason,
        recommendedAction: action,
        squadName,
        parentIds: node.parentIds || [],
        childIds: node.childIds || [],
        isOrphan: Boolean(node.isOrphan),
        x: layer,
        y: idx + 1
      });
    });
  }

  return result;
}

/**
 * Aggregates utilisation by layer for Recharts Bar/Composed charts
 */
export function calculateLayerUtilisationAggregates(
  heatmapData: HeatmapNodeData[]
): LayerUtilisationAggregate[] {
  const layerMap = new Map<number, HeatmapNodeData[]>();

  for (let l = 1; l <= 7; l++) {
    layerMap.set(l, []);
  }

  heatmapData.forEach((item) => {
    const list = layerMap.get(item.layerNum) || [];
    list.push(item);
    layerMap.set(item.layerNum, list);
  });

  const aggregates: LayerUtilisationAggregate[] = [];

  for (let l = 1; l <= 7; l++) {
    const nodes = layerMap.get(l) || [];
    const meta = LAYER_METADATA[l] || { name: `Layer ${l}`, short: `L${l}` };

    if (nodes.length === 0) {
      aggregates.push({
        layerNum: l,
        layerName: meta.name,
        layerShort: meta.short,
        avgUtilisation: 0,
        peakUtilisation: 0,
        bottleneckCount: 0,
        stressedCount: 0,
        totalNodes: 0,
        totalAllocatedFte: 0,
        totalCapacityFte: 0,
        isLayerBottlenecked: false
      });
      continue;
    }

    const totalUtil = nodes.reduce((sum, n) => sum + n.utilisationPct, 0);
    const avgUtil = Math.round(totalUtil / nodes.length);
    const peakUtil = Math.max(...nodes.map((n) => n.utilisationPct));
    const bottleneckCount = nodes.filter((n) => n.isBottleneck).length;
    const stressedCount = nodes.filter((n) => n.severity === 'stressed').length;
    const totalAllocatedFte = Math.round(nodes.reduce((sum, n) => sum + n.allocatedFte, 0) * 10) / 10;
    const totalCapacityFte = Math.round(nodes.reduce((sum, n) => sum + n.capacityFte, 0) * 10) / 10;

    aggregates.push({
      layerNum: l,
      layerName: meta.name,
      layerShort: meta.short,
      avgUtilisation: avgUtil,
      peakUtilisation: peakUtil,
      bottleneckCount,
      stressedCount,
      totalNodes: nodes.length,
      totalAllocatedFte,
      totalCapacityFte,
      isLayerBottlenecked: peakUtil >= 100 || avgUtil >= 95
    });
  }

  return aggregates;
}

/**
 * Simulates an AI capacity rebalance to remediate a bottleneck
 */
export function simulateRebalanceBottleneck(
  nodesMap: Record<string, TraceabilityNode>,
  targetNodeId: string,
  fteReductionPct: number = 18
): Record<string, TraceabilityNode> {
  const updatedMap = { ...nodesMap };
  const target = updatedMap[targetNodeId];
  if (!target) return updatedMap;

  if (target.squadLoad) {
    const currentLoad = target.squadLoad.loadPct;
    const newLoad = Math.max(78, Math.round(currentLoad - fteReductionPct));
    updatedMap[targetNodeId] = {
      ...target,
      status: 'On Track',
      squadLoad: {
        ...target.squadLoad,
        loadPct: newLoad
      }
    };
  } else {
    updatedMap[targetNodeId] = {
      ...target,
      status: 'On Track',
      squadLoad: {
        squadName: target.owner || 'Remediated Squad',
        fte: 12,
        loadPct: 82
      }
    };
  }

  return updatedMap;
}

/**
 * Returns color hex code based on utilisation percentage
 */
export function getUtilisationColor(utilisationPct: number): string {
  if (utilisationPct >= 105) return '#dc2626'; // Deep Crimson (Severe Bottleneck)
  if (utilisationPct >= 100) return '#ef4444'; // Red (Bottleneck)
  if (utilisationPct >= 90) return '#f97316';  // Orange (High Stress)
  if (utilisationPct >= 80) return '#eab308';  // Amber (Moderate Stress)
  if (utilisationPct >= 70) return '#6366f1';  // Indigo (Balanced/Optimal)
  if (utilisationPct >= 50) return '#0ea5e9';  // Blue/Cyan (Healthy)
  return '#64748b';                            // Slate (Under-utilised)
}
