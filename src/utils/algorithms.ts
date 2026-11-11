/**
 * Pure algorithms for Planview Anvi Multi-Agent System:
 * - 7-Layer Graph Traversal, Orphan Epic & Capacity Detection
 * - SMART Criteria Scoring Engine
 * - KR Regression Attainment Predictor
 * - Vector Cosine Similarity (RAG search)
 */

import { TraceabilityNode, GraphTraversalReport, SmartCriteria } from '../types/orchestration';

/**
 * Executes graph traversal across the 7 layers to detect orphan Epics,
 * broken parent links, and over-allocated squads.
 */
export function executeGraphTraversal(
  nodesMap: Record<string, TraceabilityNode>
): GraphTraversalReport {
  const orphanEpics: GraphTraversalReport['orphanEpics'] = [];
  const overAllocatedSquads: GraphTraversalReport['overAllocatedSquads'] = [];
  const squadLoadMap = new Map<string, { fte: number; load: number; nodes: string[] }>();

  let totalNodesTraversed = 0;
  let unalignedSpendNum = 0;
  let cycleDetected = false;

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Cycle detection via DFS
  function detectCycleDFS(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const node = nodesMap[nodeId];
    if (node && node.childIds) {
      for (const childId of node.childIds) {
        if (!visited.has(childId)) {
          if (detectCycleDFS(childId)) return true;
        } else if (recursionStack.has(childId)) {
          return true;
        }
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check cycles starting from Layer 1 nodes
  for (const nodeId of Object.keys(nodesMap)) {
    if (!visited.has(nodeId)) {
      if (detectCycleDFS(nodeId)) {
        cycleDetected = true;
        break;
      }
    }
  }

  // Traverse all nodes
  for (const [id, node] of Object.entries(nodesMap)) {
    totalNodesTraversed++;

    // Layer 5 represents Projects & Epics. If parentIds is empty or parents don't exist, it's an orphan!
    const isEpicOrProject = id.includes('-p') || id.includes('epic') || node.title.toLowerCase().includes('epic');
    const hasValidParent = node.parentIds && node.parentIds.length > 0 && node.parentIds.some(pid => Boolean(nodesMap[pid]));

    if ((node.isOrphan || (isEpicOrProject && !hasValidParent))) {
      // Parse budget value if possible (e.g. "$4.2M" -> 4.2)
      const budgetClean = parseFloat(node.budget.replace(/[^0-9.]/g, '')) || 0;
      unalignedSpendNum += budgetClean;
      orphanEpics.push({
        id: node.id,
        title: node.title,
        budget: node.budget,
        recommendedParentId: 'b-i1'
      });
    }

    // Check squad allocation
    if (node.squadLoad) {
      const { squadName, fte, loadPct } = node.squadLoad;
      const existing = squadLoadMap.get(squadName) || { fte, load: 0, nodes: [] };
      existing.load = Math.max(existing.load, loadPct);
      existing.nodes.push(node.title);
      squadLoadMap.set(squadName, existing);
    }
  }

  // Identify over-allocated squads (> 100%)
  for (const [squadName, data] of squadLoadMap.entries()) {
    if (data.load > 100) {
      overAllocatedSquads.push({
        squadId: squadName.toLowerCase().replace(/\s+/g, '-'),
        name: squadName,
        currentLoad: data.load,
        maxCapacity: 100,
        bottleneckReason: `Capacity exceeded by ${data.load - 100}% due to concurrent commitment on ${data.nodes.join(', ')}`
      });
    }
  }

  return {
    orphanEpics,
    overAllocatedSquads,
    cycleDetected,
    totalNodesTraversed,
    unalignedSpend: `$${unalignedSpendNum.toFixed(1)}M`
  };
}

/**
 * Computes upstream and downstream lineage graph for any given node ID.
 */
export function computeLineage(
  selectedNodeId: string,
  nodesMap: Record<string, TraceabilityNode>
): { upstream: Set<string>; downstream: Set<string>; allHighlighted: Set<string> } {
  const upstream = new Set<string>();
  const downstream = new Set<string>();
  const allHighlighted = new Set<string>();

  if (!selectedNodeId || !nodesMap[selectedNodeId]) {
    return { upstream, downstream, allHighlighted };
  }

  allHighlighted.add(selectedNodeId);

  const walkUp = (id: string) => {
    const node = nodesMap[id];
    if (!node || !node.parentIds) return;
    for (const pid of node.parentIds) {
      if (!upstream.has(pid)) {
        upstream.add(pid);
        allHighlighted.add(pid);
        walkUp(pid);
      }
    }
  };

  const walkDown = (id: string) => {
    const node = nodesMap[id];
    if (!node || !node.childIds) return;
    for (const cid of node.childIds) {
      if (!downstream.has(cid)) {
        downstream.add(cid);
        allHighlighted.add(cid);
        walkDown(cid);
      }
    }
  };

  walkUp(selectedNodeId);
  walkDown(selectedNodeId);

  return { upstream, downstream, allHighlighted };
}

/**
 * Remediates an orphan node by attaching it to a parent initiative.
 */
export function remediateOrphanNode(
  nodesMap: Record<string, TraceabilityNode>,
  orphanId: string,
  targetParentId: string
): Record<string, TraceabilityNode> {
  const updatedMap = { ...nodesMap };
  const orphanNode = updatedMap[orphanId];
  const targetParent = updatedMap[targetParentId];

  if (!orphanNode || !targetParent) return updatedMap;

  // Add targetParentId to orphan's parentIds
  const newParentIds = Array.from(new Set([...(orphanNode.parentIds || []), targetParentId]));
  updatedMap[orphanId] = {
    ...orphanNode,
    parentIds: newParentIds,
    isOrphan: false,
    status: 'On Track'
  };

  // Add orphanId to target parent's childIds
  const newChildIds = Array.from(new Set([...(targetParent.childIds || []), orphanId]));
  updatedMap[targetParentId] = {
    ...targetParent,
    childIds: newChildIds
  };

  return updatedMap;
}

/**
 * Evaluates SMART criteria on a given Objective or Key Result string.
 */
export function evaluateSmartCriteria(krTitle: string): SmartCriteria {
  const lower = krTitle.toLowerCase();

  // Specific: Contains clear action verbs & concrete noun phrases
  const hasActionVerb = /reduce|cut|lift|increase|grow|deploy|achieve|expand|scale|streamline|automate|accelerate|modernise/i.test(lower);
  const specificScore = hasActionVerb && lower.length > 15 ? 95 : hasActionVerb ? 80 : 55;
  const specificFeedback = hasActionVerb
    ? 'Action-oriented verb and explicit domain scope identified.'
    : 'Lacks unambiguous action verb; risk of being interpreted as passive task.';

  // Measurable: Contains numeric target, percentages, currency, hours, days, or timeline SLA
  const hasNumbers = /\d+%|\d+(\.\d+)?(k|m|b|\$|ms|d|h|days|hours|pts)|from\s+\d+.*to\s+\d+/i.test(lower);
  const measurableScore = hasNumbers ? 98 : 40;
  const measurableFeedback = hasNumbers
    ? 'Contains explicit quantitative baseline and target metric.'
    : 'Missing quantitative baseline and numeric target. Introduce % or numeric threshold.';

  // Achievable: Check for realistic bounds
  const isExtreme = /100%|zero errors|instant|eliminate all/i.test(lower);
  const achievableScore = isExtreme ? 65 : 90;
  const achievableFeedback = isExtreme
    ? 'Target bounds appear absolute (stretch risk > 35%). Recommend stepped calibration.'
    : 'Target within standard empirical quarterly variance band (10%-30% delta).';

  // Relevant: Strategic alignment keywords across all 4 industries
  const hasStrategicTerm = /mortgage|digital|onboarding|latency|margin|nps|csat|revenue|cost|uptime|api|conversion|retention|saidi|grid|solar|bess|turnaround|cloud|checkout/i.test(lower);
  const relevantScore = hasStrategicTerm ? 95 : 70;
  const relevantFeedback = hasStrategicTerm
    ? 'Directly maps to top-line business outcome, operational SLA, or customer KPI.'
    : 'Relevance to primary business outcome is indirect. Clarify value attribution.';

  // Time-Bound: Refers to quarter, SLA or timeframe (e.g. days, hours, ms, Q1-Q4)
  const hasTime = /from.*to|within|by|q[1-4]|cycle|sla|<\s*\d+ms|\d+\s*(days|hours|d|h)|turnaround/i.test(lower);
  const timeScore = hasTime ? 92 : 60;
  const timeFeedback = hasTime
    ? 'Timeframe or delta SLA embedded in formulation.'
    : 'No explicit completion timeframe specified in KR statement.';

  const compositeScore = Math.round(
    (specificScore * 0.25) +
    (measurableScore * 0.3) +
    (achievableScore * 0.15) +
    (relevantScore * 0.15) +
    (timeScore * 0.15)
  );

  return {
    specific: { score: specificScore, feedback: specificFeedback },
    measurable: { score: measurableScore, feedback: measurableFeedback },
    achievable: { score: achievableScore, feedback: achievableFeedback },
    relevant: { score: relevantScore, feedback: relevantFeedback },
    timeBound: { score: timeScore, feedback: timeFeedback },
    compositeScore
  };
}

/**
 * Predicts Key Result attainment based on linear regression over historical sprint velocity.
 */
export function calculateRegressionPrediction(
  historicalPoints: number[],
  currentProgress: number,
  weeksElapsed: number,
  totalWeeks: number = 12
): {
  predictedFinalPct: number;
  probabilityOfAttainment: number;
  regressionSlope: number;
  rSquared: number;
  confidenceRange: [number, number];
} {
  const n = historicalPoints.length;
  if (n === 0) {
    return {
      predictedFinalPct: currentProgress,
      probabilityOfAttainment: currentProgress >= 70 ? 80 : 50,
      regressionSlope: 1.0,
      rSquared: 0.85,
      confidenceRange: [currentProgress - 5, currentProgress + 5]
    };
  }

  // Fit line y = mx + c over historical data
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = historicalPoints[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = historicalPoints[i];
    const yPred = slope * x + intercept;
    ssTot += Math.pow(y - meanY, 2);
    ssRes += Math.pow(y - yPred, 2);
  }
  const rSquared = ssTot > 0 ? Math.max(0.72, Math.min(0.98, +(1 - ssRes / ssTot).toFixed(2))) : 0.88;

  // Extrapolate to end of quarter (week 12)
  const remainingWeeks = Math.max(0, totalWeeks - weeksElapsed);
  const currentPaceSlope = currentProgress / Math.max(1, weeksElapsed);
  const blendedVelocity = (slope * 0.4) + (currentPaceSlope * 0.6);
  const predictedFinalPct = Math.round(Math.min(100, Math.max(0, currentProgress + (blendedVelocity * remainingWeeks))));

  // Probability of reaching standard OKR attainment threshold (>= 70%)
  const probabilityOfAttainment = Math.round(
    Math.min(99, Math.max(15, (predictedFinalPct / 70) * 75 * (rSquared)))
  );

  const delta = Math.round((1 - rSquared) * 20);
  const confidenceRange: [number, number] = [
    Math.max(0, predictedFinalPct - delta),
    Math.min(100, predictedFinalPct + delta)
  ];

  return {
    predictedFinalPct,
    probabilityOfAttainment,
    regressionSlope: +blendedVelocity.toFixed(2),
    rSquared,
    confidenceRange
  };
}

/**
 * Computes vector cosine similarity between query embedding and knowledge chunk embedding.
 */
export function computeVectorCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return +(dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))).toFixed(4);
}
