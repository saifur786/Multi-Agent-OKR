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
import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences
} from './src/utils/navOrder';
import {
  buildDeterministicIngestionPreview,
  classifyDocumentPillar,
  extractReadableTextFromPdfBytes,
  PILLAR_TITLES,
  type KnowledgePillarId
} from './src/utils/ragIngestion';
import {
  isAllowedGeminiChatModel,
  resolveGeminiChatModel,
  sanitizeChatHistoryForApi
} from './src/utils/geminiChatConfig';

dotenv.config({ path: '.env.local' });
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
const memoryUserAccounts: Array<{
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: string;
  industry: string;
  permissions: string[];
  status: 'pending' | 'invited' | 'active';
  firebaseEnabled: boolean;
  invitedAt?: string;
  createdAt: string;
}> = [];
const memoryPolicies: Array<{
  id: string;
  name: string;
  industry: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  createdAt: string;
}> = [];
const memoryInvitations: Array<{
  id: string;
  name: string;
  email: string;
  role: string;
  industry: string;
  permissions: string[];
  status: 'sent' | 'registered';
  invitationToken: string;
  inviteLink: string;
  createdAt: string;
}> = [];
let memoryUserPreferences: {
  id: string;
  navButtonOrder: string[];
  updatedAt?: string;
} = {
  id: 'default',
  ...DEFAULT_USER_PREFERENCES
};

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
    const server = app.listen(port, '0.0.0.0', () => {
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

app.use(express.json({ limit: '15mb' }));

// Allow cross-port local dev communication (e.g. Vite :5173 or fallback :3001 <-> :3000)
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});

function getGeminiApiKey(): string {
  const raw = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  if (!raw || raw === 'MY_GEMINI_API_KEY') return '';
  return raw;
}

const GEMINI_MODEL = 'gemini-4-hydrogen';
let cachedGeminiClient: GoogleGenAI | null = null;
let cachedGeminiKey = '';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (cachedGeminiClient && cachedGeminiKey === apiKey) {
    return cachedGeminiClient;
  }
  cachedGeminiKey = apiKey;
  cachedGeminiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  return cachedGeminiClient;
}

function parseGeminiJsonSafe<T = any>(rawText: string | undefined): T | null {
  if (!rawText) return null;
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

async function generateWithGeminiRetry<T>(
  operation: (client: GoogleGenAI) => Promise<T>,
  retries = 2
): Promise<T | null> {
  const client = getGeminiClient();
  if (!client) return null;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation(client);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 350 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}

app.get('/api/health', async (_req, res) => {
  const db = await connectMongo();
  res.json({
    ok: true,
    mongo: !!db,
    mode: db ? 'mongodb' : 'memory',
    database: DATABASE_NAME,
    geminiConfigured: Boolean(getGeminiApiKey()),
    geminiModel: GEMINI_MODEL
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

app.get('/api/user-preferences', async (_req, res) => {
  const db = await connectMongo();
  if (!db) {
    return res.json({
      preferences: normalizeUserPreferences(memoryUserPreferences),
      source: 'memory'
    });
  }

  const doc = await db.collection('user_preferences').findOne({ id: 'default' });
  const preferences = doc ? normalizeUserPreferences(doc) : { ...DEFAULT_USER_PREFERENCES };
  return res.json({ preferences, source: 'mongodb' });
});

app.post('/api/user-preferences', async (req, res) => {
  const db = await connectMongo();
  const normalized = normalizeUserPreferences({
    ...req.body,
    updatedAt: req.body?.updatedAt || new Date().toISOString()
  });

  if (!db) {
    memoryUserPreferences = { id: 'default', ...normalized };
    return res.json({ preferences: normalized, source: 'memory' });
  }

  await db.collection('user_preferences').updateOne(
    { id: 'default' },
    { $set: { id: 'default', ...normalized } },
    { upsert: true }
  );
  return res.json({ preferences: normalized, source: 'mongodb' });
});

app.get('/api/admin/users', async (_req, res) => {
  const db = await connectMongo();
  if (!db) {
    return res.json({ users: memoryUserAccounts, source: 'memory' });
  }

  const users = await db.collection('user_accounts').find({}).sort({ createdAt: -1 }).toArray();
  return res.json({ users, source: 'mongodb' });
});

app.post('/api/admin/industries', async (req, res) => {
  const db = await connectMongo();
  const payload = req.body ?? {};
  const name = String(payload.name || '').trim();
  const sector = String(payload.sector || 'Enterprise').trim();
  if (!name) {
    return res.status(400).json({ error: 'Industry name is required.' });
  }

  const industryId = String(payload.id || name).replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
  const normalizedIndustry = {
    id: industryId || 'industry',
    name,
    sector,
    quarter: String(payload.quarter || 'Q1 2027').trim(),
    description: String(payload.description || '').trim(),
    policies: Array.isArray(payload.policies) ? payload.policies : [],
    createdAt: new Date().toISOString(),
    _lastUpdated: new Date().toISOString()
  };

  if (!db) {
    memoryIndustries.set(normalizedIndustry.id, normalizedIndustry);
    return res.status(201).json({ industry: normalizedIndustry, source: 'memory' });
  }

  await db.collection('industries').updateOne(
    { id: normalizedIndustry.id },
    { $set: normalizedIndustry },
    { upsert: true }
  );
  return res.status(201).json({ industry: normalizedIndustry, source: 'mongodb' });
});

app.post('/api/admin/policies', async (req, res) => {
  const db = await connectMongo();
  const payload = req.body ?? {};
  const policy = {
    id: String(payload.id || `policy-${Date.now()}`),
    name: String(payload.name || '').trim(),
    industry: String(payload.industry || '').trim(),
    type: String(payload.type || 'Governance').trim(),
    severity: String(payload.severity || 'Medium').trim(),
    description: String(payload.description || '').trim(),
    createdAt: new Date().toISOString()
  };

  if (!policy.name || !policy.industry) {
    return res.status(400).json({ error: 'Policy name and industry are required.' });
  }

  if (!db) {
    memoryPolicies.push(policy);
    return res.status(201).json({ policy, source: 'memory' });
  }

  await db.collection('policies').updateOne(
    { id: policy.id },
    { $set: policy },
    { upsert: true }
  );
  return res.status(201).json({ policy, source: 'mongodb' });
});

app.post('/api/admin/invite', async (req, res) => {
  const db = await connectMongo();
  const payload = req.body ?? {};
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const role = String(payload.role || 'okr-creator').trim();
  const industry = String(payload.industry || '').trim();
  const permissions = Array.isArray(payload.permissions) ? payload.permissions : [];

  if (!name || !email || !industry) {
    return res.status(400).json({ error: 'Name, email and industry are required.' });
  }

  const inviteToken = `invite-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const inviteLink = `http://localhost:3000/register?token=${inviteToken}`;
  const invite = {
    id: `invite-${Date.now()}`,
    name,
    email,
    role,
    industry,
    permissions,
    status: 'sent',
    invitationToken: inviteToken,
    inviteLink,
    createdAt: new Date().toISOString()
  };

  if (!db) {
    memoryInvitations.push(invite);
    memoryUserAccounts.push({
      id: `acct-${Date.now()}`,
      name,
      email,
      role,
      industry,
      permissions,
      status: 'invited',
      firebaseEnabled: true,
      invitedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    return res.status(201).json({ invite, source: 'memory' });
  }

  await db.collection('user_invitations').updateOne(
    { email },
    { $set: invite },
    { upsert: true }
  );
  await db.collection('user_accounts').updateOne(
    { email },
    { $set: {
        id: `acct-${Date.now()}`,
        name,
        email,
        role,
        industry,
        permissions,
        status: 'invited',
        firebaseEnabled: true,
        invitedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      } },
    { upsert: true }
  );

  return res.status(201).json({ invite, source: 'mongodb' });
});

app.post('/api/admin/register', async (req, res) => {
  const db = await connectMongo();
  const payload = req.body ?? {};
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const role = String(payload.role || 'okr-creator').trim();
  const industry = String(payload.industry || '').trim();
  const uid = String(payload.uid || '').trim();

  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const record = {
    id: uid || `acct-${Date.now()}`,
    uid: uid || `firebase-${Date.now()}`,
    name,
    email,
    role,
    industry,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
    status: 'active',
    firebaseEnabled: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  if (!db) {
    const existing = memoryUserAccounts.findIndex((entry) => entry.email.toLowerCase() === email.toLowerCase());
    if (existing >= 0) {
      memoryUserAccounts[existing] = { ...memoryUserAccounts[existing], ...record };
    } else {
      memoryUserAccounts.push(record as any);
    }
    return res.status(201).json({ user: record, source: 'memory' });
  }

  await db.collection('user_accounts').updateOne(
    { email },
    { $set: record },
    { upsert: true }
  );
  return res.status(201).json({ user: record, source: 'mongodb' });
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

const workerAgentBlueprint = [
  { id: 'strategy-explorer', name: 'Strategy Explorer' },
  { id: 'okr-quality-auditor', name: 'OKR Quality Auditor' },
  { id: 'alignment-capacity-agent', name: 'Alignment Capacity Agent' },
  { id: 'risk-sentinel', name: 'Risk Sentinel' },
  { id: 'executive-reporter', name: 'Executive Reporter' },
  { id: 'retrospective-learner', name: 'Retrospective Learner' }
] as const;

type WorkerAgentStatusRecord = {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  label: string;
  reason: string;
  action: string;
};

function getDeterministicWorkerStatuses(industryName: string, disasterCount: number): WorkerAgentStatusRecord[] {
  return workerAgentBlueprint.map((agent, index) => {
    const isError = disasterCount > 0 && [1, 3, 5].includes(index);
    const isActive = index === 0 || (index === 1 && disasterCount === 0);
    const status: WorkerAgentStatusRecord['status'] = isError ? 'error' : isActive ? 'active' : 'idle';

    const reason = isError
      ? `${agent.name} is blocked by a live risk signal in ${industryName}; the system needs a human intervention before the next orchestration stage can continue.`
      : isActive
        ? `${agent.name} is processing the live pipeline successfully and is aligned to the current executive outcome.`
        : `${agent.name} is waiting for the next event trigger or the next safe stage handoff.`;

    const action = isError
      ? `Review the ${agent.name} evidence, confirm the root cause, and approve a corrective action before re-entering the pipeline.`
      : isActive
        ? `Continue monitoring ${agent.name} and keep the current stage visible for the human operator.`
        : `Stay ready and queue ${agent.name} for the next stage when orchestration resumes.`;

    return {
      id: agent.id,
      name: agent.name,
      status,
      label: status === 'error' ? 'Error' : status === 'active' ? 'Active' : 'Idle',
      reason,
      action
    };
  });
}

async function logWorkerAgentStatusSnapshot(
  snapshot: WorkerAgentStatusRecord[],
  source: 'gemini' | 'fallback',
  industryName: string
) {
  const record = {
    id: `status-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    agent: 'WorkerAgentStatus',
    context: `orchestration-status:${industryName}`,
    message: `Captured worker agent status report for ${industryName}.`,
    response: JSON.stringify(snapshot),
    createdAt: new Date().toISOString(),
    metadata: {
      source,
      industry: industryName,
      statuses: snapshot
    }
  };

  if (mongoDb) {
    await mongoDb.collection('agent_interactions').insertOne(record).catch(() => {});
    return;
  }

  memoryInteractions.unshift(record);
  if (memoryInteractions.length > 200) {
    memoryInteractions.length = 200;
  }
}

app.get('/api/worker-agent-status', async (req, res) => {
  try {
    const industryName = String(req.query.industry || 'Enterprise').trim() || 'Enterprise';
    const fallback = getDeterministicWorkerStatuses(industryName, Math.max(0, Number(req.query.disasterCount || 0)));

    if (getGeminiClient()) {
      try {
        const response = await generateWithGeminiRetry((client) =>
          client.models.generateContent({
            model: GEMINI_MODEL,
            contents: `Evaluate the six orchestrator worker agents for the ${industryName} portfolio. Determine whether each agent is active, idle, or error based on a live operational review. For any error condition, provide a concise reason and a single actionable remediation step. Return JSON only as an array of objects with fields: id, name, status, label, reason, action.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    status: { type: Type.STRING },
                    label: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    action: { type: Type.STRING }
                  },
                  required: ['id', 'name', 'status', 'label', 'reason', 'action']
                }
              }
            }
          })
        );

        const parsed = parseGeminiJsonSafe<Array<Record<string, any>>>(response?.text);
        if (Array.isArray(parsed) && parsed.length >= 6) {
          const normalized = parsed.slice(0, 6).map((agent, index) => {
            const resolvedName = String(agent.name || workerAgentBlueprint[index]?.name || `Worker ${index + 1}`);
            const status = String(agent.status || 'idle').toLowerCase();
            return {
              id: String(agent.id || workerAgentBlueprint[index]?.id || `worker-${index + 1}`),
              name: resolvedName,
              status: status === 'error' ? 'error' : status === 'active' ? 'active' : 'idle',
              label: String(agent.label || (status === 'error' ? 'Error' : status === 'active' ? 'Active' : 'Idle')),
              reason: String(agent.reason || `The live health review indicates ${resolvedName} is in a ${status} state.`),
              action: String(agent.action || 'Continue monitoring the current workflow until the next remediation step is approved.')
            } satisfies WorkerAgentStatusRecord;
          });

          await logWorkerAgentStatusSnapshot(normalized, 'gemini', industryName);
          return res.json({
            agentStatuses: normalized,
            source: 'google-agentic-api',
            generatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn('Google agentic worker status fallback engaged:', error);
      }
    }

    await logWorkerAgentStatusSnapshot(fallback, 'fallback', industryName);
    return res.json({
      agentStatuses: fallback,
      source: 'deterministic-fallback',
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Worker agent status route failed:', error);
    return res.status(500).json({ error: error?.message || 'Unable to resolve worker agent status.' });
  }
});

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

    if (getGeminiClient()) {
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

        const response = await generateWithGeminiRetry((client) =>
          client.models.generateContent({
            model: GEMINI_MODEL,
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
          })
        );

        const parsed = parseGeminiJsonSafe(response?.text);
        if (parsed) {
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
    if (getGeminiClient()) {
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

        const response = await generateWithGeminiRetry((client) =>
          client.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              systemInstruction: 'You are an enterprise strategic portfolio architect for Planview. Respond exclusively with valid JSON conforming to the requested schema.',
              responseMimeType: 'application/json'
            }
          })
        );

        const parsed = parseGeminiJsonSafe(response?.text);
        if (parsed) {
          return res.json({ success: true, strategy: parsed, source: GEMINI_MODEL });
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

/**
 * API route: RAG Knowledge Base Document Ingestion (PDF / Text / Reports)
 * Parses local industry documents via server-side @google/genai (with deterministic fallback)
 * to update the 5-Pillar AI Knowledge Base.
 */
app.post('/api/rag/ingest', async (req, res) => {
  try {
    const {
      industryName = 'Enterprise',
      sector = 'Enterprise Technology',
      targetPillarId = 'auto',
      fileName = 'uploaded-document.txt',
      mimeType = 'text/plain',
      textContent = '',
      base64Content = ''
    } = req.body ?? {};

    const cleanFileName = String(fileName || 'uploaded-document.txt').slice(0, 140);
    const isPdf = String(mimeType).toLowerCase().includes('pdf') || cleanFileName.toLowerCase().endsWith('.pdf');

    let extractedText = typeof textContent === 'string' ? textContent.trim() : '';
    if (!extractedText && isPdf && typeof base64Content === 'string' && base64Content.trim()) {
      const pdfBytes = Uint8Array.from(Buffer.from(base64Content, 'base64'));
      extractedText = extractReadableTextFromPdfBytes(pdfBytes);
    }

    if (!extractedText && !base64Content) {
      return res.status(400).json({
        error: 'Document text or file content is required for RAG ingestion.'
      });
    }

    const client = getGeminiClient();
    const requestedPillar: KnowledgePillarId | 'auto' =
      ['kb1', 'kb2', 'kb3', 'kb4', 'kb5'].includes(String(targetPillarId))
        ? (String(targetPillarId) as KnowledgePillarId)
        : 'auto';

    if (client) {
      try {
        const instructionPrompt = `You are the Planview Anvi RAG Knowledge Base Ingestion Pipeline for ${industryName} (${sector}).
Analyze the uploaded document "${cleanFileName}" and extract structured enterprise vector knowledge to update one of the 5 Knowledge Base Pillars:
- kb1: Historical Performance (attainment, sprint velocity, SLAs, historical benchmarks)
- kb2: Market Data (industry standards, regulatory policies, compliance mandates, market benchmarks)
- kb3: Customer Feedback (NPS, CSAT, adoption friction, voice of customer)
- kb4: Project Runner & Outcome (ROI, program delivery lessons, epics, postmortems)
- kb5: Resources & Utilisation (FTE capacity, squad allocation, bottlenecks, staffing)

${requestedPillar !== 'auto' ? `Target Pillar MUST be "${requestedPillar}".` : 'Choose the best matching targetPillarId from kb1..kb5.'}
Produce 3 to 6 concise, self-contained semantic vector chunks suitable for RAG retrieval, a 1-sentence executive summary, a concise KPI metricHighlight (under 28 chars), a short trendTag (under 24 chars), and 3 keyInsights.`;

        const parts: Array<Record<string, any>> = [];
        if (isPdf && typeof base64Content === 'string' && base64Content.trim().length > 0) {
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Content.trim()
            }
          });
        } else {
          parts.push({
            text: `Document Content (${cleanFileName}):\n${extractedText.slice(0, 24000)}`
          });
        }
        parts.push({ text: instructionPrompt });

        const response = await generateWithGeminiRetry((ai) =>
          ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: { parts },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  targetPillarId: {
                    type: Type.STRING,
                    description: 'One of kb1, kb2, kb3, kb4, kb5'
                  },
                  summary: {
                    type: Type.STRING,
                    description: 'Concise 1-2 sentence executive summary of the document.'
                  },
                  metricHighlight: {
                    type: Type.STRING,
                    description: 'Primary numeric KPI headline under 28 characters.'
                  },
                  trendTag: {
                    type: Type.STRING,
                    description: 'Short badge label under 24 characters.'
                  },
                  keyInsights: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  chunks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['targetPillarId', 'summary', 'metricHighlight', 'trendTag', 'keyInsights', 'chunks']
              }
            }
          })
        );

        const parsed = parseGeminiJsonSafe<{
          targetPillarId?: string;
          summary?: string;
          metricHighlight?: string;
          trendTag?: string;
          keyInsights?: string[];
          chunks?: string[];
        }>(response?.text);

        if (parsed && Array.isArray(parsed.chunks) && parsed.chunks.length > 0) {
          const resolvedPillar: KnowledgePillarId =
            requestedPillar !== 'auto'
              ? requestedPillar
              : ['kb1', 'kb2', 'kb3', 'kb4', 'kb5'].includes(String(parsed.targetPillarId))
                ? (String(parsed.targetPillarId) as KnowledgePillarId)
                : classifyDocumentPillar(extractedText, cleanFileName, 'auto');

          return res.json({
            success: true,
            preview: {
              targetPillarId: resolvedPillar,
              targetPillarTitle: PILLAR_TITLES[resolvedPillar],
              fileName: cleanFileName,
              summary: String(parsed.summary || '').trim() || `Indexed ${cleanFileName} via Gemini RAG pipeline.`,
              metricHighlight: String(parsed.metricHighlight || `${parsed.chunks.length} Vectors Indexed`).slice(0, 32),
              trendTag: String(parsed.trendTag || `RAG · ${cleanFileName.slice(0, 18)}`).slice(0, 28),
              keyInsights: (parsed.keyInsights || []).map((k) => String(k).trim()).filter(Boolean).slice(0, 5),
              chunks: parsed.chunks
                .map((c, idx) => ({
                  id: `rag-doc-${Date.now()}-${idx + 1}`,
                  text: String(c).trim().slice(0, 320),
                  source: cleanFileName
                }))
                .filter((c) => c.text.length > 0)
                .slice(0, 8),
              engine: 'gemini-rag'
            }
          });
        }
      } catch (geminiError: any) {
        const msg = geminiError instanceof Error ? geminiError.message : 'Gemini RAG call failed';
        console.warn(`Gemini RAG ingestion fallback (${msg})`);
      }
    }

    const fallbackText =
      extractedText ||
      `Uploaded policy/performance document ${cleanFileName} for ${industryName} (${sector}).`;
    const preview = buildDeterministicIngestionPreview({
      fileName: cleanFileName,
      textContent: fallbackText,
      targetPillarId: requestedPillar,
      industryName: String(industryName)
    });

    return res.json({ success: true, preview });
  } catch (error: any) {
    console.error('RAG document ingestion error:', error);
    return res.status(500).json({ error: error.message || 'Failed to ingest document.' });
  }
});

/**
 * API route: Multi-Turn Gemini Chatbot (powered by @google/genai ai.chats)
 * Supports selectable Gemini models (gemini-4-carbon, gemini-4-argon, gemini-4-hydrogen, gemini-3.1-flash-lite)
 * and customizable role-based system instructions.
 */
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const {
      model: requestedModel,
      systemInstruction = '',
      history = [],
      message = '',
      industryContext = ''
    } = req.body ?? {};

    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Chat message cannot be empty.' });
    }

    if (requestedModel && !isAllowedGeminiChatModel(String(requestedModel))) {
      return res.status(400).json({
        error: `Unsupported model "${String(requestedModel)}". Allowed models: gemini-4-hydrogen, gemini-4-argon, gemini-4-carbon, gemini-3.1-flash-lite.`
      });
    }

    const activeModel = resolveGeminiChatModel(requestedModel);
    const client = getGeminiClient();
    if (!client) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Set GEMINI_API_KEY in Settings > Secrets to enable live chat responses.'
      });
    }

    const fullSystemInstruction = [
      String(systemInstruction || 'You are the Planview Anvi Enterprise Strategy & OKR Copilot.').trim(),
      industryContext ? `\nLive Portfolio Context:\n${String(industryContext).slice(0, 6000)}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const formattedHistory = sanitizeChatHistoryForApi(Array.isArray(history) ? history : []);

    const chat = client.chats.create({
      model: activeModel,
      config: {
        systemInstruction: fullSystemInstruction
      },
      history: formattedHistory
    });

    const response = await chat.sendMessage({ message: cleanMessage });
    const replyText = (response.text || '').trim();

    if (!replyText) {
      return res.status(502).json({
        error: `Model ${activeModel} returned an empty response. Please try again.`
      });
    }

    return res.json({
      success: true,
      model: activeModel,
      reply: replyText
    });
  } catch (error: any) {
    console.error('Gemini multi-turn chat error:', error);
    const status = typeof error?.status === 'number' ? error.status : 500;
    const message = error?.message || 'Gemini chat request failed.';
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: message
    });
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
