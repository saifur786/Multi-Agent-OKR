import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Building2,
  Briefcase,
  ShoppingBag,
  Zap,
  Layers,
  GitBranch,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RefreshCw,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Cpu,
  Lightbulb,
  Sliders,
  Compass,
  Award,
  Check,
  Info,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

/**
 * ============================================================================
 * ENTERPRISE DATA: 4 INDUSTRIES (Banking, IT Consulting, Retail, Power Suppliers)
 * ============================================================================
 * Each industry contains:
 * 1. Metadata & Executive Summary
 * 2. 6-Stage Multi-Agent OKR Lifecycle (with 5 Agentic AI actions & simulation data)
 * 3. 7-Layer Planview Traceability Graph (with parent-child lineage & AI inspector)
 * 4. 5-Pillar AI Knowledge Base (Historical, Market, Customer, Project Runner, Resources)
 */
const INDUSTRY_DATA = {
  Banking: {
    id: 'Banking',
    name: 'Global Horizon Bank',
    sector: 'Retail & Commercial Banking',
    quarter: 'Q4 2026',
    overallHealth: 'At Risk',
    attainment: 74,
    totalBudget: '$42.5M',
    activeAgents: 6,
    stages: [
      {
        id: 1,
        title: 'Define Organisational Strategy',
        subtitle: 'Business & IT Alignment',
        agentName: 'Strategy Explorer Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Translate board-level digital banking mandates into measurable Business & IT strategic themes.',
        confidence: 92,
        status: 'On Track',
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
        agentName: 'Outcome Predictor Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Replace activity-based goals with measurable, outcome-focused Objectives and Key Results.',
        confidence: 88,
        status: 'On Track',
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
        agentName: 'Portfolio & Epic Alignment Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Connect every Objective to funded Initiatives, Epics, Projects, and Agile Release Trains.',
        confidence: 85,
        status: 'At Risk',
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
        agentName: 'Risk & Velocity Sentinel Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Continuously monitor delivery signals to detect which Objectives are likely to miss targets.',
        confidence: 79,
        status: 'At Risk',
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
        agentName: 'Executive Telemetry & Dashboard Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Generate real-time executive dashboards showing OKR health, KR attainment, and portfolio ROI.',
        confidence: 94,
        status: 'On Track',
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
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Perform retrospective root-cause analysis on succeeded/failed OKRs to improve next-cycle planning.',
        confidence: 91,
        status: 'On Track',
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
        { id: 'b-p4', title: 'Epic: Kafka Event Mesh', owner: 'Squad Delta', status: 'On Track', progress: 79, budget: '$6.8M', parentIds: ['b-i4'], childIds: ['b-t1'], ai: { analyse: 'Throughput 15k TPS.', predict: 'Meets SLA.', recommend: 'Complete load test.', automate: 'Terraform IaC deployed.', optimise: '18% lower memory footprint.' } }
      ],
      6: [
        { id: 'b-t1', title: 'Core Banking & Payments ART (42 FTE)', owner: 'RTE Sarah Chen', status: 'At Risk', progress: 66, budget: '$11.0M', parentIds: ['b-p1', 'b-p4'], childIds: ['b-o-1'], ai: { analyse: '108% utilisation on Backend.', predict: 'Burnout risk in 3 weeks.', recommend: 'Shift 2 devs from Branch Ops.', automate: 'Capacity alerts active.', optimise: 'Balanced sprint WIP limits.' } },
        { id: 'b-t2', title: 'Digital Channels & AI Squads (36 FTE)', owner: 'RTE Marcus Vance', status: 'On Track', progress: 85, budget: '$7.6M', parentIds: ['b-p2', 'b-p3'], childIds: ['b-o-2'], ai: { analyse: '88% healthy utilisation.', predict: 'High sustained velocity.', recommend: 'Share AI patterns.', automate: 'DORA metrics tracked.', optimise: 'Deployment freq 12/week.' } }
      ],
      7: [
        { id: 'b-o-1', title: '+$18M Net New Mortgage Volume', owner: 'CFO', status: 'At Risk', progress: 64, budget: 'ROI 2.4x', parentIds: ['b-t1'], childIds: [], ai: { analyse: 'Trailing target by $3.1M.', predict: 'Recovers if API v3 ships.', recommend: 'Prioritise broker portal.', automate: 'Revenue attribution live.', optimise: 'CAC reduced by 12%.' } },
        { id: 'b-o-2', title: '-22% Cost-to-Serve & +12 NPS', owner: 'COO', status: 'On Track', progress: 88, budget: 'ROI 3.1x', parentIds: ['b-t2'], childIds: [], ai: { analyse: '$4.8M annualised savings.', predict: 'Exceeds Q4 target.', recommend: 'Reinvest savings in AI.', automate: 'Outcome Intelligence live.', optimise: 'Top-quartile industry NPS.' } }
      ]
    },
    knowledgeBase: [
      { id: 'kb1', title: 'Historical Performance', metric: '76% Avg Attainment', trend: '+4% YoY', summary: 'Last 8 quarters show 84% attainment on Digital Channel OKRs vs 64% on Core Mainframe modernisation.', details: ['Q1-Q3 Avg Velocity: 42 pts/sprint', 'Budget Variance: +3.2% overage on legacy', 'Top Bottleneck: Compliance sign-off'] },
      { id: 'kb2', title: 'Market Data', metric: '6.2% Digital Shift', trend: 'APRA CPS 230', summary: 'Competitor neo-banks average 36-hour mortgage approvals; Open Banking API adoption up 34% YoY.', details: ['Peer Avg Mortgage SLA: 2.1 days', 'Regulatory Deadline: July 2026', 'Digital Wealth CAGR: 14.5%'] },
      { id: 'kb3', title: 'Customer Feedback', metric: 'NPS 52 (+7)', trend: 'CSAT 4.3/5', summary: '14,200 survey responses highlight fast mobile onboarding as top strength; document upload friction as #1 pain point.', details: ['Top Praise: Instant card freeze', 'Top Pain: Mortgage income proof', 'Support Ticket Drop: -18%'] },
      { id: 'kb4', title: 'Project Runner & Outcome', metric: '2.7x Avg ROI', trend: '71% On-Time', summary: 'Cloud-native initiatives delivered 2.9x ROI; monolithic vendor upgrades averaged 4.5-month delays.', details: ['Best Runner: Anvi Chatbot (3.4x ROI)', 'Delayed: Mainframe Batch v4', 'Lesson: Decouple via APIs'] },
      { id: 'kb5', title: 'Resources & Utilisation', metric: '94% Utilisation', trend: '2 Bottlenecks', summary: '78 FTEs across 2 ARTs. Cloud Security and Credit Engine Backend squads are over-allocated (>100%).', details: ['Backend Devs: 108% load', 'QA Automation: 96% load', 'Available Buffer: 4 FTEs in Branch Ops'] }
    ]
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
        agentName: 'Strategy Explorer Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Pivot practice mix from legacy staff-augmentation to high-margin GenAI & Cloud Transformation.',
        confidence: 95,
        status: 'On Track',
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
        agentName: 'Outcome Predictor Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Shift partner scorecards from billable hours to client business outcomes & reusable IP.',
        confidence: 90,
        status: 'On Track',
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
        agentName: 'Portfolio & Epic Alignment Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Align client delivery engagements, internal IP accelerators, and upskilling programs to OKRs.',
        confidence: 88,
        status: 'On Track',
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
        agentName: 'Risk & Velocity Sentinel Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Detect margin erosion, scope creep, and resource contention across active client portfolios.',
        confidence: 84,
        status: 'On Track',
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
        agentName: 'Executive Telemetry & Dashboard Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Provide Managing Partners with live visibility into OKR attainment, margin, and utilisation.',
        confidence: 93,
        status: 'On Track',
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
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Capture delivery retrospectives and IP reuse metrics to sharpen Q1 2027 bidding & staffing.',
        confidence: 92,
        status: 'On Track',
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
        { id: 'c-i2', title: 'Enterprise Data & Cloud Delivery', owner: 'Program Director', status: 'At Risk', progress: 74, budget: '$7.3M', parentIds: ['c-kr2'], childIds: ['b-p2-c'], ai: { analyse: '44/45 SOWs green.', predict: '1 SOW needs CR.', recommend: 'Escalate Telco scope.', automate: 'Jira/PSA sync.', optimise: 'Automated QA scripts.' } }
      ],
      5: [
        { id: 'c-p1', title: 'Epic: RAG & Agentic Workflow Kit', owner: 'AI Pod Alpha', status: 'On Track', progress: 92, budget: '$2.1M', parentIds: ['c-i1'], childIds: ['c-t1'], ai: { analyse: 'Zero defects in prod.', predict: 'On-time.', recommend: 'Open-source core.', automate: 'Auto-evals running.', optimise: '35% lower token cost.' } },
        { id: 'b-p2-c', title: 'Epic: Telco Data Lake Migration', owner: 'Data Pod Beta', status: 'At Risk', progress: 70, budget: '$3.8M', parentIds: ['c-i2'], childIds: ['c-t1'], ai: { analyse: '18% scope growth.', predict: 'CR #4 mitigates.', recommend: 'Freeze schema.', automate: 'Data lineage active.', optimise: 'Parallelised ETL.' } }
      ],
      6: [
        { id: 'c-t1', title: 'Cloud, Data & AI Consultants (140 FTE)', owner: 'Resource Manager', status: 'On Track', progress: 86, budget: '$12.4M', parentIds: ['c-p1', 'b-p2-c'], childIds: ['c-o-1'], ai: { analyse: '83% utilisation.', predict: 'Healthy.', recommend: 'Upskill 12 in GenAI.', automate: 'Skills matrix live.', optimise: 'Zero bench >14 days.' } }
      ],
      7: [
        { id: 'c-o-1', title: '+$6.4M Incremental Margin & 96% CSAT', owner: 'Managing Partner', status: 'On Track', progress: 88, budget: 'ROI 3.4x', parentIds: ['c-t1'], childIds: [], ai: { analyse: 'Client NPS 64.', predict: 'Exceeds Q4 plan.', recommend: 'Reinvest in AI COE.', automate: 'P&L attribution live.', optimise: 'Top-decile partner ROI.' } }
      ]
    },
    knowledgeBase: [
      { id: 'kb1', title: 'Historical Performance', metric: '85% Avg Attainment', trend: '+6% YoY', summary: 'AI-enabled engagements consistently beat T&M margin benchmarks by 7.5 percentage points.', details: ['Avg Gross Margin: 40.4%', 'Billable Utilisation: 81.4%', 'Repeat Client Rate: 88%'] },
      { id: 'kb2', title: 'Market Data', metric: '+28% GenAI Demand', trend: 'APAC Cloud', summary: 'Enterprise clients shifting from PoCs to production Agentic AI & Planview portfolio governance.', details: ['Avg Deal Size: $1.2M', 'Competitor Rate Pressure: -3%', 'AI Governance RFPs: +42%'] },
      { id: 'kb3', title: 'Customer Feedback', metric: 'NPS 64 (+9)', trend: 'CSAT 4.7/5', summary: 'Clients praise speed-to-value of Apex Accelerators; request more post-go-live knowledge transfer.', details: ['Top Praise: 4-week MVP', 'Top Request: Internal upskilling', 'Renewal Rate: 92%'] },
      { id: 'kb4', title: 'Project Runner & Outcome', metric: '3.4x Avg ROI', trend: '89% On-Time', summary: 'Fixed-price projects using reusable IP kits achieve 94% on-time delivery vs 71% for bespoke builds.', details: ['Best Runner: FinServ Cloud Kit', 'Risk Pattern: Uncontrolled SOW scope', 'Lesson: Gate CRs at +10%'] },
      { id: 'kb5', title: 'Resources & Utilisation', metric: '83% Utilisation', trend: 'Balanced', summary: '380 consultants across 4 practices; Principal AI Architects near capacity, junior bench well-managed.', details: ['AI Architects: 92% load', 'Data Engineers: 95% load', 'Bench: 11% (upskilling)'] }
    ]
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
        agentName: 'Strategy Explorer Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Unify e-commerce, 140 physical stores, and AI supply chain into a seamless omnichannel engine.',
        confidence: 91,
        status: 'On Track',
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
        agentName: 'Outcome Predictor Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Focus retail & tech teams on conversion, inventory velocity, and customer lifetime value.',
        confidence: 87,
        status: 'On Track',
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
        agentName: 'Portfolio & Epic Alignment Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Link Merchandising, Supply Chain, and Digital Epics to Q4 peak-season OKRs.',
        confidence: 86,
        status: 'On Track',
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
        agentName: 'Risk & Velocity Sentinel Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Detect supply chain delays, checkout latency, and store fulfillment bottlenecks.',
        confidence: 82,
        status: 'At Risk',
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
        agentName: 'Executive Telemetry & Dashboard Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Deliver live peak-season command center dashboards for Retail & Tech executives.',
        confidence: 92,
        status: 'On Track',
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
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Analyse Q4 peak performance to optimise Q1 2027 inventory & digital investments.',
        confidence: 90,
        status: 'On Track',
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
        { id: 'r-t1', title: 'Omnichannel & Supply Chain Tech (54 FTE)', owner: 'Engineering Director', status: 'On Track', progress: 82, budget: '$14.2M', parentIds: ['r-p1', 'r-p2'], childIds: ['r-o-1'], ai: { analyse: '91% healthy load.', predict: 'Peak-ready.', recommend: 'Rotate on-call.', automate: 'DORA metrics green.', optimise: 'MTTR < 12 mins.' } }
      ],
      7: [
        { id: 'r-o-1', title: '+$14.5M Peak Revenue & -14% Returns', owner: 'CFO', status: 'On Track', progress: 85, budget: 'ROI 2.9x', parentIds: ['r-t1'], childIds: [], ai: { analyse: 'Tracking +$11.8M YTD.', predict: 'Meets Q4 plan.', recommend: 'Scale AI Fit.', automate: 'Margin attribution live.', optimise: '+2.8% gross margin.' } }
      ]
    },
    knowledgeBase: [
      { id: 'kb1', title: 'Historical Performance', metric: '81% Avg Attainment', trend: '+5% YoY', summary: 'Digital Checkout OKRs average 89% attainment; Store-WMS integrations historically face Q4 lag.', details: ['Peak Conversion: 3.8%', 'Return Rate: 16% (down from 19%)', 'Inventory Turn: 5.4x'] },
      { id: 'kb2', title: 'Market Data', metric: '+19% Mobile Share', trend: 'Click & Collect', summary: 'Shoppers increasingly expect 2-hour local pickup and AI-guided sizing to avoid returns.', details: ['Mobile Traffic: 74%', 'BNPL Share: 22%', 'Peer Delivery SLA: Next-day'] },
      { id: 'kb3', title: 'Customer Feedback', metric: 'NPS 58 (+6)', trend: 'CSAT 4.5/5', summary: 'Customers love 1-tap checkout; top complaint is out-of-stock surprises on Click & Collect.', details: ['Top Praise: Fast Apple Pay', 'Top Pain: Cancelled pickup items', 'AI Fit Rating: 4.6/5'] },
      { id: 'kb4', title: 'Project Runner & Outcome', metric: '2.9x Avg ROI', trend: '82% On-Time', summary: 'AI Size & Fit delivered 3.6x ROI; legacy POS hardware upgrades ran 14% over budget.', details: ['Best Runner: AI Size & Fit', 'Overrun: Legacy POS', 'Lesson: Edge-cache WMS'] },
      { id: 'kb5', title: 'Resources & Utilisation', metric: '91% Utilisation', trend: '1 Bottleneck', summary: '54 FTEs; WMS Integration Devs at 102% load during peak prep.', details: ['WMS Devs: 102% load', 'Frontend Squad: 96% load', 'QA: 84% load'] }
    ]
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
        agentName: 'Strategy Explorer Agent',
        planviewCapability: 'Strategic Portfolio Management & Anvi',
        goal: 'Accelerate renewable grid integration, smart-meter telemetry, and predictive outage prevention.',
        confidence: 89,
        status: 'On Track',
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
        agentName: 'Outcome Predictor Agent',
        planviewCapability: 'OKR Management & Goal Framework',
        goal: 'Align Field Ops, Asset Management, and IT on grid reliability (SAIDI) and renewable hosting.',
        confidence: 85,
        status: 'On Track',
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
        agentName: 'Portfolio & Epic Alignment Agent',
        planviewCapability: 'Portfolio, Program & Agile Tracking',
        goal: 'Connect substation upgrades, DERMS software Epics, and field maintenance to OKRs.',
        confidence: 80,
        status: 'At Risk',
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
        agentName: 'Risk & Velocity Sentinel Agent',
        planviewCapability: 'Execution Intelligence & Risk Radar',
        goal: 'Detect capital-works slippage, OT/IT bottlenecks, and weather-driven schedule risks.',
        confidence: 74,
        status: 'At Risk',
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
        agentName: 'Executive Telemetry & Dashboard Agent',
        planviewCapability: 'Outcome Tracking & Executive Reporting',
        goal: 'Provide Board & Regulator-ready visibility into grid reliability, capex ROI, and OKR health.',
        confidence: 90,
        status: 'On Track',
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
        agentName: 'Retrospective & Learning Agent',
        planviewCapability: 'Outcome Intelligence & Lessons Learned',
        goal: 'Feed outage root-causes and capex delivery patterns into Q1 2027 grid planning.',
        confidence: 89,
        status: 'On Track',
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
        { id: 'p-p2', title: 'Epic: Solar & EV Load Forecaster', owner: 'Grid AI Squad', status: 'On Track', progress: 90, budget: '$9.8M', parentIds: ['p-i2'], childIds: ['p-t1'], ai: { analyse: '15-min granularity.', predict: 'Green.', recommend: 'Roll out statewide.', automate: 'MLOps pipeline.', optimise: 'Cut cloud compute 16%.' } }
      ],
      6: [
        { id: 'p-t1', title: 'OT/SCADA & Grid AI Engineers (64 FTE)', owner: 'Engineering Director', status: 'At Risk', progress: 71, budget: '$24.3M', parentIds: ['p-p1', 'p-p2'], childIds: ['p-o-1'], ai: { analyse: '106% load on OT.', predict: 'Needs contractor burst.', recommend: 'Add 4 OT specialists.', automate: 'Capacity alerts live.', optimise: 'Balanced sprint load.' } }
      ],
      7: [
        { id: 'p-o-1', title: '-13% SAIDI & $3.2M BESS Arbitrage', owner: 'CFO & Regulator', status: 'On Track', progress: 78, budget: 'ROI 2.6x', parentIds: ['p-t1'], childIds: [], ai: { analyse: '42k customer-hours saved.', predict: 'Meets AER target.', recommend: 'Publish sustainability report.', automate: 'Outcome tracking live.', optimise: 'Avoided $1.9M penalties.' } }
      ]
    },
    knowledgeBase: [
      { id: 'kb1', title: 'Historical Performance', metric: '74% Avg Attainment', trend: '+3% YoY', summary: 'Software/AI grid projects hit 88% attainment; physical substation upgrades average 66% due to supply chain.', details: ['SAIDI Improvement: -13% YoY', 'Capex Variance: +6.1% on hardware', 'Best Quarter: Q2 2026'] },
      { id: 'kb2', title: 'Market Data', metric: '+38% DER Growth', trend: 'AEMO 2030', summary: 'Rapid rooftop solar & EV uptake requires dynamic voltage management and automated feeder switching.', details: ['Rooftop Solar: 34% penetration', 'EV Load Growth: +45% YoY', 'Transformer Lead Time: 26 wks'] },
      { id: 'kb3', title: 'Customer Feedback', metric: 'NPS 44 (+5)', trend: 'CSAT 4.1/5', summary: 'Customers value proactive SMS outage ETAs; frustrated by solar export limits during midday.', details: ['Top Praise: SMS Outage Alerts', 'Top Pain: Solar curtailment', 'Call Volume: -21%'] },
      { id: 'kb4', title: 'Project Runner & Outcome', metric: '2.6x Avg ROI', trend: '74% On-Time', summary: 'AI DERMS & BESS Dispatch delivered 3.3x ROI; legacy SCADA upgrades suffered vendor delays.', details: ['Best Runner: AI DERMS', 'Delayed: Western Substation', 'Lesson: Pre-stage LTE kits'] },
      { id: 'kb5', title: 'Resources & Utilisation', metric: '101% Utilisation', trend: '2 Bottlenecks', summary: '64 FTEs; OT/SCADA Cyber Engineers (106%) and HV Technicians (104%) are critically constrained.', details: ['OT/SCADA: 106% load', 'HV Techs: 104% load', 'Grid AI: 86% load'] }
    ]
  }
};

const INDUSTRY_ICONS = {
  Banking: Building2,
  'IT Consulting': Briefcase,
  Retail: ShoppingBag,
  'Power Suppliers': Zap
};

const LAYER_NAMES = {
  1: '1. Corporate Strategy',
  2: '2. Objectives',
  3: '3. Key Results',
  4: '4. Initiatives',
  5: '5. Projects & Epics',
  6: '6. Team & Resources',
  7: '7. Business Outcomes'
};

const AI_PILLAR_META = [
  { key: 'analyse', label: 'Analyse', icon: BarChart3, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: 'predict', label: 'Predict', icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { key: 'recommend', label: 'Recommend', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { key: 'automate', label: 'Automate', icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { key: 'optimise', label: 'Optimise', icon: Sliders, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' }
];

function StatusBadge({ status }) {
  if (status === 'On Track') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> On Track
      </span>
    );
  }
  if (status === 'At Risk') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5" /> At Risk
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="w-3.5 h-3.5" /> Behind
    </span>
  );
}

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT
 * ============================================================================
 */
export default function App() {
  const [selectedIndustry, setSelectedIndustry] = useState('Banking');
  const [activeView, setActiveView] = useState('lifecycle'); // 'lifecycle' | 'traceability' | 'knowledge'
  const [activeStageId, setActiveStageId] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simRunCount, setSimRunCount] = useState(0);
  const [selectedNodeId, setSelectedNodeId] = useState('b-o1');
  const [fedPillars, setFedPillars] = useState({
    kb1: true,
    kb2: true,
    kb3: true,
    kb4: true,
    kb5: true
  });

  const industry = INDUSTRY_DATA[selectedIndustry];

  // Reset selected traceability node when switching industries
  const handleIndustryChange = (ind) => {
    setSelectedIndustry(ind);
    setActiveStageId(1);
    setSimRunCount(0);
    const firstLayer2Node = INDUSTRY_DATA[ind].traceability[2]?.[0]?.id || INDUSTRY_DATA[ind].traceability[1][0].id;
    setSelectedNodeId(firstLayer2Node);
  };

  // Run interactive Agent Simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimRunCount((prev) => prev + 1);
    }, 650);
  };

  const activeStage = industry.stages.find((s) => s.id === activeStageId) || industry.stages[0];

  // Flatten traceability nodes for quick lookup & lineage highlighting
  const allNodesMap = useMemo(() => {
    const map = {};
    Object.values(industry.traceability).forEach((layerNodes) => {
      layerNodes.forEach((node) => {
        map[node.id] = node;
      });
    });
    return map;
  }, [industry]);

  // Compute upstream (ancestors) and downstream (descendants) for selected node
  const highlightedIds = useMemo(() => {
    const set = new Set();
    if (!selectedNodeId || !allNodesMap[selectedNodeId]) return set;
    set.add(selectedNodeId);

    const walkUp = (id) => {
      const node = allNodesMap[id];
      if (!node) return;
      node.parentIds.forEach((pid) => {
        if (!set.has(pid)) {
          set.add(pid);
          walkUp(pid);
        }
      });
    };

    const walkDown = (id) => {
      const node = allNodesMap[id];
      if (!node) return;
      node.childIds.forEach((cid) => {
        if (!set.has(cid)) {
          set.add(cid);
          walkDown(cid);
        }
      });
    };

    walkUp(selectedNodeId);
    walkDown(selectedNodeId);
    return set;
  }, [selectedNodeId, allNodesMap]);

  const selectedNode = allNodesMap[selectedNodeId] || industry.traceability[1][0];
  const activeFedCount = Object.values(fedPillars).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* ====================================================================
          TOP HEADER & INDUSTRY SWITCHER
         ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Brand & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Planview Anvi — Multi-Agent OKR Lifecycle & Traceability
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{industry.name}</span>
                  <span>•</span>
                  <span>{industry.sector}</span>
                  <span>•</span>
                  <span className="font-medium text-indigo-600">{industry.quarter}</span>
                </p>
              </div>
            </div>

            {/* Organization Type Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {Object.keys(INDUSTRY_DATA).map((ind) => {
                const Icon = INDUSTRY_ICONS[ind];
                const isActive = selectedIndustry === ind;
                return (
                  <button
                    key={ind}
                    onClick={() => handleIndustryChange(ind)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {ind}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Navigation Views + Executive KPI Strip */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <nav className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveView('lifecycle')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'lifecycle'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                6-Stage Multi-Agent Lifecycle
              </button>
              <button
                onClick={() => setActiveView('traceability')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'traceability'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                7-Layer Planview Traceability
              </button>
              <button
                onClick={() => setActiveView('knowledge')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeView === 'knowledge'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Database className="w-4 h-4" />
                AI Knowledge Base (5 Pillars)
              </button>
            </nav>

            {/* Quick Executive Metrics */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Attainment: <strong className="text-slate-900">{industry.attainment}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Portfolio: <strong className="text-slate-900">{industry.totalBudget}</strong></span>
              </div>
              <StatusBadge status={industry.overallHealth} />
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MAIN CONTENT AREA
         ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ------------------------------------------------------------------
            VIEW 1: 6-STAGE MULTI-AGENT OKR LIFECYCLE
           ------------------------------------------------------------------ */}
        {activeView === 'lifecycle' && (
          <div className="space-y-6">
            {/* Horizontal 6-Stage Stepper */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  Planview End-to-End OKR Lifecycle
                </h2>
                <span className="text-xs text-slate-500">
                  {activeFedCount}/5 Knowledge Pillars Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                {industry.stages.map((stage) => {
                  const isSelected = stage.id === activeStageId;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setActiveStageId(stage.id)}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {stage.id}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              stage.status === 'On Track' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-2">{stage.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{stage.agentName}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Stage Detail & Multi-Agent Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Stage Goal + 5 Agentic AI Capabilities */}
              <div className="lg:col-span-2 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-700">
                          Stage {activeStage.id} of 6
                        </span>
                        <StatusBadge status={activeStage.status} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{activeStage.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{activeStage.goal}</p>
                    </div>
                    <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 shrink-0">
                      <p className="text-[11px] font-medium text-slate-500 uppercase">Active Agent</p>
                      <p className="text-sm font-bold text-indigo-700 flex items-center gap-1.5 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                        {activeStage.agentName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{activeStage.planviewCapability}</p>
                    </div>
                  </div>

                  {/* 5 Agentic AI Actions: Analyse, Predict, Recommend, Automate, Optimise */}
                  <div className="mt-5">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      5 Agentic AI Actions ({industry.name})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {AI_PILLAR_META.map((pillar) => {
                        const Icon = pillar.icon;
                        return (
                          <div
                            key={pillar.key}
                            className={`p-3.5 rounded-xl border ${pillar.color} ${
                              pillar.key === 'optimise' ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wide mb-1">
                              <Icon className="w-4 h-4" />
                              {pillar.label}
                            </div>
                            <p className="text-sm text-slate-800 leading-relaxed">
                              {activeStage.aiActions[pillar.key]}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Agent Simulation & Risk Telemetry */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      Agent Simulation & Telemetry
                    </h4>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {Math.min(99, activeStage.confidence + simRunCount)}% Confidence
                    </span>
                  </div>

                  <button
                    onClick={handleRunSimulation}
                    disabled={isSimulating}
                    className="w-full mb-5 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold shadow-sm transition-all"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running Multi-Agent Simulation...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Agent Simulation
                      </>
                    )}
                  </button>

                  <div className={`space-y-3 transition-opacity ${isSimulating ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-medium text-slate-500 uppercase">Velocity Trend</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">
                        {activeStage.simMetrics.velocityTrend}
                        {simRunCount > 0 && ' (Verified)'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-medium text-slate-500 uppercase">Budget Burn</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{activeStage.simMetrics.budgetBurn}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[11px] font-medium text-slate-500 uppercase">Resource Constraint</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">
                        {activeStage.simMetrics.resourceConstraint}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                      <p className="text-[11px] font-bold text-amber-800 uppercase">Risk Detection</p>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        {activeStage.simMetrics.riskAlert}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[11px] font-bold text-emerald-800 uppercase">Recommended Action</p>
                      <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                        {activeStage.simMetrics.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            VIEW 2: 7-LAYER PLANVIEW TRACEABILITY EXPLORER
           ------------------------------------------------------------------ */}
        {activeView === 'traceability' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: 7-Layer Interactive Lineage Tree */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    7-Layer Planview Traceability Explorer
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any node to highlight its upstream & downstream strategic lineage.
                  </p>
                </div>
                <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  {highlightedIds.size} Connected Nodes Highlighted
                </span>
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((layerIdx) => {
                  const nodes = industry.traceability[layerIdx] || [];
                  return (
                    <div key={layerIdx} className="relative">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        {LAYER_NAMES[layerIdx]}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {nodes.map((node) => {
                          const isSelected = node.id === selectedNodeId;
                          const isHighlighted = highlightedIds.has(node.id);
                          return (
                            <button
                              key={node.id}
                              onClick={() => setSelectedNodeId(node.id)}
                              className={`text-left p-3 rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                                  : isHighlighted
                                  ? 'bg-indigo-50/90 border-indigo-300 text-slate-900 shadow-sm'
                                  : 'bg-slate-50/70 border-slate-200 text-slate-500 opacity-65 hover:opacity-100'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold leading-snug">{node.title}</p>
                                <span
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : node.status === 'On Track'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-amber-100 text-amber-700'
                                  }`}
                                >
                                  {node.progress}%
                                </span>
                              </div>
                              <div
                                className={`mt-2 flex items-center justify-between text-[11px] ${
                                  isSelected ? 'text-indigo-100' : 'text-slate-500'
                                }`}
                              >
                                <span>{node.owner}</span>
                                <span className="font-medium">{node.budget}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Side Inspector with 5 Agentic AI Capabilities */}
            <div className="space-y-5">
              {selectedNode && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-28">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Layer Inspector
                    </span>
                    <StatusBadge status={selectedNode.status} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedNode.title}</h3>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 pb-4 border-b border-slate-100">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {selectedNode.owner}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {selectedNode.budget}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 mb-5">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-600">Attainment / Progress</span>
                      <span className="text-slate-900 font-bold">{selectedNode.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedNode.status === 'On Track' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${selectedNode.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* 5 Agentic AI Insights for Selected Node */}
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Anvi Agentic AI Insights
                  </h4>
                  <div className="space-y-2.5">
                    {AI_PILLAR_META.map((pillar) => {
                      const Icon = pillar.icon;
                      return (
                        <div key={pillar.key} className={`p-3 rounded-xl border ${pillar.color}`}>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase">
                            <Icon className="w-3.5 h-3.5" />
                            {pillar.label}
                          </div>
                          <p className="text-xs text-slate-800 mt-1">{selectedNode.ai[pillar.key]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            VIEW 3: AI KNOWLEDGE BASE (5 PILLARS)
           ------------------------------------------------------------------ */}
        {activeView === 'knowledge' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  AI Knowledge Base — {industry.name}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  5-pillar enterprise context feeding Planview Anvi agents across all 6 OKR lifecycle stages.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-700">
                <Sparkles className="w-4 h-4" />
                {activeFedCount} of 5 Pillars Feeding OKR Agents
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {industry.knowledgeBase.map((pillar) => {
                const isFed = fedPillars[pillar.id];
                return (
                  <div
                    key={pillar.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                      isFed ? 'border-slate-200' : 'border-slate-200 opacity-65'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {pillar.trend}
                        </span>
                      </div>

                      <div className="text-2xl font-extrabold text-indigo-600 mb-2">{pillar.metric}</div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">{pillar.summary}</p>

                      <ul className="space-y-1.5 mb-5">
                        {pillar.details.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() =>
                        setFedPillars((prev) => ({
                          ...prev,
                          [pillar.id]: !prev[pillar.id]
                        }))
                      }
                      className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        isFed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {isFed ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Feeding into OKR Agents
                        </>
                      ) : (
                        <>
                          <Info className="w-3.5 h-3.5" /> Enable Agent Feed
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}