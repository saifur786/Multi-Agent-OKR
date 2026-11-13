import { IndustryDataBundle, IndustryKey } from '../types/orchestration';
import { TELCO_DATA } from './telcoData';
import {
  BANKING_ORG_DIRECTORY,
  BANKING_POLICIES,
  BANKING_PROGRAMS,
  BANKING_DISASTERS,
  GLOBAL_DISASTER_TEMPLATES
} from './enterpriseGovernanceData';

export const INDUSTRY_DATA: Record<IndustryKey, IndustryDataBundle> = {
  Banking: {
    id: 'Banking',
    name: 'Global Horizon Bank',
    sector: 'Retail & Commercial Banking',
    quarter: 'Q4 2026',
    overallHealth: 'At Risk',
    attainment: 74,
    totalBudget: '$42.5M',
    activeAgents: 6,
    orgDirectory: BANKING_ORG_DIRECTORY,
    policies: BANKING_POLICIES,
    programs: BANKING_PROGRAMS,
    activeDisasters: [...BANKING_DISASTERS, ...GLOBAL_DISASTER_TEMPLATES],
    stages: [
      {
        id: 1,
        title: 'Define Organisational Strategy',
        subtitle: 'Business & IT Alignment',
        agentRole: 'strategy-explorer',
        agentName: 'Strategy & Ideation Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Translate board-level digital banking mandates into measurable Business & IT strategic themes.',
        confidence: 92,
        status: 'On Track',
        moduleDetail: {
          badge: 'RAG & Vector Retrieval',
          description: 'Queries Market Data & Historical Performance vectors via RAG to propose Strategic Themes.'
        },
        aiActions: {
          analyse: 'Evaluated 14 regulatory mandates (APRA CPS 230) and 3-year digital wealth growth benchmarks.',
          predict: 'AI-first self-service will reduce branch-servicing cost-to-income ratio by 4.2% over 6 quarters.',
          recommend: 'Shift 18% of legacy mainframe maintenance capex toward Cloud-Native Core & Instant Payments.',
          automate: 'Auto-generated 4 strategic themes in Planview Portfolios mapped to Business & IT capabilities.',
          optimise: 'Balanced risk-weighted investment mix: 55% Growth, 30% Regulatory/Resilience, 15% Efficiency.'
        },
        simMetrics: {
          velocityTrend: '+11% vs Q3 baseline',
          budgetBurn: '68% of Q4 allocation',
          resourceConstraint: 'Cloud Security Architects at 94% utilisation',
          riskAlert: 'Medium: Core banking API migration dependency on legacy vendor.',
          recommendedAction: 'Reallocate 2 senior integration squads from Branch Ops to Open Banking APIs.'
        }
      },
      {
        id: 2,
        title: 'Define Objectives & Key Results',
        subtitle: 'Outcome-Oriented OKRs',
        agentRole: 'okr-predictor',
        agentName: 'OKR Quality & Prediction Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Replace activity-based goals with measurable, outcome-focused Objectives and Key Results.',
        confidence: 88,
        status: 'On Track',
        moduleDetail: {
          badge: 'SMART & Regression Modeling',
          description: 'Evaluates SMART criteria and runs regression against historical KR attainment.'
        },
        aiActions: {
          analyse: 'Scanned 42 draft OKRs; flagged 11 as output-based (e.g., "Launch mobile app") rather than outcome-based.',
          predict: 'KR "Reduce mortgage approval time from 9 days to 48 hours" has an 81% probability of attainment.',
          recommend: 'Refine KR3 to "Increase digital-only onboarding completion from 54% to 78%".',
          automate: 'Auto-linked leading indicators (API latency, KYC drop-off) to real-time Planview KR scorecards.',
          optimise: 'Calibrated stretch targets using 8 quarters of historical retail banking attainment data.'
        },
        simMetrics: {
          velocityTrend: '+8% KR clarity score',
          budgetBurn: '71% of Q4 allocation',
          resourceConstraint: 'KYC/AML Compliance reviewers bottlenecked',
          riskAlert: 'Low: All 4 enterprise OKRs have assigned executive sponsors.',
          recommendedAction: 'Enable automated document verification to relieve KYC review queue.'
        }
      },
      {
        id: 3,
        title: 'Align Tasks & Work for Execution',
        subtitle: 'Epics, Features & Investments',
        agentRole: 'alignment-capacity',
        agentName: 'Alignment & Capacity Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Connect every Objective to funded Initiatives, Epics, Projects, and Agile Release Trains.',
        confidence: 85,
        status: 'At Risk',
        moduleDetail: {
          badge: '7-Layer Graph Traversal',
          description: 'Executes graph traversal across the 7 layers to detect orphan Epics and over-allocated squads.'
        },
        aiActions: {
          analyse: 'Mapped 28 active Epics and 14 capital projects; detected 3 orphan projects with zero OKR alignment.',
          predict: 'Defunding 2 low-impact legacy reporting projects frees $1.8M for Instant Payments.',
          recommend: 'Consolidate "Mobile Wallet v2" and "Tap-to-Pay" Epics under the Digital Payments Initiative.',
          automate: 'Synced Jira & Planview AgilePlace boards to update Epic completion % automatically.',
          optimise: 'Re-sequenced 6 cross-team dependencies to eliminate Q4 integration bottlenecks.'
        },
        simMetrics: {
          velocityTrend: '89% work-to-OKR alignment',
          budgetBurn: '76% of Q4 allocation',
          resourceConstraint: 'iOS/Android squads over-allocated by 14%',
          riskAlert: 'High: 3 orphan projects consuming $1.4M without OKR contribution.',
          recommendedAction: 'Pause orphan projects and redirect 6 engineers to Digital Onboarding Epic.'
        }
      },
      {
        id: 4,
        title: 'Execution & Risk Detection',
        subtitle: 'Velocity, Burn & Constraints',
        agentRole: 'risk-sentinel',
        agentName: 'Risk Detection Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Continuously monitor delivery signals to detect which Objectives are likely to miss targets.',
        confidence: 79,
        status: 'At Risk',
        moduleDetail: {
          badge: 'Cron & Webhook Risk Radar',
          description: 'Runs scheduled cron/webhook jobs evaluating sprint velocity, budget burn rate, and resource utilisation.'
        },
        aiActions: {
          analyse: 'Evaluated sprint velocity, $14.2M Q4 burn rate, and 96% engineering utilisation across 12 squads.',
          predict: 'KR "Reduce mortgage approval to 48h" is projected to miss target by 18% due to Credit Engine delays.',
          recommend: 'Descope non-critical commercial lending features and add 1 automated QA squad.',
          automate: 'Triggered real-time Slack/Teams executive risk alerts and updated Planview Risk Register.',
          optimise: 'Simulated 3 capacity-shift scenarios; Option B recovers 14% schedule slippage in 3 weeks.'
        },
        simMetrics: {
          velocityTrend: '-9% sprint velocity dip',
          budgetBurn: '84% (6% ahead of pace)',
          resourceConstraint: 'Credit Engine Backend Devs at 108% load',
          riskAlert: 'Critical: Mortgage Automation KR projected at 62% attainment.',
          recommendedAction: 'Approve $320K burst capacity for Credit Engine API testing.'
        }
      },
      {
        id: 5,
        title: 'Monitor & Progress',
        subtitle: 'Executive Telemetry & Dashboards',
        agentRole: 'executive-reporter',
        agentName: 'Executive Reporting Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Generate real-time executive dashboards showing OKR health, KR attainment, and portfolio ROI.',
        confidence: 94,
        status: 'On Track',
        moduleDetail: {
          badge: 'Executive JSON Aggregation',
          description: 'Aggregates KR health, portfolio contribution, and resource impact into JSON payloads for React dashboards.'
        },
        aiActions: {
          analyse: 'Aggregated 1,420 delivery milestones, 18 KRs, and $42.5M portfolio spend into live telemetry.',
          predict: 'Overall Q4 Enterprise OKR attainment forecasted at 78% (up 4% after Risk Sentinel intervention).',
          recommend: 'Highlight "Digital Wealth NPS +12 pts" in Board pack as top-performing investment.',
          automate: 'Published weekly C-suite OKR digest with drill-down traceability to Jira Epics.',
          optimise: 'Filtered out 35% vanity metrics to focus leadership attention on 6 leading outcome KPIs.'
        },
        simMetrics: {
          velocityTrend: '+6% recovery post-intervention',
          budgetBurn: '79% on-plan',
          resourceConstraint: 'Balanced across 8 of 10 portfolios',
          riskAlert: 'Low: Telemetry latency < 15 minutes across all core systems.',
          recommendedAction: 'Lock Q4 executive scorecard for upcoming Board Risk Committee.'
        }
      },
      {
        id: 6,
        title: 'Review & Continuous Improvement',
        subtitle: 'Retrospective & Learning Loop',
        agentRole: 'retrospective-learning',
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Perform retrospective root-cause analysis on succeeded/failed OKRs to improve next-cycle planning.',
        confidence: 91,
        status: 'On Track',
        moduleDetail: {
          badge: 'Root-Cause & Vector Ingestion',
          description: 'Synthesises Project Runner logs and Customer Feedback to generate root-cause analysis.'
        },
        aiActions: {
          analyse: 'Audited 24 closed OKRs: 16 achieved (>70%), 5 partial, 3 missed due to third-party vendor delays.',
          predict: 'Applying Q4 lessons to Q1 2027 OKRs increases predicted attainment accuracy by 15%.',
          recommend: 'Mandate vendor SLA buffers for all Regulatory & Core Banking KRs in Q1 2027.',
          automate: 'Archived root-cause tags into Planview Knowledge Base for future Strategy Explorer queries.',
          optimise: 'Generated 5 pre-calibrated Q1 2027 draft OKRs based on top-performing squad velocity.'
        },
        simMetrics: {
          velocityTrend: '+14% cycle-over-cycle learning',
          budgetBurn: '97% final Q4 utilisation',
          resourceConstraint: 'Resolved for Q1 planning',
          riskAlert: 'None: Retrospective insights ingested into AI Knowledge Base.',
          recommendedAction: 'Adopt AI-calibrated Q1 2027 OKR templates across all 4 business units.'
        }
      }
    ],
    traceability: {
      1: [
        { id: 'b-s1', title: 'Become #1 Digital-First Retail Bank', owner: 'CEO & Group CIO', status: 'On Track', progress: 82, budget: '$24.0M', parentIds: [], childIds: ['b-o1', 'b-o2'], ai: { analyse: 'Aligned with 68% of digital capex.', predict: '84% likelihood of market share gain.', recommend: 'Maintain Cloud Core priority.', automate: 'Linked to Board Scorecard.', optimise: 'Rebalanced 10% from branch ops.' } },
        { id: 'b-s2', title: 'Zero-Trust Operational Resilience', owner: 'CRO & CISO', status: 'At Risk', progress: 65, budget: '$18.5M', parentIds: [], childIds: ['b-o3'], ai: { analyse: 'APRA CPS 230 compliance at 65%.', predict: '2-week buffer needed for DR drill.', recommend: 'Prioritise automated failover.', automate: 'Synced with GRC Risk Register.', optimise: 'Shifted 3 SecOps engineers.' } }
      ],
      2: [
        { id: 'b-o1', title: 'Accelerate Digital Mortgage & Onboarding', owner: 'VP Retail Banking', status: 'At Risk', progress: 68, budget: '$14.2M', parentIds: ['b-s1'], childIds: ['b-kr1', 'b-kr2'], ai: { analyse: 'Strong demand; backend latency.', predict: '71% attainment without intervention.', recommend: 'Focus on Credit Engine API.', automate: 'Auto-tracks funnel drop-off.', optimise: 'Streamlined 4 approval steps.' } },
        { id: 'b-o2', title: 'Elevate Digital Wealth & Self-Service', owner: 'Head of Wealth', status: 'On Track', progress: 88, budget: '$9.8M', parentIds: ['b-s1'], childIds: ['b-kr3'], ai: { analyse: 'NPS trending +12 pts.', predict: '93% attainment probability.', recommend: 'Expand AI robo-advisor.', automate: 'Live CSAT ingestion.', optimise: 'Reduced support cost by 19%.' } },
        { id: 'b-o3', title: 'Achieve 99.99% Core Payment Uptime', owner: 'VP Infrastructure', status: 'On Track', progress: 79, budget: '$18.5M', parentIds: ['b-s2'], childIds: ['b-kr4'], ai: { analyse: 'Zero P1 incidents in 60 days.', predict: '90% attainment.', recommend: 'Complete multi-region chaos test.', automate: 'PagerDuty telemetry linked.', optimise: 'Automated incident triage.' } }
      ],
      3: [
        { id: 'b-kr1', title: 'Cut Mortgage Approval from 9d to 48h', owner: 'Mortgage Tribe Lead', status: 'At Risk', progress: 58, budget: '$8.4M', parentIds: ['b-o1'], childIds: ['b-i1'], ai: { analyse: 'Currently at 4.1 days average.', predict: 'Misses 48h target by 18%.', recommend: 'Automate income verification.', automate: 'Daily SLA breach alerts.', optimise: 'Parallelised credit checks.' } },
        { id: 'b-kr2', title: 'Increase Digital Onboarding to 78%', owner: 'Onboarding Lead', status: 'On Track', progress: 76, budget: '$5.8M', parentIds: ['b-o1'], childIds: ['b-i2'], ai: { analyse: 'Up from 54% to 72%.', predict: '86% chance to hit 78%.', recommend: 'Simplify eKYC selfie step.', automate: 'Funnel analytics active.', optimise: 'A/B tested 3 UI flows.' } },
        { id: 'b-kr3', title: 'Lift Self-Service Resolution to 75%', owner: 'CX Ops Lead', status: 'On Track', progress: 84, budget: '$9.8M', parentIds: ['b-o2'], childIds: ['b-i3'], ai: { analyse: 'Currently at 71%.', predict: '95% attainment.', recommend: 'Train Anvi bot on tax FAQs.', automate: 'Auto-resolves 62% of chats.', optimise: 'Reduced call centre handle time.' } },
        { id: 'b-kr4', title: 'Reduce Payment API Latency < 120ms', owner: 'Payments Architect', status: 'On Track', progress: 81, budget: '$18.5M', parentIds: ['b-o3'], childIds: ['b-i4'], ai: { analyse: 'P95 latency at 128ms.', predict: '89% attainment.', recommend: 'Enable edge caching.', automate: 'Datadog APM linked.', optimise: 'Cut DB query overhead 22%.' } }
      ],
      4: [
        { id: 'b-i1', title: 'AI-Powered Mortgage Decisioning', owner: 'Lending Program Mgr', status: 'At Risk', progress: 60, budget: '$8.4M', parentIds: ['b-kr1'], childIds: ['b-p1'], ai: { analyse: '2-week slip in Credit Engine.', predict: 'Needs burst QA capacity.', recommend: 'Add 1 automated QA squad.', automate: 'Synced to Planview Portfolios.', optimise: 'Reprioritised 14 user stories.' } },
        { id: 'b-i2', title: 'Frictionless Mobile eKYC', owner: 'Digital Channel Mgr', status: 'On Track', progress: 78, budget: '$5.8M', parentIds: ['b-kr2'], childIds: ['b-p2'], ai: { analyse: 'On schedule for Nov release.', predict: 'High adoption expected.', recommend: 'Roll out to 100% iOS users.', automate: 'Feature flags automated.', optimise: 'Cut SDK size by 30%.' } },
        { id: 'b-i3', title: 'Conversational Banking Assistant', owner: 'AI Product Owner', status: 'On Track', progress: 86, budget: '$9.8M', parentIds: ['b-kr3'], childIds: ['b-p3'], ai: { analyse: '42k monthly active users.', predict: 'Exceeds Q4 target.', recommend: 'Add card-freeze intent.', automate: 'Continuous NLP retraining.', optimise: '94% intent accuracy.' } },
        { id: 'b-i4', title: 'Cloud-Native Instant Payments', owner: 'Core Payments Mgr', status: 'On Track', progress: 80, budget: '$18.5M', parentIds: ['b-kr4'], childIds: ['b-p4'], ai: { analyse: 'NPP integration complete.', predict: 'On track for Q4 sign-off.', recommend: 'Finalise DR failover test.', automate: 'CI/CD pipeline gated.', optimise: 'Reduced cloud compute 14%.' } }
      ],
      5: [
        { id: 'b-p1', title: 'Epic: Credit Engine API v3', owner: 'Squad Alpha', status: 'At Risk', progress: 55, budget: '$4.2M', parentIds: ['b-i1'], childIds: ['b-t1'], ai: { analyse: 'Blocked by legacy mainframe.', predict: '10-day delay risk.', recommend: 'Use mock sandbox for UI.', automate: 'Jira blockers flagged.', optimise: 'Split into 2 smaller releases.' } },
        { id: 'b-p2', title: 'Epic: Biometric ID Verification', owner: 'Squad Beta', status: 'On Track', progress: 82, budget: '$3.1M', parentIds: ['b-i2'], childIds: ['b-t2'], ai: { analyse: '99.2% match accuracy.', predict: 'On-time delivery.', recommend: 'Proceed to prod.', automate: 'Automated regression passed.', optimise: 'Sub-2s verification.' } },
        { id: 'b-p3', title: 'Epic: Anvi Support Chatbot', owner: 'Squad Gamma', status: 'On Track', progress: 89, budget: '$4.5M', parentIds: ['b-i3'], childIds: ['b-t2'], ai: { analyse: 'CSAT 4.6/5.0.', predict: 'Early completion.', recommend: 'Expand to Wealth.', automate: 'Auto-escalation to human.', optimise: 'Zero hallucination incidents.' } },
        { id: 'b-p4', title: 'Epic: Kafka Event Mesh', owner: 'Squad Delta', status: 'On Track', progress: 79, budget: '$6.8M', parentIds: ['b-i4'], childIds: ['b-t1'], ai: { analyse: 'Throughput 15k TPS.', predict: 'Meets SLA.', recommend: 'Complete load test.', automate: 'Terraform IaC deployed.', optimise: '18% lower memory footprint.' } },
        { id: 'b-p-orphan1', title: 'Epic: Legacy Mainframe Batch Extractor (Orphan)', owner: 'COBOL Custodians', status: 'At Risk', progress: 24, budget: '$1.4M', parentIds: [], childIds: [], isOrphan: true, ai: { analyse: 'Detected by Stage 3 Agent: Zero OKR linkage.', predict: 'Burn rate $120k/sprint without outcome.', recommend: 'Defund or attach to b-i1 (AI Decisioning).', automate: 'Flagged in Alignment Register.', optimise: 'Reclaim 6 engineers for Core API.' } }
      ],
      6: [
        { id: 'b-t1', title: 'Core Banking & Payments ART (42 FTE)', owner: 'RTE Sarah Chen', status: 'At Risk', progress: 66, budget: '$11.0M', parentIds: ['b-p1', 'b-p4'], childIds: ['b-o-1'], squadLoad: { squadName: 'Credit Engine Backend', fte: 14, loadPct: 108 }, ai: { analyse: '108% utilisation on Backend.', predict: 'Burnout risk in 3 weeks.', recommend: 'Shift 2 devs from Branch Ops.', automate: 'Capacity alerts active.', optimise: 'Balanced sprint WIP limits.' } },
        { id: 'b-t2', title: 'Digital Channels & AI Squads (36 FTE)', owner: 'RTE Marcus Vance', status: 'On Track', progress: 85, budget: '$7.6M', parentIds: ['b-p2', 'b-p3'], childIds: ['b-o-2'], squadLoad: { squadName: 'Digital Channels Squad', fte: 18, loadPct: 88 }, ai: { analyse: '88% healthy utilisation.', predict: 'High sustained velocity.', recommend: 'Share AI patterns.', automate: 'DORA metrics tracked.', optimise: 'Deployment freq 12/week.' } }
      ],
      7: [
        { id: 'b-o-1', title: '+$18M Net New Mortgage Volume', owner: 'CFO', status: 'At Risk', progress: 64, budget: 'ROI 2.4x', parentIds: ['b-t1'], childIds: [], ai: { analyse: 'Trailing target by $3.1M.', predict: 'Recovers if API v3 ships.', recommend: 'Prioritise broker portal.', automate: 'Revenue attribution live.', optimise: 'CAC reduced by 12%.' } },
        { id: 'b-o-2', title: '-22% Cost-to-Serve & +12 NPS', owner: 'COO', status: 'On Track', progress: 88, budget: 'ROI 3.1x', parentIds: ['b-t2'], childIds: [], ai: { analyse: '$4.8M annualised savings.', predict: 'Exceeds Q4 target.', recommend: 'Reinvest savings in AI.', automate: 'Outcome Intelligence live.', optimise: 'Top-quartile industry NPS.' } }
      ]
    },
    knowledgeBase: [
      {
        id: 'kb1',
        title: 'Historical Performance',
        metric: '76% Avg Attainment',
        trend: '+4% YoY',
        summary: 'Last 8 quarters show 84% attainment on Digital Channel OKRs vs 64% on Core Mainframe modernisation.',
        details: ['Q1-Q3 Avg Velocity: 42 pts/sprint', 'Budget Variance: +3.2% overage on legacy', 'Top Bottleneck: Compliance sign-off'],
        vectorChunks: [
          { id: 'hp-1', text: 'Digital channel initiatives delivered 84% average attainment across Q1-Q3 2026 with 42 story pts/sprint.', source: 'Jira Sprint History' },
          { id: 'hp-2', text: 'Core mainframe migrations experienced 4.5 months average delay due to unmocked downstream vendor dependencies.', source: 'Post-Mortem DB' }
        ]
      },
      {
        id: 'kb2',
        title: 'Market Data',
        metric: '6.2% Digital Shift',
        trend: 'APRA CPS 230',
        summary: 'Competitor neo-banks average 36-hour mortgage approvals; Open Banking API adoption up 34% YoY.',
        details: ['Peer Avg Mortgage SLA: 2.1 days', 'Regulatory Deadline: July 2026', 'Digital Wealth CAGR: 14.5%'],
        vectorChunks: [
          { id: 'md-1', text: 'APRA CPS 230 operational resilience standard requires demonstrable multi-region failover and critical service SLAs by July 2026.', source: 'Regulatory Filing' },
          { id: 'md-2', text: 'Australian neo-bank peer benchmark indicates digital loan origination SLA dropped to 36 hours in Q3 2026.', source: 'Gartner FinServ Index' }
        ]
      },
      {
        id: 'kb3',
        title: 'Customer Feedback',
        metric: 'NPS 52 (+7)',
        trend: 'CSAT 4.3/5',
        summary: '14,200 survey responses highlight fast mobile onboarding as top strength; document upload friction as #1 pain point.',
        details: ['Top Praise: Instant card freeze', 'Top Pain: Mortgage income proof', 'Support Ticket Drop: -18%'],
        vectorChunks: [
          { id: 'cf-1', text: 'Customer survey NPS increased to +52. Highest friction driver remains income verification document upload for lending.', source: 'Qualtrics CX Feed' },
          { id: 'cf-2', text: 'Instant virtual card generation via Anvi chatbot drove 4.6/5 CSAT rating across 28,000 retail interactions.', source: 'Anvi CX Logs' }
        ]
      },
      {
        id: 'kb4',
        title: 'Project Runner & Outcome',
        metric: '2.7x Avg ROI',
        trend: '71% On-Time',
        summary: 'Cloud-native initiatives delivered 2.9x ROI; monolithic vendor upgrades averaged 4.5-month delays.',
        details: ['Best Runner: Anvi Chatbot (3.4x ROI)', 'Delayed: Mainframe Batch v4', 'Lesson: Decouple via APIs'],
        vectorChunks: [
          { id: 'pr-1', text: 'Conversational Banking Anvi Chatbot delivered $4.8M annualised cost-to-serve reduction, representing 3.4x direct capex ROI.', source: 'Planview Portfolios' },
          { id: 'pr-2', text: 'Credit Decisioning Engine v3 experienced 14 days schedule slip caused by test data provisioning bottlenecks.', source: 'Release Train Logs' }
        ]
      },
      {
        id: 'kb5',
        title: 'Resources & Utilisation',
        metric: '94% Utilisation',
        trend: '2 Bottlenecks',
        summary: '78 FTEs across 2 ARTs. Cloud Security and Credit Engine Backend squads are over-allocated (>100%).',
        details: ['Backend Devs: 108% load', 'QA Automation: 96% load', 'Available Buffer: 4 FTEs in Branch Ops'],
        vectorChunks: [
          { id: 'ru-1', text: 'Credit Engine Backend squad has 14 allocated engineers working at 108% capacity, risking delivery fatigue.', source: 'Planview Resource Management' },
          { id: 'ru-2', text: 'Branch Operations team retains 4 senior integration engineers available for burst capacity reassignment.', source: 'Workday Skills Matrix' }
        ]
      }
    ],
    smartRubric: {
      specific: { score: 92, feedback: 'Action-oriented verb and explicit mortgage turnaround scope.' },
      measurable: { score: 96, feedback: 'Numeric baseline (9 days) and target metric (48 hours) defined.' },
      achievable: { score: 78, feedback: 'Stretch target requires backend automation; regression model confirms 81% likelihood.' },
      relevant: { score: 95, feedback: 'Directly powers +$18M net new mortgage loan volume outcome.' },
      timeBound: { score: 90, feedback: 'Target bound to end of Q4 2026 delivery cycle.' },
      compositeScore: 90
    },
    regressionModel: {
      historicalDataPoints: [
        { quarter: 'Q4 2025', actual: 68, predicted: 66 },
        { quarter: 'Q1 2026', actual: 72, predicted: 70 },
        { quarter: 'Q2 2026', actual: 75, predicted: 74 },
        { quarter: 'Q3 2026', actual: 80, predicted: 79 }
      ],
      regressionEquation: 'Attainment = 1.14 * (SprintVelocity) + 12.4',
      rSquared: 0.88,
      predictedProbability: 81,
      confidenceInterval: [74, 88],
      stretchFactor: 1.25
    },
    graphDiagnostics: {
      orphanEpics: [
        {
          id: 'b-p-orphan1',
          title: 'Epic: Legacy Mainframe Batch Extractor (Orphan)',
          budget: '$1.4M',
          recommendedParentId: 'b-i1'
        }
      ],
      overAllocatedSquads: [
        {
          squadId: 'credit-engine-backend',
          name: 'Credit Engine Backend',
          currentLoad: 108,
          maxCapacity: 100,
          bottleneckReason: 'Over-allocated across Credit API v3 and Kafka Event Mesh'
        }
      ],
      cycleDetected: false,
      totalNodesTraversed: 20,
      unalignedSpend: '$1.4M'
    },
    cronJobs: [
      {
        id: 'cron-vel',
        name: 'Sprint Velocity & Burndown Evaluator',
        cronExpression: '*/15 * * * *',
        lastRun: '10 mins ago',
        nextRun: 'in 5 mins',
        status: 'active',
        monitoredMetric: 'Squad Story Points / Sprint',
        threshold: '-8% vs Baseline',
        anomalyDetected: true
      },
      {
        id: 'cron-burn',
        name: 'Capex / Opex Burn Rate Sentinel',
        cronExpression: '0 */4 * * *',
        lastRun: '2 hours ago',
        nextRun: 'in 2 hours',
        status: 'idle',
        monitoredMetric: 'Quarterly Budget Consumption',
        threshold: '> 6% Ahead of Schedule',
        anomalyDetected: true
      },
      {
        id: 'cron-res',
        name: 'Resource Contention & Heatmap Scanner',
        cronExpression: '0 8 * * 1-5',
        lastRun: 'Today 08:00',
        nextRun: 'Tomorrow 08:00',
        status: 'active',
        monitoredMetric: 'FTE Allocation %',
        threshold: '> 100% Load',
        anomalyDetected: true
      }
    ],
    recentWebhooks: [
      {
        source: 'Jira Software',
        event: 'sprint.velocity.dropped',
        triggerTime: '12 mins ago',
        payload: { sprintId: 'SP-2026-Q4-S3', squad: 'Credit Engine', dropPercentage: 9.2, blockerCount: 3 }
      },
      {
        source: 'Datadog APM',
        event: 'latency.sla.breach',
        triggerTime: '34 mins ago',
        payload: { service: 'mortgage-decision-service', p95Latency: '240ms', threshold: '120ms' }
      },
      {
        source: 'Planview AgilePlace',
        event: 'epic.blocked',
        triggerTime: '1 hour ago',
        payload: { epicId: 'b-p1', blocker: 'Mainframe Test Harness Offline', impactedOKRs: ['b-kr1'] }
      }
    ],
    executivePayload: {
      reportId: 'EXEC-REP-BANKING-Q4-2026',
      generatedAt: '2026-11-10T16:00:00Z',
      industry: 'Global Horizon Bank',
      quarter: 'Q4 2026',
      executiveSummary: {
        attainmentScore: 74,
        healthStatus: 'At Risk',
        totalCapitalAtRisk: '$8.4M',
        portfolioContributionROI: '2.4x Expected',
        criticalInterventionsRequired: 2
      },
      keyResultHealth: [
        { krId: 'b-kr1', title: 'Cut Mortgage Approval from 9d to 48h', probabilityPct: 81, status: 'At Risk', varianceVsTarget: '-18%' },
        { krId: 'b-kr2', title: 'Increase Digital Onboarding to 78%', probabilityPct: 86, status: 'On Track', varianceVsTarget: '+4%' },
        { krId: 'b-kr3', title: 'Lift Self-Service Resolution to 75%', probabilityPct: 95, status: 'On Track', varianceVsTarget: '+9%' },
        { krId: 'b-kr4', title: 'Reduce Payment API Latency < 120ms', probabilityPct: 89, status: 'On Track', varianceVsTarget: '+1%' }
      ],
      resourceAllocationImpact: [
        { squadName: 'Credit Engine Backend', headcountFte: 14, allocationPct: 108, riskLevel: 'Critical' },
        { squadName: 'Digital Channels Squad', headcountFte: 18, allocationPct: 88, riskLevel: 'Low' },
        { squadName: 'Security & Compliance', headcountFte: 8, allocationPct: 94, riskLevel: 'Medium' }
      ],
      strategicThemeAlignment: [
        { theme: 'Become #1 Digital-First Retail Bank', allocatedBudget: '$24.0M', connectedEpicsCount: 4, healthPct: 82 },
        { theme: 'Zero-Trust Operational Resilience', allocatedBudget: '$18.5M', connectedEpicsCount: 3, healthPct: 65 }
      ]
    },
    retrospective: {
      incidentId: 'RETRO-2026-Q4-01',
      krOrEpicName: 'Cut Mortgage Approval from 9d to 48h (b-kr1)',
      symptom: 'Delivery velocity slowed by 9% and P95 API latency doubled to 240ms, threatening the 48-hour approval SLA.',
      fiveWhys: [
        'Why 1: Credit Engine API v3 slipped 2 weeks behind planned delivery schedule.',
        'Why 2: Developers were blocked waiting for mock sandbox responses from third-party credit bureau.',
        'Why 3: The legacy test environment lacked synthetic mock contracts for edge-case KYC inquiries.',
        'Why 4: Synthetic data generation was deprioritized during initial sprint planning in favor of UI features.',
        'Why 5: Lack of an automated contract-testing framework between the lending squad and external bureau.'
      ],
      fishbone: {
        people: ['Credit Engine Backend squad overloaded at 108%', 'Lack of dedicated test-automation engineer'],
        process: ['No pre-sprint dependency handshake with external vendor', 'Late manual security sign-offs'],
        technology: ['Legacy mainframe batch interface required synchronous polling', 'Lack of API edge caching'],
        governance: ['Orphan legacy reporting project consuming 6 FTEs that could have supported API testing']
      },
      actionableLesson: 'Mandate consumer-driven contract testing (Pact) and allocate 15% burst capacity to synthetic test harnesses before external vendor integrations.',
      ingestedIntoKnowledgeBase: true
    }
  },

  'IT Consulting': {
    id: 'IT Consulting',
    name: 'Apex Digital Partners',
    sector: 'Enterprise IT & Cloud Consulting',
    quarter: 'Q4 2026',
    overallHealth: 'On Track',
    attainment: 86,
    totalBudget: '$18.8M',
    activeAgents: 6,
    stages: [
      {
        id: 1,
        title: 'Define Organisational Strategy',
        subtitle: 'Business & IT Alignment',
        agentRole: 'strategy-explorer',
        agentName: 'Strategy & Ideation Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Pivot practice mix from legacy staff-augmentation to high-margin GenAI & Cloud Transformation.',
        confidence: 95,
        status: 'On Track',
        moduleDetail: {
          badge: 'RAG & Vector Retrieval',
          description: 'Queries Market Data & Historical Performance vectors via RAG to propose Strategic Themes.'
        },
        aiActions: {
          analyse: 'Analysed 120 enterprise client RFPs and margin profiles across ANZ & APAC.',
          predict: 'AI-accelerated delivery pods will lift gross margin from 34% to 41% within 3 quarters.',
          recommend: 'Establish dedicated "Planview + GenAI Governance" practice with $4.2M seed investment.',
          automate: 'Created 3 practice-level strategic themes in Planview linked to partner P&L targets.',
          optimise: 'Balanced bench investment: 60% AI/Cloud, 25% ERP Modernisation, 15% Cyber.'
        },
        simMetrics: {
          velocityTrend: '+15% proposal win rate',
          budgetBurn: '64% of Q4 allocation',
          resourceConstraint: 'Principal AI Architects at 92% billable',
          riskAlert: 'Low: Strong pipeline coverage (3.4x Q4 target).',
          recommendedAction: 'Fast-track 12 senior cloud engineers through GenAI certification.'
        }
      },
      {
        id: 2,
        title: 'Define Objectives & Key Results',
        subtitle: 'Outcome-Oriented OKRs',
        agentRole: 'okr-predictor',
        agentName: 'OKR Quality & Prediction Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Shift partner scorecards from billable hours to client business outcomes & reusable IP.',
        confidence: 90,
        status: 'On Track',
        moduleDetail: {
          badge: 'SMART & Regression Modeling',
          description: 'Evaluates SMART criteria and runs regression against historical KR attainment.'
        },
        aiActions: {
          analyse: 'Reviewed 32 practice OKRs; replaced "Deliver 10 workshops" with measurable client value KRs.',
          predict: 'KR "Achieve 82% billable utilisation with >40% gross margin" has 89% attainment likelihood.',
          recommend: 'Add leading KR: "Deploy reusable AI accelerators in 65% of new client engagements".',
          automate: 'Connected PSA time-tracking & CRM pipeline directly to Planview KR progress.',
          optimise: 'Calibrated regional targets for Sydney, Melbourne, and Singapore hubs.'
        },
        simMetrics: {
          velocityTrend: '+12% outcome alignment',
          budgetBurn: '66% of Q4 allocation',
          resourceConstraint: 'Healthy bench at 11%',
          riskAlert: 'Low: All practice leads signed off on Q4 KRs.',
          recommendedAction: 'Incentivise IP reuse in Q4 partner bonus structure.'
        }
      },
      {
        id: 3,
        title: 'Align Tasks & Work for Execution',
        subtitle: 'Epics, Features & Investments',
        agentRole: 'alignment-capacity',
        agentName: 'Alignment & Capacity Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Align client delivery engagements, internal IP accelerators, and upskilling programs to OKRs.',
        confidence: 88,
        status: 'On Track',
        moduleDetail: {
          badge: '7-Layer Graph Traversal',
          description: 'Executes graph traversal across the 7 layers to detect orphan Epics and over-allocated squads.'
        },
        aiActions: {
          analyse: 'Mapped 45 client engagements and 8 internal IP Epics; identified 2 duplicate cloud-migration toolkits.',
          predict: 'Merging duplicate toolkits saves 1,200 engineering hours in Q4.',
          recommend: 'Standardise on "Apex Cloud Accelerator v3" across all Financial Services clients.',
          automate: 'Synced Planview Resource Management with Jira & GitHub Copilot telemetry.',
          optimise: 'Matched 18 bench consultants to high-priority Q4 client mobilisations.'
        },
        simMetrics: {
          velocityTrend: '94% engagement alignment',
          budgetBurn: '69% of Q4 allocation',
          resourceConstraint: 'SAP S/4HANA leads tight in Nov',
          riskAlert: 'Medium: 2 client SOWs awaiting final signature.',
          recommendedAction: 'Pre-allocate soft-booked resources to avoid mobilisation lag.'
        }
      },
      {
        id: 4,
        title: 'Execution & Risk Detection',
        subtitle: 'Velocity, Burn & Constraints',
        agentRole: 'risk-sentinel',
        agentName: 'Risk Detection Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Detect margin erosion, scope creep, and resource contention across active client portfolios.',
        confidence: 84,
        status: 'On Track',
        moduleDetail: {
          badge: 'Cron & Webhook Risk Radar',
          description: 'Runs scheduled cron/webhook jobs evaluating sprint velocity, budget burn rate, and resource utilisation.'
        },
        aiActions: {
          analyse: 'Monitored 45 active SOWs, burn rates, and client NPS signals in real time.',
          predict: 'Fixed-price "Telco Data Lake" engagement at 22% risk of margin overrun due to scope creep.',
          recommend: 'Trigger Change Request #4 and deploy automated data-quality testing scripts.',
          automate: 'Flagged margin variance >5% to Engagement Partner and Planview Risk Log.',
          optimise: 'Rebalanced 3 senior data engineers from low-risk T&M accounts to Telco Data Lake.'
        },
        simMetrics: {
          velocityTrend: '+7% delivery predictability',
          budgetBurn: '72% on-plan',
          resourceConstraint: 'Data Engineers at 95% utilisation',
          riskAlert: 'Medium: Telco Data Lake fixed-price margin at 31% (target 38%).',
          recommendedAction: 'Approve Change Request #4 ($240K) with client sponsor.'
        }
      },
      {
        id: 5,
        title: 'Monitor & Progress',
        subtitle: 'Executive Telemetry & Dashboards',
        agentRole: 'executive-reporter',
        agentName: 'Executive Reporting Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Provide Managing Partners with live visibility into OKR attainment, margin, and utilisation.',
        confidence: 93,
        status: 'On Track',
        moduleDetail: {
          badge: 'Executive JSON Aggregation',
          description: 'Aggregates KR health, portfolio contribution, and resource impact into JSON payloads for React dashboards.'
        },
        aiActions: {
          analyse: 'Consolidated 45 client P&Ls, 16 KRs, and 380 consultants into executive telemetry.',
          predict: 'Q4 Firm-wide OKR attainment tracking at 86%, with 41.2% blended gross margin.',
          recommend: 'Showcase "AI Accelerator" 3.2x delivery speedup in Q4 Town Hall.',
          automate: 'Generated automated weekly Partner Flash Report from Planview.',
          optimise: 'Eliminated 18 hours/week of manual PMO spreadsheet consolidation.'
        },
        simMetrics: {
          velocityTrend: '+9% margin visibility',
          budgetBurn: '74% on-plan',
          resourceConstraint: 'Balanced across 4 practices',
          riskAlert: 'None: All executive KPIs green.',
          recommendedAction: 'Lock Q4 forecast for Board presentation.'
        }
      },
      {
        id: 6,
        title: 'Review & Continuous Improvement',
        subtitle: 'Retrospective & Learning Loop',
        agentRole: 'retrospective-learning',
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Capture delivery retrospectives and IP reuse metrics to sharpen Q1 2027 bidding & staffing.',
        confidence: 92,
        status: 'On Track',
        moduleDetail: {
          badge: 'Root-Cause & Vector Ingestion',
          description: 'Synthesises Project Runner logs and Customer Feedback to generate root-cause analysis.'
        },
        aiActions: {
          analyse: 'Evaluated 38 completed engagements: AI-assisted pods delivered 28% faster with 96% CSAT.',
          predict: 'Embedding GenAI pair-programming in all Q1 bids improves win rate by 11%.',
          recommend: 'Update estimation templates to reflect 25% faster boilerplate coding.',
          automate: 'Published 14 reusable architecture blueprints to Apex Knowledge Hub.',
          optimise: 'Generated Q1 2027 hiring & upskilling plan for 25 AI/Data specialists.'
        },
        simMetrics: {
          velocityTrend: '+18% IP reuse rate',
          budgetBurn: '95% final Q4 utilisation',
          resourceConstraint: 'Q1 hiring pipeline active',
          riskAlert: 'None: Lessons learned synced to bid desk.',
          recommendedAction: 'Roll out updated GenAI estimation model to all Sales Leads.'
        }
      }
    ],
    traceability: {
      1: [
        { id: 'c-s1', title: 'Lead ANZ GenAI & Cloud Transformation', owner: 'Managing Partner', status: 'On Track', progress: 88, budget: '$11.5M', parentIds: [], childIds: ['c-o1'], ai: { analyse: 'Win rate up 15%.', predict: '91% attainment.', recommend: 'Double down on FinServ.', automate: 'CRM synced.', optimise: 'Focused on $1M+ deals.' } },
        { id: 'c-s2', title: 'Expand Reusable IP & Margin to 41%', owner: 'COO & Practice Heads', status: 'On Track', progress: 84, budget: '$7.3M', parentIds: [], childIds: ['c-o2'], ai: { analyse: 'Margin at 40.4%.', predict: '87% attainment.', recommend: 'Mandate accelerator use.', automate: 'PSA margin alerts.', optimise: 'Cut bench time by 4 days.' } }
      ],
      2: [
        { id: 'c-o1', title: 'Grow AI & Cloud Practice Revenue 35%', owner: 'Cloud Practice Lead', status: 'On Track', progress: 89, budget: '$11.5M', parentIds: ['c-s1'], childIds: ['c-kr1'], ai: { analyse: 'Pipeline $28M.', predict: '92% attainment.', recommend: 'Close 2 tier-1 banks.', automate: 'Live booking tracker.', optimise: 'Prioritised high-margin SOWs.' } },
        { id: 'c-o2', title: 'Achieve 82% Billable Utilisation', owner: 'Resource Ops Lead', status: 'On Track', progress: 83, budget: '$7.3M', parentIds: ['c-s2'], childIds: ['c-kr2'], ai: { analyse: 'Currently at 81.4%.', predict: '88% attainment.', recommend: 'Mobilise 6 bench devs.', automate: 'Planview RM active.', optimise: 'Reduced unbilled admin 12%.' } }
      ],
      3: [
        { id: 'c-kr1', title: 'Deploy GenAI Accelerators in 65% of Deals', owner: 'AI COE Lead', status: 'On Track', progress: 87, budget: '$4.2M', parentIds: ['c-o1'], childIds: ['c-i1'], ai: { analyse: '62% adoption achieved.', predict: '94% attainment.', recommend: 'Publish Banking kit.', automate: 'GitHub telemetry.', optimise: 'Cut setup time 40%.' } },
        { id: 'c-kr2', title: 'Keep Fixed-Price Margin > 38%', owner: 'Delivery Excellence', status: 'At Risk', progress: 72, budget: '$7.3M', parentIds: ['c-o2'], childIds: ['c-i2'], ai: { analyse: 'Telco Data Lake at 31%.', predict: 'Needs CR #4.', recommend: 'Enforce scope gates.', automate: 'Weekly burn alerts.', optimise: 'Shifted 3 senior devs.' } }
      ],
      4: [
        { id: 'c-i1', title: 'Apex GenAI Accelerator Suite v3', owner: 'IP Product Mgr', status: 'On Track', progress: 90, budget: '$4.2M', parentIds: ['c-kr1'], childIds: ['c-p1'], ai: { analyse: 'Used in 18 engagements.', predict: 'Exceeds target.', recommend: 'Add Planview connector.', automate: 'CI/CD templates.', optimise: '3.2x faster MVP.' } },
        { id: 'c-i2', title: 'Enterprise Data & Cloud Delivery', owner: 'Program Director', status: 'At Risk', progress: 74, budget: '$7.3M', parentIds: ['c-kr2'], childIds: ['c-p2'], ai: { analyse: '44/45 SOWs green.', predict: '1 SOW needs CR.', recommend: 'Escalate Telco scope.', automate: 'Jira/PSA sync.', optimise: 'Automated QA scripts.' } }
      ],
      5: [
        { id: 'c-p1', title: 'Epic: RAG & Agentic Workflow Kit', owner: 'AI Pod Alpha', status: 'On Track', progress: 92, budget: '$2.1M', parentIds: ['c-i1'], childIds: ['c-t1'], ai: { analyse: 'Zero defects in prod.', predict: 'On-time.', recommend: 'Open-source core.', automate: 'Auto-evals running.', optimise: '35% lower token cost.' } },
        { id: 'c-p2', title: 'Epic: Telco Data Lake Migration', owner: 'Data Pod Beta', status: 'At Risk', progress: 70, budget: '$3.8M', parentIds: ['c-i2'], childIds: ['c-t1'], ai: { analyse: '18% scope growth.', predict: 'CR #4 mitigates.', recommend: 'Freeze schema.', automate: 'Data lineage active.', optimise: 'Parallelised ETL.' } }
      ],
      6: [
        { id: 'c-t1', title: 'Cloud, Data & AI Consultants (140 FTE)', owner: 'Resource Manager', status: 'On Track', progress: 86, budget: '$12.4M', parentIds: ['c-p1', 'c-p2'], childIds: ['c-o-1'], squadLoad: { squadName: 'Data Pod Beta', fte: 18, loadPct: 95 }, ai: { analyse: '83% utilisation.', predict: 'Healthy.', recommend: 'Upskill 12 in GenAI.', automate: 'Skills matrix live.', optimise: 'Zero bench >14 days.' } }
      ],
      7: [
        { id: 'c-o-1', title: '+$6.4M Incremental Margin & 96% CSAT', owner: 'Managing Partner', status: 'On Track', progress: 88, budget: 'ROI 3.4x', parentIds: ['c-t1'], childIds: [], ai: { analyse: 'Client NPS 64.', predict: 'Exceeds Q4 plan.', recommend: 'Reinvest in AI COE.', automate: 'P&L attribution live.', optimise: 'Top-decile partner ROI.' } }
      ]
    },
    knowledgeBase: [
      {
        id: 'kb1',
        title: 'Historical Performance',
        metric: '85% Avg Attainment',
        trend: '+6% YoY',
        summary: 'AI-enabled engagements consistently beat T&M margin benchmarks by 7.5 percentage points.',
        details: ['Avg Gross Margin: 40.4%', 'Billable Utilisation: 81.4%', 'Repeat Client Rate: 88%'],
        vectorChunks: [
          { id: 'c-hp-1', text: 'Engagements deploying reusable IP accelerators experienced 28% faster sprint velocity and 41.2% gross margin.', source: 'PSA Practice Scorecard' }
        ]
      },
      {
        id: 'kb2',
        title: 'Market Data',
        metric: '+28% GenAI Demand',
        trend: 'APAC Cloud',
        summary: 'Enterprise clients shifting from PoCs to production Agentic AI & Planview portfolio governance.',
        details: ['Avg Deal Size: $1.2M', 'Competitor Rate Pressure: -3%', 'AI Governance RFPs: +42%'],
        vectorChunks: [
          { id: 'c-md-1', text: 'APAC enterprise demand for multi-agent orchestration and automated governance frameworks grew 42% YoY.', source: 'IDC Consulting Tracker' }
        ]
      },
      {
        id: 'kb3',
        title: 'Customer Feedback',
        metric: 'NPS 64 (+9)',
        trend: 'CSAT 4.7/5',
        summary: 'Clients praise speed-to-value of Apex Accelerators; request more post-go-live knowledge transfer.',
        details: ['Top Praise: 4-week MVP', 'Top Request: Internal upskilling', 'Renewal Rate: 92%'],
        vectorChunks: [
          { id: 'c-cf-1', text: 'Client CX score reached 4.7/5 across 38 completed reviews. Highlight was 4-week accelerated MVP deployment.', source: 'Client Voice Survey' }
        ]
      },
      {
        id: 'kb4',
        title: 'Project Runner & Outcome',
        metric: '3.4x Avg ROI',
        trend: '89% On-Time',
        summary: 'Fixed-price projects using reusable IP kits achieve 94% on-time delivery vs 71% for bespoke builds.',
        details: ['Best Runner: FinServ Cloud Kit', 'Risk Pattern: Uncontrolled SOW scope', 'Lesson: Gate CRs at +10%'],
        vectorChunks: [
          { id: 'c-pr-1', text: 'FinServ Cloud Kit delivery pod delivered 3.4x partner ROI with 94% on-time milestone sign-off.', source: 'Engagement Analytics' }
        ]
      },
      {
        id: 'kb5',
        title: 'Resources & Utilisation',
        metric: '83% Utilisation',
        trend: 'Balanced',
        summary: '380 consultants across 4 practices; Principal AI Architects near capacity, junior bench well-managed.',
        details: ['AI Architects: 92% load', 'Data Engineers: 95% load', 'Bench: 11% (upskilling)'],
        vectorChunks: [
          { id: 'c-ru-1', text: 'Principal AI Architects operating at 92% billable utilisation. 12 cloud engineers currently upskilling in GenAI.', source: 'Workday Resourcing' }
        ]
      }
    ],
    smartRubric: {
      specific: { score: 94, feedback: 'Explicit accelerator deployment percentage and deal coverage scope.' },
      measurable: { score: 98, feedback: 'Quantified at 65% of new client deals.' },
      achievable: { score: 88, feedback: 'Current adoption is 62%, requiring modest 3% delta.' },
      relevant: { score: 96, feedback: 'Directly drives 41% target gross margin expansion.' },
      timeBound: { score: 90, feedback: 'Quarterly measurement cycle with weekly CRM audit.' },
      compositeScore: 93
    },
    regressionModel: {
      historicalDataPoints: [
        { quarter: 'Q4 2025', actual: 78, predicted: 76 },
        { quarter: 'Q1 2026', actual: 82, predicted: 81 },
        { quarter: 'Q2 2026', actual: 85, predicted: 84 },
        { quarter: 'Q3 2026', actual: 88, predicted: 87 }
      ],
      regressionEquation: 'Attainment = 0.98 * (IP_Adoption) + 18.2',
      rSquared: 0.94,
      predictedProbability: 89,
      confidenceInterval: [84, 94],
      stretchFactor: 1.15
    },
    graphDiagnostics: {
      orphanEpics: [],
      overAllocatedSquads: [
        {
          squadId: 'data-pod-beta',
          name: 'Data Pod Beta',
          currentLoad: 95,
          maxCapacity: 100,
          bottleneckReason: 'High load due to Telco Data Lake scope change'
        }
      ],
      cycleDetected: false,
      totalNodesTraversed: 14,
      unalignedSpend: '$0.0M'
    },
    cronJobs: [
      {
        id: 'cron-margin',
        name: 'Fixed-Price Margin Drift Sentinel',
        cronExpression: '0 0 * * 5',
        lastRun: 'Friday 00:00',
        nextRun: 'Next Friday',
        status: 'active',
        monitoredMetric: 'Realized Gross Margin %',
        threshold: '< 38% on Fixed-Price SOWs',
        anomalyDetected: true
      }
    ],
    recentWebhooks: [
      {
        source: 'ServiceNow GRC',
        event: 'change.request.approved',
        triggerTime: '2 hours ago',
        payload: { crId: 'CR-4', client: 'Telco Corp', amount: '$240k', status: 'Executed' }
      }
    ],
    executivePayload: {
      reportId: 'EXEC-REP-CONSULTING-Q4-2026',
      generatedAt: '2026-11-10T16:00:00Z',
      industry: 'Apex Digital Partners',
      quarter: 'Q4 2026',
      executiveSummary: {
        attainmentScore: 86,
        healthStatus: 'On Track',
        totalCapitalAtRisk: '$1.2M',
        portfolioContributionROI: '3.4x Blended',
        criticalInterventionsRequired: 0
      },
      keyResultHealth: [
        { krId: 'c-kr1', title: 'Deploy GenAI Accelerators in 65% of Deals', probabilityPct: 94, status: 'On Track', varianceVsTarget: '+3%' },
        { krId: 'c-kr2', title: 'Keep Fixed-Price Margin > 38%', probabilityPct: 76, status: 'At Risk', varianceVsTarget: '-4%' }
      ],
      resourceAllocationImpact: [
        { squadName: 'AI Pod Alpha', headcountFte: 14, allocationPct: 88, riskLevel: 'Low' },
        { squadName: 'Data Pod Beta', headcountFte: 18, allocationPct: 95, riskLevel: 'Medium' }
      ],
      strategicThemeAlignment: [
        { theme: 'Lead ANZ GenAI & Cloud Transformation', allocatedBudget: '$11.5M', connectedEpicsCount: 2, healthPct: 88 },
        { theme: 'Expand Reusable IP & Margin to 41%', allocatedBudget: '$7.3M', connectedEpicsCount: 2, healthPct: 84 }
      ]
    },
    retrospective: {
      incidentId: 'RETRO-2026-Q4-02',
      krOrEpicName: 'Keep Fixed-Price Margin > 38% (c-kr2)',
      symptom: 'Telco Data Lake SOW margin dipped to 31% before Change Request #4 approval.',
      fiveWhys: [
        'Why 1: Client requested 14 unanticipated custom ETL ingest connectors.',
        'Why 2: Scope boundaries in initial SOW stated "connect enterprise sources" without explicit count limit.',
        'Why 3: Sales pod lacked reusable boilerplate connector architecture checklist during proposal phase.',
        'Why 4: Bid review gate did not mandate validation from Practice Technical Architect.',
        'Why 5: Rapid deal closing pressure led to expedited pre-sales governance bypass.'
      ],
      fishbone: {
        people: ['Pre-sales lead bypassed delivery architect sign-off'],
        process: ['Fixed-price contract template lacked standard connector count clauses'],
        technology: ['Legacy ETL required custom code rather than metadata-driven ingestion'],
        governance: ['No automated alert when engineer hours on SOW exceeded 80% of budget cap']
      },
      actionableLesson: 'Institutionalize mandatory technical architecture approval for all fixed-price proposals > $500k and enforce metadata-driven connector templates.',
      ingestedIntoKnowledgeBase: true
    }
  },

  Retail: {
    id: 'Retail',
    name: 'OmniStyle Retail Group',
    sector: 'Omnichannel Fashion & Lifestyle',
    quarter: 'Q4 2026',
    overallHealth: 'On Track',
    attainment: 81,
    totalBudget: '$26.4M',
    activeAgents: 6,
    stages: [
      {
        id: 1,
        title: 'Define Organisational Strategy',
        subtitle: 'Business & IT Alignment',
        agentRole: 'strategy-explorer',
        agentName: 'Strategy & Ideation Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Unify e-commerce, 140 physical stores, and AI supply chain into a seamless omnichannel engine.',
        confidence: 91,
        status: 'On Track',
        moduleDetail: {
          badge: 'RAG & Vector Retrieval',
          description: 'Queries Market Data & Historical Performance vectors via RAG to propose Strategic Themes.'
        },
        aiActions: {
          analyse: 'Analysed peak Black Friday/Cyber Monday traffic and 140-store inventory turn rates.',
          predict: 'Ship-from-Store + AI Demand Forecasting will lift Q4 gross margin by 2.8%.',
          recommend: 'Prioritise Unified Inventory Visibility over standalone mobile app redesign.',
          automate: 'Mapped 3 omnichannel strategic themes in Planview to Merchandising & IT roadmaps.',
          optimise: 'Allocated 50% capex to Supply Chain AI, 35% Digital Checkout, 15% In-Store POS.'
        },
        simMetrics: {
          velocityTrend: '+14% omnichannel readiness',
          budgetBurn: '70% of Q4 allocation',
          resourceConstraint: 'Supply Chain Data Scientists at 90% load',
          riskAlert: 'Low: Peak-season freeze window locked.',
          recommendedAction: 'Complete load testing for 50k concurrent checkouts by Nov 15.'
        }
      },
      {
        id: 2,
        title: 'Define Objectives & Key Results',
        subtitle: 'Outcome-Oriented OKRs',
        agentRole: 'okr-predictor',
        agentName: 'OKR Quality & Prediction Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Focus retail & tech teams on conversion, inventory velocity, and customer lifetime value.',
        confidence: 87,
        status: 'On Track',
        moduleDetail: {
          badge: 'SMART & Regression Modeling',
          description: 'Evaluates SMART criteria and runs regression against historical KR attainment.'
        },
        aiActions: {
          analyse: 'Evaluated 26 retail OKRs; converted "Launch Click & Collect" into conversion & fulfillment KRs.',
          predict: 'KR "Reduce stockouts on top 500 SKUs by 35%" has 84% attainment probability.',
          recommend: 'Set KR "Increase 2-hour Click & Collect share of online orders from 18% to 30%".',
          automate: 'Connected Shopify Plus, POS, and WMS telemetry to Planview KR scorecards.',
          optimise: 'Calibrated peak-season stretch targets using 3 years of Q4 holiday data.'
        },
        simMetrics: {
          velocityTrend: '+10% KR alignment',
          budgetBurn: '72% of Q4 allocation',
          resourceConstraint: 'Store Ops trainers at 85% load',
          riskAlert: 'Low: All store & digital leads aligned.',
          recommendedAction: 'Run 2-week Click & Collect pilot in 15 flagship stores.'
        }
      },
      {
        id: 3,
        title: 'Align Tasks & Work for Execution',
        subtitle: 'Epics, Features & Investments',
        agentRole: 'alignment-capacity',
        agentName: 'Alignment & Capacity Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Link Merchandising, Supply Chain, and Digital Epics to Q4 peak-season OKRs.',
        confidence: 86,
        status: 'On Track',
        moduleDetail: {
          badge: '7-Layer Graph Traversal',
          description: 'Executes graph traversal across the 7 layers to detect orphan Epics and over-allocated squads.'
        },
        aiActions: {
          analyse: 'Mapped 22 Epics; flagged 1 legacy loyalty-card project with low Q4 revenue impact.',
          predict: 'Deferring legacy loyalty UI frees $950K for AI Size & Fit Recommendations.',
          recommend: 'Align "One-Tap Checkout" and "Apple Pay Express" under Digital Conversion Initiative.',
          automate: 'Synced Planview Portfolios with Azure DevOps & Merchandising calendars.',
          optimise: 'Sequenced POS firmware rollout 3 weeks ahead of Black Friday.'
        },
        simMetrics: {
          velocityTrend: '91% work-to-OKR alignment',
          budgetBurn: '75% of Q4 allocation',
          resourceConstraint: 'Frontend Checkout squad at 96%',
          riskAlert: 'Medium: 3PL carrier API rate-limit risk during peak.',
          recommendedAction: 'Implement circuit-breaker & fallback carrier routing.'
        }
      },
      {
        id: 4,
        title: 'Execution & Risk Detection',
        subtitle: 'Velocity, Burn & Constraints',
        agentRole: 'risk-sentinel',
        agentName: 'Risk Detection Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Detect supply chain delays, checkout latency, and store fulfillment bottlenecks.',
        confidence: 82,
        status: 'At Risk',
        moduleDetail: {
          badge: 'Cron & Webhook Risk Radar',
          description: 'Runs scheduled cron/webhook jobs evaluating sprint velocity, budget burn rate, and resource utilisation.'
        },
        aiActions: {
          analyse: 'Evaluated WMS integration velocity, $19.8M spend, and 3PL carrier SLA trends.',
          predict: 'KR "2-hour Click & Collect at 30%" faces 12% risk due to Store-WMS sync lag.',
          recommend: 'Deploy edge inventory caching in 40 high-volume metro stores.',
          automate: 'Triggered automated Planview risk alert to VP Supply Chain & E-Commerce.',
          optimise: 'Simulated peak load; caching cuts inventory sync lag from 15 mins to 20 seconds.'
        },
        simMetrics: {
          velocityTrend: '-4% WMS sync velocity',
          budgetBurn: '78% on-plan',
          resourceConstraint: 'WMS Integration Devs at 102% load',
          riskAlert: 'Medium: Store-WMS sync lag impacting metro Click & Collect.',
          recommendedAction: 'Deploy edge caching patch to top 40 stores this week.'
        }
      },
      {
        id: 5,
        title: 'Monitor & Progress',
        subtitle: 'Executive Telemetry & Dashboards',
        agentRole: 'executive-reporter',
        agentName: 'Executive Reporting Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Deliver live peak-season command center dashboards for Retail & Tech executives.',
        confidence: 92,
        status: 'On Track',
        moduleDetail: {
          badge: 'Executive JSON Aggregation',
          description: 'Aggregates KR health, portfolio contribution, and resource impact into JSON payloads for React dashboards.'
        },
        aiActions: {
          analyse: 'Streaming real-time POS, e-commerce conversion, and fulfillment SLA metrics.',
          predict: 'Q4 OKR attainment tracking at 81%, with online conversion up +0.6% YoY.',
          recommend: 'Highlight "AI Size Recommender" (-14% return rate) in Executive Weekly.',
          automate: 'Published automated daily peak-readiness scorecard in Planview.',
          optimise: 'Consolidated 6 disparate retail dashboards into 1 unified OKR view.'
        },
        simMetrics: {
          velocityTrend: '+8% conversion lift',
          budgetBurn: '79% on-plan',
          resourceConstraint: 'Balanced post-patch',
          riskAlert: 'Low: All peak-season guardrails green.',
          recommendedAction: 'Maintain 24/7 war-room telemetry through Cyber Week.'
        }
      },
      {
        id: 6,
        title: 'Review & Continuous Improvement',
        subtitle: 'Retrospective & Learning Loop',
        agentRole: 'retrospective-learning',
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Analyse Q4 peak performance to optimise Q1 2027 inventory & digital investments.',
        confidence: 90,
        status: 'On Track',
        moduleDetail: {
          badge: 'Root-Cause & Vector Ingestion',
          description: 'Synthesises Project Runner logs and Customer Feedback to generate root-cause analysis.'
        },
        aiActions: {
          analyse: 'Reviewed 18 Q4 OKRs: AI Demand Forecasting & One-Tap Checkout exceeded targets by 14%.',
          predict: 'Expanding AI Size & Fit to footwear reduces Q1 2027 return logistics cost by $1.6M.',
          recommend: 'Begin Q1 2027 WMS stress-testing 6 weeks earlier.',
          automate: 'Ingested Q4 return-rate & fulfillment data into Planview Knowledge Base.',
          optimise: 'Generated Q1 2027 draft OKRs focused on post-holiday retention & loyalty.'
        },
        simMetrics: {
          velocityTrend: '+11% YoY peak efficiency',
          budgetBurn: '96% final Q4 utilisation',
          resourceConstraint: 'Resolved for Q1',
          riskAlert: 'None: Q4 learnings archived.',
          recommendedAction: 'Approve Q1 2027 Footwear AI Fit Epic.'
        }
      }
    ],
    traceability: {
      1: [
        { id: 'r-s1', title: 'Seamless Omnichannel Growth & Margin', owner: 'CEO & Chief Digital Officer', status: 'On Track', progress: 83, budget: '$26.4M', parentIds: [], childIds: ['r-o1', 'r-o2'], ai: { analyse: 'Omnichannel orders up 24%.', predict: '86% attainment.', recommend: 'Keep focus on Click & Collect.', automate: 'POS + Web synced.', optimise: 'Cut split-shipments 18%.' } }
      ],
      2: [
        { id: 'r-o1', title: 'Boost Digital Conversion & Reduce Returns', owner: 'VP E-Commerce', status: 'On Track', progress: 86, budget: '$12.2M', parentIds: ['r-s1'], childIds: ['r-kr1'], ai: { analyse: 'Conversion at 3.8%.', predict: '91% attainment.', recommend: 'Expand AI Fit.', automate: 'GA4 linked.', optimise: 'Return rate -14%.' } },
        { id: 'r-o2', title: 'Accelerate Store Fulfillment & Inventory Turn', owner: 'VP Supply Chain', status: 'At Risk', progress: 74, budget: '$14.2M', parentIds: ['r-s1'], childIds: ['r-kr2'], ai: { analyse: 'WMS sync lag in metro.', predict: '78% attainment.', recommend: 'Deploy edge cache.', automate: 'WMS alerts active.', optimise: 'Stockouts down 29%.' } }
      ],
      3: [
        { id: 'r-kr1', title: 'Lift Checkout Conversion from 3.2% to 4.0%', owner: 'Digital Product Lead', status: 'On Track', progress: 88, budget: '$12.2M', parentIds: ['r-o1'], childIds: ['r-i1'], ai: { analyse: 'Currently 3.8%.', predict: '93% attainment.', recommend: 'Promote Apple Pay.', automate: 'Funnel live.', optimise: '1.2s page load.' } },
        { id: 'r-kr2', title: 'Hit 30% 2-Hour Click & Collect Share', owner: 'Omnichannel Ops Lead', status: 'At Risk', progress: 71, budget: '$14.2M', parentIds: ['r-o2'], childIds: ['r-i2'], ai: { analyse: 'Currently 24%.', predict: '76% attainment.', recommend: 'Metro edge cache.', automate: 'Store SLA tracker.', optimise: 'Cut pick time 22%.' } }
      ],
      4: [
        { id: 'r-i1', title: 'One-Tap Checkout & AI Size Fit', owner: 'E-Com Program Mgr', status: 'On Track', progress: 89, budget: '$12.2M', parentIds: ['r-kr1'], childIds: ['r-p1'], ai: { analyse: '48k daily users.', predict: 'Exceeds target.', recommend: 'Roll out to all categories.', automate: 'A/B tests live.', optimise: 'Zero checkout errors.' } },
        { id: 'r-i2', title: 'Unified Real-Time Inventory Mesh', owner: 'Supply Chain Mgr', status: 'At Risk', progress: 73, budget: '$14.2M', parentIds: ['r-kr2'], childIds: ['r-p2'], ai: { analyse: '100/140 stores live.', predict: 'Needs edge patch.', recommend: 'Patch top 40 stores.', automate: 'Kafka lag alerts.', optimise: '99.4% stock accuracy.' } }
      ],
      5: [
        { id: 'r-p1', title: 'Epic: Express Wallet & AI Fit', owner: 'Digital Squad', status: 'On Track', progress: 91, budget: '$6.4M', parentIds: ['r-i1'], childIds: ['r-t1'], ai: { analyse: 'Shipped ahead of freeze.', predict: 'Green.', recommend: 'Monitor peak.', automate: 'CI/CD gated.', optimise: 'Sub-second API.' } },
        { id: 'r-p2', title: 'Epic: Store-WMS Edge Cache', owner: 'Supply Chain Squad', status: 'At Risk', progress: 70, budget: '$7.8M', parentIds: ['r-i2'], childIds: ['r-t1'], ai: { analyse: 'Patch in UAT.', predict: 'Ships Friday.', recommend: 'Prioritise QA.', automate: 'Load test running.', optimise: '20s sync achieved.' } }
      ],
      6: [
        { id: 'r-t1', title: 'Omnichannel & Supply Chain Tech (54 FTE)', owner: 'Engineering Director', status: 'On Track', progress: 82, budget: '$14.2M', parentIds: ['r-p1', 'r-p2'], childIds: ['r-o-1'], squadLoad: { squadName: 'WMS Integration Devs', fte: 16, loadPct: 102 }, ai: { analyse: '91% healthy load.', predict: 'Peak-ready.', recommend: 'Rotate on-call.', automate: 'DORA metrics green.', optimise: 'MTTR < 12 mins.' } }
      ],
      7: [
        { id: 'r-o-1', title: '+$14.5M Peak Revenue & -14% Returns', owner: 'CFO', status: 'On Track', progress: 85, budget: 'ROI 2.9x', parentIds: ['r-t1'], childIds: [], ai: { analyse: 'Tracking +$11.8M YTD.', predict: 'Meets Q4 plan.', recommend: 'Scale AI Fit.', automate: 'Margin attribution live.', optimise: '+2.8% gross margin.' } }
      ]
    },
    knowledgeBase: [
      {
        id: 'kb1',
        title: 'Historical Performance',
        metric: '81% Avg Attainment',
        trend: '+5% YoY',
        summary: 'Digital Checkout OKRs average 89% attainment; Store-WMS integrations historically face Q4 lag.',
        details: ['Peak Conversion: 3.8%', 'Return Rate: 16% (down from 19%)', 'Inventory Turn: 5.4x'],
        vectorChunks: [
          { id: 'r-hp-1', text: 'Digital checkout optimization historically exceeded Q4 conversion targets by 0.6% points.', source: 'Shopify Plus Telemetry' }
        ]
      },
      {
        id: 'kb2',
        title: 'Market Data',
        metric: '+19% Mobile Share',
        trend: 'Click & Collect',
        summary: 'Shoppers increasingly expect 2-hour local pickup and AI-guided sizing to avoid returns.',
        details: ['Mobile Traffic: 74%', 'BNPL Share: 22%', 'Peer Delivery SLA: Next-day'],
        vectorChunks: [
          { id: 'r-md-1', text: '74% of retail peak traffic originates from mobile devices, demanding sub-2-second checkout latency.', source: 'National Retail Federation' }
        ]
      },
      {
        id: 'kb3',
        title: 'Customer Feedback',
        metric: 'NPS 58 (+6)',
        trend: 'CSAT 4.5/5',
        summary: 'Customers love 1-tap checkout; top complaint is out-of-stock surprises on Click & Collect.',
        details: ['Top Praise: Fast Apple Pay', 'Top Pain: Cancelled pickup items', 'AI Fit Rating: 4.6/5'],
        vectorChunks: [
          { id: 'r-cf-1', text: 'Cancelled Click & Collect pickup items accounted for 42% of negative CSAT responses in metro stores.', source: 'Zendesk CX Analytics' }
        ]
      },
      {
        id: 'kb4',
        title: 'Project Runner & Outcome',
        metric: '2.9x Avg ROI',
        trend: '82% On-Time',
        summary: 'AI Size & Fit delivered 3.6x ROI; legacy POS hardware upgrades ran 14% over budget.',
        details: ['Best Runner: AI Size & Fit', 'Overrun: Legacy POS', 'Lesson: Edge-cache WMS'],
        vectorChunks: [
          { id: 'r-pr-1', text: 'AI Size & Fit engine reduced apparel returns by 14%, delivering $3.2M direct return logistics savings.', source: 'Supply Chain ROI Ledger' }
        ]
      },
      {
        id: 'kb5',
        title: 'Resources & Utilisation',
        metric: '91% Utilisation',
        trend: '1 Bottleneck',
        summary: '54 FTEs; WMS Integration Devs at 102% load during peak prep.',
        details: ['WMS Devs: 102% load', 'Frontend Squad: 96% load', 'QA: 84% load'],
        vectorChunks: [
          { id: 'r-ru-1', text: 'WMS Integration squad is operating at 102% capacity during edge caching patch rollout.', source: 'Sprint Velocity Tracker' }
        ]
      }
    ],
    smartRubric: {
      specific: { score: 90, feedback: 'Explicit conversion rate lift from checkout funnel optimization.' },
      measurable: { score: 96, feedback: 'Quantified from 3.2% baseline to 4.0% target.' },
      achievable: { score: 85, feedback: 'Backed by A/B test results showing +0.6% uplift from express wallets.' },
      relevant: { score: 95, feedback: 'Generates $14.5M net incremental peak gross merchandise value.' },
      timeBound: { score: 92, feedback: 'Locked to Cyber Week and Holiday peak execution window.' },
      compositeScore: 92
    },
    regressionModel: {
      historicalDataPoints: [
        { quarter: 'Q4 2025', actual: 74, predicted: 72 },
        { quarter: 'Q1 2026', actual: 78, predicted: 77 },
        { quarter: 'Q2 2026', actual: 80, predicted: 79 },
        { quarter: 'Q3 2026', actual: 83, predicted: 82 }
      ],
      regressionEquation: 'Attainment = 1.08 * (Checkout_Velocity) + 14.1',
      rSquared: 0.91,
      predictedProbability: 84,
      confidenceInterval: [78, 90],
      stretchFactor: 1.2
    },
    graphDiagnostics: {
      orphanEpics: [],
      overAllocatedSquads: [
        {
          squadId: 'wms-devs',
          name: 'WMS Integration Devs',
          currentLoad: 102,
          maxCapacity: 100,
          bottleneckReason: 'Edge cache patch rollout across 40 metro stores'
        }
      ],
      cycleDetected: false,
      totalNodesTraversed: 12,
      unalignedSpend: '$0.0M'
    },
    cronJobs: [
      {
        id: 'cron-wms',
        name: 'WMS Store Inventory Lag Monitor',
        cronExpression: '*/5 * * * *',
        lastRun: '2 mins ago',
        nextRun: 'in 3 mins',
        status: 'active',
        monitoredMetric: 'Store Inventory Sync Latency',
        threshold: '> 5 Minutes',
        anomalyDetected: true
      }
    ],
    recentWebhooks: [
      {
        source: 'Datadog APM',
        event: 'sync.lag.spike',
        triggerTime: '18 mins ago',
        payload: { service: 'wms-inventory-kafka', syncDelay: '14 mins', impactedStores: 40 }
      }
    ],
    executivePayload: {
      reportId: 'EXEC-REP-RETAIL-Q4-2026',
      generatedAt: '2026-11-10T16:00:00Z',
      industry: 'OmniStyle Retail Group',
      quarter: 'Q4 2026',
      executiveSummary: {
        attainmentScore: 81,
        healthStatus: 'On Track',
        totalCapitalAtRisk: '$3.4M',
        portfolioContributionROI: '2.9x Expected',
        criticalInterventionsRequired: 1
      },
      keyResultHealth: [
        { krId: 'r-kr1', title: 'Lift Checkout Conversion from 3.2% to 4.0%', probabilityPct: 93, status: 'On Track', varianceVsTarget: '+5%' },
        { krId: 'r-kr2', title: 'Hit 30% 2-Hour Click & Collect Share', probabilityPct: 76, status: 'At Risk', varianceVsTarget: '-6%' }
      ],
      resourceAllocationImpact: [
        { squadName: 'WMS Integration Devs', headcountFte: 16, allocationPct: 102, riskLevel: 'Critical' },
        { squadName: 'Digital Channels Squad', headcountFte: 22, allocationPct: 91, riskLevel: 'Low' }
      ],
      strategicThemeAlignment: [
        { theme: 'Seamless Omnichannel Growth & Margin', allocatedBudget: '$26.4M', connectedEpicsCount: 2, healthPct: 83 }
      ]
    },
    retrospective: {
      incidentId: 'RETRO-2026-Q4-03',
      krOrEpicName: 'Hit 30% 2-Hour Click & Collect Share (r-kr2)',
      symptom: 'Metro store Click & Collect order fulfillment delayed by 15-minute inventory sync lag.',
      fiveWhys: [
        'Why 1: High in-store POS transaction volume overwhelmed centralized Kafka consumer queues.',
        'Why 2: Store POS units were streaming unbatched inventory updates directly over WAN.',
        'Why 3: Local store servers lacked local edge caching layer for real-time item reservations.',
        'Why 4: Edge architecture pilot was delayed due to hardware supply constraints in Q2.',
        'Why 5: Supply chain team prioritized warehouse robotics over store edge compute.'
      ],
      fishbone: {
        people: ['WMS squad overloaded at 102% allocation'],
        process: ['Store fulfillment SLA not alerted until customer arrived at counter'],
        technology: ['Centralized inventory database with 15-minute batch polling'],
        governance: ['SLA mismatch between online checkout promises and store pick capability']
      },
      actionableLesson: 'Standardize local edge-cached inventory mesh in top 40 flagship stores prior to peak trading freeze.',
      ingestedIntoKnowledgeBase: true
    }
  },

  'Power Suppliers': {
    id: 'Power Suppliers',
    name: 'GridVantage Energy',
    sector: 'Power Generation & Smart Grid',
    quarter: 'Q4 2026',
    overallHealth: 'At Risk',
    attainment: 72,
    totalBudget: '$68.0M',
    activeAgents: 6,
    stages: [
      {
        id: 1,
        title: 'Define Organisational Strategy',
        subtitle: 'Business & IT Alignment',
        agentRole: 'strategy-explorer',
        agentName: 'Strategy & Ideation Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Accelerate renewable grid integration, smart-meter telemetry, and predictive outage prevention.',
        confidence: 89,
        status: 'On Track',
        moduleDetail: {
          badge: 'RAG & Vector Retrieval',
          description: 'Queries Market Data & Historical Performance vectors via RAG to propose Strategic Themes.'
        },
        aiActions: {
          analyse: 'Evaluated AEMO grid stability mandates, 2030 decarbonisation targets, and storm-season risk.',
          predict: 'AI Predictive Grid Maintenance will cut unplanned feeder outages by 28% over 4 quarters.',
          recommend: 'Shift 22% of thermal plant capex into Battery Energy Storage Systems (BESS) & Grid AI.',
          automate: 'Created 3 energy-transition strategic themes in Planview linked to Asset & IT portfolios.',
          optimise: 'Balanced capex: 50% Grid Modernisation, 30% Renewables/BESS, 20% Customer/DER.'
        },
        simMetrics: {
          velocityTrend: '+9% transition pace',
          budgetBurn: '71% of Q4 allocation',
          resourceConstraint: 'OT/SCADA Cyber Engineers at 98% load',
          riskAlert: 'Medium: Transformer supply-chain lead times at 26 weeks.',
          recommendedAction: 'Lock Q1 2027 BESS inverter procurement early.'
        }
      },
      {
        id: 2,
        title: 'Define Objectives & Key Results',
        subtitle: 'Outcome-Oriented OKRs',
        agentRole: 'okr-predictor',
        agentName: 'OKR Quality & Prediction Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Align Field Ops, Asset Management, and IT on grid reliability (SAIDI) and renewable hosting.',
        confidence: 85,
        status: 'On Track',
        moduleDetail: {
          badge: 'SMART & Regression Modeling',
          description: 'Evaluates SMART criteria and runs regression against historical KR attainment.'
        },
        aiActions: {
          analyse: 'Audited 30 utility OKRs; replaced "Install 50k smart meters" with grid-visibility & outage KRs.',
          predict: 'KR "Reduce SAIDI (outage minutes) by 18% YoY" has 76% attainment probability.',
          recommend: 'Add KR "Increase automated fault-isolation coverage to 65% of metro feeders".',
          automate: 'Connected SCADA/OMS outage telemetry directly to Planview KR scorecards.',
          optimise: 'Calibrated summer storm-season targets using 10-year weather & load curves.'
        },
        simMetrics: {
          velocityTrend: '+7% reliability focus',
          budgetBurn: '73% of Q4 allocation',
          resourceConstraint: 'Field Crew schedulers tight',
          riskAlert: 'Low: AER regulatory KPIs mapped to OKRs.',
          recommendedAction: 'Sync smart-meter voltage alerts with Field Dispatch.'
        }
      },
      {
        id: 3,
        title: 'Align Tasks & Work for Execution',
        subtitle: 'Epics, Features & Investments',
        agentRole: 'alignment-capacity',
        agentName: 'Alignment & Capacity Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Connect substation upgrades, DERMS software Epics, and field maintenance to OKRs.',
        confidence: 80,
        status: 'At Risk',
        moduleDetail: {
          badge: '7-Layer Graph Traversal',
          description: 'Executes graph traversal across the 7 layers to detect orphan Epics and over-allocated squads.'
        },
        aiActions: {
          analyse: 'Mapped 34 capital works projects & 16 IT Epics; found 4 substation projects lacking SCADA integration.',
          predict: 'Integrating SCADA early avoids $2.4M in rework during commissioning.',
          recommend: 'Bundle "DERMS Solar Forecasting" and "BESS Dispatch" under Grid Flexibility Initiative.',
          automate: 'Linked Planview Capital Planning with Primavera P6 & Jira.',
          optimise: 'Re-sequenced 5 regional line-upgrades ahead of summer bushfire season.'
        },
        simMetrics: {
          velocityTrend: '86% portfolio alignment',
          budgetBurn: '77% of Q4 allocation',
          resourceConstraint: 'High-Voltage Technicians at 104%',
          riskAlert: 'High: 4 substation upgrades missing OT/SCADA milestones.',
          recommendedAction: 'Assign dedicated OT integration lead to Western Substation.'
        }
      },
      {
        id: 4,
        title: 'Execution & Risk Detection',
        subtitle: 'Velocity, Burn & Constraints',
        agentRole: 'risk-sentinel',
        agentName: 'Risk Detection Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Detect capital-works slippage, OT/IT bottlenecks, and weather-driven schedule risks.',
        confidence: 74,
        status: 'At Risk',
        moduleDetail: {
          badge: 'Cron & Webhook Risk Radar',
          description: 'Runs scheduled cron/webhook jobs evaluating sprint velocity, budget burn rate, and resource utilisation.'
        },
        aiActions: {
          analyse: 'Monitored $68M capex burn, 104% HV technician load, and vendor transformer delays.',
          predict: 'KR "Automate 65% of metro feeders" projected to miss by 15% due to SCADA telemetry lag.',
          recommend: 'Deploy mobile LTE/5G mesh gateways as interim telemetry for 12 delayed substations.',
          automate: 'Triggered Planview Executive Risk Alert to Chief Engineer & CIO.',
          optimise: 'Simulated crew dispatch; interim LTE gateways recover 11% of schedule.'
        },
        simMetrics: {
          velocityTrend: '-11% substation commissioning',
          budgetBurn: '82% (5% ahead of pace)',
          resourceConstraint: 'OT/SCADA Engineers at 106% load',
          riskAlert: 'Critical: Metro feeder automation KR at 58% attainment.',
          recommendedAction: 'Approve $450K interim LTE telemetry kit for 12 substations.'
        }
      },
      {
        id: 5,
        title: 'Monitor & Progress',
        subtitle: 'Executive Telemetry & Dashboards',
        agentRole: 'executive-reporter',
        agentName: 'Executive Reporting Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Provide Board & Regulator-ready visibility into grid reliability, capex ROI, and OKR health.',
        confidence: 90,
        status: 'On Track',
        moduleDetail: {
          badge: 'Executive JSON Aggregation',
          description: 'Aggregates KR health, portfolio contribution, and resource impact into JSON payloads for React dashboards.'
        },
        aiActions: {
          analyse: 'Aggregated 1.2M smart-meter feeds, 34 capex projects, and 14 KRs.',
          predict: 'Q4 OKR attainment forecasted at 75% post-mitigation.',
          recommend: 'Highlight "22% faster outage restoration" in AER regulatory submission.',
          automate: 'Generated automated weekly Grid & Portfolio Health Digest in Planview.',
          optimise: 'Unified Asset & IT reporting, cutting monthly Board pack prep by 60%.'
        },
        simMetrics: {
          velocityTrend: '+5% post-mitigation',
          budgetBurn: '80% on-plan',
          resourceConstraint: 'Stabilising',
          riskAlert: 'Medium: Monitor summer peak load.',
          recommendedAction: 'Lock Q4 regulatory reliability report.'
        }
      },
      {
        id: 6,
        title: 'Review & Continuous Improvement',
        subtitle: 'Retrospective & Learning Loop',
        agentRole: 'retrospective-learning',
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Feed outage root-causes and capex delivery patterns into Q1 2027 grid planning.',
        confidence: 89,
        status: 'On Track',
        moduleDetail: {
          badge: 'Root-Cause & Vector Ingestion',
          description: 'Synthesises Project Runner logs and Customer Feedback to generate root-cause analysis.'
        },
        aiActions: {
          analyse: 'Evaluated 20 closed OKRs: Predictive Maintenance exceeded target; hardware-heavy projects slipped.',
          predict: 'Adding 4-week supply-chain buffers to Q1 2027 capex OKRs improves predictability 18%.',
          recommend: 'Standardise LTE/5G interim telemetry for all rural feeder upgrades.',
          automate: 'Archived asset-failure & vendor-delay patterns in Planview Knowledge Base.',
          optimise: 'Drafted Q1 2027 OKRs for VPP (Virtual Power Plant) & EV-grid readiness.'
        },
        simMetrics: {
          velocityTrend: '+12% capex predictability',
          budgetBurn: '98% final Q4 utilisation',
          resourceConstraint: 'Q1 contractors secured',
          riskAlert: 'None: Lessons learned ingested.',
          recommendedAction: 'Approve Q1 2027 VPP & EV-Grid OKR slate.'
        }
      }
    ],
    traceability: {
      1: [
        { id: 'p-s1', title: 'Net-Zero Ready & Resilient Smart Grid', owner: 'CEO & Chief Engineer', status: 'At Risk', progress: 72, budget: '$68.0M', parentIds: [], childIds: ['p-o1', 'p-o2'], ai: { analyse: 'BESS & AI on track; hardware lag.', predict: '76% attainment.', recommend: 'Use LTE interim gateways.', automate: 'SCADA + Planview synced.', optimise: 'Shifted 12% to Grid AI.' } }
      ],
      2: [
        { id: 'p-o1', title: 'Cut Unplanned Outages (SAIDI) by 18%', owner: 'VP Grid Operations', status: 'At Risk', progress: 68, budget: '$42.0M', parentIds: ['p-s1'], childIds: ['p-kr1'], ai: { analyse: 'Currently -13% YoY.', predict: '74% attainment.', recommend: 'Accelerate feeder automation.', automate: 'OMS telemetry live.', optimise: 'Predictive crew staging.' } },
        { id: 'p-o2', title: 'Enable 40% More Rooftop Solar & EV Load', owner: 'VP Energy Transition', status: 'On Track', progress: 84, budget: '$26.0M', parentIds: ['p-s1'], childIds: ['p-kr2'], ai: { analyse: 'DERMS live in 3 regions.', predict: '90% attainment.', recommend: 'Expand dynamic tariffs.', automate: 'Smart-meter feeds.', optimise: 'Reduced curtailment 24%.' } }
      ],
      3: [
        { id: 'p-kr1', title: 'Automate 65% of Metro Feeders', owner: 'Grid Automation Lead', status: 'At Risk', progress: 61, budget: '$42.0M', parentIds: ['p-o1'], childIds: ['p-i1'], ai: { analyse: 'Currently 52%.', predict: 'Needs LTE gateways.', recommend: 'Deploy interim kits.', automate: 'Substation tracker.', optimise: 'Cut fault-isolation to 45s.' } },
        { id: 'p-kr2', title: 'Deploy DERMS Across 120k Homes', owner: 'DERMS Lead', status: 'On Track', progress: 86, budget: '$26.0M', parentIds: ['p-o2'], childIds: ['p-i2'], ai: { analyse: '104k homes connected.', predict: '92% attainment.', recommend: 'Onboard EV chargers.', automate: 'API telemetry.', optimise: 'Peak-shaving +18MW.' } }
      ],
      4: [
        { id: 'p-i1', title: 'Self-Healing Grid & SCADA Upgrade', owner: 'Capital Works Mgr', status: 'At Risk', progress: 63, budget: '$42.0M', parentIds: ['p-kr1'], childIds: ['p-p1'], ai: { analyse: '12 substations delayed.', predict: 'LTE recovers 11%.', recommend: 'Approve $450K kit.', automate: 'Primavera P6 linked.', optimise: 'Prioritised storm zones.' } },
        { id: 'p-i2', title: 'AI DERMS & BESS Dispatch', owner: 'Grid AI Program Mgr', status: 'On Track', progress: 88, budget: '$26.0M', parentIds: ['p-kr2'], childIds: ['p-p2'], ai: { analyse: '99.6% forecast accuracy.', predict: 'Exceeds target.', recommend: 'Add VPP bidding.', automate: 'AEMO market API.', optimise: '+$3.2M arbitrage value.' } }
      ],
      5: [
        { id: 'p-p1', title: 'Epic: Substation LTE Telemetry', owner: 'OT/SCADA Squad', status: 'At Risk', progress: 59, budget: '$14.5M', parentIds: ['p-i1'], childIds: ['p-t1'], ai: { analyse: 'Hardware in transit.', predict: '2-week slip.', recommend: 'Parallelise config.', automate: 'Field app synced.', optimise: 'Zero-touch provisioning.' } },
        { id: 'p-p2', title: 'Epic: Solar & EV Load Forecaster', owner: 'Grid AI Squad', status: 'On Track', progress: 90, budget: '$9.8M', parentIds: ['p-i2'], childIds: ['p-t1'], ai: { analyse: '15-min granularity.', predict: 'Green.', recommend: 'Roll out statewide.', automate: 'MLOps pipeline.', optimise: 'Cut cloud compute 16%.' } },
        { id: 'p-p-orphan1', title: 'Epic: Legacy Coal Plant Fly-Ash Monitoring (Orphan)', owner: 'Thermal Ops', status: 'Behind', progress: 18, budget: '$2.1M', parentIds: [], childIds: [], isOrphan: true, ai: { analyse: 'Zero strategic alignment to Net-Zero or SAIDI OKRs.', predict: 'Wasted capex without carbon offset.', recommend: 'Decommission and reallocate to DERMS.', automate: 'Flagged by Alignment Agent.', optimise: 'Save $2.1M for Grid AI.' } }
      ],
      6: [
        { id: 'p-t1', title: 'OT/SCADA & Grid AI Engineers (64 FTE)', owner: 'Engineering Director', status: 'At Risk', progress: 71, budget: '$24.3M', parentIds: ['p-p1', 'p-p2'], childIds: ['p-o-1'], squadLoad: { squadName: 'OT/SCADA Cyber Engineers', fte: 24, loadPct: 106 }, ai: { analyse: '106% load on OT.', predict: 'Needs contractor burst.', recommend: 'Add 4 OT specialists.', automate: 'Capacity alerts live.', optimise: 'Balanced sprint load.' } }
      ],
      7: [
        { id: 'p-o-1', title: '-13% SAIDI & $3.2M BESS Arbitrage', owner: 'CFO & Regulator', status: 'On Track', progress: 78, budget: 'ROI 2.6x', parentIds: ['p-t1'], childIds: [], ai: { analyse: '42k customer-hours saved.', predict: 'Meets AER target.', recommend: 'Publish sustainability report.', automate: 'Outcome tracking live.', optimise: 'Avoided $1.9M penalties.' } }
      ]
    },
    knowledgeBase: [
      {
        id: 'kb1',
        title: 'Historical Performance',
        metric: '74% Avg Attainment',
        trend: '+3% YoY',
        summary: 'Software/AI grid projects hit 88% attainment; physical substation upgrades average 66% due to supply chain.',
        details: ['SAIDI Improvement: -13% YoY', 'Capex Variance: +6.1% on hardware', 'Best Quarter: Q2 2026'],
        vectorChunks: [
          { id: 'p-hp-1', text: 'Substation automation historically achieved 66% attainment due to 26-week transformer lead times.', source: 'Capital Works Audit' }
        ]
      },
      {
        id: 'kb2',
        title: 'Market Data',
        metric: '+38% DER Growth',
        trend: 'AEMO 2030',
        summary: 'Rapid rooftop solar & EV uptake requires dynamic voltage management and automated feeder switching.',
        details: ['Rooftop Solar: 34% penetration', 'EV Load Growth: +45% YoY', 'Transformer Lead Time: 26 wks'],
        vectorChunks: [
          { id: 'p-md-1', text: 'AEMO 2030 Integrated System Plan projects rooftop solar penetration reaching 38% in regional network.', source: 'AEMO ISP Report' }
        ]
      },
      {
        id: 'kb3',
        title: 'Customer Feedback',
        metric: 'NPS 44 (+5)',
        trend: 'CSAT 4.1/5',
        summary: 'Customers value proactive SMS outage ETAs; frustrated by solar export limits during midday.',
        details: ['Top Praise: SMS Outage Alerts', 'Top Pain: Solar curtailment', 'Call Volume: -21%'],
        vectorChunks: [
          { id: 'p-cf-1', text: 'Customers expressed dissatisfaction over midday solar curtailment limits in high-density feeder suburbs.', source: 'Energy Ombudsman Feed' }
        ]
      },
      {
        id: 'kb4',
        title: 'Project Runner & Outcome',
        metric: '2.6x Avg ROI',
        trend: '74% On-Time',
        summary: 'AI DERMS & BESS Dispatch delivered 3.3x ROI; legacy SCADA upgrades suffered vendor delays.',
        details: ['Best Runner: AI DERMS', 'Delayed: Western Substation', 'Lesson: Pre-stage LTE kits'],
        vectorChunks: [
          { id: 'p-pr-1', text: 'AI DERMS Solar Forecasting reduced feeder trip incidents by 24% and generated $3.2M arbitrage value.', source: 'Grid Telemetry Engine' }
        ]
      },
      {
        id: 'kb5',
        title: 'Resources & Utilisation',
        metric: '101% Utilisation',
        trend: '2 Bottlenecks',
        summary: '64 FTEs; OT/SCADA Cyber Engineers (106%) and HV Technicians (104%) are critically constrained.',
        details: ['OT/SCADA: 106% load', 'HV Techs: 104% load', 'Grid AI: 86% load'],
        vectorChunks: [
          { id: 'p-ru-1', text: 'OT/SCADA cyber integration engineers are overcommitted at 106% load across 3 regional substation programs.', source: 'Primavera P6 Resource Tracker' }
        ]
      }
    ],
    smartRubric: {
      specific: { score: 92, feedback: 'Specific fault-isolation automation across metro feeder network.' },
      measurable: { score: 95, feedback: 'Defined threshold of 65% automated feeder coverage.' },
      achievable: { score: 75, feedback: 'High hardware lead time risk; mitigatable via interim LTE telemetry kits.' },
      relevant: { score: 98, feedback: 'Directly improves SAIDI reliability and avoids regulatory penalty.' },
      timeBound: { score: 88, feedback: 'Summer storm-season deadline enforced.' },
      compositeScore: 89
    },
    regressionModel: {
      historicalDataPoints: [
        { quarter: 'Q4 2025', actual: 64, predicted: 62 },
        { quarter: 'Q1 2026', actual: 68, predicted: 67 },
        { quarter: 'Q2 2026', actual: 72, predicted: 71 },
        { quarter: 'Q3 2026', actual: 74, predicted: 75 }
      ],
      regressionEquation: 'Attainment = 0.88 * (FieldCommissioning) + 16.4',
      rSquared: 0.86,
      predictedProbability: 76,
      confidenceInterval: [68, 84],
      stretchFactor: 1.3
    },
    graphDiagnostics: {
      orphanEpics: [
        {
          id: 'p-p-orphan1',
          title: 'Epic: Legacy Coal Plant Fly-Ash Monitoring (Orphan)',
          budget: '$2.1M',
          recommendedParentId: 'p-i1'
        }
      ],
      overAllocatedSquads: [
        {
          squadId: 'ot-scada',
          name: 'OT/SCADA Cyber Engineers',
          currentLoad: 106,
          maxCapacity: 100,
          bottleneckReason: 'Simultaneous commissioning of Western and Northern substations'
        }
      ],
      cycleDetected: false,
      totalNodesTraversed: 16,
      unalignedSpend: '$2.1M'
    },
    cronJobs: [
      {
        id: 'cron-saidi',
        name: 'SCADA SAIDI Outage Minute Aggregator',
        cronExpression: '*/10 * * * *',
        lastRun: '4 mins ago',
        nextRun: 'in 6 mins',
        status: 'active',
        monitoredMetric: 'Feeder Outage Duration (SAIDI)',
        threshold: '> 15 Outage Minutes / Month',
        anomalyDetected: true
      }
    ],
    recentWebhooks: [
      {
        source: 'Datadog APM',
        event: 'scada.substation.timeout',
        triggerTime: '45 mins ago',
        payload: { substation: 'Western Metro Sub 4', protocol: 'DNP3', retryCount: 5 }
      }
    ],
    executivePayload: {
      reportId: 'EXEC-REP-POWER-Q4-2026',
      generatedAt: '2026-11-10T16:00:00Z',
      industry: 'GridVantage Energy',
      quarter: 'Q4 2026',
      executiveSummary: {
        attainmentScore: 72,
        healthStatus: 'At Risk',
        totalCapitalAtRisk: '$14.5M',
        portfolioContributionROI: '2.6x Expected',
        criticalInterventionsRequired: 2
      },
      keyResultHealth: [
        { krId: 'p-kr1', title: 'Automate 65% of Metro Feeders', probabilityPct: 76, status: 'At Risk', varianceVsTarget: '-13%' },
        { krId: 'p-kr2', title: 'Deploy DERMS Across 120k Homes', probabilityPct: 92, status: 'On Track', varianceVsTarget: '+4%' }
      ],
      resourceAllocationImpact: [
        { squadName: 'OT/SCADA Cyber Engineers', headcountFte: 24, allocationPct: 106, riskLevel: 'Critical' },
        { squadName: 'Grid AI Squad', headcountFte: 16, allocationPct: 86, riskLevel: 'Low' }
      ],
      strategicThemeAlignment: [
        { theme: 'Net-Zero Ready & Resilient Smart Grid', allocatedBudget: '$68.0M', connectedEpicsCount: 3, healthPct: 72 }
      ]
    },
    retrospective: {
      incidentId: 'RETRO-2026-Q4-04',
      krOrEpicName: 'Automate 65% of Metro Feeders (p-kr1)',
      symptom: 'Substation commissioning delayed by 12 weeks due to specialized RTU/SCADA hardware lead times.',
      fiveWhys: [
        'Why 1: Physical remote terminal units (RTUs) were held in vendor customs clearance.',
        'Why 2: Custom optical fiber communication cards had unexpected firmware incompatibility.',
        'Why 3: Field crews were unable to complete end-to-end telemetry testing without physical RTU units on site.',
        'Why 4: The engineering team had not tested cellular LTE/5G wireless gateways as a virtual testing alternative.',
        'Why 5: Capital procurement specifications strictly mandated hardwired fiber prior to commissioning.'
      ],
      fishbone: {
        people: ['HV technician crew waiting on hardware delivery', 'OT engineers over-allocated across multiple sites'],
        process: ['Rigid procurement specifications prevented flexible interim wireless fallback'],
        technology: ['Vendor proprietary protocol delayed integration with modern open DNP3 telemetry'],
        governance: ['Capital works milestones tied exclusively to physical installation rather than logical connectivity']
      },
      actionableLesson: 'Standardize modular wireless LTE/5G telemetry gateways to enable logical software commissioning weeks before physical fiber pull.',
      ingestedIntoKnowledgeBase: true
    }
  },
  Telco: TELCO_DATA
};
