/**
 * Planview Anvi - Business Problem Library & AI Attribute Parser
 * Curates 6-attribute structured business problems across industries
 * (Telco, Banking, Retail, IT Consulting, Power Suppliers) and provides
 * intelligent unstructured text parsing to extract all 6 dimensions.
 */

import {
  IndustryKey,
  IndustryDataBundle,
  StructuredBusinessProblem,
  TraceabilityNode,
  BusinessMetricIndicator
} from '../types/orchestration';

export interface BusinessProblemTemplate {
  id: string;
  title: string;
  sector: string;
  problem: StructuredBusinessProblem;
}

export const INDUSTRY_BUSINESS_PROBLEMS: Record<IndustryKey, BusinessProblemTemplate[]> = {
  Telco: [
    {
      id: 'telco-prob-1',
      title: 'Peak-Hour Metro Backhaul Congestion & Churn',
      sector: 'Telecommunications',
      problem: {
        problemDescription: 'High-density urban cell towers experience 94% optical backhaul saturation during the 18:00-21:00 peak hours, generating over 45,000 monthly subscriber complaints and high churn.',
        impactedStakeholders: ['14.8M Mobile Subscribers', 'Enterprise Tier-1 WAN Customers', 'Field Maintenance Crews'],
        causalChainToDollarImpact: 'Congested fiber backhaul -> 4.2% packet drop -> degraded streaming & gaming -> 2.1% monthly subscriber churn -> $18.4M annualised ARPU revenue leakage.',
        rootCause: 'Legacy 10Gbps optical transport interfaces saturated by 5G mid-band traffic; 6-month delay in municipal dark fiber permitting.',
        targetRemediationTiming: 'Q1 2027 Sprint 6',
        metrics: [
          { indicator: 'Peak Backhaul Link Utilisation', baselineValue: '94%', targetValue: '< 65%', metricType: 'Leading' },
          { indicator: 'Postpaid Subscriber Churn Rate', baselineValue: '2.1%', targetValue: '< 0.95%', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'telco-prob-2',
      title: 'Silent Network Quality Degradation & Unreported Churn',
      sector: 'Telecommunications',
      problem: {
        problemDescription: 'Subscribers who experience > 3 dropped calls or speed dips per week port out at 4.2x normal rates without ever calling customer support.',
        impactedStakeholders: ['Postpaid Consumer Base', 'Digital Retention Marketing', 'Customer Care Representatives'],
        causalChainToDollarImpact: 'Silent network micro-outages -> undetected dissatisfaction -> competitor SIM purchase -> $12.8M loss in 24-month contract customer lifetime value.',
        rootCause: 'BSS/CRM silos separated from real-time OSS network telemetry; missing automated trigger pipeline.',
        targetRemediationTiming: 'Q1 2027 Sprint 4',
        metrics: [
          { indicator: 'Real-Time OSS-to-CRM Telemetry Ingestion Latency', baselineValue: '4.5 hours', targetValue: '< 30 seconds', metricType: 'Leading' },
          { indicator: 'Silent Attrition Revenue Loss', baselineValue: '$12.8M', targetValue: '< $3.2M', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'telco-prob-3',
      title: '5G Standalone Enterprise Network Slicing SLA Violations',
      sector: 'Telecommunications',
      problem: {
        problemDescription: 'Enterprise industrial customers requiring ultra-reliable low latency (URLLC < 15ms) experience intermittent jitter spikes during network slice re-anchoring.',
        impactedStakeholders: ['Automated Logistics Hubs', 'Connected Healthcare Hospitals', 'B2B Enterprise Sales'],
        causalChainToDollarImpact: 'Slice jitter spikes -> industrial robot safety halts -> SLA contractual breach penalties -> $8.6M risk to private 5G contract renewals.',
        rootCause: 'Distributed UPF (User Plane Function) edge cloud gateways lack automated dynamic resource re-allocation under burst loads.',
        targetRemediationTiming: 'Q2 2027 Sprint 2',
        metrics: [
          { indicator: '99.9th Percentile URLLC Slice Latency', baselineValue: '28ms', targetValue: '< 12ms', metricType: 'Leading' },
          { indicator: 'Enterprise Slicing Contractual Penalty Payouts', baselineValue: '$1.4M / qtr', targetValue: '$0', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'telco-prob-4',
      title: 'Legacy 3G/Copper Decommissioning & Spectrum Starvation',
      sector: 'Telecommunications',
      problem: {
        problemDescription: 'Continuing to operate 24-year-old 3G equipment diverts $4.8M annual opex and freezes 15MHz of prime sub-1GHz spectrum needed for rural 5G coverage.',
        impactedStakeholders: ['Field Engineering', 'Rural Subscribers', 'Spectrum Governance Board'],
        causalChainToDollarImpact: 'Sub-1GHz spectrum frozen in 3G -> delayed rural 5G expansion -> competitor gains 8% rural market share -> $7.2M annual revenue displacement.',
        rootCause: 'Remaining 42,000 legacy 3G telematics and medical alert devices requiring proactive migration concierge.',
        targetRemediationTiming: 'Q3 2027 Sprint 1',
        metrics: [
          { indicator: 'Active 3G Carrier Decommissioning Rate', baselineValue: '18% complete', targetValue: '100% complete', metricType: 'Leading' },
          { indicator: 'Sub-1GHz Re-farmed 5G Carrier Bandwidth', baselineValue: '0 MHz', targetValue: '15 MHz contiguous', metricType: 'Lagging' }
        ]
      }
    }
  ],
  Banking: [
    {
      id: 'bank-prob-1',
      title: 'APRA CPS 230 Operational Resilience & Instant Payments Downtime',
      sector: 'Banking & Financial Services',
      problem: {
        problemDescription: 'Core banking transaction settlement engine experiences intermittent queue timeouts during high-volume payroll windows, risking regulatory non-compliance.',
        impactedStakeholders: ['Commercial Banking Clients', 'Regulatory Compliance Team', 'Instant Payments Squad'],
        causalChainToDollarImpact: 'Settlement queue timeouts -> NPP payment rejections -> regulatory enforcement audit -> $14.2M capital adequacy buffer hold.',
        rootCause: 'Monolithic mainframe database lock contention on synchronous account balance verification.',
        targetRemediationTiming: 'Q1 2027 Sprint 5',
        metrics: [
          { indicator: 'NPP Transaction Processing Latency', baselineValue: '1,450ms', targetValue: '< 180ms', metricType: 'Leading' },
          { indicator: 'Operational Resilience Penalty Exposure', baselineValue: '$14.2M', targetValue: '$0', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'bank-prob-2',
      title: 'High Mortgage Origination Friction & Turnaround Latency',
      sector: 'Banking & Financial Services',
      problem: {
        problemDescription: 'Home loan applications take 14.8 days from initial digital inquiry to unconditional approval, causing 38% borrower dropout to nimble digital non-bank lenders.',
        impactedStakeholders: ['Retail Mortgage Applicants', 'Mortgage Broker Network', 'Underwriting Operations'],
        causalChainToDollarImpact: '14.8 day turnaround -> broker disengagement -> 38% applicant attrition -> $24.6M annual net interest margin loss.',
        rootCause: 'Manual human income verification and disconnected valuation systems requiring 4 handoffs.',
        targetRemediationTiming: 'Q2 2027 Sprint 3',
        metrics: [
          { indicator: 'Time-to-Yes Digital Underwriting Speed', baselineValue: '14.8 days', targetValue: '< 4 hours', metricType: 'Leading' },
          { indicator: 'Originated Home Loan Portfolio Value', baselineValue: '$1.8B / qtr', targetValue: '>$2.6B / qtr', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'bank-prob-3',
      title: 'Digital Fraud & Authorised Push Payment (APP) Scams',
      sector: 'Banking & Financial Services',
      problem: {
        problemDescription: 'Sophisticated social-engineering APP scams bypass legacy rule-based transaction filters, resulting in escalating customer distress and restitution claims.',
        impactedStakeholders: ['Consumer Banking Customers', 'Fraud & AML SecOps', 'Risk Committee'],
        causalChainToDollarImpact: 'Undetected mule accounts -> unauthorized outbound transfers -> voluntary customer compensation -> $9.5M annual fraud loss.',
        rootCause: 'Lack of real-time behavioral biometrics and cross-bank mule account intelligence sharing.',
        targetRemediationTiming: 'Q1 2027 Sprint 4',
        metrics: [
          { indicator: 'Real-Time AI Fraud Interception Rate', baselineValue: '61%', targetValue: '> 94%', metricType: 'Leading' },
          { indicator: 'Net Unrecovered Fraud Payouts', baselineValue: '$9.5M', targetValue: '< $1.8M', metricType: 'Lagging' }
        ]
      }
    }
  ],
  Retail: [
    {
      id: 'retail-prob-1',
      title: 'Omnichannel Inventory Inaccuracy & Click-and-Collect Stockouts',
      sector: 'Omnichannel Retail',
      problem: {
        problemDescription: 'Discrepancy between online stock visibility and actual physical store shelf inventory causes 24% of Click-and-Collect orders to be cancelled upon customer arrival.',
        impactedStakeholders: ['Online Shoppers', 'Store Fulfillment Clerks', 'Merchandising Team'],
        causalChainToDollarImpact: 'Inaccurate store inventory -> 24% order cancellations -> lost lifetime customer loyalty -> $16.8M annualised gross margin leakage.',
        rootCause: 'Store POS and warehouse ERP update batch pipelines every 6 hours instead of real-time event streaming.',
        targetRemediationTiming: 'Q2 2027 Sprint 2',
        metrics: [
          { indicator: 'Store Stock Record Accuracy %', baselineValue: '76%', targetValue: '> 98%', metricType: 'Leading' },
          { indicator: 'Click-and-Collect Order Fulfillment Cancellation Rate', baselineValue: '24%', targetValue: '< 2.5%', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'retail-prob-2',
      title: 'E-Commerce Checkout Cart Abandonment on Mobile Devices',
      sector: 'Omnichannel Retail',
      problem: {
        problemDescription: 'Mobile web checkout conversion sits at 1.8% vs 4.2% on desktop due to multi-step address input and friction in digital wallet tokenisation.',
        impactedStakeholders: ['Mobile Web Visitors', 'Digital Marketing Squad', 'Payment Experience Tribe'],
        causalChainToDollarImpact: 'Mobile checkout friction -> 72% cart abandonment -> wasted PPC acquisition ad spend -> $11.4M lost incremental sales.',
        rootCause: 'Legacy multi-page checkout architecture lacking one-click biometrics (Apple Pay / Google Pay) and address auto-complete.',
        targetRemediationTiming: 'Q1 2027 Sprint 3',
        metrics: [
          { indicator: 'One-Click Mobile Checkout Conversion Rate', baselineValue: '1.8%', targetValue: '> 3.8%', metricType: 'Leading' },
          { indicator: 'Incremental Annual Mobile E-Commerce Revenue', baselineValue: '$0 baseline', targetValue: '+$11.4M', metricType: 'Lagging' }
        ]
      }
    }
  ],
  'IT Consulting': [
    {
      id: 'it-prob-1',
      title: 'Billable Consultant Utilisation Squeeze & Bench Cost Overhead',
      sector: 'Enterprise IT Consulting',
      problem: {
        problemDescription: 'Specialist cloud architecture and AI engineering consultants experience an average 18-day unbilled bench delay between project engagements.',
        impactedStakeholders: ['Senior Delivery Consultants', 'Practice Leads', 'CFO Portfolio Office'],
        causalChainToDollarImpact: '18-day bench delay -> unbilled salary carry -> EBITDA margin compression -> $8.2M gross consulting margin erosion.',
        rootCause: 'Siloed regional resourcing spreadsheets lacking real-time project demand skill-matching algorithms.',
        targetRemediationTiming: 'Q1 2027 Sprint 4',
        metrics: [
          { indicator: 'Average Billable Utilisation Rate', baselineValue: '72%', targetValue: '> 86%', metricType: 'Leading' },
          { indicator: 'Unbilled Bench Cost Expenditure', baselineValue: '$8.2M', targetValue: '< $2.1M', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'it-prob-2',
      title: 'Fixed-Price Project Scope Creep & Margin Degradation',
      sector: 'Enterprise IT Consulting',
      problem: {
        problemDescription: 'Fixed-price cloud migration contracts experience 34% unbillable scope expansion due to ambiguous acceptance criteria and ad-hoc client change requests.',
        impactedStakeholders: ['Engagement Managers', 'Client Program Directors', 'Delivery Squads'],
        causalChainToDollarImpact: 'Unbilled change requests -> squad overtime -> project gross margin falls from 42% to 19% -> $5.4M project margin loss.',
        rootCause: 'Missing automated requirements traceability and change impact quantification tools.',
        targetRemediationTiming: 'Q2 2027 Sprint 1',
        metrics: [
          { indicator: 'Change Request Capture & Approval Ratio', baselineValue: '41%', targetValue: '> 92%', metricType: 'Leading' },
          { indicator: 'Average Fixed-Price Project Gross Margin', baselineValue: '23%', targetValue: '> 38%', metricType: 'Lagging' }
        ]
      }
    }
  ],
  'Power Suppliers': [
    {
      id: 'power-prob-1',
      title: 'Renewable Solar Inverter Grid Frequency Instability',
      sector: 'Renewable Power & Grid Distribution',
      problem: {
        problemDescription: 'Rooftop solar distributed generation injection causes mid-day reverse power flows, pushing local substation frequency outside the 49.85 - 50.15 Hz stability envelope.',
        impactedStakeholders: ['Grid Transmission Operators', 'Industrial Power Off-takers', 'Distribution Asset Engineers'],
        causalChainToDollarImpact: 'Frequency instability -> emergency spinning reserve throttling -> wholesale market penalty tariffs -> $10.5M stability ancillary services cost.',
        rootCause: 'Substations lack sub-second dynamic synchronous condenser and utility-scale battery energy storage system (BESS) automated control.',
        targetRemediationTiming: 'Q2 2027 Sprint 3',
        metrics: [
          { indicator: 'Grid Frequency Standard Deviation (Hz)', baselineValue: '±0.28 Hz', targetValue: '< ±0.06 Hz', metricType: 'Leading' },
          { indicator: 'Frequency Control Ancillary Services (FCAS) Cost', baselineValue: '$10.5M', targetValue: '< $2.4M', metricType: 'Lagging' }
        ]
      }
    },
    {
      id: 'power-prob-2',
      title: 'Aging Transmission Line Thermal Overload & Wildfire Risk',
      sector: 'Renewable Power & Grid Distribution',
      problem: {
        problemDescription: 'Extreme high-temperature heatwaves drive peak air-conditioning loads that push 132kV overhead transmission lines past their static thermal sag limits.',
        impactedStakeholders: ['Regional Communities', 'Wildfire Prevention Agency', 'Network Reliability Operations'],
        causalChainToDollarImpact: 'Line thermal sag -> vegetation contact hazard -> mandatory load-shedding blackouts -> $15.8M regulatory penalty & liability exposure.',
        rootCause: 'Reliance on conservative static seasonal line ratings rather than dynamic line rating (DLR) sensors measuring real-time wind and temperature.',
        targetRemediationTiming: 'Q1 2027 Sprint 6',
        metrics: [
          { indicator: 'Dynamic Line Rating (DLR) Sensor Coverage', baselineValue: '14%', targetValue: '> 85%', metricType: 'Leading' },
          { indicator: 'Preventative Load-Shedding MWh Curtailment', baselineValue: '12,400 MWh', targetValue: '< 400 MWh', metricType: 'Lagging' }
        ]
      }
    }
  ]
};

/**
 * Returns available business problems for a selected industry, aggregating
 * predefined templates, managed programs, and existing nodes.
 */
export function getAvailableBusinessProblemsForIndustry(
  industry: IndustryDataBundle,
  nodesMap: Record<string, TraceabilityNode>
): BusinessProblemTemplate[] {
  const templates: BusinessProblemTemplate[] = [];

  // 1. Predefined curated industry templates
  const industryKey = (industry.id || 'Telco') as IndustryKey;
  if (INDUSTRY_BUSINESS_PROBLEMS[industryKey]) {
    templates.push(...INDUSTRY_BUSINESS_PROBLEMS[industryKey]);
  }

  // 2. Problems attached to managed programs in this bundle
  if (industry.programs) {
    industry.programs.forEach((prog) => {
      if (prog.businessProblem && !templates.some((t) => t.problem.problemDescription === prog.businessProblem.problemDescription)) {
        templates.push({
          id: `prog-prob-${prog.id}`,
          title: `Program Problem: ${prog.title}`,
          sector: industry.sector,
          problem: prog.businessProblem
        });
      }
    });
  }

  // 3. Problems already attached to existing nodes in this industry
  Object.values(nodesMap).forEach((node) => {
    if (node.businessProblem && !templates.some((t) => t.problem.problemDescription === node.businessProblem?.problemDescription)) {
      templates.push({
        id: `node-prob-${node.id}`,
        title: `Node Problem: ${node.title}`,
        sector: industry.sector,
        problem: node.businessProblem
      });
    }
  });

  return templates;
}

/**
 * AI-style Heuristic Parser: converts unstructured or semi-structured text
 * into a fully populated 6-attribute StructuredBusinessProblem.
 */
export function parseRawProblemText(
  rawText: string,
  sector: string = 'Enterprise'
): StructuredBusinessProblem {
  const clean = rawText.trim();
  if (!clean) {
    return {
      problemDescription: `Operational execution friction identified in ${sector} value stream.`,
      impactedStakeholders: ['Executive Leadership', 'Core Customers', 'Agile Delivery Squads'],
      causalChainToDollarImpact: 'Operational friction -> 15% execution delay -> $4.5M annualised financial opportunity loss.',
      rootCause: 'Constrained specialized headcount and architectural bottlenecks.',
      targetRemediationTiming: 'Q2 2027 Sprint 4',
      metrics: [
        { indicator: 'Operational Throughput Efficiency', baselineValue: '68%', targetValue: '> 88%', metricType: 'Leading' },
        { indicator: 'Annual Financial Degradation Impact', baselineValue: '$4.5M loss rate', targetValue: '$0', metricType: 'Lagging' }
      ]
    };
  }

  // Split lines / sentences
  const sentences = clean.split(/[.\n]+/).map((s) => s.trim()).filter((s) => s.length > 0);

  // 1. Problem Description: First prominent sentence
  const problemDescription = sentences[0] || clean;

  // 2. Impacted Stakeholders: Look for stakeholder words or groups
  const stakeholderMatches = clean.match(/(subscribers?|customers?|clients?|engineers?|squads?|executives?|users?|brokers?|regulators?|teams?|operators?|staff|patients?)/gi);
  const impactedStakeholders: string[] = stakeholderMatches && stakeholderMatches.length > 0
    ? Array.from(new Set(stakeholderMatches.map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()))).slice(0, 4)
    : ['Executive Leadership', 'Enterprise Customers', 'Engineering Squads'];

  // 3. Causal Chain to $ Impact: Extract dollar mention or create cause-effect progression
  const dollarMatch = clean.match(/\$[\d.]+\s*(?:M|B|K|million|billion|thousand)?/i);
  const dollarVal = dollarMatch ? dollarMatch[0] : '$5.8M';
  let causalChainToDollarImpact = '';
  if (clean.includes('->') || clean.includes('causes') || clean.includes('resulting in')) {
    const causalSentence = sentences.find((s) => s.includes('->') || s.includes('causes') || s.includes('resulting in') || s.includes('$'));
    causalChainToDollarImpact = causalSentence ? causalSentence.trim() : `${sentences[0]} -> operational drag -> ${dollarVal} revenue leakage.`;
  } else {
    causalChainToDollarImpact = `Operational bottleneck in ${sector} -> delayed resolution -> customer attrition -> ${dollarVal} revenue leakage.`;
  }

  // 4. Root Cause: Look for "due to", "caused by", "because of", "lack of", "legacy"
  let rootCause = 'Architectural bottlenecks and constrained specialized engineering capacity.';
  const rootCauseMarker = sentences.find((s) => /(due to|caused by|because of|lack of|legacy|insufficient|missing|siloed)/i.test(s));
  if (rootCauseMarker) {
    const match = rootCauseMarker.match(/(?:due to|caused by|because of|lack of|legacy)\s+([^,.]+)/i);
    if (match && match[1]) {
      rootCause = `${match[0].charAt(0).toUpperCase() + match[0].slice(1)}.`;
    } else {
      rootCause = rootCauseMarker;
    }
  }

  // 5. Target Remediation Timing: Look for Q[1-4], 2026/2027/2028, Sprint, months
  let targetRemediationTiming = 'Q2 2027 Sprint 4';
  const timingMatch = clean.match(/(Q[1-4]\s*202[6-9](?:\s*Sprint\s*\d+)?|\b\d+\s*(?:weeks?|months?)\b)/i);
  if (timingMatch) {
    targetRemediationTiming = timingMatch[0];
  }

  // 6. Metrics: Look for percentages or indicator words
  const percentMatches = clean.match(/\b\d+(?:\.\d+)?%/g);
  let leadingBase = percentMatches && percentMatches[0] ? percentMatches[0] : '88%';
  let leadingTarget = percentMatches && percentMatches[1] ? percentMatches[1] : '< 60%';

  // Extract metric names if present
  let metricIndicator = 'Operational Bottleneck Index';
  if (/latency|ms|ping/i.test(clean)) metricIndicator = 'Transaction Processing Latency';
  else if (/churn|attrition/i.test(clean)) metricIndicator = 'Customer Churn Rate';
  else if (/utilis|utiliz|saturation/i.test(clean)) metricIndicator = 'Resource & Bandwidth Utilisation';
  else if (/downtime|outage|sla/i.test(clean)) metricIndicator = 'Availability SLA Compliance';
  else if (/accuracy|error/i.test(clean)) metricIndicator = 'Inventory / Data Accuracy Rate';

  const metrics: BusinessMetricIndicator[] = [
    {
      indicator: metricIndicator,
      baselineValue: leadingBase,
      targetValue: leadingTarget,
      metricType: 'Leading'
    },
    {
      indicator: `${sector} Annual Dollar Impact`,
      baselineValue: dollarVal,
      targetValue: '$0',
      metricType: 'Lagging'
    }
  ];

  return {
    problemDescription,
    impactedStakeholders,
    causalChainToDollarImpact,
    rootCause,
    targetRemediationTiming,
    metrics
  };
}
