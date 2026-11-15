import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  HelpCircle,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Wrench
} from 'lucide-react';
import { TraceabilityNode } from '../types/orchestration';
import {
  BusinessProblemAttributeKey,
  OKR_REQUIRED_ATTRIBUTES,
  OkrHealthScanResult,
  scanPortfolioOkrHealth
} from '../utils/okrHealthChecker';
import { eventBus } from '../utils/eventBus';

interface OKRHealthCheckerProps {
  okrNodes: TraceabilityNode[];
  industryName: string;
  selectedOkrId: string | null;
  onInspectOkr: (okrId: string) => void;
  onFixOkrInManager: (okrId: string, targetAttribute?: BusinessProblemAttributeKey) => void;
  onFixOkrInline: (okrId: string) => void;
}

type HealthFilterTab = 'all' | 'flagged' | 'complete';

export const OKRHealthChecker: React.FC<OKRHealthCheckerProps> = ({
  okrNodes,
  industryName,
  selectedOkrId,
  onInspectOkr,
  onFixOkrInManager,
  onFixOkrInline
}) => {
  const [filterTab, setFilterTab] = useState<HealthFilterTab>('all');
  const [attributeFilter, setAttributeFilter] = useState<BusinessProblemAttributeKey | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showGuidance, setShowGuidance] = useState<boolean>(false);
  const [lastScannedAt, setLastScannedAt] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const summary = useMemo(() => scanPortfolioOkrHealth(okrNodes), [okrNodes]);

  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return summary.results.filter((item) => {
      if (filterTab === 'flagged' && !item.isFlagged) return false;
      if (filterTab === 'complete' && item.isFlagged) return false;
      if (attributeFilter && !item.missingAttributes.some((m) => m.attribute === attributeFilter)) {
        return false;
      }
      if (query) {
        const matchesQuery =
          item.okrId.toLowerCase().includes(query) ||
          item.okrTitle.toLowerCase().includes(query) ||
          item.owner.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }
      return true;
    });
  }, [summary.results, filterTab, attributeFilter, searchQuery]);

  const handleRunScan = () => {
    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    setLastScannedAt(nowLabel);

    eventBus.publish({
      topic: 'GOVERNANCE_POLICY_VALIDATED',
      sourceAgent: 'OKR Health Checker',
      targetAgent: 'Supervisor Agent',
      summary: `Scanned ${summary.totalOkrs} OKRs in ${industryName}: ${summary.flaggedCount} flagged incomplete, ${summary.completeCount} complete (6/6 attributes).`,
      payload: {
        industryName,
        totalOkrs: summary.totalOkrs,
        flaggedCount: summary.flaggedCount,
        completeCount: summary.completeCount,
        overallCompletenessPct: summary.overallCompletenessPct
      },
      latencyMs: 14,
      severity: summary.flaggedCount > 0 ? 'warning' : 'success'
    });
  };

  const renderStatusLabel = (item: OkrHealthScanResult) => {
    if (!item.isFlagged) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Complete (6/6)</span>
        </span>
      );
    }

    if (item.healthTier === 'Incomplete') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>Flagged · {item.missingAttributes.length} missing</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Flagged · {item.missingAttributes.length} missing</span>
      </span>
    );
  };

  return (
    <section
      aria-label="OKR Health Checker"
      className="bg-white rounded-xl border border-slate-200 p-5 space-y-5"
    >
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              OKR Health Checker
            </h3>
            <span className="text-xs text-slate-400" aria-hidden="true">·</span>
            <span className="text-xs font-medium text-slate-600 tabular-nums">
              Last scan {lastScannedAt}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scans all OKRs in {industryName} across the 6 structured Business Problem dimensions: Description, Stakeholders, Causal Chain, Root Cause, Remediation Timing, and Metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowGuidance((prev) => !prev)}
            aria-expanded={showGuidance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>{showGuidance ? 'Hide Audit Criteria' : 'Audit Criteria & Tips'}</span>
          </button>
          <button
            type="button"
            onClick={handleRunScan}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-scan All OKRs</span>
          </button>
        </div>
      </div>

      {/* Expandable Tips & Audit Criteria */}
      {showGuidance && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-2.5">
          <div className="font-semibold text-slate-900">
            How OKRHealthChecker Evaluates Completeness
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] leading-relaxed">
            <div>
              <strong className="text-slate-900">1. Description:</strong> Requires a problem statement of at least 15 characters describing customer or operational friction.
            </div>
            <div>
              <strong className="text-slate-900">2. Stakeholders:</strong> Requires at least one impacted group or HR directory stakeholder assigned.
            </div>
            <div>
              <strong className="text-slate-900">3. Causal Chain:</strong> Requires a quantified narrative (&ge; 10 chars) linking cause to dollar or revenue impact.
            </div>
            <div>
              <strong className="text-slate-900">4. Root Cause:</strong> Requires at least one underlying root cause (&ge; 10 chars) explaining why the bottleneck occurs.
            </div>
            <div>
              <strong className="text-slate-900">5. Remediation Timing:</strong> Requires a target milestone, sprint, or quarter delivery window.
            </div>
            <div>
              <strong className="text-slate-900">6. Metrics:</strong> Requires at least one Leading or Lagging metric with explicit baseline and target values.
            </div>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
            Tip: Click any missing attribute button on a flagged OKR row to jump directly to that dimension inside BusinessProblemManager.
          </p>
        </div>
      )}

      {/* 4-Column Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="text-[11px] font-medium text-slate-500">Total OKRs Scanned</div>
          <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{summary.totalOkrs}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="text-[11px] font-medium text-slate-500">Flagged Incomplete</div>
          <div className={`text-xl font-bold tabular-nums mt-0.5 ${summary.flaggedCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {summary.flaggedCount}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="text-[11px] font-medium text-slate-500">Complete (6/6)</div>
          <div className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">{summary.completeCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="text-[11px] font-medium text-slate-500">Portfolio Attribute Coverage</div>
          <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{summary.overallCompletenessPct}%</div>
        </div>
      </div>

      {/* 6-Attribute Missing Coverage Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">
            Filter by Missing Attribute
          </span>
          {attributeFilter && (
            <button
              type="button"
              onClick={() => setAttributeFilter(null)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Clear attribute filter ({attributeFilter})
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {summary.attributeCoverage.map((stat) => {
            const isSelected = attributeFilter === stat.attribute;
            const hasMissing = stat.missingCount > 0;
            return (
              <button
                key={stat.attribute}
                type="button"
                onClick={() => setAttributeFilter(isSelected ? null : stat.attribute)}
                className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-semibold truncate">{stat.attribute}</div>
                <div className="text-[11px] tabular-nums mt-0.5 flex items-center justify-between">
                  <span className={hasMissing ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>
                    {hasMissing ? `${stat.missingCount} missing` : 'All present'}
                  </span>
                  <span className="text-slate-400">{stat.coveragePct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All OKRs ({summary.totalOkrs})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('flagged')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterTab === 'flagged' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Flagged Incomplete ({summary.flaggedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('complete')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filterTab === 'complete' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Complete ({summary.completeCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by OKR ID, title, or owner..."
            aria-label="Filter scanned OKRs"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Results List */}
      {summary.totalOkrs === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
          No OKRs defined yet in {industryName}. Switch to Manual OKRs and add an OKR to scan its 6 business problem attributes.
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center space-y-2">
          <p className="text-xs font-medium text-slate-700">
            No OKRs match the current filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterTab('all');
              setAttributeFilter(null);
              setSearchQuery('');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
          {filteredResults.map((item) => {
            const isSelected = selectedOkrId === item.okrId;
            return (
              <div
                key={item.okrId}
                data-health-okr-id={item.okrId}
                className={`p-4 transition-colors ${
                  isSelected ? 'bg-indigo-50/40' : 'bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700">{item.okrId}</span>
                      <span aria-hidden="true">·</span>
                      <span>Owner: <strong className="font-medium text-slate-700">{item.owner}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{item.presentCount}/{item.totalRequired} attributes ({item.completenessPct}%)</span>
                      <span aria-hidden="true">·</span>
                      {renderStatusLabel(item)}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900">
                      {item.okrTitle}
                    </h4>

                    {/* Attribute Matrix */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      {OKR_REQUIRED_ATTRIBUTES.map((attr) => {
                        const missingInfo = item.missingAttributes.find((m) => m.attribute === attr);
                        if (missingInfo) {
                          return (
                            <button
                              key={attr}
                              type="button"
                              onClick={() => onFixOkrInManager(item.okrId, attr)}
                              title={`${missingInfo.reason} Click to fix in BusinessProblemManager.`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-medium text-amber-900 cursor-pointer transition-colors whitespace-nowrap"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Missing: {attr}</span>
                            </button>
                          );
                        }
                        return (
                          <span
                            key={attr}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-emerald-700 whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{attr}</span>
                          </span>
                        );
                      })}
                    </div>

                    {item.missingAttributes.length > 0 && (
                      <p className="text-[11px] text-slate-500 pt-0.5">
                        Next remediation: {item.missingAttributes[0].remediationHint}
                      </p>
                    )}
                  </div>

                  {/* Row Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onInspectOkr(item.okrId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>Inspect OKR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onFixOkrInline(item.okrId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit Inline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onFixOkrInManager(
                          item.okrId,
                          item.missingAttributes[0]?.attribute || 'Description'
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                        item.isFlagged
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{item.isFlagged ? 'Fix in Manager' : 'Manage Attributes'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
