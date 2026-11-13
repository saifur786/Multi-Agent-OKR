import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { MongoClient, type Db } from 'mongodb';
import { GoogleGenAI, Type } from '@google/genai';
import { INDUSTRY_DATA } from './src/data/industryData';
import {
  buildStructuredBusinessProblemFromDraft,
  mergeConversationalDrafts,
  parseConversationalOkrInput
} from './src/utils/conversationalOkrParser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const INITIAL_PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = (process.env.MONGODB_URI || '').trim();
const DATABASE_NAME = process.env.MONGODB_DB_NAME || 'multi_agent_okr';

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let mongoUnavailable = false;

const memoryIndustries = new Map<string, any>(
  Object.values(INDUSTRY_DATA).map((industry) => [
    industry.id,
    { ...industry, _lastUpdated: new Date().toISOString() }
  ])
);
const memoryInteractions: Array<{
  id: string;
  agent: string;
  context: string;
  message: string;
  response: string;
  createdAt: string;
  metadata: Record<string, any>;
}> = [];

async function connectMongo(): Promise<Db | null> {
  if (mongoDb) return mongoDb;
  if (!MONGODB_URI || mongoUnavailable) return null;

  let candidateClient: MongoClient | null = null;
  try {
    candidateClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000
    });
    await candidateClient.connect();
    mongoClient = candidateClient;
    mongoDb = mongoClient.db(DATABASE_NAME);
    await mongoDb.collection('industries').createIndex({ id: 1 }, { unique: true });
    await mongoDb.collection('industries').createIndex({ name: 1 });
    await mongoDb.collection('agent_interactions').createIndex({ createdAt: -1 });
    await mongoDb.collection('agent_interactions').createIndex({ agent: 1, context: 1 });
    console.log(`Connected to MongoDB (${DATABASE_NAME}).`);
    return mongoDb;
  } catch (error) {
    mongoUnavailable = true;
    if (candidateClient) {
      await candidateClient.close().catch(() => {});
    }
    const reason = error instanceof Error ? error.message : 'connection failed';
    console.info(`MongoDB unavailable (${reason}); running with stateful in-memory store.`);
    return null;
  }
}

async function seedIndustriesIfEmpty() {
  if (!mongoDb) return;

  const count = await mongoDb.collection('industries').countDocuments();
  if (count > 0) return;

  const documents = Object.values(INDUSTRY_DATA).map((industry) => ({
    ...industry,
    _lastUpdated: new Date().toISOString()
  }));

  await mongoDb.collection('industries').insertMany(documents);
  console.log(`Seeded ${documents.length} industry records into MongoDB.`);
}

function startServerOnPort(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Planview Anvi Multi-Agent System server running on http://localhost:${port}`);
      resolve(port);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        console.warn(`Port ${port} is already in use. Retrying on ${nextPort}...`);
        server.close(() => {
          startServerOnPort(nextPort).then(resolve).catch(reject);
        });
        return;
      }

      reject(error);
    });
  });
}

app.use(express.json({ limit: '5mb' }));

app.get('/api/health', async (_req, res) => {
  const db = await connectMongo();
  res.json({
    ok: true,
    mongo: !!db,
    mode: db ? 'mongodb' : 'memory',
    database: DATABASE_NAME
  });
});

app.get('/api/industries', async (_req, res) => {
  const db = await connectMongo();
  if (!db) {
    const industries = Array.from(memoryIndustries.values()).sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''))
    );
    return res.json({ industries, source: 'memory' });
  }

  const industries = await db.collection('industries').find({}).sort({ name: 1 }).toArray();
  return res.json({ industries, source: 'mongodb' });
});

app.post('/api/industries', async (req, res) => {
  const db = await connectMongo();
  const payload = req.body;

  if (!payload?.id || !payload?.name) {
    return res.status(400).json({ error: 'Industry id and name are required.' });
  }

  const timestamped = { ...payload, _lastUpdated: new Date().toISOString() };

  if (!db) {
    const existed = memoryIndustries.has(payload.id);
    memoryIndustries.set(payload.id, timestamped);
    return res.status(201).json({ industry: timestamped, source: 'memory', upserted: !existed });
  }

  const result = await db.collection('industries').updateOne(
    { id: payload.id },
    { $set: timestamped },
    { upsert: true }
  );

  return res.status(201).json({ industry: timestamped, source: 'mongodb', upserted: result.upsertedCount > 0 });
});

app.get('/api/agent-interactions', async (req, res) => {
  const db = await connectMongo();
  const { agent, context, from, to, q } = req.query;

  if (!db) {
    let filtered = memoryInteractions.slice();
    if (agent) {
      filtered = filtered.filter((item) => item.agent === String(agent));
    }
    if (context) {
      const ctxNeedle = String(context).toLowerCase();
      filtered = filtered.filter((item) => item.context.toLowerCase().includes(ctxNeedle));
    }
    if (q) {
      const queryNeedle = String(q).toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.message.toLowerCase().includes(queryNeedle) ||
          item.response.toLowerCase().includes(queryNeedle) ||
          item.context.toLowerCase().includes(queryNeedle)
      );
    }
    if (from) {
      const fromIso = new Date(String(from)).toISOString();
      filtered = filtered.filter((item) => item.createdAt >= fromIso);
    }
    if (to) {
      const toIso = new Date(String(to)).toISOString();
      filtered = filtered.filter((item) => item.createdAt <= toIso);
    }
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return res.json({ interactions: filtered, source: 'memory' });
  }

  const filter: Record<string, any> = {};
  if (agent) filter.agent = String(agent);
  if (context) filter.context = { $regex: String(context), $options: 'i' };
  if (q) {
    filter.$or = [
      { message: { $regex: String(q), $options: 'i' } },
      { response: { $regex: String(q), $options: 'i' } },
      { context: { $regex: String(q), $options: 'i' } }
    ];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(String(from)).toISOString();
    if (to) filter.createdAt.$lte = new Date(String(to)).toISOString();
  }

  const interactions = await db.collection('agent_interactions')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return res.json({ interactions, source: 'mongodb' });
});

app.post('/api/agent-interactions', async (req, res) => {
  const db = await connectMongo();
  const payload = req.body ?? {};

  const record = {
    id: payload.id || `interaction-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    agent: payload.agent || 'System',
    context: payload.context || 'general',
    message: payload.message || '',
    response: payload.response || '',
    createdAt: payload.createdAt || new Date().toISOString(),
    metadata: payload.metadata || {}
  };

  if (!db) {
    memoryInteractions.unshift(record);
    if (memoryInteractions.length > 200) {
      memoryInteractions.length = 200;
    }
    return res.status(201).json({ saved: true, source: 'memory', interaction: record });
  }

  await db.collection('agent_interactions').insertOne(record);
  return res.status(201).json({ saved: true, source: 'mongodb', interaction: record });
});

const conversationalEventTopics = [
  'ORCHESTRATION_STARTED',
  'OKR_CREATED_OR_EDITED',
  'RISK_SENTINEL_ALERT',
  'MANUAL_PRIORITY_OVERRIDDEN',
  'INTERVENTION_APPLIED',
  'ADVISORY_COMMITTEE_EVALUATED'
] as const;

// Initialize GoogleGenAI server-side client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

app.post('/api/okr-conversational-agent', async (req, res) => {
  try {
    const body = req.body ?? {};
    const message = String(body.message || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];
    const context = {
      ...(body.context || {}),
      autoCompleteRemaining: Boolean(body.autoCompleteRemaining ?? body.context?.autoCompleteRemaining)
    };
    const currentDraft = body.currentDraft || null;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const fallback = parseConversationalOkrInput(message, context, history, currentDraft);

    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const missingListText =
          fallback.missingAttributes.length > 0
            ? fallback.missingAttributes.map((m) => `${m.category} -> ${m.label}: ${m.question}`).join('\n  - ')
            : 'None (All OKR & 6 Business Problem attributes captured!)';

        const prompt = `You are Planview Anvi Intelligent Conversational OKR Agent.
Interpret user message intent (including structured key-value lines AND plain conversational answers to your prior question) across the multi-turn conversation and return structured JSON only.

Rules:
- Whenever the user supplies an owner, timeline, metric(s), target outcome, budget, or any business problem attribute (even as a short follow-up answer), classify intent as "create_okr" or "update_business_problem" and update okrDraft.
- Preserve exact owner names, timeline strings, and metrics (indicator, baselineValue, targetValue, metricType Leading/Lagging) given by the user.
- Check the Gap Analysis below: if attributes are still missing (and autoCompleteRemaining is false), ask focused, helpful follow-up questions in "questions" and "assistantMessage" to gather those exact missing fields (especially verifying if owner exists in Available Owners).
- When all attributes are captured (or autoCompleteRemaining is true), clearly state that the complete OKR & 6-dimension Business Problem is ready for "Apply Draft to Form" and "Publish OKR & Execute Remaining Stages".

Context:
- Industry: ${context.industryName || 'Unknown'}
- Sector: ${context.sector || 'Enterprise'}
- Quarter: ${context.quarter || 'Q1 2027'}
- Auto-complete remaining fields requested: ${Boolean(context.autoCompleteRemaining)}
- Available HR Directory Owners: ${(context.owners || []).join(', ') || 'Executive Lead'}
- Parent Options: ${(context.parentOptions || []).map((p: any) => `${p.id}:${p.title || ''}`).join(' | ')}
- Existing OKRs: ${(context.existingOkrTitles || []).join(' | ')}
- Current Draft JSON: ${JSON.stringify(currentDraft || fallback.okrDraft || null)}
- Gap Analysis (${fallback.readinessPct}% ready):
  - ${missingListText}

Conversation History:
${history.map((item: any, i: number) => `${i + 1}. ${item.role}: ${item.text}`).join('\n')}

Latest User Message:
${message}

Return:
- assistantMessage (summarize captured fields and ask concise questions for missing fields, OR confirm 100% readiness to Apply Draft to Form)
- intent in [create_okr, update_business_problem, run_orchestration, clarify, unknown]
- confidence (0..1)
- questions (up to 3 targeted questions for missing OKR or Business Problem fields)
- actionPlan (up to 4)
- okrDraft with title, parentId, owner, priority, budget, targetDate, problemDescription, impactedStakeholders[], causalChainToDollarImpact, rootCause, rootCauses[], targetRemediationTiming, remediationTimings[], metrics[]
- orchestrationEvents[] where topic is one of ${conversationalEventTopics.join(', ')}`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                assistantMessage: { type: Type.STRING },
                intent: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                questions: { type: Type.ARRAY, items: { type: Type.STRING } },
                actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                okrDraft: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    parentId: { type: Type.STRING },
                    owner: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    budget: { type: Type.STRING },
                    targetDate: { type: Type.STRING },
                    problemDescription: { type: Type.STRING },
                    impactedStakeholders: { type: Type.ARRAY, items: { type: Type.STRING } },
                    causalChainToDollarImpact: { type: Type.STRING },
                    rootCause: { type: Type.STRING },
                    rootCauses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    targetRemediationTiming: { type: Type.STRING },
                    remediationTimings: { type: Type.ARRAY, items: { type: Type.STRING } },
                    metrics: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          indicator: { type: Type.STRING },
                          baselineValue: { type: Type.STRING },
                          targetValue: { type: Type.STRING },
                          metricType: { type: Type.STRING }
                        }
                      }
                    }
                  }
                },
                orchestrationEvents: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      topic: { type: Type.STRING },
                      sourceAgent: { type: Type.STRING },
                      targetAgent: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      severity: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          const effectiveIntent =
            (parsed.intent === 'clarify' || parsed.intent === 'unknown') &&
            (fallback.intent === 'create_okr' || fallback.intent === 'update_business_problem')
              ? fallback.intent
              : parsed.intent || fallback.intent;

          const effectiveDraft = (parsed.okrDraft || fallback.okrDraft)
            ? mergeConversationalDrafts(
                parsed.okrDraft || null,
                fallback.okrDraft
                  ? {
                      ...fallback.okrDraft,
                      title: parsed.okrDraft?.title && !/^(title|outcome|placeholder)/i.test(parsed.okrDraft.title)
                        ? parsed.okrDraft.title
                        : fallback.okrDraft.title,
                      problemDescription: parsed.okrDraft?.problemDescription || fallback.okrDraft.problemDescription,
                      causalChainToDollarImpact:
                        parsed.okrDraft?.causalChainToDollarImpact || fallback.okrDraft.causalChainToDollarImpact,
                      rootCause: parsed.okrDraft?.rootCause || fallback.okrDraft.rootCause,
                      lastAskedField: fallback.nextExpectedField
                    }
                  : null
              )
            : null;

          const effectiveBusinessProblem = effectiveDraft
            ? buildStructuredBusinessProblemFromDraft(effectiveDraft, context.sector || 'Enterprise', message)
            : fallback.businessProblem;

          return res.json({
            success: true,
            assistantMessage:
              effectiveIntent !== 'clarify' && parsed.intent === 'clarify'
                ? fallback.assistantMessage
                : parsed.assistantMessage || fallback.assistantMessage,
            intent: effectiveIntent,
            confidence: typeof parsed.confidence === 'number' ? Math.max(parsed.confidence, fallback.confidence) : fallback.confidence,
            questions: fallback.questions.length > 0 ? fallback.questions : (Array.isArray(parsed.questions) ? parsed.questions : []),
            actionPlan: Array.isArray(parsed.actionPlan) && parsed.actionPlan.length > 0 ? parsed.actionPlan : fallback.actionPlan,
            okrDraft: effectiveDraft,
            businessProblem: effectiveBusinessProblem,
            orchestrationEvents: Array.isArray(parsed.orchestrationEvents) && parsed.orchestrationEvents.length > 0
              ? parsed.orchestrationEvents
              : fallback.orchestrationEvents,
            missingAttributes: fallback.missingAttributes,
            capturedAttributes: fallback.capturedAttributes,
            readinessPct: fallback.readinessPct,
            isDraftComplete: fallback.isDraftComplete,
            nextExpectedField: fallback.nextExpectedField,
            source: 'gemini-4-hydrogen'
          });
        }
      } catch (geminiError) {
        const msg = geminiError instanceof Error ? geminiError.message : 'Gemini call failed';
        console.warn(`Conversational OKR agent Gemini call skipped (${msg}); using deterministic parser fallback.`);
      }
    }

    return res.json({ success: true, ...fallback, source: 'deterministic-parser' });
  } catch (error: any) {
    console.error('Conversational OKR agent error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * API route: Invoke Strategy & Ideation Agent to generate real-world, measurable strategy
 */
app.post('/api/generate-strategy', async (req, res) => {
  try {
    const { industryName, sector, strategicMandate, budget, quarter } = req.body;

    if (!industryName) {
      return res.status(400).json({ error: 'industryName is required' });
    }

    // If Gemini API is available and configured, use it for real-world strategic synthesis
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are Planview Anvi's Strategy & Ideation Agent. Generate a comprehensive, real-world, measurable OKR strategy and 7-layer traceability structure for an enterprise in the following domain:
Industry/Name: ${industryName}
Sector: ${sector || 'Enterprise Technology'}
Strategic Mandate: ${strategicMandate || 'Accelerate digital outcome attainment and operational efficiency'}
Quarter: ${quarter || 'Q1 2027'}
Budget: ${budget || '$35.0M'}

Generate a structured JSON response containing:
1. "strategicThemes": array of 2 strategic themes (each with title, owner, budget, progress percentage, rationales for analyse, predict, recommend, automate, optimise).
2. "objectives": array of 2-3 measurable business/IT objectives linked to the themes.
3. "keyResults": array of 3-4 measurable KRs with explicit numeric metrics, baselines, and stretch targets.
4. "initiatives": array of 3-4 funded initiatives.
5. "epics": array of 3-4 delivery epics (and 1 potential orphan or legacy dependency to challenge the Alignment Agent).
6. "teams": array of 2 Agile Release Trains / Squads with FTE count and capacity load percentage (e.g., 90-110%).
7. "outcomes": array of 2 top-line business outcomes with expected ROI and customer/operational impact.
8. "knowledgeBase": array of 5 knowledge pillars (Historical Performance, Market Data, Customer Feedback, Project Runner, Resources) with metrics and bullet points.`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction: 'You are an enterprise strategic portfolio architect for Planview. Respond exclusively with valid JSON conforming to the requested schema.',
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({ success: true, strategy: parsed, source: 'gemini-4-hydrogen' });
        }
      } catch (geminiError) {
        const msg = geminiError instanceof Error ? geminiError.message : 'Gemini call failed';
        console.warn(`Gemini API strategy call skipped (${msg}); using algorithmic synthesis.`);
      }
    }

    // Deterministic High-Quality Algorithmic Synthesizer fallback
    const fallbackStrategy = generateAlgorithmicStrategy(industryName, sector, strategicMandate, budget, quarter);
    return res.json({ success: true, strategy: fallbackStrategy, source: 'anvi-strategy-engine' });
  } catch (error: any) {
    console.error('Error generating strategy:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

function generateAlgorithmicStrategy(
  industryName: string,
  sector: string = 'Enterprise Operations',
  mandate: string = 'Digital transformation and outcome acceleration',
  budget: string = '$35.0M',
  quarter: string = 'Q1 2027'
) {
  const cleanBudget = budget.startsWith('$') ? budget : `$${budget}`;
  const budgetNum = parseFloat(cleanBudget.replace(/[^0-9.]/g, '')) || 35.0;

  return {
    industryName,
    sector,
    quarter: quarter || 'Q1 2027',
    totalBudget: cleanBudget,
    strategicThemes: [
      {
        id: 'c-s1',
        title: `Scale Next-Gen AI & Autonomous Delivery in ${industryName}`,
        owner: 'Group Chief Executive & CIO',
        budget: `$${(budgetNum * 0.6).toFixed(1)}M`,
        progress: 82,
        status: 'On Track',
        rationales: {
          analyse: `Evaluated ${sector} competitive benchmarks and automated delivery velocity trends.`,
          predict: `Autonomous workflow execution will lift operational gross margin by 3.8% over 4 quarters.`,
          recommend: `Shift 20% of legacy maintenance spend toward API-driven platform automation.`,
          automate: `Auto-generated Planview Portfolios strategic themes mapped to enterprise capabilities.`,
          optimise: `Risk-weighted capex: 60% Growth & Innovation, 25% Operational Resilience, 15% Efficiency.`
        }
      },
      {
        id: 'c-s2',
        title: `Mission-Critical Operational Resilience & Compliance`,
        owner: 'Chief Risk Officer & COO',
        budget: `$${(budgetNum * 0.4).toFixed(1)}M`,
        progress: 68,
        status: 'At Risk',
        rationales: {
          analyse: `Audited regulatory SLAs, cyber compliance posture, and high-availability standards in ${sector}.`,
          predict: `Achieving 99.99% uptime avoids estimated $2.8M in unplanned outage costs.`,
          recommend: `Establish automated multi-region DR failover and telemetry observability gates.`,
          automate: `Continuous GRC risk scorecards synchronized with Planview Risk Radar.`,
          optimise: `Prioritized cloud infrastructure hardening across critical service dependencies.`
        }
      }
    ],
    objectives: [
      {
        id: 'c-o1',
        title: `Accelerate ${industryName} Customer Outcome Attainment by 30%`,
        owner: 'VP Product & Delivery',
        budget: `$${(budgetNum * 0.45).toFixed(1)}M`,
        progress: 78,
        status: 'On Track'
      },
      {
        id: 'c-o2',
        title: `Modernize Core Platform & Decouple Legacy Monoliths`,
        owner: 'Head of Enterprise Architecture',
        budget: `$${(budgetNum * 0.35).toFixed(1)}M`,
        progress: 64,
        status: 'At Risk'
      },
      {
        id: 'c-o3',
        title: `Zero-Downtime Resilience & Regulatory SLA Compliance`,
        owner: 'VP Reliability Engineering',
        budget: `$${(budgetNum * 0.2).toFixed(1)}M`,
        progress: 84,
        status: 'On Track'
      }
    ],
    keyResults: [
      {
        id: 'c-kr1',
        title: `Cut customer service fulfillment cycle time from 5 days to 24 hours`,
        owner: 'Operations Tribe Lead',
        progress: 72,
        budget: `$${(budgetNum * 0.25).toFixed(1)}M`,
        status: 'On Track',
        metricType: 'SLA'
      },
      {
        id: 'c-kr2',
        title: `Lift digital self-service adoption rate from 46% to 75%`,
        owner: 'Digital Channel Lead',
        progress: 81,
        budget: `$${(budgetNum * 0.2).toFixed(1)}M`,
        status: 'On Track',
        metricType: 'Adoption'
      },
      {
        id: 'c-kr3',
        title: `Reduce core system transaction latency from 320ms to under 100ms`,
        owner: 'Platform Architect',
        progress: 62,
        budget: `$${(budgetNum * 0.3).toFixed(1)}M`,
        status: 'At Risk',
        metricType: 'Performance'
      },
      {
        id: 'c-kr4',
        title: `Achieve 99.98% platform service uptime across all peak operating hours`,
        owner: 'SRE Lead',
        progress: 88,
        budget: `$${(budgetNum * 0.25).toFixed(1)}M`,
        status: 'On Track',
        metricType: 'Reliability'
      }
    ],
    initiatives: [
      {
        id: 'c-i1',
        title: `Autonomous Decisioning & Process Orchestration`,
        owner: 'Program Director',
        budget: `$${(budgetNum * 0.25).toFixed(1)}M`,
        progress: 75,
        status: 'On Track'
      },
      {
        id: 'c-i2',
        title: `Omnichannel Self-Service & Digital Client Portal`,
        owner: 'Digital Channel Director',
        budget: `$${(budgetNum * 0.2).toFixed(1)}M`,
        progress: 82,
        status: 'On Track'
      },
      {
        id: 'c-i3',
        title: `Cloud-Native Event Mesh & High-Throughput APIs`,
        owner: 'Core Platform Lead',
        budget: `$${(budgetNum * 0.3).toFixed(1)}M`,
        progress: 60,
        status: 'At Risk'
      },
      {
        id: 'c-i4',
        title: `Automated Disaster Recovery & Continuous Compliance`,
        owner: 'GRC Program Mgr',
        budget: `$${(budgetNum * 0.25).toFixed(1)}M`,
        progress: 86,
        status: 'On Track'
      }
    ],
    epics: [
      {
        id: 'c-p1',
        title: `Epic: Core Autonomous Processing Engine`,
        owner: 'Squad Alpha',
        budget: `$${(budgetNum * 0.14).toFixed(1)}M`,
        progress: 74,
        status: 'On Track'
      },
      {
        id: 'c-p2',
        title: `Epic: Interactive Mobile & Web Portal v3`,
        owner: 'Squad Beta',
        budget: `$${(budgetNum * 0.12).toFixed(1)}M`,
        progress: 84,
        status: 'On Track'
      },
      {
        id: 'c-p3',
        title: `Epic: Distributed Streaming Kafka Pipeline`,
        owner: 'Squad Gamma',
        budget: `$${(budgetNum * 0.16).toFixed(1)}M`,
        progress: 58,
        status: 'At Risk'
      },
      {
        id: 'c-p-orphan1',
        title: `Epic: Legacy Vendor Custom Interface (Orphan)`,
        owner: 'Legacy Support Pod',
        budget: `$${(budgetNum * 0.08).toFixed(1)}M`,
        progress: 26,
        status: 'At Risk',
        isOrphan: true
      }
    ],
    teams: [
      {
        id: 'c-t1',
        name: `${industryName} Digital Core ART (48 FTE)`,
        owner: 'RTE Jordan Taylor',
        budget: `$${(budgetNum * 0.55).toFixed(1)}M`,
        progress: 72,
        squadLoad: { squadName: 'Backend Core Engine', fte: 18, loadPct: 108 },
        status: 'At Risk'
      },
      {
        id: 'c-t2',
        name: `Experience & Integration Squads (36 FTE)`,
        owner: 'RTE Elena Rostova',
        budget: `$${(budgetNum * 0.45).toFixed(1)}M`,
        progress: 86,
        squadLoad: { squadName: 'Digital Experience Squad', fte: 16, loadPct: 88 },
        status: 'On Track'
      }
    ],
    outcomes: [
      {
        id: 'c-o-1',
        title: `+$16.5M Incremental Annualized Value Creation`,
        owner: 'Chief Financial Officer',
        budget: 'ROI 3.1x',
        progress: 76,
        status: 'On Track'
      },
      {
        id: 'c-o-2',
        title: `-28% Operational Unit Cost & +15 Net Promoter Score`,
        owner: 'Chief Operating Officer',
        budget: 'ROI 2.8x',
        progress: 84,
        status: 'On Track'
      }
    ],
    knowledgeBase: [
      {
        id: 'kb1',
        title: 'Historical Performance',
        metric: '79% Avg Attainment',
        trend: '+5% YoY',
        summary: `Prior delivery cycles in ${industryName} show strong performance on digital interfaces vs legacy integrations.`,
        details: [
          'Sprint Velocity: 44 story points / sprint',
          'Attainment Variance: +2.8% on modern services',
          'Top Obstacle: Legacy interface latency'
        ]
      },
      {
        id: 'kb2',
        title: 'Market Data',
        metric: '+22% Sector Growth',
        trend: `${sector} Index`,
        summary: `Market benchmarks reflect rapid customer adoption of automated instant service in ${sector}.`,
        details: [
          'Peer fulfillment turnaround: 2.4 days',
          'Cloud adoption rate: 68%',
          'Annual innovation CAGR: 16.2%'
        ]
      },
      {
        id: 'kb3',
        title: 'Customer Feedback',
        metric: 'NPS 54 (+8)',
        trend: 'CSAT 4.4/5',
        summary: `Voice of Customer indicates high appreciation for rapid self-service with friction on manual steps.`,
        details: [
          'Top Praise: Sub-second response time',
          'Top Request: End-to-end automation',
          'Repeat Engagement: 91%'
        ]
      },
      {
        id: 'kb4',
        title: 'Project Runner & Outcome',
        metric: '3.0x Avg ROI',
        trend: '82% On-Time',
        summary: `Decoupled API initiatives delivered 3.2x ROI compared to 1.8x on monolithic vendor upgrades.`,
        details: [
          'Top Runner: Autonomous Process Engine',
          'Bottleneck: Mainframe sync queue',
          'Core Takeaway: Decouple early via event mesh'
        ]
      },
      {
        id: 'kb5',
        title: 'Resources & Utilisation',
        metric: '96% Utilisation',
        trend: '1 Critical Squad',
        summary: `84 total FTEs; Backend Core Engine squad is stretched at 108% capacity.`,
        details: [
          'Backend Core: 108% allocation',
          'Frontend / Mobile: 88% allocation',
          'Burst Buffer: 4 FTEs available'
        ]
      }
    ]
  };
}

// Development server with Vite middleware integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  try {
    await connectMongo();
    await seedIndustriesIfEmpty();
    const activePort = await startServerOnPort(INITIAL_PORT);
    console.log(`App is listening on http://localhost:${activePort}`);
  } catch (error) {
    console.error('Unable to start the application server:', error);
    process.exit(1);
  }
}

startServer();
