import React, { useCallback, useEffect, useState } from 'react';
import { Database, RefreshCw, X } from 'lucide-react';
import type { WorkerAgentLogEntry, WorkerAgentStatusSummary } from '../utils/workerAgentTelemetry';

interface WorkerAgentLogsModalProps {
  agent: WorkerAgentStatusSummary | null;
  industryName: string;
  onClose: () => void;
}

export const WorkerAgentLogsModal: React.FC<WorkerAgentLogsModalProps> = ({
  agent,
  industryName,
  onClose
}) => {
  const [logs, setLogs] = useState<WorkerAgentLogEntry[]>([]);
  const [domainRole, setDomainRole] = useState<string>('');
  const [stageNumber, setStageNumber] = useState<number | null>(null);
  const [storeSource, setStoreSource] = useState<'mongodb' | 'memory'>('memory');
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAgentLogs = useCallback(async () => {
    if (!agent) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const resp = await fetch(
        `/api/worker-agent-logs?agentId=${encodeURIComponent(agent.id || agent.name)}&industry=${encodeURIComponent(industryName)}&limit=5`
      );
      if (!resp.ok) {
        const errPayload = await resp.json().catch(() => null);
        throw new Error(errPayload?.error || 'Unable to retrieve worker agent logs.');
      }
      const data = await resp.json();
      setLogs(Array.isArray(data?.logs) ? data.logs.slice(0, 5) : []);
      setDomainRole(typeof data?.domainRole === 'string' ? data.domainRole : '');
      setStageNumber(typeof data?.stageNumber === 'number' ? data.stageNumber : null);
      setStoreSource(data?.source === 'mongodb' ? 'mongodb' : 'memory');
      setTotalMatched(Number(data?.totalMatched || 0));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load worker logs.');
    } finally {
      setIsLoading(false);
    }
  }, [agent, industryName]);

  useEffect(() => {
    if (!agent) return;
    void fetchAgentLogs();
  }, [agent, fetchAgentLogs]);

  useEffect(() => {
    if (!agent) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [agent, onClose]);

  if (!agent) return null;

  const statusTone =
    agent.status === 'error'
      ? 'text-red-700'
      : agent.status === 'active'
        ? 'text-emerald-700'
        : 'text-slate-700';

  const statusDot =
    agent.status === 'error'
      ? 'bg-red-500'
      : agent.status === 'active'
        ? 'bg-emerald-500'
        : 'bg-slate-400';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Worker Agent Logs: ${agent.name}`}
        data-testid="worker-agent-logs-modal"
        className="w-full max-w-2xl max-h-[86vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>{stageNumber ? `Stage ${stageNumber} Worker` : 'Worker Agent'}</span>
              <span aria-hidden="true">·</span>
              <span>{industryName}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 text-slate-200">
                <Database className="w-3.5 h-3.5 text-indigo-300" />
                <span>{storeSource === 'mongodb' ? 'MongoDB Knowledge Base' : 'Knowledge Base Store'}</span>
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-white truncate">{agent.name}</h2>
            {domainRole && <p className="mt-0.5 text-xs text-slate-300">{domainRole}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void fetchAgentLogs()}
              disabled={isLoading}
              aria-label="Refresh worker agent logs"
              data-testid="refresh-worker-logs-btn"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Worker Agent Logs Modal"
              data-testid="close-worker-logs-btn"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-3.5 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="inline-flex items-center gap-2 font-semibold">
              <span className={`inline-block h-2 w-2 rounded-full ${statusDot}`} />
              <span className={statusTone}>Current Status: {agent.label}</span>
            </div>
            <span className="text-[11px] text-slate-500 tabular-nums">
              Showing last {logs.length} of {Math.max(logs.length, totalMatched)} KB records
            </span>
          </div>
          {agent.reason && <p className="text-xs text-slate-700">{agent.reason}</p>}
          {agent.action && (
            <p className="text-[11px] text-slate-500">
              <strong className="font-semibold text-slate-700">Recommended action:</strong> {agent.action}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-3" aria-label="Loading worker logs">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="border-b border-slate-100 pb-3 animate-pulse space-y-2">
                  <div className="h-3 w-44 rounded bg-slate-200" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center justify-between gap-3">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => void fetchAgentLogs()}
                className="rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white hover:bg-red-800 cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-800">No persisted reasoning steps yet</p>
              <p className="text-xs text-slate-500">
                Run Orchestrate Pipeline or trigger this worker stage to record reasoning steps into the MongoDB Knowledge Base.
              </p>
            </div>
          ) : (
            <ol className="divide-y divide-slate-200" data-testid="worker-agent-logs-list">
              {logs.map((log, index) => (
                <li key={log.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 tabular-nums">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-semibold text-indigo-700">#{index + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-700">{log.sourceAgent}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate max-w-[240px]">{log.context}</span>
                    </div>
                    <time dateTime={log.createdAt} className="font-mono text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">{log.trigger}</p>
                  <p className="text-xs leading-relaxed text-slate-600">{log.reasoning}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-[11px] text-slate-500">
          <span>Source: {storeSource === 'mongodb' ? 'MongoDB agent_interactions collection' : 'Knowledge Base interaction log'}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
