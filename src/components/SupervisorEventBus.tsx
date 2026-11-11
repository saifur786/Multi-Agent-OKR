import React, { useState } from 'react';
import {
  Radio,
  Sparkles,
  Zap,
  Filter,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  ShieldAlert,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { BusEvent } from '../types/orchestration';

interface SupervisorEventBusProps {
  events: BusEvent[];
  onClear: () => void;
  onReseed: () => void;
  onInjectTestEvent: () => void;
  onClose?: () => void;
}

export const SupervisorEventBus: React.FC<SupervisorEventBusProps> = ({
  events,
  onClear,
  onReseed,
  onInjectTestEvent,
  onClose
}) => {
  const [filterTopic, setFilterTopic] = useState<string>('ALL');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvents = events.filter((evt) => {
    if (filterTopic === 'ALL') return true;
    return evt.topic.includes(filterTopic);
  });

  const handleCopy = (evt: BusEvent) => {
    navigator.clipboard.writeText(JSON.stringify(evt.payload, null, 2));
    setCopiedId(evt.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getSeverityBadge = (sev: BusEvent['severity']) => {
    switch (sev) {
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-violet-600 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Anvi Asynchronous Event Bus Telemetry
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              Supervisor-Worker Architecture
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Decoupled event-driven messaging coordinating 6 autonomous agents across the OKR lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onInjectTestEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Emit Webhook Event</span>
          </button>
          <button
            onClick={onReseed}
            title="Reset to default operational log"
            className="p-1.5 rounded-lg text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClear}
            title="Clear all events"
            className="p-1.5 rounded-lg text-slate-600 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
            >
              Hide
            </button>
          )}
        </div>
      </div>

      {/* Supervisor-Worker Interactive Topology Strip */}
      <div className="bg-slate-900 rounded-xl p-4 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Supervisor Node */}
          <div className="flex items-center gap-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-violet-500/40 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-violet-200 uppercase tracking-wider">Supervisor Agent</p>
              <p className="text-[11px] text-slate-300">Anvi Orchestrator Kernel</p>
            </div>
          </div>

          {/* Event Bus Backbone Wire */}
          <div className="flex-1 w-full flex items-center justify-center relative py-1">
            <div className="h-0.5 w-full bg-gradient-to-r from-violet-500 via-indigo-400 to-emerald-400 relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-800 text-[10px] font-semibold text-violet-300 rounded border border-violet-600/50">
                ASYNC EVENT BUS (P99 &lt; 45ms)
              </span>
            </div>
          </div>

          {/* 6 Connected Worker Agents Count */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>6 Active Worker Agents Polling</span>
          </div>
        </div>

        {/* Worker Agents badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate">1. Strategy RAG</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="truncate">2. OKR Predictor</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate">3. Capacity Graph</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">4. Risk Sentinel</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">5. Exec Reporter</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span className="truncate">6. Retro Learner</span>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Topic:
        </span>
        {[
          { key: 'ALL', label: 'All Topics' },
          { key: 'STRATEGY', label: 'Strategy / RAG' },
          { key: 'OKR', label: 'OKR / Regression' },
          { key: 'GRAPH', label: 'Graph / Traversal' },
          { key: 'RISK', label: 'Risk / Sentinel' },
          { key: 'EXECUTIVE', label: 'Executive JSON' },
          { key: 'ROOT_CAUSE', label: 'Retro / Root Cause' }
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterTopic(f.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filterTopic === f.key
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Events Stream Timeline */}
      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No events match the selected topic filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedEventId === evt.id;
            return (
              <div
                key={evt.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-slate-400 text-[11px]">{evt.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeverityBadge(evt.severity)}`}>
                      {evt.topic}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700 font-medium">{evt.sourceAgent}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-500">{evt.targetAgent}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {evt.latencyMs}ms
                    </span>
                    <button
                      onClick={() => setExpandedEventId(isExpanded ? null : evt.id)}
                      className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                      aria-label="Toggle event payload"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-800 font-medium">{evt.summary}</p>

                {/* Expanded Payload Inspector */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Event Payload</span>
                      <button
                        onClick={() => handleCopy(evt)}
                        className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {copiedId === evt.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Payload</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-48">
                      {JSON.stringify(evt.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
