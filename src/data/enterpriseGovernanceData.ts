/**
 * Planview Anvi - Enterprise Governance, Org Directory, Policies & Disaster Scenarios
 * Configurable data & rules for Banking, IT Consulting, Retail, Power Suppliers, and Telco
 */

import {
  OrgDirectoryMember,
  OkrEnterprisePolicy,
  ManagedProgram,
  SignificantDisasterEvent
} from '../types/orchestration';

export const GLOBAL_DISASTER_TEMPLATES: SignificantDisasterEvent[] = [
  {
    id: 'dis-global-cyber',
    title: 'Global Zero-Day Ransomware Attack on Enterprise Cloud Infrastructure',
    type: 'cyberattack',
    industry: 'Global',
    severity: 'Critical',
    active: false,
    description: 'Coordinated global cyberattack targets virtualization hypervisors and identity management (IAM) controllers, encrypting mission-critical databases.',
    impacts: {
      attainmentDropPct: -24,
      impactedLayerIds: [1, 2, 3, 5],
      affectedSquads: ['Core Platform & Infrastructure', 'Security Operations (SecOps)'],
      costImpact: '$16.8M in forensic mitigation, ransomware quarantine & downtime',
      mitigationAction: 'Activate immutable air-gapped snapshots, sever compromised VPN interconnects, and enforce physical hardware key MFA.'
    }
  },
  {
    id: 'dis-global-cloud',
    title: 'Tier-4 Hyperscale Data Centre Power Grid Cascade Outage',
    type: 'datacenter_outage',
    industry: 'Global',
    severity: 'Critical',
    active: false,
    description: 'Simultaneous failure of dual electrical substation feeds and backup diesel turbine synchronizers causes total power loss across Primary Cloud Availability Zone.',
    impacts: {
      attainmentDropPct: -18,
      impactedLayerIds: [2, 3, 4, 6],
      affectedSquads: ['Cloud Reliability Engineering', 'Backend Core Platform'],
      costImpact: '$9.2M in customer SLA compensation and emergency disaster recovery',
      mitigationAction: 'Execute automated cross-region DNS evacuation to Secondary Active-Active disaster recovery region.'
    }
  },
  {
    id: 'dis-global-bandwidth',
    title: 'Subsea Intercontinental Fiber Cable Severance (Deep Sea Anomaly)',
    type: 'network_saturation',
    industry: 'Global',
    severity: 'Severe',
    active: false,
    description: 'Underwater seismic activity severs 3 transoceanic high-bandwidth fiber optic cables, choking international data transit throughput by 70%.',
    impacts: {
      attainmentDropPct: -15,
      impactedLayerIds: [3, 4, 6],
      affectedSquads: ['Global Network Engineering', 'Edge Delivery ART'],
      costImpact: '$5.4M in burst IP transit spot-market bandwidth purchases',
      mitigationAction: 'Enact dynamic application-layer traffic shaping and prioritize low-bandwidth transactional API payloads.'
    }
  },
  {
    id: 'dis-global-natural',
    title: 'Extreme Superstorm & Regional Critical Infrastructure Disruption',
    type: 'natural_disaster',
    industry: 'Global',
    severity: 'Critical',
    active: false,
    description: 'Unprecedented Category 5 superstorm batters regional metropolitan center, flooding electrical substations, knocking out telecom towers, and closing transit corridors.',
    impacts: {
      attainmentDropPct: -20,
      impactedLayerIds: [4, 5, 6, 7],
      affectedSquads: ['Field Engineering & Dispatch', 'Emergency Operations Team'],
      costImpact: '$11.5M in physical hardware replacements & emergency field operations',
      mitigationAction: 'Deploy mobile emergency satellite communication trailers, reserve field generators, and activate mutual-aid technician pools.'
    }
  }
];

export const BANKING_ORG_DIRECTORY: OrgDirectoryMember[] = [
  { id: 'dir-b1', name: 'Jonathan Vance', role: 'Group Chief Executive Officer', department: 'Executive Board', title: 'CEO', email: 'jonathan.vance@globalhorizonbank.com', fteCapacity: 1.0 },
  { id: 'dir-b2', name: 'Dr. Aris Thorne', role: 'Chief Information & Digital Officer', department: 'Technology & Architecture', title: 'Group CIO', email: 'aris.thorne@globalhorizonbank.com', fteCapacity: 1.0 },
  { id: 'dir-b3', name: 'Claire Bennett', role: 'VP Retail Banking & Digital Lending', department: 'Retail Products', title: 'Vice President', email: 'claire.bennett@globalhorizonbank.com', fteCapacity: 1.0 },
  { id: 'dir-b4', name: 'Liam Gallagher', role: 'Head of Digital Wealth & CX', department: 'Wealth Management', title: 'Executive Director', email: 'liam.g@globalhorizonbank.com', fteCapacity: 1.0 },
  { id: 'dir-b5', name: 'Sarah Chen', role: 'Core Banking Release Train Engineer', department: 'Agile Delivery', title: 'RTE Sarah Chen', email: 'sarah.chen@globalhorizonbank.com', fteCapacity: 1.0 }
];

export const BANKING_POLICIES: OkrEnterprisePolicy[] = [
  {
    id: 'pol-b1',
    ruleName: 'APRA CPS 230 Operational Resilience Mandate',
    category: 'Checkpoints',
    description: 'All strategic objectives and core IT Key Results must maintain verified zero-trust disaster recovery tolerances and end-to-end service mapping.',
    minMeasurableScore: 75,
    minAmbitionScore: 70,
    maxKrsPerObjective: 4,
    mandatoryMetadataFields: ['owner', 'budget', 'causalChainToDollarImpact', 'targetRemediationTiming'],
    governanceFrequency: 'Bi-Weekly',
    status: 'Enforced'
  },
  {
    id: 'pol-b2',
    ruleName: 'Causal Dollar Impact Accountability',
    category: 'SMART Threshold',
    description: 'Every Key Result with budget > $5M must include an explicit causal chain mapping leading metrics to bottom-line cost-to-income or revenue impact.',
    minMeasurableScore: 80,
    minAmbitionScore: 75,
    maxKrsPerObjective: 4,
    mandatoryMetadataFields: ['causalChainToDollarImpact', 'metrics'],
    governanceFrequency: 'Monthly',
    status: 'Enforced'
  }
];

export const BANKING_PROGRAMS: ManagedProgram[] = [
  {
    id: 'prog-b1',
    title: 'Digital Mortgage 48-Hour Decisioning Acceleration Program',
    status: 'Active',
    linkedOkrId: 'b-kr1',
    strategicStatement: {
      issues: 'Manual credit underwriting steps and legacy mainframe batch runs cause 4.1-day average mortgage turnaround, losing $3.1M volume to neo-banks.',
      intent: 'Automate 85% of income verification and credit underwriting into real-time microservices, delivering unconditional mortgage decisions in under 48 hours.',
      growthVision: 'Capture #1 digital mortgage market share among affluent millennials and expand retail lending book by $18M.'
    },
    businessProblem: {
      problemDescription: 'Legacy batch integration in Credit Engine API causes customer drop-off at the 72-hour mark, lowering broker conversion from 64% to 41%.',
      impactedStakeholders: ['Retail Mortgage Applicants', 'Mortgage Brokers Network', 'Credit Risk Underwriters'],
      causalChainToDollarImpact: '9-day turnaround delay -> broker defection to digital neo-lenders -> $3.1M quarterly loan volume shortfall -> $8.4M capital at risk.',
      rootCause: 'Mainframe batch extract runs only once per night; manual tax return document extraction.',
      targetRemediationTiming: 'Q1 2027 Sprint 4',
      metrics: [
        { indicator: 'End-to-End Approval Time', baselineValue: '4.1 days', targetValue: '48 hours', metricType: 'Lagging' },
        { indicator: 'Credit API Response Time', baselineValue: '340ms', targetValue: '< 95ms', metricType: 'Leading' },
        { indicator: 'Broker Channel Conversion Rate', baselineValue: '41%', targetValue: '68%', metricType: 'Leading' }
      ]
    },
    roadmap: [
      { milestone: 'Automated OCR & Tax Parsing', targetQuarter: 'Q4 2026', deliverables: ['AI document extraction live', 'Instant income verification SDK'], status: 'Completed' },
      { milestone: 'Credit Engine v3 API Deployment', targetQuarter: 'Q1 2027', deliverables: ['Automated decision rules engine', 'Sub-48h loan pipeline operational'], status: 'In Progress' }
    ],
    resourceAssignments: [
      { squadId: 'squad-b1', squadName: 'Credit Engine Backend Squad', assignedFte: 14, budgetAllocation: '$4.2M' },
      { squadId: 'squad-b2', squadName: 'Digital Channels Squad', assignedFte: 18, budgetAllocation: '$3.8M' }
    ]
  },
  {
    id: 'prog-b2',
    title: 'Legacy Mainframe Batch Extractor Modernisation',
    status: 'Terminated',
    linkedOkrId: 'b-s1',
    strategicStatement: {
      issues: 'Batch extraction routine was originally built for overnight tape archiving and was completely unaligned with real-time digital banking.',
      intent: 'Decommission legacy COBOL batch jobs and migrate transaction logging directly to Kafka streaming event mesh.',
      growthVision: 'Free up mainframe MIPS consumption and reallocate senior engineers to instant payment APIs.'
    },
    businessProblem: {
      problemDescription: 'Orphan batch process consuming $1.4M with zero direct OKR linkage or customer outcome attribution.',
      impactedStakeholders: ['Mainframe Operations', 'Enterprise Architecture'],
      causalChainToDollarImpact: 'Obsolete COBOL maintenance -> $1.4M wasted annual capex -> delayed cloud modernization.',
      rootCause: 'Unmonitored historical project scope that continued post-core banking rollout.',
      targetRemediationTiming: 'Terminated in Q4 2026',
      metrics: [
        { indicator: 'Mainframe MIPS Usage Reduction', baselineValue: '420 MIPS', targetValue: '0 MIPS', metricType: 'Lagging' }
      ]
    },
    roadmap: [
      { milestone: 'Traffic Audit & Dependency Isolation', targetQuarter: 'Q3 2026', deliverables: ['Zero active consumers verified'], status: 'Completed' },
      { milestone: 'Shutdown & Team Reallocation', targetQuarter: 'Q4 2026', deliverables: ['Decommissioned batch servers', 'Transferred 6 engineers to Cloud Core'], status: 'Completed' }
    ],
    resourceAssignments: [
      { squadId: 'squad-b-orphan', squadName: 'COBOL Custodians', assignedFte: 0, budgetAllocation: '$0 (Reallocated)' }
    ],
    terminationReason: 'Stage 3 Alignment Agent flagged orphan status. Decommissioned and reallocated $1.4M budget and 6 engineers to Cloud-Native Instant Payments.',
    terminationDate: '2026-10-28',
    reallocatedHeadcount: 6,
    reallocatedBudget: '$1.4M'
  }
];

export const BANKING_DISASTERS: SignificantDisasterEvent[] = [
  {
    id: 'dis-b1',
    title: 'Core Payment Gateway DDoS & Ransomware Wave',
    type: 'cyberattack',
    industry: 'Banking',
    severity: 'Critical',
    active: false,
    description: 'High-volume Layer 7 volumetric attack floods payment authentication APIs, triggering automated safety circuit-breakers.',
    impacts: {
      attainmentDropPct: -18,
      impactedLayerIds: [2, 3, 5],
      affectedSquads: ['Credit Engine Backend', 'Security & Compliance'],
      costImpact: '$8.4M transaction volume hold & mitigation fees',
      mitigationAction: 'Activate Cloudflare Magic Transit scrubbers and isolate internal payment processing clusters.'
    }
  },
  {
    id: 'dis-b2',
    title: 'Primary Data Centre Water Main Rupture',
    type: 'datacenter_outage',
    industry: 'Banking',
    severity: 'Critical',
    active: false,
    description: 'Chilled water pipe burst in sub-floor cable trays causes electrical short circuit in Primary Data Centre.',
    impacts: {
      attainmentDropPct: -14,
      impactedLayerIds: [1, 2, 6],
      affectedSquads: ['Core Banking & Payments ART'],
      costImpact: '$4.5M emergency facility repair & failover audit',
      mitigationAction: 'Complete automated active-active failover to Secondary Tier-4 Cloud facility.'
    }
  }
];
