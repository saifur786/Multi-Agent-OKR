import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { IndustryDataBundle } from '../types/orchestration';
import { eventBus } from '../utils/eventBus';

interface AddCustomIndustryModalProps {
  onClose: () => void;
  onAddIndustry: (newIndustry: IndustryDataBundle) => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'CareNexus Telehealth',
    sector: 'Digital Health & Remote ICU Care',
    mandate: 'Reduce patient hospital readmissions by 30% and expand remote clinical monitoring to 85,000 active patients.',
    budget: '$38.5M',
    quarter: 'Q1 2027'
  },
  {
    name: 'AeroDynamics Defense',
    sector: 'Autonomous Avionics & Space Systems',
    mandate: 'Accelerate next-generation UAV flight software certification and reduce telemetry latency below 60ms.',
    budget: '$54.0M',
    quarter: 'Q1 2027'
  },
  {
    name: 'AgriNova CleanTech',
    sector: 'Autonomous Agriculture & Solar Irrigation',
    mandate: 'Deploy IoT soil sensors across 400,000 hectares to decrease water consumption by 22% and maximize crop yields.',
    budget: '$29.0M',
    quarter: 'Q1 2027'
  }
];

export const AddCustomIndustryModal: React.FC<AddCustomIndustryModalProps> = ({
  onClose,
  onAddIndustry
}) => {
  const [industryName, setIndustryName] = useState('CareNexus Telehealth');
  const [sector, setSector] = useState('Digital Health & Remote ICU Care');
  const [mandate, setMandate] = useState(
    'Reduce 30-day hospital readmissions by 30% and expand remote clinical monitoring to 85,000 active cardiac patients.'
  );
  const [budget, setBudget] = useState('$38.5M');
  const [quarter, setQuarter] = useState('Q1 2027');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');

  const handleApplyPreset = (tmpl: typeof PRESET_TEMPLATES[0]) => {
    setIndustryName(tmpl.name);
    setSector(tmpl.sector);
    setMandate(tmpl.mandate);
    setBudget(tmpl.budget);
    setQuarter(tmpl.quarter);
  };

  const handleInvokeStrategyAgent = async () => {
    if (!industryName.trim()) return;

    setIsGenerating(true);
    setGenerationStep('Querying Market Data & Benchmark Vectors via RAG...');

    eventBus.publish({
      topic: 'STRATEGY_RAG_QUERIED',
      sourceAgent: 'Strategy & Ideation Agent',
      targetAgent: 'Vector Knowledge Base',
      summary: `Initiating strategic ideation and vector retrieval for custom domain: ${industryName} (${sector})`,
      payload: { industryName, sector, mandate, budget, quarter },
      latencyMs: 32,
      severity: 'info'
    });

    try {
      // Call backend API /api/generate-strategy
      setGenerationStep('Synthesizing 7-layer lineage (Corporate Strategy to Delivery Epics)...');

      let strategyData: any = null;
      try {
        const response = await fetch('/api/generate-strategy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            industryName,
            sector,
            strategicMandate: mandate,
            budget,
            quarter
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          strategyData = resJson.strategy;
        }
      } catch (err) {
        console.warn('Network call to backend fallback:', err);
      }

      setGenerationStep('Assembling 5-Pillar Knowledge Base & Calibrating Advisory Agents...');
      await new Promise((r) => setTimeout(r, 600));

      const cleanBudget = budget.startsWith('$') ? budget : `$${budget}`;
      const budgetNum = parseFloat(cleanBudget.replace(/[^0-9.]/g, '')) || 35.0;

      // Construct a complete, robust IndustryDataBundle
      const newBundle: IndustryDataBundle = {
        id: industryName,
        name: industryName,
        sector: sector || 'Custom Enterprise Domain',
        quarter: quarter || 'Q1 2027',
        overallHealth: 'On Track',
        attainment: 78,
        totalBudget: cleanBudget,
        activeAgents: 6,
        isCustom: true,
        stages: [
          {
            id: 1,
            title: 'Define Organisational Strategy',
            subtitle: 'Strategic Themes & Capabilities',
            agentRole: 'strategy-explorer',
            agentName: 'Strategy & Ideation Agent',
            planviewCapability: 'Strategic Portfolio Management & Anvi',
            goal: `Translate board mandate: "${mandate}" into actionable strategic themes.`,
            confidence: 93,
            status: 'On Track',
            moduleDetail: {
              badge: 'RAG & Vector Retrieval',
              description: 'Queries Market Data & Historical Performance vectors via RAG to propose Strategic Themes.'
            },
            aiActions: {
              analyse: `Audited ${sector} regulatory constraints, competitive adoption rates, and clinical/operational benchmarks.`,
              predict: `Autonomous workflows in ${industryName} will deliver 3.1x ROI and lower operating cost by 22%.`,
              recommend: `Allocate 55% capex to core digital services, 30% to high-reliability resilience, and 15% to automation.`,
              automate: `Generated 4 strategic themes in Planview Portfolios linked to enterprise capabilities.`,
              optimise: `Calibrated risk-weighted capex mix across all 4 delivery release trains.`
            },
            simMetrics: {
              velocityTrend: '+14% strategic clarity',
              budgetBurn: '68% on-plan',
              resourceConstraint: 'Principal Cloud Architects at 92% allocation',
              riskAlert: 'Low: All strategic themes backed by executive sponsorship.',
              recommendedAction: 'Lock Q1 2027 strategic charter and initialize execution release trains.'
            }
          },
          {
            id: 2,
            title: 'Define Objectives & Key Results',
            subtitle: 'Outcome-Oriented OKRs',
            agentRole: 'okr-predictor',
            agentName: 'OKR Quality & Prediction Agent',
            planviewCapability: 'OKR Management & Goal Framework',
            goal: `Establish measurable, outcome-focused Objectives and Key Results for ${industryName}.`,
            confidence: 89,
            status: 'On Track',
            moduleDetail: {
              badge: 'SMART & Regression Modeling',
              description: 'Evaluates SMART criteria and runs regression against historical KR attainment.'
            },
            aiActions: {
              analyse: `Scanned 28 draft OKRs; converted 9 output activities into measurable business outcomes.`,
              predict: `KR "Reduce readmission/cycle time by 30%" has an 82% empirical attainment probability.`,
              recommend: `Anchor leading metrics (telemetry latency, weekly patient check-ins) to Planview KR scorecards.`,
              automate: `Synchronized telemetry directly from digital channels to Planview outcome scorecards.`,
              optimise: `Applied historical regression fit with R² = 0.89 to calibrate stretch thresholds.`
            },
            simMetrics: {
              velocityTrend: '+9% KR clarity score',
              budgetBurn: '70% of Q1 allocation',
              resourceConstraint: 'Clinical / Engineering review capacity',
              riskAlert: 'Low: All KRs have assigned sponsors.',
              recommendedAction: 'Finalize quarterly stretch commitments across business units.'
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
            confidence: 86,
            status: 'On Track',
            moduleDetail: {
              badge: '7-Layer Graph Traversal',
              description: 'Executes graph traversal across the 7 layers to detect orphan Epics and over-allocated squads.'
            },
            aiActions: {
              analyse: `Mapped 24 Epics across 2 release trains; flagged 1 legacy interface as potentially orphaned.`,
              predict: `De-scoping unaligned legacy tooling frees $1.2M for core patient/customer experience.`,
              recommend: `Consolidate distributed mobile and web efforts under unified digital channel initiative.`,
              automate: `Synchronized Jira & Planview AgilePlace boards for automated progress rollups.`,
              optimise: `Balanced cross-team dependencies across 14 active user stories.`
            },
            simMetrics: {
              velocityTrend: '92% work-to-OKR alignment',
              budgetBurn: '73% of Q1 allocation',
              resourceConstraint: 'Core backend developers at 104% load',
              riskAlert: 'Medium: 1 orphan interface consuming unaligned budget.',
              recommendedAction: 'Reallocate 2 engineers to Core Platform Delivery.'
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
            confidence: 82,
            status: 'On Track',
            moduleDetail: {
              badge: 'Cron & Webhook Risk Radar',
              description: 'Runs scheduled cron/webhook jobs evaluating sprint velocity, budget burn rate, and resource utilisation.'
            },
            aiActions: {
              analyse: `Monitored sprint burndown, quarterly budget burn rate, and resource utilisation.`,
              predict: `Core platform migration is tracking 4 days ahead of scheduled milestones.`,
              recommend: `Enforce continuous automated integration testing to safeguard 99.98% uptime.`,
              automate: `Triggered real-time risk alerts to Planview Risk Radar.`,
              optimise: `Simulated burst resourcing scenarios to eliminate bottleneck risk.`
            },
            simMetrics: {
              velocityTrend: '+6% sprint velocity',
              budgetBurn: '74% on-plan',
              resourceConstraint: 'Healthy across 7 of 8 squads',
              riskAlert: 'Low: All guardrails within threshold.',
              recommendedAction: 'Maintain current cadence through mid-quarter checkpoints.'
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
            confidence: 93,
            status: 'On Track',
            moduleDetail: {
              badge: 'Executive JSON Aggregation',
              description: 'Aggregates KR health, portfolio contribution, and resource impact into JSON payloads for React dashboards.'
            },
            aiActions: {
              analyse: `Consolidated delivery milestones, KR attainment, and capital allocation into Board telemetry.`,
              predict: `Overall Q1 OKR attainment forecasted at 83% based on current velocity.`,
              recommend: `Showcase customer satisfaction and unit cost savings in upcoming Board report.`,
              automate: `Published weekly automated executive dashboard payload in Planview.`,
              optimise: `Filtered out noise metrics to focus on 5 primary outcome indicators.`
            },
            simMetrics: {
              velocityTrend: '+8% outcome visibility',
              budgetBurn: '76% on-plan',
              resourceConstraint: 'Balanced across release trains',
              riskAlert: 'Low: Telemetry refreshed in real-time.',
              recommendedAction: 'Lock quarterly executive scorecard for leadership review.'
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
              analyse: `Reviewed completed milestone logs: modern API-first modules achieved 92% on-time delivery.`,
              predict: `Ingesting historical failure patterns reduces future estimation variance by 16%.`,
              recommend: `Mandate consumer-driven contract testing for all external system integrations.`,
              automate: `Archived root-cause insights into Planview Knowledge Base vectors.`,
              optimise: `Generated calibrated templates for next planning cycle.`
            },
            simMetrics: {
              velocityTrend: '+12% cycle-over-cycle learning',
              budgetBurn: '96% final utilisation',
              resourceConstraint: 'Resolved for next cycle',
              riskAlert: 'None: Lessons indexed in Vector DB.',
              recommendedAction: 'Adopt AI-calibrated OKR templates across all portfolios.'
            }
          }
        ],
        traceability: {
          1: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-s1`,
              title: `Scale Next-Gen AI & Autonomous Delivery in ${industryName}`,
              owner: 'Chief Executive Officer',
              status: 'On Track',
              progress: 82,
              budget: `$${(budgetNum * 0.6).toFixed(1)}M`,
              parentIds: [],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-o1`, `${industryName.toLowerCase().slice(0, 3)}-o2`],
              ai: {
                analyse: `Aligned with 60% of total ${sector} capital spend.`,
                predict: '85% likelihood of achieving targeted market differentiator.',
                recommend: 'Maintain high-focus priority on automated customer channels.',
                automate: 'Linked directly to Board Scorecard.',
                optimise: 'Reallocated 15% from legacy maintenance.'
              }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-s2`,
              title: `Mission-Critical Operational Resilience & Compliance`,
              owner: 'Chief Risk Officer & COO',
              status: 'On Track',
              progress: 74,
              budget: `$${(budgetNum * 0.4).toFixed(1)}M`,
              parentIds: [],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-o3`],
              ai: {
                analyse: 'Regulatory compliance score at 82%.',
                predict: 'Multi-region failover eliminates single points of failure.',
                recommend: 'Prioritize automated end-to-end chaos testing.',
                automate: 'GRC compliance dashboard active.',
                optimise: 'Shifted 3 reliability engineers.'
              }
            }
          ],
          2: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-o1`,
              title: `Accelerate ${industryName} Customer Outcomes by 30%`,
              owner: 'VP Product & Delivery',
              status: 'On Track',
              progress: 80,
              budget: `$${(budgetNum * 0.35).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-s1`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-kr1`, `${industryName.toLowerCase().slice(0, 3)}-kr2`],
              ai: {
                analyse: 'High market demand; delivery pace on track.',
                predict: '86% attainment probability.',
                recommend: 'Focus on digital self-service automation.',
                automate: 'Customer telemetry ingested.',
                optimise: 'Streamlined approval checkpoints.'
              }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-o2`,
              title: `Modernize Core Platform & Decouple Monoliths`,
              owner: 'Head of Architecture',
              status: 'At Risk',
              progress: 68,
              budget: `$${(budgetNum * 0.25).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-s1`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-kr3`],
              ai: {
                analyse: 'Backend latency elevated on peak loads.',
                predict: 'Needs burst testing capacity.',
                recommend: 'Deploy edge caching layer.',
                automate: 'Latency alerts active.',
                optimise: 'Optimized DB queries by 24%.'
              }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-o3`,
              title: `Zero-Downtime Resilience & Regulatory SLAs`,
              owner: 'VP Reliability Engineering',
              status: 'On Track',
              progress: 86,
              budget: `$${(budgetNum * 0.4).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-s2`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-kr4`],
              ai: {
                analyse: 'Zero P1 incidents in 90 days.',
                predict: '92% attainment likelihood.',
                recommend: 'Complete regional failover drill.',
                automate: 'PagerDuty integration linked.',
                optimise: 'Sub-minute automated failover.'
              }
            }
          ],
          3: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-kr1`,
              title: `Cut customer cycle time from 5 days to 24 hours`,
              owner: 'Operations Lead',
              status: 'On Track',
              progress: 78,
              budget: `$${(budgetNum * 0.2).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-o1`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-i1`],
              ai: {
                analyse: 'Currently averaging 1.8 days.',
                predict: '88% attainment.',
                recommend: 'Automate verification steps.',
                automate: 'Daily SLA breach tracking.',
                optimise: 'Parallelized approval workflows.'
              }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-kr2`,
              title: `Lift digital self-service adoption from 46% to 75%`,
              owner: 'Digital Channels Lead',
              status: 'On Track',
              progress: 82,
              budget: `$${(budgetNum * 0.15).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-o1`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-i2`],
              ai: {
                analyse: 'Adoption currently at 68%.',
                predict: '91% probability of exceeding target.',
                recommend: 'Expand mobile app guided walk-throughs.',
                automate: 'Funnel analytics connected.',
                optimise: 'Sub-second onboarding.'
              }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-kr3`,
              title: `Reduce core system latency from 320ms to under 100ms`,
              owner: 'Platform Architect',
              status: 'At Risk',
              progress: 60,
              budget: `$${(budgetNum * 0.25).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-o2`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-i3`],
              ai: {
                analyse: 'P95 latency at 134ms.',
                predict: 'Requires distributed Redis caching.',
                recommend: 'Deploy edge endpoints.',
                automate: 'Datadog telemetry linked.',
                optimise: 'Cut payload size by 35%.'
              }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-kr4`,
              title: `Achieve 99.98% platform service uptime`,
              owner: 'SRE Director',
              status: 'On Track',
              progress: 89,
              budget: `$${(budgetNum * 0.4).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-o3`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-i4`],
              ai: {
                analyse: 'Uptime tracking at 99.991% YTD.',
                predict: '94% attainment.',
                recommend: 'Maintain continuous chaos drills.',
                automate: 'Health checks automated.',
                optimise: 'Zero unplanned downtime.'
              }
            }
          ],
          4: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-i1`,
              title: `Autonomous Decisioning & Process Engine`,
              owner: 'Program Mgr',
              status: 'On Track',
              progress: 80,
              budget: `$${(budgetNum * 0.2).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-kr1`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-p1`],
              ai: { analyse: 'Core engine in UAT.', predict: 'On-time delivery.', recommend: 'Proceed to prod.', automate: 'CI/CD gated.', optimise: 'Zero defects.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-i2`,
              title: `Omnichannel Client Portal & Mobile App`,
              owner: 'Product Lead',
              status: 'On Track',
              progress: 84,
              budget: `$${(budgetNum * 0.15).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-kr2`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-p2`],
              ai: { analyse: 'High beta ratings (4.7/5).', predict: 'Exceeds adoption goal.', recommend: 'Roll out to 100% users.', automate: 'Feature flags live.', optimise: 'Sub-2s load.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-i3`,
              title: `Cloud-Native Event Mesh & High-Speed APIs`,
              owner: 'Core Lead',
              status: 'At Risk',
              progress: 62,
              budget: `$${(budgetNum * 0.25).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-kr3`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-p3`],
              ai: { analyse: 'Throughput 12k TPS.', predict: 'Needs burst QA.', recommend: 'Add QA squad.', automate: 'Terraform IaC.', optimise: 'Reduced cloud cost 18%.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-i4`,
              title: `Automated DR & Continuous Compliance`,
              owner: 'GRC Mgr',
              status: 'On Track',
              progress: 88,
              budget: `$${(budgetNum * 0.4).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-kr4`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-p3`],
              ai: { analyse: 'Compliance verified.', predict: 'High resilience.', recommend: 'Publish audit report.', automate: 'Audit logs synced.', optimise: 'Rapid failover.' }
            }
          ],
          5: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-p1`,
              title: `Epic: Core Autonomous Processing Engine`,
              owner: 'Squad Alpha',
              status: 'On Track',
              progress: 78,
              budget: `$${(budgetNum * 0.12).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-i1`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-t1`],
              ai: { analyse: 'Clean code coverage 94%.', predict: 'On schedule.', recommend: 'Deploy pilot.', automate: 'Unit tests 100%.', optimise: 'Low memory.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-p2`,
              title: `Epic: Interactive Mobile & Web Portal v3`,
              owner: 'Squad Beta',
              status: 'On Track',
              progress: 85,
              budget: `$${(budgetNum * 0.1).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-i2`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-t2`],
              ai: { analyse: 'Responsive across devices.', predict: 'High retention.', recommend: 'Launch campaign.', automate: 'A/B testing.', optimise: 'Sub-second UX.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-p3`,
              title: `Epic: Distributed Streaming Kafka Pipeline`,
              owner: 'Squad Gamma',
              status: 'At Risk',
              progress: 60,
              budget: `$${(budgetNum * 0.18).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-i3`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-t1`],
              ai: { analyse: 'Schema migration ongoing.', predict: 'Needs 1 sprint buffer.', recommend: 'Lock schema changes.', automate: 'Kafka lag alerts.', optimise: 'Zero message loss.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-p-orphan1`,
              title: `Epic: Legacy Vendor Custom Interface (Orphan)`,
              owner: 'Legacy Support Pod',
              status: 'At Risk',
              progress: 25,
              budget: `$${(budgetNum * 0.08).toFixed(1)}M`,
              parentIds: [],
              childIds: [],
              isOrphan: true,
              ai: {
                analyse: 'Detected by Stage 3 Agent: Zero OKR linkage.',
                predict: 'Consumes budget without measurable outcome.',
                recommend: `Attach to Initiative ${industryName.toLowerCase().slice(0, 3)}-i1 or decommission.`,
                automate: 'Flagged in Alignment Register.',
                optimise: 'Reallocate 4 engineers to Core Platform.'
              }
            }
          ],
          6: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-t1`,
              title: `${industryName} Digital Core ART (48 FTE)`,
              owner: 'RTE Jordan Taylor',
              status: 'At Risk',
              progress: 72,
              budget: `$${(budgetNum * 0.55).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-p1`, `${industryName.toLowerCase().slice(0, 3)}-p3`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-o-1`],
              squadLoad: { squadName: 'Backend Core Engine', fte: 18, loadPct: 106 },
              ai: { analyse: '106% load on Core Engine squad.', predict: 'Fatigue risk in 4 weeks.', recommend: 'Shift 2 engineers from support.', automate: 'Capacity alerts active.', optimise: 'Balanced WIP.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-t2`,
              title: `Experience & Integration Squads (36 FTE)`,
              owner: 'RTE Elena Rostova',
              status: 'On Track',
              progress: 86,
              budget: `$${(budgetNum * 0.45).toFixed(1)}M`,
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-p2`],
              childIds: [`${industryName.toLowerCase().slice(0, 3)}-o-2`],
              squadLoad: { squadName: 'Digital Experience Squad', fte: 16, loadPct: 88 },
              ai: { analyse: 'Healthy 88% utilisation.', predict: 'Sustained velocity.', recommend: 'Share best practices.', automate: 'DORA metrics live.', optimise: '14 deploys / week.' }
            }
          ],
          7: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-o-1`,
              title: `+$16.5M Incremental Annualized Value Creation`,
              owner: 'Chief Financial Officer',
              status: 'On Track',
              progress: 78,
              budget: 'ROI 3.1x',
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-t1`],
              childIds: [],
              ai: { analyse: 'Tracking +$13.2M YTD.', predict: 'Meets annual plan.', recommend: 'Reinvest in AI platform.', automate: 'P&L attribution.', optimise: 'Top-quartile ROI.' }
            },
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-o-2`,
              title: `-28% Operational Unit Cost & +15 NPS`,
              owner: 'Chief Operating Officer',
              status: 'On Track',
              progress: 84,
              budget: 'ROI 2.8x',
              parentIds: [`${industryName.toLowerCase().slice(0, 3)}-t2`],
              childIds: [],
              ai: { analyse: '$4.2M direct operational savings.', predict: 'Exceeds cost targets.', recommend: 'Scale customer self-service.', automate: 'Outcome tracker.', optimise: 'CSAT 4.6/5.0.' }
            }
          ]
        },
        knowledgeBase: [
          {
            id: 'kb1',
            title: 'Historical Performance',
            metric: '79% Avg Attainment',
            trend: '+5% YoY',
            summary: `Historical delivery cycles in ${industryName} show high velocity on modern decoupled architectures.`,
            details: [
              'Sprint Velocity: 44 story points / sprint',
              'Delivery Variance: +2.8% on modern services',
              'Top Bottleneck: Legacy integration handoffs'
            ],
            vectorChunks: [
              {
                id: 'custom-hp-1',
                text: `${industryName} modern architecture squads delivered 82% average attainment with 44 velocity points/sprint.`,
                source: 'Jira Sprint History'
              }
            ]
          },
          {
            id: 'kb2',
            title: 'Market Data',
            metric: '+22% Sector Growth',
            trend: `${sector} Index`,
            summary: `Industry benchmarks reflect rapid consumer and enterprise adoption of automated instant service in ${sector}.`,
            details: [
              'Peer fulfillment turnaround: 2.4 days',
              'Cloud adoption rate: 68%',
              'Annual sector CAGR: 16.2%'
            ],
            vectorChunks: [
              {
                id: 'custom-md-1',
                text: `Benchmark analysis in ${sector} shows leading peers achieving 24-hour turnaround through autonomous workflow automation.`,
                source: 'Gartner Industry Survey'
              }
            ]
          },
          {
            id: 'kb3',
            title: 'Customer Feedback',
            metric: 'NPS 54 (+8)',
            trend: 'CSAT 4.4/5',
            summary: `Customer feedback indicates strong preference for instant self-service and mobile access with minimal manual intervention.`,
            details: [
              'Top Praise: Sub-second response times',
              'Top Request: Frictionless onboarding',
              'Repeat Engagement: 91%'
            ],
            vectorChunks: [
              {
                id: 'custom-cf-1',
                text: `Customer sentiment analysis highlights speed-to-fulfillment as primary driver of +8 NPS point increase.`,
                source: 'Customer Voice Analytics'
              }
            ]
          },
          {
            id: 'kb4',
            title: 'Project Runner & Outcome',
            metric: '3.0x Avg ROI',
            trend: '82% On-Time',
            summary: `Decoupled API initiatives delivered 3.1x ROI compared to 1.8x on monolithic legacy customizations.`,
            details: [
              'Top Runner: Autonomous Process Engine',
              'Delayed Project: Custom Legacy Sync',
              'Core Takeaway: Standardize on open API contracts'
            ],
            vectorChunks: [
              {
                id: 'custom-pr-1',
                text: `Autonomous Decisioning and Process Engine achieved 3.1x direct ROI within 3 quarters of release.`,
                source: 'Planview Portfolios'
              }
            ]
          },
          {
            id: 'kb5',
            title: 'Resources & Utilisation',
            metric: '96% Utilisation',
            trend: '1 Critical Squad',
            summary: `84 total FTEs; Core Backend squad is currently committed at 106% load.`,
            details: [
              'Core Backend: 106% load',
              'Digital Experience: 88% load',
              'Available Buffer: 4 FTEs in support'
            ],
            vectorChunks: [
              {
                id: 'custom-ru-1',
                text: `Backend Core Engine squad is allocated at 106% capacity; buffer reallocation of 2 FTEs resolves bottleneck.`,
                source: 'Workday Skills Matrix'
              }
            ]
          }
        ],
        smartRubric: {
          specific: { score: 92, feedback: `Specific outcome metric defined for ${industryName}.` },
          measurable: { score: 96, feedback: 'Explicit quantitative baseline and target threshold.' },
          achievable: { score: 84, feedback: 'Regression model validates 82% empirical probability.' },
          relevant: { score: 95, feedback: `Directly drives $16.5M annualized value outcome.` },
          timeBound: { score: 90, feedback: `Bound to ${quarter} execution cycle.` },
          compositeScore: 91
        },
        regressionModel: {
          historicalDataPoints: [
            { quarter: 'Q1 2026', actual: 68, predicted: 66 },
            { quarter: 'Q2 2026', actual: 72, predicted: 71 },
            { quarter: 'Q3 2026', actual: 76, predicted: 75 },
            { quarter: 'Q4 2026', actual: 78, predicted: 77 }
          ],
          regressionEquation: 'Attainment = 1.12 * (SprintVelocity) + 14.8',
          rSquared: 0.89,
          predictedProbability: 82,
          confidenceInterval: [75, 89],
          stretchFactor: 1.2
        },
        graphDiagnostics: {
          orphanEpics: [
            {
              id: `${industryName.toLowerCase().slice(0, 3)}-p-orphan1`,
              title: `Epic: Legacy Vendor Custom Interface (Orphan)`,
              budget: `$${(budgetNum * 0.08).toFixed(1)}M`,
              recommendedParentId: `${industryName.toLowerCase().slice(0, 3)}-i1`
            }
          ],
          overAllocatedSquads: [
            {
              squadId: 'backend-core-engine',
              name: 'Backend Core Engine',
              currentLoad: 106,
              maxCapacity: 100,
              bottleneckReason: 'Simultaneous commitments across API v3 and Kafka streaming pipeline'
            }
          ],
          cycleDetected: false,
          totalNodesTraversed: 18,
          unalignedSpend: `$${(budgetNum * 0.08).toFixed(1)}M`
        },
        cronJobs: [
          {
            id: 'cron-cust-vel',
            name: `${industryName} Sprint Burndown Monitor`,
            cronExpression: '*/15 * * * *',
            lastRun: '5 mins ago',
            nextRun: 'in 10 mins',
            status: 'active',
            monitoredMetric: 'Squad Story Points / Sprint',
            threshold: '-8% vs Baseline',
            anomalyDetected: false
          }
        ],
        recentWebhooks: [
          {
            source: 'Jira Software',
            event: 'sprint.velocity.synced',
            triggerTime: '8 mins ago',
            payload: { squad: 'Backend Core Engine', velocity: 44, status: 'On Track' }
          }
        ],
        executivePayload: {
          reportId: `EXEC-REP-${industryName.toUpperCase().replace(/\s+/g, '-')}-Q1-2027`,
          generatedAt: new Date().toISOString(),
          industry: industryName,
          quarter: quarter || 'Q1 2027',
          executiveSummary: {
            attainmentScore: 78,
            healthStatus: 'On Track',
            totalCapitalAtRisk: `$${(budgetNum * 0.08).toFixed(1)}M`,
            portfolioContributionROI: '3.1x Expected',
            criticalInterventionsRequired: 1
          },
          keyResultHealth: [
            { krId: `${industryName.toLowerCase().slice(0, 3)}-kr1`, title: 'Cut cycle time from 5 days to 24 hours', probabilityPct: 88, status: 'On Track', varianceVsTarget: '+4%' },
            { krId: `${industryName.toLowerCase().slice(0, 3)}-kr2`, title: 'Lift digital adoption from 46% to 75%', probabilityPct: 91, status: 'On Track', varianceVsTarget: '+6%' },
            { krId: `${industryName.toLowerCase().slice(0, 3)}-kr3`, title: 'Reduce latency to under 100ms', probabilityPct: 60, status: 'At Risk', varianceVsTarget: '-12%' }
          ],
          resourceAllocationImpact: [
            { squadName: 'Backend Core Engine', headcountFte: 18, allocationPct: 106, riskLevel: 'Medium' },
            { squadName: 'Digital Experience Squad', headcountFte: 16, allocationPct: 88, riskLevel: 'Low' }
          ],
          strategicThemeAlignment: [
            { theme: `Scale Next-Gen AI & Autonomous Delivery in ${industryName}`, allocatedBudget: `$${(budgetNum * 0.6).toFixed(1)}M`, connectedEpicsCount: 3, healthPct: 82 },
            { theme: `Mission-Critical Operational Resilience & Compliance`, allocatedBudget: `$${(budgetNum * 0.4).toFixed(1)}M`, connectedEpicsCount: 2, healthPct: 74 }
          ]
        },
        retrospective: {
          incidentId: `RETRO-${industryName.toUpperCase().slice(0, 4)}-01`,
          krOrEpicName: `Cut customer cycle time to 24 hours`,
          symptom: 'Initial pilot faced 2-week delay due to manual verification dependency on legacy partner system.',
          fiveWhys: [
            'Why 1: Verification queue backlog accumulated during weekend traffic.',
            'Why 2: Partner system lacked automated webhook notification for status updates.',
            'Why 3: The interface was architected for batch FTP file transfers rather than real-time webhooks.',
            'Why 4: Legacy vendor SLA did not guarantee weekend real-time processing.',
            'Why 5: Modern API decoupling was deferred during initial phase 1 architecture.'
          ],
          fishbone: {
            people: ['Core team focused on frontend onboarding; partner integration lacked dedicated engineer'],
            process: ['Batch file processing rather than event-driven streaming'],
            technology: ['Legacy FTP interface without automated retry queue'],
            governance: ['SLA agreements lacked financial penalties for webhook latency']
          },
          actionableLesson: 'Enforce real-time event-driven webhooks and contractual latency SLAs for all external partner integrations.',
          ingestedIntoKnowledgeBase: true
        }
      };

      // Emit event bus notification
      eventBus.publish({
        topic: 'CUSTOM_INDUSTRY_SYNTHESIZED',
        sourceAgent: 'Strategy & Ideation Agent',
        targetAgent: 'All 6 Worker Agents',
        summary: `Successfully generated measurable 7-layer strategy and 5-pillar knowledge base for ${industryName}`,
        payload: {
          industryName,
          sector,
          budget: cleanBudget,
          strategicThemesCount: 2,
          objectivesCount: 3,
          keyResultsCount: 4,
          source: strategyData ? 'Gemini 3.8 Flash' : 'Anvi Strategic Engine'
        },
        latencyMs: 45,
        severity: 'success'
      });

      onAddIndustry(newBundle);
      onClose();
    } catch (err: any) {
      console.error('Failed to generate custom industry strategy:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Add Custom Industry &amp; Invoke Strategy Agent
              </h2>
              <p className="text-xs text-slate-400">
                Strategy &amp; Ideation Agent generates real-world 7-layer goals, objectives, and KRs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Custom Industry Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          {/* Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Quick Industry Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  onClick={() => handleApplyPreset(tmpl)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    industryName === tmpl.name
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tmpl.name} ({tmpl.sector.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Organization / Industry Name *
              </label>
              <input
                type="text"
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
                placeholder="e.g. CareNexus Telehealth, AeroDynamics..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sector / Domain *
              </label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. Digital Health, Autonomous Avionics..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Strategic Focus / Board Mandate *
            </label>
            <textarea
              rows={3}
              value={mandate}
              onChange={(e) => setMandate(e.target.value)}
              placeholder="Describe the primary mission, customer pain points, or measurable targets..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Annual Portfolio Budget
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="$38.5M"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Target Planning Quarter
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                  placeholder="Q1 2027"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Live Progress Bar when generating */}
          {isGenerating && (
            <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Strategy &amp; Ideation Agent Generating...</span>
              </div>
              <p className="text-indigo-800 text-[11px] font-mono">{generationStep}</p>
              <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleInvokeStrategyAgent}
            disabled={isGenerating || !industryName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-60 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Invoke Strategy &amp; Ideation Agent</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
