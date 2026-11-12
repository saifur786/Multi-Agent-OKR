/**
 * Planview Anvi - Telco Industry Data Bundle
 * Apex Telecommunications: 5G Mobile, Dark Fiber & Edge Cloud Infrastructure
 */

import {
  IndustryDataBundle,
  OrgDirectoryMember,
  OkrEnterprisePolicy,
  ManagedProgram,
  SignificantDisasterEvent
} from '../types/orchestration';

export const TELCO_ORG_DIRECTORY: OrgDirectoryMember[] = [
  { id: 'dir-t1', name: 'Dr. Elena Vance', role: 'Group CTO & EVP Networks', department: 'Network Engineering', title: 'Chief Technology Officer', email: 'elena.vance@apextelecom.com', fteCapacity: 1.0 },
  { id: 'dir-t2', name: 'Marcus Sterling', role: 'VP 5G RAN & Transport', department: 'RAN Operations', title: 'Vice President Radio Access Networks', email: 'marcus.sterling@apextelecom.com', fteCapacity: 1.0 },
  { id: 'dir-t3', name: 'Priya Patel', role: 'Chief Commercial Officer', department: 'Consumer & Enterprise', title: 'Executive Vice President', email: 'priya.patel@apextelecom.com', fteCapacity: 1.0 },
  { id: 'dir-t4', name: 'Dr. Julian Thorne', role: 'Head of Network AI & Automation', department: 'Autonomous Systems', title: 'Chief AI Architect', email: 'julian.thorne@apextelecom.com', fteCapacity: 1.0 },
  { id: 'dir-t5', name: 'Sarah Jenkins', role: 'Chief Information Security Officer', department: 'Cyber & Telco SecOps', title: 'VP Information Security', email: 'sarah.jenkins@apextelecom.com', fteCapacity: 1.0 },
  { id: 'dir-t6', name: 'Dave Kowalski', role: 'Director Field Operations & Dispatch', department: 'Field Services', title: 'Director Field Engineering', email: 'dave.k@apextelecom.com', fteCapacity: 1.0 }
];

export const TELCO_POLICIES: OkrEnterprisePolicy[] = [
  {
    id: 'pol-t1',
    ruleName: 'Mandatory Leading & Lagging Indicators',
    category: 'SMART Threshold',
    description: 'Every Key Result must specify at least 1 leading indicator (e.g. packet latency, bandwidth utilization) and 1 lagging dollar impact (churn $, ARPU).',
    minMeasurableScore: 75,
    minAmbitionScore: 70,
    maxKrsPerObjective: 4,
    mandatoryMetadataFields: ['owner', 'budget', 'causalChainToDollarImpact', 'targetRemediationTiming', 'metrics'],
    governanceFrequency: 'Bi-Weekly',
    status: 'Enforced'
  },
  {
    id: 'pol-t2',
    ruleName: 'Human-in-the-Loop Override Accountability',
    category: 'Checkpoints',
    description: 'Manual prioritization overrides above AI recommendations require mandatory written justification, HR directory sign-off, and impact review.',
    minMeasurableScore: 70,
    minAmbitionScore: 65,
    maxKrsPerObjective: 5,
    mandatoryMetadataFields: ['overrideReason', 'overriddenBy'],
    governanceFrequency: 'Monthly',
    status: 'Enforced'
  },
  {
    id: 'pol-t3',
    ruleName: 'Critical Infrastructure Disaster Contingency',
    category: 'Ambition',
    description: 'Objectives involving core network components must define an automated rollback or burst capacity plan in the event of disaster shocks.',
    minMeasurableScore: 80,
    minAmbitionScore: 75,
    maxKrsPerObjective: 4,
    mandatoryMetadataFields: ['rootCause', 'impactedStakeholders'],
    governanceFrequency: 'Quarterly',
    status: 'Enforced'
  }
];

export const TELCO_PROGRAMS: ManagedProgram[] = [
  {
    id: 'prog-t1',
    title: '5G Metro Bandwidth & Dark Fiber Acceleration Program',
    status: 'Active',
    linkedOkrId: 't-kr1',
    strategicStatement: {
      issues: 'Peak-hour cell tower congestion in 14 metro clusters causing 4.2% packet drops, streaming buffering, and sharp NPS drops.',
      intent: 'Double fiber backhaul capacity to 400Gbps across top 2,400 macro cell sites to guarantee sub-15ms mobile gaming and enterprise VPN SLAs.',
      growthVision: 'Position Apex as the #1 5G Standalone network in latency, unlocking high-margin enterprise private 5G and mobile gaming revenue.'
    },
    businessProblem: {
      problemDescription: 'High-density urban cell towers experience 94% backhaul saturation during the 18:00-21:00 peak hours, generating over 45,000 monthly subscriber complaints and high churn.',
      impactedStakeholders: ['14.8M Mobile Subscribers', 'Enterprise Tier-1 WAN Customers', 'Field Maintenance Crews'],
      causalChainToDollarImpact: 'Congested fiber backhaul -> 4.2% packet drop -> degraded streaming/gaming -> 2.1% monthly subscriber churn -> $18.4M annualised ARPU revenue leakage.',
      rootCause: 'Legacy 10Gbps optical transport interfaces saturated by 5G mid-band traffic; 6-month delay in municipal dark fiber permitting.',
      targetRemediationTiming: 'Q1 2027 Sprint 6 (Within 8 weeks)',
      metrics: [
        { indicator: 'Peak Network Bandwidth Utilisation', baselineValue: '94% saturated', targetValue: '< 72% optimal', metricType: 'Leading' },
        { indicator: 'Monthly Postpaid Subscriber Churn %', baselineValue: '2.1% monthly', targetValue: '< 0.95% target', metricType: 'Lagging' },
        { indicator: 'Mean 5G Download Speed (Metro)', baselineValue: '85 Mbps', targetValue: '340 Mbps', metricType: 'Leading' },
        { indicator: 'Annualized Revenue Leakage Avoidance', baselineValue: '$18.4M loss rate', targetValue: '$0 (Fully Recovered)', metricType: 'Lagging' }
      ]
    },
    roadmap: [
      { milestone: 'Permit Clearance & Site Prep', targetQuarter: 'Q4 2026', deliverables: ['Council approvals across 12 zones', 'Fiber route trenching completed'], status: 'Completed' },
      { milestone: '400G Dense WDM Transponder Deployment', targetQuarter: 'Q1 2027', deliverables: ['850 macro towers migrated to 400G', 'Sub-15ms edge routing verified'], status: 'In Progress' },
      { milestone: 'Dynamic Traffic Steering & Network Slicing', targetQuarter: 'Q2 2027', deliverables: ['Automated slice SLA controller live', 'Enterprise private APNs activated'], status: 'Upcoming' }
    ],
    resourceAssignments: [
      { squadId: 'squad-t1', squadName: 'Fiber Backhaul Transport Squad', assignedFte: 18, budgetAllocation: '$8.5M' },
      { squadId: 'squad-t2', squadName: 'Optical Transmission Engineering', assignedFte: 12, budgetAllocation: '$6.0M' }
    ]
  },
  {
    id: 'prog-t2',
    title: 'Predictive Subscriber Churn & AI Proactive Care Program',
    status: 'Active',
    linkedOkrId: 't-kr3',
    strategicStatement: {
      issues: 'Customer care contacts are purely reactive; subscribers experience silent disgruntlement before porting numbers to competitor networks.',
      intent: 'Deploy real-time AI churn prediction on network quality signals, automatically triggering instant credit compensations and loyalty upgrades.',
      growthVision: 'Transform customer touchpoints from cost-center friction into proactive relationship builders, sustaining industry-leading 72 NPS.'
    },
    businessProblem: {
      problemDescription: 'Subscribers who experience > 3 dropped calls or speed dips per week port out at 4.2x normal rates without ever calling customer support.',
      impactedStakeholders: ['Postpaid Consumer Base', 'Digital Retention Marketing', 'Customer Care Representatives'],
      causalChainToDollarImpact: 'Silent network micro-outages -> undetected dissatisfaction -> competitor SIM purchase -> $12.8M loss in 24-month contract customer lifetime value.',
      rootCause: 'BSS/CRM silos separated from real-time OSS network telemetry; missing automated trigger pipeline.',
      targetRemediationTiming: 'Q1 2027 Sprint 4',
      metrics: [
        { indicator: 'AI Churn Prediction Precision (Recall > 85%)', baselineValue: '54%', targetValue: '91%', metricType: 'Leading' },
        { indicator: 'Postpaid Churn Rate', baselineValue: '2.1%', targetValue: '< 1.0%', metricType: 'Lagging' },
        { indicator: 'Proactive Customer Save Conversion Rate', baselineValue: '18%', targetValue: '48%', metricType: 'Leading' }
      ]
    },
    roadmap: [
      { milestone: 'OSS Telemetry Stream Integration', targetQuarter: 'Q4 2026', deliverables: ['Kafka connector to RAN call detail logs', 'Real-time anomaly scoring pipeline'], status: 'Completed' },
      { milestone: 'Next-Best-Action Automated Delivery', targetQuarter: 'Q1 2027', deliverables: ['Push notification & SMS instant credit engine', 'Retention squad portal deployment'], status: 'In Progress' },
      { milestone: 'Full Scale Omnichannel Orchestration', targetQuarter: 'Q2 2027', deliverables: ['Self-healing retail store sync', 'Family plan retention bundling'], status: 'Upcoming' }
    ],
    resourceAssignments: [
      { squadId: 'squad-t3', squadName: 'Subscriber Churn AI Squad', assignedFte: 14, budgetAllocation: '$5.8M' },
      { squadId: 'squad-t4', squadName: 'Digital Experience Squad', assignedFte: 8, budgetAllocation: '$3.4M' }
    ]
  },
  {
    id: 'prog-t3',
    title: 'Legacy 3G Network Decommissioning & Spectrum Re-farming',
    status: 'Terminated',
    linkedOkrId: 't-s1',
    strategicStatement: {
      issues: 'Continuing to maintain 24-year-old 3G base stations diverts $4.8M annual opex and ties up 12 senior engineers on obsolete hardware.',
      intent: 'Orderly shutdown of legacy 3G carriers and re-farming 850MHz spectrum directly into 5G Low-Band nationwide coverage.',
      growthVision: 'Reclaim 15MHz of prime sub-1GHz spectrum to expand rural 5G coverage without purchasing additional government spectrum licenses.'
    },
    businessProblem: {
      problemDescription: '3G network accounts for only 0.4% of total traffic but consumes 14% of tower electrical power and generates frequent legacy alarm noise.',
      impactedStakeholders: ['Rural Subscribers with 3G-only handsets', 'Tower Space Landlords', 'Radio Field Technicians'],
      causalChainToDollarImpact: 'Legacy parts scarcity -> $1.8M inflated supplier spares cost -> high tower power consumption -> $4.8M unnecessary cash drain.',
      rootCause: 'Delayed handset upgrade trade-in campaign for vulnerable rural seniors.',
      targetRemediationTiming: 'Terminated in Q4 2026 (Reprioritised to 5G Metro Backhaul)',
      metrics: [
        { indicator: 'Spectrum Re-farmed to 5G', baselineValue: '0 MHz', targetValue: '15 MHz', metricType: 'Leading' },
        { indicator: 'Tower Power Consumption (MWh)', baselineValue: '4,200 MWh', targetValue: '3,450 MWh', metricType: 'Lagging' }
      ]
    },
    roadmap: [
      { milestone: 'Handset Upgrade Subsidy Campaign', targetQuarter: 'Q3 2026', deliverables: ['Distributed 42,000 free 4G/5G handsets', '99.2% customer migration achieved'], status: 'Completed' },
      { milestone: '3G Carrier De-activation', targetQuarter: 'Q4 2026', deliverables: ['Decommissioned 1,840 3G radio heads', 'Released 12 field engineers to 5G SA'], status: 'Completed' }
    ],
    resourceAssignments: [
      { squadId: 'squad-t5', squadName: 'Legacy Maintenance Taskforce', assignedFte: 0, budgetAllocation: '$0 (Reallocated)' }
    ],
    terminationReason: 'Project goals completed ahead of schedule; remaining $1.8M budget and 12 FTE reallocated to 5G Metro Backhaul Program.',
    terminationDate: '2026-10-15',
    reallocatedHeadcount: 12,
    reallocatedBudget: '$1.8M'
  }
];

export const TELCO_DISASTERS: SignificantDisasterEvent[] = [
  {
    id: 'dis-t1',
    title: 'Severe Cyclone & Coastal Cell Tower Blackout',
    type: 'natural_disaster',
    industry: 'Telco',
    severity: 'Critical',
    active: false,
    description: 'Category 4 tropical cyclone causes catastrophic structural failure on 140 macro towers and severs terrestrial fiber backhaul links.',
    impacts: {
      attainmentDropPct: -22,
      impactedLayerIds: [3, 4, 5, 6],
      affectedSquads: ['Fiber Backhaul Transport Squad', 'Field Operations & Dispatch'],
      costImpact: '$8.4M repair capex & SLA credits',
      mitigationAction: 'Deploy COW (Cells on Wheels), satellite emergency backhaul (Starlink/LEO), and mutual aid crews.'
    }
  },
  {
    id: 'dis-t2',
    title: 'Undersea Fiber Cable Severance (Trans-Pacific Link)',
    type: 'network_saturation',
    industry: 'Telco',
    severity: 'Severe',
    active: false,
    description: 'Deep-sea trawler severs dual redundant subsea fiber lines, choking international bandwidth capacity by 65%.',
    impacts: {
      attainmentDropPct: -16,
      impactedLayerIds: [2, 3, 4],
      affectedSquads: ['Core Transmission Engineering', 'Enterprise Peering Tribe'],
      costImpact: '$4.2M rerouting transit bandwidth fees',
      mitigationAction: 'Reroute via auxiliary Southern Cross cable and activate emergency rate-limiting on non-critical video streaming.'
    }
  },
  {
    id: 'dis-t3',
    title: 'Nationwide BSS/OSS Zero-Day Cyberattack & Ransomware',
    type: 'cyberattack',
    industry: 'Global',
    severity: 'Critical',
    active: false,
    description: 'Sophisticated nation-state actor targets BSS billing database and customer provisioning gateway, locking automated activation APIs.',
    impacts: {
      attainmentDropPct: -25,
      impactedLayerIds: [1, 2, 3, 5],
      affectedSquads: ['Subscriber Churn AI Squad', 'Telco SecOps & Compliance'],
      costImpact: '$14.5M forensic remediation & regulatory fines',
      mitigationAction: 'Isolate compromised gateway, restore immutable air-gapped database backups, and mandate zero-trust hardware token re-auth.'
    }
  },
  {
    id: 'dis-t4',
    title: 'Primary Data Centre Cooling Failure & Core HSS Outage',
    type: 'datacenter_outage',
    industry: 'Telco',
    severity: 'Critical',
    active: false,
    description: 'Chilled water cooling pump failure in Central Metro Data Centre triggers thermal runaway, taking down Home Subscriber Server (HSS) cluster.',
    impacts: {
      attainmentDropPct: -19,
      impactedLayerIds: [2, 3, 6, 7],
      affectedSquads: ['Core IMS & HSS Operations', 'Cloud Infrastructure Reliability'],
      costImpact: '$6.1M downtime compensation & emergency hardware replacement',
      mitigationAction: 'Trigger automated disaster recovery failover to Secondary Geo-Redundant Tier-4 facility within 12 minutes.'
    }
  }
];

export const TELCO_DATA: IndustryDataBundle = {
  id: 'telco',
  name: 'Apex Telecommunications',
  sector: '5G Mobile, Dark Fiber & Edge Cloud',
  quarter: 'Q4 2026',
  overallHealth: 'At Risk',
  attainment: 71,
  totalBudget: '$54.0M',
  activeAgents: 6,
  orgDirectory: TELCO_ORG_DIRECTORY,
  policies: TELCO_POLICIES,
  programs: TELCO_PROGRAMS,
  activeDisasters: TELCO_DISASTERS,
  stages: [
    {
      id: 1,
      title: 'Define Organisational Strategy',
      subtitle: '5G Standalone & Edge Mandates',
      agentRole: 'strategy-explorer',
      agentName: 'Strategy & Ideation Agent',
      planviewCapability: 'Strategic Portfolio Management & Anvi',
      goal: 'Translate telecom regulator spectrum commitments and 5G monetisation into clear executive strategic themes.',
      confidence: 88,
      status: 'On Track',
      moduleDetail: {
        badge: 'RAG & Vector Retrieval',
        description: 'Queries Market Data & Historical Performance vectors via RAG to propose Strategic Themes.'
      },
      aiActions: {
        analyse: 'Analyzed 12 5G market reports (GSMA Intelligence) and peer fiber capex efficiency benchmarks.',
        predict: 'Expanding 5G Standalone to top 30 cities will unlock $42M in enterprise edge computing private slicing ARR.',
        recommend: 'Shift $14.5M from legacy copper maintenance into high-density 400G metro dark fiber backhaul.',
        automate: 'Synchronised 4 strategic themes in Planview Portfolios mapped to 5G SA and Autonomous CX capabilities.',
        optimise: 'Optimised risk-weighted investment mix: 50% 5G Densification, 30% BSS AI Automation, 20% Resilience.'
      },
      simMetrics: {
        velocityTrend: '+9% fiber deployment pace',
        budgetBurn: '72% of Q4 capex',
        resourceConstraint: 'Optical transmission engineers at 114% utilization',
        riskAlert: 'Medium: Dark fiber municipal permitting delays in 3 metro councils.',
        recommendedAction: 'Engage municipal liaison and deploy interim 80GHz E-Band wireless millimeter backhaul.'
      }
    },
    {
      id: 2,
      title: 'Define Objectives & Key Results',
      subtitle: 'Quality, Novelty & Attainment Regression',
      agentRole: 'okr-predictor',
      agentName: 'OKR Quality & Prediction Agent',
      planviewCapability: 'OKR Quality Scoring & Advisory Model',
      goal: 'Structure rigorous, measurable Key Results and compute historical polynomial regression attainment probability.',
      confidence: 83,
      status: 'At Risk',
      moduleDetail: {
        badge: 'SMART & Regression Modeling',
        description: 'Evaluates SMART criteria and runs regression against historical KR attainment.'
      },
      aiActions: {
        analyse: 'Validated 4 Objectives and 12 Key Results against telecom industry SMART criteria (score: 84%).',
        predict: 'KR "Cut postpaid churn < 1.0%" predicted at 68% attainment probability without predictive AI intervention.',
        recommend: 'Inject proactive customer care triggers to elevate churn attainment probability to 86%.',
        automate: 'Computed closed-form polynomial regression equation: y = -0.042x^2 + 1.28x + 64.2 (R² = 0.884).',
        optimise: 'Aligned leading metrics (network latency, packet loss) with lagging financial ARR indicators.'
      },
      simMetrics: {
        velocityTrend: 'Balanced velocity across 3 tribes',
        budgetBurn: '78% allocated',
        resourceConstraint: 'Subscriber Churn AI Squad at 92% capacity',
        riskAlert: 'High: Churn reduction KR trending below stretch target.',
        recommendedAction: 'Pair 2 data scientists from Enterprise B2B to strengthen BSS retention model.'
      }
    },
    {
      id: 3,
      title: 'Align Tasks & Work for Execution',
      subtitle: 'RAN & Fiber 7-Layer Graph Traversal',
      agentRole: 'alignment-capacity',
      agentName: 'Alignment & Capacity Agent',
      planviewCapability: 'Portfolio, Program & Agile Tracking',
      goal: 'Traverse 7 layers to detect orphaned legacy work and eliminate over-allocated transmission squads.',
      confidence: 81,
      status: 'At Risk',
      moduleDetail: {
        badge: '7-Layer Graph Traversal',
        description: 'Executes graph traversal across the 7 layers to detect orphan Epics and over-allocated squads.'
      },
      aiActions: {
        analyse: 'Detected 1 orphan Epic: "Legacy 3G Base Station Firmware Maintenance" ($1.8M unaligned spend).',
        predict: 'Terminating orphan 3G maintenance reclaims 12 senior engineers for 5G Metro Backhaul deployment.',
        recommend: 'Authorize immediate program termination and reallocate $1.8M budget to 400G Dense WDM Epic.',
        automate: 'Re-linked Jira Align release trains directly to Q4 5G SA Coverage Objective.',
        optimise: 'Rebalanced sprint capacity across 54 FTE in RAN & Fiber Transport ART.'
      },
      simMetrics: {
        velocityTrend: '91% work-to-OKR alignment',
        budgetBurn: '81% of Q4 budget',
        resourceConstraint: 'Fiber Backhaul Transport Squad over-allocated by 14%',
        riskAlert: 'Critical: 1 orphan epic consuming $1.8M with zero 5G strategic value.',
        recommendedAction: 'Execute program termination and redeploy squads to metro fiber bottlenecks.'
      }
    },
    {
      id: 4,
      title: 'Execution & Risk Detection',
      subtitle: 'Tower Telemetry & Traffic Saturation Radar',
      agentRole: 'risk-sentinel',
      agentName: 'Risk Detection Agent',
      planviewCapability: 'Execution Intelligence & Risk Radar',
      goal: 'Continuous cron and webhook monitoring of cell tower latency, dark fiber utilization, and customer churn spikes.',
      confidence: 76,
      status: 'At Risk',
      moduleDetail: {
        badge: 'Cron & Webhook Risk Radar',
        description: 'Runs scheduled cron/webhook jobs evaluating sprint velocity, budget burn rate, and resource utilisation.'
      },
      aiActions: {
        analyse: 'Monitored 14,000 tower telemetry streams; detected 94% backhaul saturation in North Metro cluster.',
        predict: 'SLA breach probability elevated to 42% over the upcoming festive season streaming peak.',
        recommend: 'Activate millimeter E-band wireless microwave burst capacity on top 40 congested towers.',
        automate: 'Emitted real-time Slack and ServiceNow P1 risk tickets to Network Operations Center (NOC).',
        optimise: 'Dynamic traffic steering reduced peak packet drops from 4.2% to 1.1% in simulated load test.'
      },
      simMetrics: {
        velocityTrend: '-8% velocity dip due to fiber trenching delays',
        budgetBurn: '86% (4% ahead of burn schedule)',
        resourceConstraint: 'Field dispatch crews at 104% load',
        riskAlert: 'Severe: Metro backhaul saturation threatening $4.2M enterprise SLAs.',
        recommendedAction: 'Approve $450K emergency E-Band wireless microwave bridge contract.'
      }
    },
    {
      id: 5,
      title: 'Monitor & Progress',
      subtitle: 'Executive Telemetry & Trajectory Forecast',
      agentRole: 'executive-reporter',
      agentName: 'Executive Reporting Agent',
      planviewCapability: 'Outcome Tracking & Executive Reporting',
      goal: 'Aggregate network telemetry, OKR status, and financial ROI into executive JSON dashboards and trajectory charts.',
      confidence: 93,
      status: 'On Track',
      moduleDetail: {
        badge: 'Executive JSON Aggregation',
        description: 'Aggregates KR health, portfolio contribution, and resource impact into JSON payloads for React dashboards.'
      },
      aiActions: {
        analyse: 'Consolidated 2,140 delivery user stories, 14,000 cell sites, and $54.0M capital investment into live telemetry.',
        predict: 'Overall Q4 OKR attainment projected at 76% (up 5% following 3G termination and fiber rebalancing).',
        recommend: 'Present 5G Standalone Edge Slicing enterprise traction to Board Investment Committee.',
        automate: 'Generated C-suite OKR digest with 1-click CSV export and formal BRD/RTM documentation.',
        optimise: 'Synthesized 8 strategic KPIs into executive Target vs. Predicted trajectory curves.'
      },
      simMetrics: {
        velocityTrend: '+8% recovery post-intervention',
        budgetBurn: '82% on-plan',
        resourceConstraint: 'Balanced across 9 of 11 delivery squads',
        riskAlert: 'Low: Network telemetry latency < 8 minutes across national NOC.',
        recommendedAction: 'Lock Q4 strategic scorecard for Board Telecom Committee.'
      }
    },
    {
      id: 6,
      title: 'Review & Continuous Improvement',
      subtitle: 'Subsea Cable & Tower Retrospective Learning',
      agentRole: 'retrospective-learning',
      agentName: 'Retrospective & Learning Agent',
      planviewCapability: 'Post-Mortem Synthesis & AI Learning',
      goal: 'Synthesize Project Runner execution logs and NOC incident reports into closed-loop vector knowledge chunks.',
      confidence: 90,
      status: 'On Track',
      moduleDetail: {
        badge: 'Root-Cause & Vector Ingestion',
        description: 'Synthesises Project Runner logs and Customer Feedback to generate root-cause analysis.'
      },
      aiActions: {
        analyse: 'Investigated Q3 Trans-Pacific subsea fiber severance incident and subsequent transit routing spikes.',
        predict: 'Multi-vendor diverse subsea consortium contracts will prevent 95% of future international transit cost surges.',
        recommend: 'Mandate automated BGP multi-homing failover tests every quarter across all Tier-1 gateways.',
        automate: 'Ingested 5-Whys and Ishikawa fishbone diagrams into AI Knowledge Base Pillar 1 & 4.',
        optimise: 'Calibrated Q1 2027 OKR templates with realistic municipal permitting buffers.'
      },
      simMetrics: {
        velocityTrend: '+16% cycle-over-cycle learning efficiency',
        budgetBurn: '96% final Q4 capital utilisation',
        resourceConstraint: 'Resolved for Q1 2027 planning cycle',
        riskAlert: 'None: Lessons permanently embedded in Enterprise Knowledge Base.',
        recommendedAction: 'Publish 5G Permitting Playbook to accelerate regional rollouts.'
      }
    }
  ],
  traceability: {
    1: [
      {
        id: 't-s1',
        title: 'Dominate National 5G Standalone & Ultra-Low Latency Edge',
        owner: 'Group CTO & EVP Networks',
        status: 'On Track',
        progress: 78,
        budget: '$32.0M',
        parentIds: [],
        childIds: ['t-o1', 't-o2'],
        ai: {
          analyse: 'Aligned with 59% of network capital expenditure.',
          predict: '86% likelihood of retaining #1 mobile network benchmark.',
          recommend: 'Accelerate C-band optical backhaul upgrades.',
          automate: 'Directly linked to Board Strategic Scorecard.',
          optimise: 'Rebalanced $1.8M from retired 3G network maintenance.'
        }
      },
      {
        id: 't-s2',
        title: 'Next-Gen AI Customer Experience & Zero-Touch BSS',
        owner: 'Chief Commercial Officer',
        status: 'At Risk',
        progress: 65,
        budget: '$22.0M',
        parentIds: [],
        childIds: ['t-o3'],
        ai: {
          analyse: 'Consumer churn elevated at 2.1% due to peak-hour streaming congestion.',
          predict: 'Predictive retention AI recovers $12.8M annualised customer lifetime value.',
          recommend: 'Pair real-time OSS network health alerts with customer care credit triggers.',
          automate: 'Synced with Enterprise CRM & Customer Experience lake.',
          optimise: 'Reprioritized proactive outreach over reactive call center support.'
        }
      }
    ],
    2: [
      {
        id: 't-o1',
        title: 'Accelerate 5G SA Metro Densification & Dark Fiber Backhaul',
        owner: 'VP 5G RAN & Transport',
        status: 'At Risk',
        progress: 64,
        budget: '$20.0M',
        parentIds: ['t-s1'],
        childIds: ['t-kr1'],
        ai: {
          analyse: 'Strong data growth; backhaul saturation at 94% on 2,400 macro sites.',
          predict: '72% attainment without urgent fiber transponder upgrades.',
          recommend: 'Fast-track 400G Dense WDM optical contracts.',
          automate: 'Continuous monitoring of cell site backhaul capacity.',
          optimise: 'Shifted 12 FTE from legacy 3G decommissioning to metro fiber.'
        }
      },
      {
        id: 't-o2',
        title: 'Enterprise Private 5G & Industrial Edge Slicing',
        owner: 'VP Enterprise Solutions',
        status: 'On Track',
        progress: 82,
        budget: '$12.0M',
        parentIds: ['t-s1'],
        childIds: ['t-kr2'],
        ai: {
          analyse: 'Enterprise private network pipeline up 42% YoY (Mining, Logistics, Healthcare).',
          predict: '91% probability of exceeding Q4 enterprise slicing ARR target.',
          recommend: 'Finalise carrier-grade SLA portal for automated slicing provisioning.',
          automate: 'Telemetry linked to customer edge portal.',
          optimise: 'Standardised 3 modular industry blueprints.'
        }
      },
      {
        id: 't-o3',
        title: 'Autonomous Customer Care & Proactive Churn Reduction',
        owner: 'Chief Commercial Officer',
        status: 'At Risk',
        progress: 68,
        budget: '$22.0M',
        parentIds: ['t-s2'],
        childIds: ['t-kr3', 't-kr4'],
        ai: {
          analyse: 'Postpaid churn rate currently at 2.1% against 1.0% target.',
          predict: 'Predictive AI intervention models can reduce churn by 45% in 60 days.',
          recommend: 'Deploy instant credit trigger for subscribers experiencing packet loss.',
          automate: 'Automated notification engine linked to live tower alarms.',
          optimise: 'Reduced inbound call handle time by 22%.'
        }
      }
    ],
    3: [
      {
        id: 't-kr1',
        title: 'Expand 5G C-Band Coverage from 62% to 85% Pop Coverage',
        owner: 'VP 5G RAN & Transport',
        status: 'At Risk',
        progress: 58,
        budget: '$14.5M',
        parentIds: ['t-o1'],
        childIds: ['t-i1'],
        ai: {
          analyse: 'Currently at 71% population coverage; fiber backhaul bottleneck in metro zones.',
          predict: 'Misses 85% target by 8% without E-band wireless bridge deployment.',
          recommend: 'Approve interim 80GHz wireless millimeter microwave bridges.',
          automate: 'Daily tower activation telemetry feeds OKR dashboard.',
          optimise: 'Parallelised optical fiber splicing across 3 regional contractors.'
        },
        businessProblem: {
          problemDescription: 'Peak-hour cell tower bandwidth congestion in 14 metro clusters causing 4.2% packet drops and subscriber streaming buffering.',
          impactedStakeholders: ['14.8M Mobile Subscribers', 'Enterprise Tier-1 WAN Clients', 'Field Maintenance Squads'],
          causalChainToDollarImpact: 'Cell tower bandwidth saturation -> 38% call center escalation -> 2.1% monthly subscriber churn -> $18.4M annualised revenue leakage.',
          rootCause: 'Dark fiber backhaul optical capacity constrained at 94% utilization during 18:00-21:00 peak.',
          targetRemediationTiming: 'Q1 2027 Sprint 6',
          metrics: [
            { indicator: 'Network Bandwidth Utilisation', baselineValue: '94% peak', targetValue: '< 72% optimal', metricType: 'Leading' },
            { indicator: 'Monthly Postpaid Subscriber Churn %', baselineValue: '2.1%', targetValue: '< 0.95%', metricType: 'Lagging' },
            { indicator: '5G Mid-Band Download Speed', baselineValue: '85 Mbps', targetValue: '340 Mbps', metricType: 'Leading' }
          ]
        }
      },
      {
        id: 't-kr2',
        title: 'Reduce Core Network Latency to < 18ms for Edge Slicing',
        owner: 'Head of Core Networks',
        status: 'On Track',
        progress: 84,
        budget: '$8.5M',
        parentIds: ['t-o2'],
        childIds: ['t-i2'],
        ai: {
          analyse: 'P95 latency currently measured at 16.2ms in top 6 edge nodes.',
          predict: '94% probability of achieving < 18ms target across all metro clusters.',
          recommend: 'Expand user plane function (UPF) nodes to 4 edge regional data centres.',
          automate: 'Continuous active synthetic ping probes linked to Datadog.',
          optimise: 'Optimised Linux kernel eBPF packet routing path.'
        }
      },
      {
        id: 't-kr3',
        title: 'Drop Postpaid Subscriber Churn from 2.1% to < 1.0%',
        owner: 'Chief Commercial Officer',
        status: 'At Risk',
        progress: 60,
        budget: '$12.0M',
        parentIds: ['t-o3'],
        childIds: ['t-i3'],
        ai: {
          analyse: 'Subscriber churn at 2.1% with highest concentration in congested metro clusters.',
          predict: 'Predictive churn interventions can recover $12.8M in lifetime subscriber value.',
          recommend: 'Deploy automated retention promotions based on network experience scoring.',
          automate: 'Real-time alert dispatch to VIP concierge retention desk.',
          optimise: 'Targeted data top-up incentives for affected business customers.'
        },
        businessProblem: {
          problemDescription: 'High-value postpaid mobile subscribers churn silently to competitors following repeated peak-hour video buffering and dropped calls.',
          impactedStakeholders: ['Postpaid Consumer Base', 'Digital Retention Marketing', 'Customer Care Reps'],
          causalChainToDollarImpact: 'Silent network micro-outages -> undetected dissatisfaction -> competitor number porting -> $12.8M annualised customer lifetime loss.',
          rootCause: 'BSS/CRM silos separated from real-time OSS network telemetry; missing automated trigger pipeline.',
          targetRemediationTiming: 'Q1 2027 Sprint 4',
          metrics: [
            { indicator: 'AI Churn Prediction Precision', baselineValue: '54%', targetValue: '91%', metricType: 'Leading' },
            { indicator: 'Postpaid Churn Rate', baselineValue: '2.1%', targetValue: '< 1.0%', metricType: 'Lagging' }
          ]
        }
      },
      {
        id: 't-kr4',
        title: 'Automate 70% of Field Dispatches via AI Self-Healing Network',
        owner: 'Head of Network AI & Automation',
        status: 'On Track',
        progress: 78,
        budget: '$10.0M',
        parentIds: ['t-o3'],
        childIds: ['t-i4'],
        ai: {
          analyse: 'Closed-loop automation resolving 64% of tower alarms without truck rolls.',
          predict: '88% likelihood of hitting 70% automated resolution by Q4 close.',
          recommend: 'Enable automatic antenna tilt re-tuning for temporary high-density events.',
          automate: 'ServiceNow ticket generation and resolution fully automated.',
          optimise: 'Saved $4.1M in field contractor truck roll expenses.'
        }
      }
    ],
    4: [
      {
        id: 't-i1',
        title: 'Dark Fiber Dense-WDM Upgrade Program',
        owner: 'Transmission Program Lead',
        status: 'At Risk',
        progress: 62,
        budget: '$14.5M',
        parentIds: ['t-kr1'],
        childIds: ['t-p1'],
        ai: {
          analyse: 'Optical hardware supply chain delays causing 3-week installation lag.',
          predict: 'Requires burst installation capacity to meet December target.',
          recommend: 'Contract 2 specialized optical splicing teams.',
          automate: 'Synced to Planview Portfolios milestone ledger.',
          optimise: 'Re-sequenced 8 regional routes to prioritize highest-traffic nodes.'
        }
      },
      {
        id: 't-i2',
        title: 'Edge MEC Orchestrator & Network Slicing Portal',
        owner: 'Edge Product Director',
        status: 'On Track',
        progress: 85,
        budget: '$8.5M',
        parentIds: ['t-kr2'],
        childIds: ['t-p2'],
        ai: {
          analyse: '14 enterprise trials active across healthcare and autonomous logistics.',
          predict: 'On schedule for commercial GA launch in November.',
          recommend: 'Publish developer open APIs for third-party low-latency app deployment.',
          automate: 'CI/CD pipeline automated with zero-downtime slice reconfiguration.',
          optimise: 'Reduced MEC provisioning time from 14 days to 4 minutes.'
        }
      },
      {
        id: 't-i3',
        title: 'Predictive Churn Retention & Real-Time Offer Engine',
        owner: 'Customer AI Product Owner',
        status: 'At Risk',
        progress: 63,
        budget: '$12.0M',
        parentIds: ['t-kr3'],
        childIds: ['t-p3'],
        ai: {
          analyse: 'Model precision at 76%; integrating raw radio signal telemetry.',
          predict: 'Feature engineering on packet drop will elevate precision to 91%.',
          recommend: 'Automate compensation billing credits directly into subscriber accounts.',
          automate: 'Webhook triggered on cell tower congestion alarm.',
          optimise: 'A/B tested 4 personalized proactive retention offers.'
        }
      },
      {
        id: 't-i4',
        title: 'SON (Self-Organizing Network) Automated Antenna Optimization',
        owner: 'RAN Automation Lead',
        status: 'On Track',
        progress: 80,
        budget: '$10.0M',
        parentIds: ['t-kr4'],
        childIds: ['t-p4'],
        ai: {
          analyse: 'Autonomous beamforming reducing inter-cell interference by 28%.',
          predict: 'Consistently maintains high throughput across 12,000 sectors.',
          recommend: 'Roll out automated beamforming to high-speed railway corridors.',
          automate: 'Hourly algorithmic antenna tilt re-balancing.',
          optimise: 'Eliminated 1,200 manual field engineering adjustments per month.'
        }
      }
    ],
    5: [
      {
        id: 't-p1',
        title: 'Epic: 400G Optical Transponder Rollout',
        owner: 'Fiber Backhaul Transport Squad',
        status: 'At Risk',
        progress: 56,
        budget: '$6.2M',
        parentIds: ['t-i1'],
        childIds: ['t-t1'],
        ai: {
          analyse: '114% utilization on optical transmission squad.',
          predict: '12-day schedule slip if 4 additional fiber techs are not assigned.',
          recommend: 'Borrow 4 certified optical engineers from Enterprise B2B WAN team.',
          automate: 'Jira blocker alarms active.',
          optimise: 'Split optical cutovers into staggered overnight maintenance windows.'
        }
      },
      {
        id: 't-p2',
        title: 'Epic: 5G SA Network Slice Gateway API',
        owner: 'Core Software Squad',
        status: 'On Track',
        progress: 88,
        budget: '$4.1M',
        parentIds: ['t-i2'],
        childIds: ['t-t1'],
        ai: {
          analyse: '3GPP Release 17 compliance verified; sub-10ms slice switching.',
          predict: 'Early delivery by Q4 Sprint 5.',
          recommend: 'Proceed with commercial tiering billing engine.',
          automate: 'Automated contract testing via Postman/Newman.',
          optimise: 'Reduced memory footprint on cloud-native 5G core by 18%.'
        }
      },
      {
        id: 't-p3',
        title: 'Epic: BSS Churn Propensity Model v2',
        owner: 'Subscriber Churn Squad',
        status: 'At Risk',
        progress: 60,
        budget: '$5.8M',
        parentIds: ['t-i3'],
        childIds: ['t-t2'],
        ai: {
          analyse: '92% capacity stress on data engineering pipeline.',
          predict: 'Model training pipeline delayed 8 days due to GPU cluster contention.',
          recommend: 'Spin up cloud burst GPU compute on Google Cloud Vertex AI.',
          automate: 'Daily retraining on subscriber call records.',
          optimise: 'Cut inference latency from 1.4s to 85ms.'
        }
      },
      {
        id: 't-p4',
        title: 'Epic: RAN Closed-Loop Automated Beamforming',
        owner: 'Field Automation Squad',
        status: 'On Track',
        progress: 82,
        budget: '$4.5M',
        parentIds: ['t-i4'],
        childIds: ['t-t2'],
        ai: {
          analyse: 'Active on 8,200 active antenna units with zero stability regressions.',
          predict: 'On track to exceed 70% dispatch automation target.',
          recommend: 'Expand to stadium and concert venue temporary clusters.',
          automate: 'Telemetry ingestion to Planview AgilePlace.',
          optimise: 'Cut manual drive-test verification hours by 44%.'
        }
      },
      {
        id: 't-p-orphan1',
        title: 'Epic: Legacy 3G Base Station Firmware Maintenance (Orphan)',
        owner: 'Legacy Maintenance Taskforce',
        status: 'At Risk',
        progress: 18,
        budget: '$1.8M',
        parentIds: [],
        childIds: [],
        isOrphan: true,
        ai: {
          analyse: 'Flagged by Stage 3 Alignment Agent: Zero alignment with 5G or customer OKRs.',
          predict: 'Consuming $1.8M budget and 12 FTE on 0.4% traffic volume.',
          recommend: 'Terminate program immediately and reallocate budget and 12 FTE to 5G Metro Backhaul.',
          automate: 'Alerted Executive Portfolio Director.',
          optimise: 'Reclaims $1.8M capital for critical fiber transponders.'
        }
      }
    ],
    6: [
      {
        id: 't-t1',
        title: 'RAN & Fiber Transport ART (54 FTE)',
        owner: 'RTE Nathan Cross',
        status: 'At Risk',
        progress: 68,
        budget: '$14.5M',
        parentIds: ['t-p1', 't-p2'],
        childIds: ['t-o-1'],
        squadLoad: { squadName: 'Fiber Backhaul Transport Squad', fte: 18, loadPct: 114 },
        ai: {
          analyse: '114% utilization on optical transmission squad; severe bottleneck.',
          predict: 'High burnout risk and deployment slip in 4 key metro clusters.',
          recommend: 'Rebalance 4 FTE from legacy network support and approve burst overtime.',
          automate: 'Real-time squad workload alerts active.',
          optimise: 'Re-sequenced sprint backlog to clear blocked optical splices.'
        }
      },
      {
        id: 't-t2',
        title: 'Digital BSS & Customer AI Train (38 FTE)',
        owner: 'RTE Maya Lin',
        status: 'On Track',
        progress: 84,
        budget: '$10.3M',
        parentIds: ['t-p3', 't-p4'],
        childIds: ['t-o-2'],
        squadLoad: { squadName: 'Subscriber Churn Squad', fte: 14, loadPct: 92 },
        ai: {
          analyse: '92% utilization; high sustained sprint velocity.',
          predict: 'Will deliver automated retention trigger engine on schedule.',
          recommend: 'Share AI feature store patterns with Enterprise B2B team.',
          automate: 'DORA deployment frequency 14/week.',
          optimise: 'Automated 88% of unit and integration test coverage.'
        }
      }
    ],
    7: [
      {
        id: 't-o-1',
        title: '+$42M 5G Enterprise Slicing ARR',
        owner: 'Chief Financial Officer',
        status: 'At Risk',
        progress: 66,
        budget: 'ROI 2.8x',
        parentIds: ['t-t1'],
        childIds: [],
        ai: {
          analyse: 'Contract pipeline at $38.2M; requires fiber backhaul completion to turn on.',
          predict: 'Recovers to 100% target if 400G transponders finish by Q1 Sprint 3.',
          recommend: 'Prioritise enterprise manufacturing plant private slices.',
          automate: 'Live revenue attribution linked to SAP S/4HANA.',
          optimise: 'ARPU expansion of 18% per connected enterprise device.'
        }
      },
      {
        id: 't-o-2',
        title: '-$16M Operational Cost via Autonomous Self-Healing',
        owner: 'Chief Operating Officer',
        status: 'On Track',
        progress: 86,
        budget: 'ROI 3.2x',
        parentIds: ['t-t2'],
        childIds: [],
        ai: {
          analyse: '$14.2M annualised operational savings realized to date.',
          predict: 'Exceeds Q4 target; truck roll reductions compounding.',
          recommend: 'Reinvest $3M savings into automated fiber monitoring robots.',
          automate: 'Outcome intelligence dashboard live.',
          optimise: 'Field dispatch efficiency improved by 34%.'
        }
      }
    ]
  },
  knowledgeBase: [
    {
      id: 'kb1',
      title: 'Historical Network Performance',
      metric: '78% Avg Attainment',
      trend: '+6% YoY',
      summary: 'Last 8 quarters show 91% attainment on 5G Core software releases vs 62% on physical fiber backhaul rollouts.',
      details: ['Q1-Q3 Avg Velocity: 48 pts/sprint', 'Permitting Delay Variance: +6.4 weeks on council approvals', 'Top Bottleneck: Optical splicing techs'],
      vectorChunks: [
        { id: 'hp-t1', text: '5G Core software deployments achieved 91% on-time milestone delivery with automated CI/CD gating across Q1-Q3 2026.', source: 'Release Train Logs' },
        { id: 'hp-t2', text: 'Physical dark fiber civil works experienced 6.4 weeks average delay caused by municipal utility trenching approval backlogs.', source: 'Field Engineering Post-Mortem' }
      ]
    },
    {
      id: 'kb2',
      title: 'Telco Market & Spectrum Data',
      metric: '18.4% 5G SA CAGR',
      trend: 'GSMA Global',
      summary: 'Global telecom benchmark indicates enterprise network slicing ARR expanding at 18.4% CAGR; competitor neo-telcos offering 4-minute virtual APNs.',
      details: ['Peer Avg 5G Download: 280 Mbps', 'Enterprise Private 5G Pipeline: +42% YoY', 'Spectrum Auction Price: $1.2B'],
      vectorChunks: [
        { id: 'md-t1', text: 'GSMA Intelligence reports enterprise private network contracts surged 42% in 2026, driven by automated manufacturing and port logistics.', source: 'GSMA Global Report' },
        { id: 'md-t2', text: 'Tier-1 Asian telecommunications operators achieved sub-15ms edge latency across 92% of metro cell sites via distributed UPF edge clouds.', source: 'Analysys Mason Benchmark' }
      ]
    },
    {
      id: 'kb3',
      title: 'Subscriber CX & Sentiment Feedback',
      metric: 'NPS 48 (+9)',
      trend: 'CSAT 4.4/5',
      summary: '28,000 monthly survey responses identify lightning-fast mobile speeds as top brand driver; streaming buffering during rush hour as top complaint.',
      details: ['Top Praise: Instant eSIM activation', 'Top Pain: Commute train buffering', 'Customer Service Call Volume: -22%'],
      vectorChunks: [
        { id: 'cf-t1', text: 'Customer survey analysis highlights that peak-hour video streaming buffering during evening commute drives 68% of negative churn sentiment.', source: 'Qualtrics Telco Feed' },
        { id: 'cf-t2', text: 'eSIM zero-touch automated onboarding drove 4.8/5 CSAT rating across 120,000 new digital activations in Q3.', source: 'Digital Channel Logs' }
      ]
    },
    {
      id: 'kb4',
      title: 'Project Runner & ROI Telemetry',
      metric: '2.9x Avg ROI',
      trend: '76% On-Time',
      summary: 'Autonomous Network AI delivered 3.4x direct capex ROI through truck roll avoidance; monolithic legacy billing upgrades averaged 5-month delays.',
      details: ['Best Runner: Automated Beamforming (3.6x ROI)', 'Delayed: Metro Fiber Route 4', 'Key Lesson: Decouple physical from logical'],
      vectorChunks: [
        { id: 'pr-t1', text: 'Closed-loop automated antenna tilt optimization generated $4.1M in field dispatch savings, achieving a 3.6x capex ROI in 12 months.', source: 'Planview Portfolios' },
        { id: 'pr-t2', text: 'Legacy BSS billing migration slipped 18 weeks due to proprietary relational database stored-procedure dependencies.', source: 'Enterprise Program Review' }
      ]
    },
    {
      id: 'kb5',
      title: 'Resource & Network Bandwidth Utilisation',
      metric: '92% Utilisation',
      trend: '1 Critical Bottleneck',
      summary: 'Optical transmission engineers running at 114% capacity stress; subscriber retention AI team operating at 92% capacity.',
      details: ['Peak Bottleneck: Fiber Backhaul Squad (114%)', 'Available Capacity: Enterprise WAN (78%)', 'Burndown Target: Rebalance 4 FTE'],
      vectorChunks: [
        { id: 'ru-t1', text: 'Optical transmission engineering squad experienced 114% allocation load across 8 simultaneous metropolitan fiber rollouts.', source: 'Workday Resource Management' },
        { id: 'ru-t2', text: 'Rebalancing 4 senior engineers from under-utilised Enterprise WAN teams reduces critical fiber backlog lead time by 32%.', source: 'Capacity & Alignment Model' }
      ]
    }
  ],
  smartRubric: {
    specific: { score: 86, feedback: 'Well-specified C-band coverage and latency thresholds with clear operational targets.' },
    measurable: { score: 88, feedback: 'Precise quantitative metrics (% pop coverage, latency in ms, churn percentage).' },
    achievable: { score: 78, feedback: 'Ambitious 85% coverage target requires prompt resolution of fiber backhaul bottleneck.' },
    relevant: { score: 94, feedback: 'Directly maps to board-level 5G market leadership and customer retention mandates.' },
    timeBound: { score: 90, feedback: 'Clear Q4 2026 delivery milestones with sprint-level trajectory monitoring.' },
    compositeScore: 87
  },
  regressionModel: {
    historicalDataPoints: [
      { quarter: 'Q1 2025', actual: 64, predicted: 62 },
      { quarter: 'Q2 2025', actual: 68, predicted: 67 },
      { quarter: 'Q3 2025', actual: 72, predicted: 71 },
      { quarter: 'Q4 2025', actual: 75, predicted: 74 },
      { quarter: 'Q1 2026', actual: 74, predicted: 76 },
      { quarter: 'Q2 2026', actual: 78, predicted: 77 },
      { quarter: 'Q3 2026', actual: 80, predicted: 79 },
      { quarter: 'Q4 2026', actual: 71, predicted: 76 }
    ],
    regressionEquation: 'y = -0.042x^2 + 1.28x + 64.2',
    rSquared: 0.884,
    predictedProbability: 76,
    confidenceInterval: [69, 83],
    stretchFactor: 1.18
  },
  graphDiagnostics: {
    orphanEpics: [
      {
        id: 't-p-orphan1',
        title: 'Epic: Legacy 3G Base Station Firmware Maintenance (Orphan)',
        budget: '$1.8M',
        recommendedParentId: 't-i1'
      }
    ],
    overAllocatedSquads: [
      {
        squadId: 'squad-t1',
        name: 'Fiber Backhaul Transport Squad',
        currentLoad: 114,
        maxCapacity: 100,
        bottleneckReason: '8 concurrent metro dark fiber installations with only 18 certified optical splicing engineers.'
      }
    ],
    cycleDetected: false,
    totalNodesTraversed: 22,
    unalignedSpend: '$1.8M'
  },
  cronJobs: [
    {
      id: 'cron-t1',
      name: 'Cell Tower Backhaul Bandwidth Radar',
      cronExpression: '*/5 * * * *',
      lastRun: '2 mins ago',
      nextRun: 'in 3 mins',
      status: 'active',
      monitoredMetric: 'Backhaul Bandwidth Utilisation (%)',
      threshold: '> 90%',
      anomalyDetected: true
    },
    {
      id: 'cron-t2',
      name: 'Real-Time Postpaid Subscriber Churn Sentinel',
      cronExpression: '0 * * * *',
      lastRun: '42 mins ago',
      nextRun: 'in 18 mins',
      status: 'active',
      monitoredMetric: 'Daily Port-Out Volume vs Baseline',
      threshold: '+15% delta',
      anomalyDetected: true
    }
  ],
  recentWebhooks: [
    {
      source: 'Datadog APM',
      event: 'tower_congestion_spike',
      triggerTime: '8 mins ago',
      payload: { towerCluster: 'Metro North #14', packetDropPct: 4.2, affectedSubscribers: 28400 }
    },
    {
      source: 'ServiceNow GRC',
      event: 'fiber_permit_delayed',
      triggerTime: '34 mins ago',
      payload: { council: 'City Center Precinct', delayWeeks: 3.5, impact: 'Trenching paused' }
    }
  ],
  executivePayload: {
    reportId: 'EXEC-REP-TELCO-Q4-2026',
    generatedAt: '2026-11-11T20:00:00Z',
    industry: 'Apex Telecommunications',
    quarter: 'Q4 2026',
    executiveSummary: {
      attainmentScore: 71,
      healthStatus: 'At Risk',
      totalCapitalAtRisk: '$18.4M',
      portfolioContributionROI: '2.8x Expected',
      criticalInterventionsRequired: 2
    },
    keyResultHealth: [
      { krId: 't-kr1', title: 'Expand 5G C-Band Coverage to 85%', probabilityPct: 68, status: 'At Risk', varianceVsTarget: '-17%' },
      { krId: 't-kr2', title: 'Reduce Core Latency < 18ms', probabilityPct: 94, status: 'On Track', varianceVsTarget: '+5%' },
      { krId: 't-kr3', title: 'Drop Postpaid Churn < 1.0%', probabilityPct: 70, status: 'At Risk', varianceVsTarget: '-11%' },
      { krId: 't-kr4', title: 'Automate 70% Field Dispatches', probabilityPct: 88, status: 'On Track', varianceVsTarget: '+3%' }
    ],
    resourceAllocationImpact: [
      { squadName: 'Fiber Backhaul Transport Squad', headcountFte: 18, allocationPct: 114, riskLevel: 'Critical' },
      { squadName: 'Subscriber Churn Squad', headcountFte: 14, allocationPct: 92, riskLevel: 'Medium' }
    ],
    strategicThemeAlignment: [
      { theme: 'Dominate National 5G Standalone & Ultra-Low Latency Edge', allocatedBudget: '$32.0M', connectedEpicsCount: 3, healthPct: 78 },
      { theme: 'Next-Gen AI Customer Experience & Zero-Touch BSS', allocatedBudget: '$22.0M', connectedEpicsCount: 2, healthPct: 65 }
    ]
  },
  retrospective: {
    incidentId: 'RETRO-2026-TELCO-Q3-01',
    krOrEpicName: 'Trans-Pacific Undersea Cable Cut (t-o1)',
    symptom: 'Dual subsea fiber cut caused 4.5 hours of degraded international streaming and $4.2M in emergency IP transit routing expenses.',
    fiveWhys: [
      'Why 1: Commercial fishing trawler dragged anchor across shallow coastal seabed.',
      'Why 2: The fiber armoring was insufficient for high-density shipping lane hazards.',
      'Why 3: The automated BGP failover to the Southern Cross cable hit transit capacity saturation.',
      'Why 4: Apex had not pre-purchased burst capacity headroom on alternate undersea routes.',
      'Why 5: Risk governance treated dual subsea fiber cuts as an improbable low-probability event without automated traffic rate-limiting.'
    ],
    fishbone: {
      people: ['NOC engineers manually toggling BGP routing tables under crisis', 'Executive decision delay on purchasing transit spot capacity'],
      process: ['Single-source reliance on primary undersea consortium without automated burst agreements'],
      technology: ['Lack of automated application-aware rate limiting on high-bandwidth 4K video traffic'],
      governance: ['Catastrophic black-swan disaster scenarios excluded from quarterly OKR risk reviews']
    },
    actionableLesson: 'Implement automated BGP multi-homing with pre-negotiated burst capacity and dynamic DPI video throttle to protect enterprise SLA traffic during fiber cuts.',
    ingestedIntoKnowledgeBase: true
  }
};
