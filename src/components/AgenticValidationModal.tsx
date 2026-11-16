import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Webhook,
  X,
  AlertTriangle
} from 'lucide-react';
import { eventBus } from '../utils/eventBus';

interface AgenticCheckItem {
  agentKey: string;
  agentName: string;
  channel: string;
  status: 'verified' | 'fallback';
  modelOrEngine: string;
  persistence: string;
  latencyMs: number;
  sampleOutput: string;
}

interface ValidationReport {
  industryName: string;
  geminiConfigured: boolean;
  geminiModel: string;
  mongoConnected: boolean;
  persistenceMode: string;
  verifiedCount: number;
  totalChecks: number;
  checkedAt: string;
  checks: AgenticCheckItem[];
}

interface InteractionItem {
  id: string;
  agent: string;
  context: string;
  message: string;
  response: string;
  createdAt: string;
}

interface AgenticValidationModalProps {
  industryName: string;
  onClose: () => void;
}

export const AgenticValidationModal: React.FC<AgenticValidationModalProps> = ({
  industryName,
  onClose
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [recentInteractions, setRecentInteractions] = useState<InteractionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRecentInteractions = async () => {
    try {
      const resp = await fetch(`/api/agent-interactions?context=${encodeURIComponent(industryName)}`);
      if (!resp.ok) return;
      const data = await resp.json();
      if (Array.isArray(data?.interactions)) {
        setRecentInteractions(data.interactions.slice(0, 12));
      }
    } catch {
      // Ignore network transient error
    }
  };

  const runFullValidation = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const resp = await fetch('/api/agents/validate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industryName })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Validation probe failed');
      }
      setReport(data as ValidationReport);

      eventBus.publish({
        topic: 'GOVERNANCE_POLICY_VALIDATED',
        sourceAgent: 'Supervisor Agent (Anvi)',
        targetAgent: 'Google Agentic Communication Bus',
        summary: `Validated ${data.totalChecks} AI agent channels (${data.verifiedCount} live Gemini / ${data.persistenceMode} persistence)`,
        payload: {
          industryName,
          geminiConfigured: data.geminiConfigured,
          mongoConnected: data.mongoConnected,
          verifiedCount: data.verifiedCount
        },
        latencyMs: 32,
        severity: 'success'
      });

      await loadRecentInteractions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to validate agentic channels.');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    void loadRecentInteractions();
    void runFullValidation();
  }, [industryName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div
        role="dialog"
        aria-label="Google Agentic AI Communication Validator"
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Google Agentic AI &amp; MongoDB Communication Validator
              </h2>
              <p className="text-xs text-slate-300">
                End-to-end live probe across Conversational, Supervisor, Ideation, Multi-Lens Advisors, Alignment, Risk + ServiceNow/Jira, Executive Reporting &amp; Retrospective agents.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Agentic Validator"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-slate-50/60">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 font-semibold">
                <Activity className="w-3.5 h-3.5" />
                Model: {report?.geminiModel || 'gemini-4-hydrogen'}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold ${
                  report?.geminiConfigured
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {report?.geminiConfigured
                  ? `Live Gemini Active (${report.verifiedCount}/${report.totalChecks})`
                  : 'Local Fallback Active (Set GEMINI_API_KEY for live LLM)'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-100 text-slate-700 font-semibold">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                Knowledge Store: {report?.mongoConnected ? 'MongoDB Connected' : 'Stateful Memory Store'}
              </span>
            </div>

            <button
              type="button"
              data-testid="rerun-agentic-validation-btn"
              onClick={() => void runFullValidation()}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Validating 8 Agents...' : 'Re-Validate All 8 Agents'}</span>
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.checks.map((item) => (
                <div
                  key={item.agentKey}
                  data-testid={`agent-check-${item.agentKey}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{item.agentName}</h3>
                      <p className="text-[11px] font-mono text-indigo-700">{item.channel}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        item.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status === 'verified' ? `Gemini (${item.latencyMs}ms)` : `Fallback (${item.latencyMs}ms)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2 border border-slate-100">
                    {item.sampleOutput}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Engine: <strong>{item.modelOrEngine}</strong></span>
                    <span>Audit Log: <strong>{item.persistence}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Webhook className="w-4 h-4 text-indigo-600" />
                Recent Persisted Agentic Interactions ({industryName})
              </h3>
              <span className="text-[11px] text-slate-500">{recentInteractions.length} latest records</span>
            </div>

            {recentInteractions.length === 0 ? (
              <p className="text-xs text-slate-500">No persisted agent interactions recorded yet for this domain.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {recentInteractions.map((entry) => (
                  <div key={entry.id} className="py-2 text-xs space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-indigo-700">{entry.agent}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 truncate">{entry.message}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{entry.response}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
