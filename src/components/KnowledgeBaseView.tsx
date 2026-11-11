import React, { useState } from 'react';
import {
  Database,
  Sparkles,
  ChevronRight,
  Check,
  Info,
  Search,
  BookOpen,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { IndustryDataBundle, KnowledgeBasePillar } from '../types/orchestration';
import { eventBus } from '../utils/eventBus';

interface KnowledgeBaseViewProps {
  industry: IndustryDataBundle;
  fedPillars: Record<string, boolean>;
  onToggleFedPillar: (pillarId: string) => void;
  activeFedCount: number;
}

const SAMPLE_QUERIES = [
  'APRA CPS 230 operational resilience deadline',
  'Mortgage approval SLA turnaround time',
  'Fixed-price gross margin and reusable accelerators',
  'Store Click & Collect WMS inventory latency',
  'Substation SCADA telemetry and LTE gateways'
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  industry,
  fedPillars,
  onToggleFedPillar,
  activeFedCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedChunks, setMatchedChunks] = useState<{
    pillarTitle: string;
    text: string;
    source: string;
    similarity: number;
  }[]>([]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setMatchedChunks([]);
      return;
    }

    const queryWords = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const results: {
      pillarTitle: string;
      text: string;
      source: string;
      similarity: number;
    }[] = [];

    industry.knowledgeBase.forEach(pillar => {
      pillar.vectorChunks.forEach(chunk => {
        const chunkText = chunk.text.toLowerCase();
        let matches = 0;
        queryWords.forEach(w => {
          if (chunkText.includes(w)) matches++;
        });
        if (matches > 0 || q.length > 5) {
          const sim = Math.min(0.98, +(0.72 + (matches * 0.09)).toFixed(2));
          results.push({
            pillarTitle: pillar.title,
            text: chunk.text,
            source: chunk.source,
            similarity: sim
          });
        }
      });
    });

    results.sort((a, b) => b.similarity - a.similarity);
    setMatchedChunks(results.slice(0, 4));

    eventBus.publish({
      topic: 'STRATEGY_RAG_QUERIED',
      sourceAgent: 'Interactive RAG Explorer',
      targetAgent: 'Vector Knowledge Base',
      summary: `Knowledge Base vector query: "${q.slice(0, 36)}..." returned ${results.length} matched vectors`,
      payload: { query: q, resultsCount: results.length, topSimilarity: results[0]?.similarity || 0 },
      latencyMs: 25,
      severity: 'info'
    });
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Base Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              AI Knowledge Base — {industry.name}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            5-pillar enterprise vector memory grounding Planview Anvi agents across all 6 OKR lifecycle stages.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200 text-xs font-semibold text-indigo-700 shrink-0">
          <Sparkles className="w-4 h-4" />
          <span>{activeFedCount} of 5 Pillars Feeding Agents</span>
        </div>
      </div>

      {/* Interactive Vector Search Workbench */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            Interactive Vector Similarity Search (RAG Testbench)
          </h3>
          <span className="text-xs text-slate-400 font-mono">1536-dim Embedding Space</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type search terms or select an enterprise prompt below..."
            className="w-full px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        {/* Sample Prompt Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium">Quick Prompts:</span>
          {SAMPLE_QUERIES.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSearch(sq)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] font-medium transition-all cursor-pointer"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Search Results */}
        {matchedChunks.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase">
              Retrieved Vectors ({matchedChunks.length} chunks)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {matchedChunks.map((m, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700">{m.pillarTitle}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[10px] border border-emerald-200">
                      Similarity: {m.similarity}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium">{m.text}</p>
                  <p className="text-[10px] text-slate-400">Source: {m.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5 Knowledge Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {industry.knowledgeBase.map((pillar) => {
          const isFed = fedPillars[pillar.id];
          return (
            <div
              key={pillar.id}
              className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between transition-all ${
                isFed ? 'border-slate-200' : 'border-slate-200 opacity-60'
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

              {/* Feed Toggle */}
              <button
                onClick={() => onToggleFedPillar(pillar.id)}
                aria-label={`Toggle Knowledge Feed for ${pillar.title}`}
                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  isFed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {isFed ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> <span>Feeding into OKR Agents</span>
                  </>
                ) : (
                  <>
                    <Info className="w-3.5 h-3.5" /> <span>Enable Agent Feed</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
