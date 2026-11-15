import type { IndustryDataBundle, TraceabilityNode } from '../types/orchestration';

export type NetworkNodeKind = 'layer' | 'problem' | 'timing';
export type NetworkLinkKind = 'hierarchy' | 'problem-link' | 'remediation-link';

export const SEVEN_LAYER_NAMES: Record<number, string> = {
  1: 'Corporate Strategy',
  2: 'Objectives',
  3: 'Key Results',
  4: 'Initiatives & Programs',
  5: 'Epics & Deliverables',
  6: 'Teams & Squads',
  7: 'Business Outcomes'
};

export interface TraceabilityGraphNode {
  id: string;
  label: string;
  fullTitle: string;
  kind: NetworkNodeKind;
  layer: number; // 1..7 for Planview nodes; 3.35 for Business Problems; 3.65 for Remediation Timings
  layerLabel: string;
  status: 'On Track' | 'At Risk' | 'Behind' | 'Problem' | 'Remediation';
  owner?: string;
  progress?: number;
  budget?: string;
  sourceOkrId?: string;
  detailText?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface TraceabilityGraphLink {
  id: string;
  source: string;
  target: string;
  kind: NetworkLinkKind;
}

export interface TraceabilityNetworkOptions {
  visibleLayers?: number[];
  includeProblems?: boolean;
  includeTimings?: boolean;
  focusOkrId?: string | null;
}

export interface TraceabilityNetworkResult {
  nodes: TraceabilityGraphNode[];
  links: TraceabilityGraphLink[];
  layerCounts: Record<number, number>;
  problemNodeCount: number;
  timingNodeCount: number;
}

function slugifyTiming(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'unspecified-timing';
}

export function inferNodeLayer(
  nodeId: string,
  traceability: Record<number, TraceabilityNode[]> | undefined
): number {
  for (let layer = 1; layer <= 7; layer++) {
    const list = traceability?.[layer] || [];
    if (list.some((item) => item.id === nodeId)) {
      return layer;
    }
  }

  const lower = nodeId.toLowerCase();
  if (lower.includes('theme')) return 1;
  if (/-o\d+|objective/.test(lower)) return 2;
  if (lower.includes('kr') || lower.includes('okr')) return 3;
  if (/-[i]\d+|init/.test(lower)) return 4;
  if (/-[p]\d+|epic|orphan/.test(lower)) return 5;
  if (/-[t]\d+|team|squad/.test(lower)) return 6;
  if (/out|roi|value/.test(lower)) return 7;
  return 3;
}

export function buildSevenLayerOkrNetwork(
  bundle: IndustryDataBundle,
  nodesMap: Record<string, TraceabilityNode>,
  options: TraceabilityNetworkOptions = {}
): TraceabilityNetworkResult {
  const visibleLayersSet = new Set(options.visibleLayers ?? [1, 2, 3, 4, 5, 6, 7]);
  const includeProblems = options.includeProblems ?? true;
  const includeTimings = options.includeTimings ?? true;
  const focusOkrId = options.focusOkrId ?? null;

  // Map every node ID in traceability + nodesMap to its layer
  const baseNodesById = new Map<string, { node: TraceabilityNode; layer: number }>();

  for (let layer = 1; layer <= 7; layer++) {
    const list = bundle.traceability?.[layer] || [];
    list.forEach((node) => {
      const merged = nodesMap[node.id] || node;
      baseNodesById.set(merged.id, { node: merged, layer });
    });
  }

  Object.values(nodesMap).forEach((node) => {
    if (!baseNodesById.has(node.id)) {
      const layer = inferNodeLayer(node.id, bundle.traceability);
      baseNodesById.set(node.id, { node, layer });
    }
  });

  // If focusOkrId is set, walk ancestors + descendants around focusOkrId
  let allowedNodeIds: Set<string> | null = null;
  if (focusOkrId && baseNodesById.has(focusOkrId)) {
    allowedNodeIds = new Set<string>([focusOkrId]);

    const walkParents = (id: string, depth = 0) => {
      if (depth > 8) return;
      const entry = baseNodesById.get(id);
      if (!entry) return;
      (entry.node.parentIds || []).forEach((pid) => {
        if (pid && !allowedNodeIds!.has(pid)) {
          allowedNodeIds!.add(pid);
          walkParents(pid, depth + 1);
        }
      });
    };

    const walkChildren = (id: string, depth = 0) => {
      if (depth > 8) return;
      const entry = baseNodesById.get(id);
      if (!entry) return;
      (entry.node.childIds || []).forEach((cid) => {
        if (cid && !allowedNodeIds!.has(cid)) {
          allowedNodeIds!.add(cid);
          walkChildren(cid, depth + 1);
        }
      });
    };

    walkParents(focusOkrId);
    walkChildren(focusOkrId);
  }

  const graphNodes: TraceabilityGraphNode[] = [];
  const graphNodesById = new Map<string, TraceabilityGraphNode>();
  const graphLinks: TraceabilityGraphLink[] = [];
  const linkDedupe = new Set<string>();
  const layerCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

  const addLink = (source: string, target: string, kind: NetworkLinkKind) => {
    if (!graphNodesById.has(source) || !graphNodesById.has(target)) return;
    const key = `${source}->${target}:${kind}`;
    if (linkDedupe.has(key)) return;
    linkDedupe.add(key);
    graphLinks.push({ id: key, source, target, kind });
  };

  // Add Planview 7-layer nodes
  baseNodesById.forEach(({ node, layer }) => {
    if (!visibleLayersSet.has(layer)) return;
    if (allowedNodeIds && !allowedNodeIds.has(node.id)) return;

    layerCounts[layer] = (layerCounts[layer] || 0) + 1;
    const graphNode: TraceabilityGraphNode = {
      id: node.id,
      label: node.title.length > 28 ? `${node.title.slice(0, 26)}…` : node.title,
      fullTitle: node.title,
      kind: 'layer',
      layer,
      layerLabel: `L${layer}: ${SEVEN_LAYER_NAMES[layer] || `Layer ${layer}`}`,
      status: node.status,
      owner: node.owner,
      progress: node.progress,
      budget: node.budget,
      detailText: node.kpiFormula || node.ai?.recommend
    };
    graphNodes.push(graphNode);
    graphNodesById.set(graphNode.id, graphNode);
  });

  // Add hierarchy edges between visible layer nodes
  baseNodesById.forEach(({ node }) => {
    if (!graphNodesById.has(node.id)) return;
    (node.parentIds || []).forEach((pid) => {
      if (graphNodesById.has(pid)) {
        addLink(pid, node.id, 'hierarchy');
      }
    });
    (node.childIds || []).forEach((cid) => {
      if (graphNodesById.has(cid)) {
        addLink(node.id, cid, 'hierarchy');
      }
    });
  });

  // Add Business Problem & Remediation Timing nodes linked to OKRs (Layers 2 & 3, or any node with businessProblem)
  let problemNodeCount = 0;
  let timingNodeCount = 0;

  baseNodesById.forEach(({ node, layer }) => {
    if (!graphNodesById.has(node.id)) return;
    const isProblemAnchor = layer === 3 || Boolean(node.businessProblem);
    if (!isProblemAnchor) return;

    const bp = node.businessProblem;
    const problemText =
      bp?.problemDescription?.trim() ||
      `Problem Gap: ${node.title.slice(0, 38)}`;
    const problemNodeId = `bp:${node.id}`;

    if (includeProblems && !graphNodesById.has(problemNodeId)) {
      problemNodeCount++;
      const problemNode: TraceabilityGraphNode = {
        id: problemNodeId,
        label: problemText.length > 26 ? `${problemText.slice(0, 24)}…` : problemText,
        fullTitle: `Business Problem — ${problemText}`,
        kind: 'problem',
        layer: 3.35,
        layerLabel: 'Business Problem',
        status: 'Problem',
        sourceOkrId: node.id,
        detailText: bp?.causalChainToDollarImpact || bp?.rootCause || 'Pending causal chain definition'
      };
      graphNodes.push(problemNode);
      graphNodesById.set(problemNodeId, problemNode);
      addLink(node.id, problemNodeId, 'problem-link');
    }

    if (includeTimings) {
      const timingsRaw =
        bp?.remediationTimings && bp.remediationTimings.length > 0
          ? bp.remediationTimings
          : bp?.targetRemediationTiming
            ? [bp.targetRemediationTiming]
            : node.targetDate
              ? [node.targetDate]
              : [];

      timingsRaw.forEach((timingStr) => {
        const cleaned = timingStr.trim();
        if (!cleaned) return;
        const timingId = `rt:${slugifyTiming(cleaned)}`;
        if (!graphNodesById.has(timingId)) {
          timingNodeCount++;
          const timingNode: TraceabilityGraphNode = {
            id: timingId,
            label: cleaned.length > 22 ? `${cleaned.slice(0, 20)}…` : cleaned,
            fullTitle: `Remediation Timing: ${cleaned}`,
            kind: 'timing',
            layer: 3.65,
            layerLabel: 'Remediation Timing',
            status: 'Remediation',
            sourceOkrId: node.id,
            detailText: `Scheduled remediation window for ${node.title}`
          };
          graphNodes.push(timingNode);
          graphNodesById.set(timingId, timingNode);
        }

        const anchorId = includeProblems && graphNodesById.has(problemNodeId) ? problemNodeId : node.id;
        addLink(anchorId, timingId, 'remediation-link');

        // Connect remediation timing downstream into connected initiatives (Layer 4)
        (node.childIds || []).forEach((childId) => {
          if (graphNodesById.has(childId)) {
            addLink(timingId, childId, 'remediation-link');
          }
        });
      });
    }
  });

  return {
    nodes: graphNodes,
    links: graphLinks,
    layerCounts,
    problemNodeCount,
    timingNodeCount
  };
}
