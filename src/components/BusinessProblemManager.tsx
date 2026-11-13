import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, Users, AlertTriangle, Clock3, Gauge, Target, Building2 } from 'lucide-react';
import { OrgDirectoryMember, StructuredBusinessProblem } from '../types/orchestration';

interface BusinessProblemManagerProps {
  isOpen: boolean;
  onClose: () => void;
  problem: StructuredBusinessProblem | null;
  orgDirectory: OrgDirectoryMember[];
  onSave: (nextProblem: StructuredBusinessProblem) => void;
}

const ATTRIBUTE_OPTIONS = [
  'Description',
  'Stakeholders',
  'Causal Chain',
  'Root Cause',
  'Remediation Timing',
  'Metrics'
] as const;

type AttributeKey = (typeof ATTRIBUTE_OPTIONS)[number];

const defaultProblem = (): StructuredBusinessProblem => ({
  problemDescription: '',
  impactedStakeholders: [],
  causalChainToDollarImpact: '',
  rootCause: '',
  rootCauses: [],
  targetRemediationTiming: '',
  remediationTimings: [],
  metrics: []
});

export const BusinessProblemManager: React.FC<BusinessProblemManagerProps> = ({
  isOpen,
  onClose,
  problem,
  orgDirectory,
  onSave
}) => {
  const normalizeProblemShape = (candidate: Partial<StructuredBusinessProblem> | null | undefined): StructuredBusinessProblem => {
    const safeProblem = { ...defaultProblem(), ...(candidate ?? {}) };
    const rootCauses = Array.isArray(safeProblem.rootCauses) && safeProblem.rootCauses.length > 0
      ? safeProblem.rootCauses.map(String)
      : safeProblem.rootCause ? [String(safeProblem.rootCause)] : [];
    const remediationTimings = Array.isArray(safeProblem.remediationTimings) && safeProblem.remediationTimings.length > 0
      ? safeProblem.remediationTimings.map(String)
      : safeProblem.targetRemediationTiming ? [String(safeProblem.targetRemediationTiming)] : [];
    return {
      ...safeProblem,
      impactedStakeholders: Array.isArray(safeProblem.impactedStakeholders) ? safeProblem.impactedStakeholders.map(String).filter(Boolean) : [],
      rootCause: rootCauses[0] ?? '',
      rootCauses,
      targetRemediationTiming: remediationTimings[0] ?? '',
      remediationTimings,
      metrics: Array.isArray(safeProblem.metrics) ? safeProblem.metrics.filter((metric) => !!metric && typeof metric === 'object') as StructuredBusinessProblem['metrics'] : []
    };
  };

  const activeProblem = useMemo(() => normalizeProblemShape(problem), [problem]);

  const [selectedAttribute, setSelectedAttribute] = useState<AttributeKey>('Description');
  const [draft, setDraft] = useState<StructuredBusinessProblem>(activeProblem);
  const [newStakeholder, setNewStakeholder] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newTiming, setNewTiming] = useState('');
  const [newMetric, setNewMetric] = useState({
    indicator: '',
    baselineValue: '',
    targetValue: '',
    metricType: 'Leading' as 'Leading' | 'Lagging'
  });

  React.useEffect(() => {
    setDraft(normalizeProblemShape(problem));
  }, [problem, isOpen]);

  if (!isOpen) return null;

  const stakeholderOptions = orgDirectory.map((member) => member.name).filter(Boolean);

  const syncDerivedFields = (next: StructuredBusinessProblem): StructuredBusinessProblem => {
    const safeNext = normalizeProblemShape(next);
    const rootCauses = Array.isArray(safeNext.rootCauses) && safeNext.rootCauses.length > 0
      ? safeNext.rootCauses
      : safeNext.rootCause ? [safeNext.rootCause] : [];
    const remediationTimings = Array.isArray(safeNext.remediationTimings) && safeNext.remediationTimings.length > 0
      ? safeNext.remediationTimings
      : safeNext.targetRemediationTiming ? [safeNext.targetRemediationTiming] : [];
    return {
      ...safeNext,
      rootCause: rootCauses[0] ?? '',
      rootCauses,
      targetRemediationTiming: remediationTimings[0] ?? '',
      remediationTimings
    };
  };

  const addStakeholder = (name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    setDraft((prev) => syncDerivedFields({
      ...prev,
      impactedStakeholders: Array.from(new Set([...(prev.impactedStakeholders || []), normalized]))
    }));
    setNewStakeholder('');
  };

  const removeStakeholder = (name: string) => {
    setDraft((prev) => syncDerivedFields({
      ...prev,
      impactedStakeholders: (prev.impactedStakeholders || []).filter((value) => value !== name)
    }));
  };

  const addRootCause = () => {
    const value = newRootCause.trim();
    if (!value) return;
    setDraft((prev) => syncDerivedFields({
      ...prev,
      rootCause: value,
      rootCauses: Array.from(new Set([...(prev.rootCauses || []), value]))
    }));
    setNewRootCause('');
  };

  const removeRootCause = (value: string) => {
    setDraft((prev) => {
      const nextEntries = (prev.rootCauses || []).filter((item) => item !== value);
      return syncDerivedFields({
        ...prev,
        rootCauses: nextEntries,
        rootCause: nextEntries[0] ?? ''
      });
    });
  };

  const addTiming = () => {
    const value = newTiming.trim();
    if (!value) return;
    setDraft((prev) => syncDerivedFields({
      ...prev,
      targetRemediationTiming: value,
      remediationTimings: Array.from(new Set([...(prev.remediationTimings || []), value]))
    }));
    setNewTiming('');
  };

  const removeTiming = (value: string) => {
    setDraft((prev) => {
      const nextEntries = (prev.remediationTimings || []).filter((item) => item !== value);
      return syncDerivedFields({
        ...prev,
        remediationTimings: nextEntries,
        targetRemediationTiming: nextEntries[0] ?? ''
      });
    });
  };

  const addMetric = () => {
    if (!newMetric.indicator.trim()) return;
    setDraft((prev) => ({
      ...prev,
      metrics: [...(prev.metrics || []), { ...newMetric, indicator: newMetric.indicator.trim() }]
    }));
    setNewMetric({ indicator: '', baselineValue: '', targetValue: '', metricType: 'Leading' });
  };

  const removeMetric = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      metrics: (prev.metrics || []).filter((_, i) => i !== index)
    }));
  };

  const updateMetric = (index: number, field: keyof typeof newMetric, value: string) => {
    setDraft((prev) => ({
      ...prev,
      metrics: (prev.metrics || []).map((metric, i) => i === index ? { ...metric, [field]: value } : metric)
    }));
  };

  const renderAttributeEditor = () => {
    switch (selectedAttribute) {
      case 'Description':
        return (
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Description</label>
            <textarea
              rows={4}
              value={draft.problemDescription}
              onChange={(event) => setDraft((prev) => ({ ...prev, problemDescription: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
              placeholder="Describe the business problem in measurable terms"
            />
          </div>
        );
      case 'Stakeholders':
        return (
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Impacted Stakeholders</label>
            <div className="flex gap-2">
              <input
                value={newStakeholder}
                onChange={(event) => setNewStakeholder(event.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
                placeholder="Add stakeholder name"
                list="stakeholder-options"
              />
              <button
                type="button"
                onClick={() => addStakeholder(newStakeholder)}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
            <datalist id="stakeholder-options">
              {stakeholderOptions.map((stakeholder) => (
                <option key={stakeholder} value={stakeholder} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-2">
              {(draft.impactedStakeholders || []).map((stakeholder) => (
                <span key={stakeholder} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                  {stakeholder}
                  <button type="button" onClick={() => removeStakeholder(stakeholder)} className="text-slate-500 hover:text-red-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      case 'Causal Chain':
        return (
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Causal Chain to $ Impact</label>
            <textarea
              rows={4}
              value={draft.causalChainToDollarImpact}
              onChange={(event) => setDraft((prev) => ({ ...prev, causalChainToDollarImpact: event.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800"
              placeholder="Describe the chain from cause to revenue or cost impact"
            />
          </div>
        );
      case 'Root Cause':
        return (
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Root Causes</label>
            <div className="flex gap-2">
              <input
                value={newRootCause}
                onChange={(event) => setNewRootCause(event.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
                placeholder="Add root cause"
              />
              <button type="button" onClick={addRootCause} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                Add
              </button>
            </div>
            <div className="space-y-2">
              {((draft.rootCauses && draft.rootCauses.length > 0) ? draft.rootCauses : draft.rootCause ? [draft.rootCause] : []).map((item) => (
                <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700">{item}</span>
                  <button type="button" onClick={() => removeRootCause(item)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Remediation Timing':
        return (
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Target Remediation Timing</label>
            <div className="flex gap-2">
              <input
                value={newTiming}
                onChange={(event) => setNewTiming(event.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
                placeholder="e.g. Q2 2027 Sprint 4"
              />
              <button type="button" onClick={addTiming} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
                Add
              </button>
            </div>
            <div className="space-y-2">
              {((draft.remediationTimings && draft.remediationTimings.length > 0) ? draft.remediationTimings : draft.targetRemediationTiming ? [draft.targetRemediationTiming] : []).map((item) => (
                <div key={item} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-700">{item}</span>
                  <button type="button" onClick={() => removeTiming(item)} className="text-slate-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Metrics':
        return (
          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-600">Metrics</label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2">
                <select
                  value={newMetric.metricType}
                  onChange={(event) => setNewMetric((prev) => ({ ...prev, metricType: event.target.value as 'Leading' | 'Lagging' }))}
                  className="w-full px-2 py-2 border border-slate-300 rounded-xl text-[10px]"
                >
                  <option value="Leading">Leading</option>
                  <option value="Lagging">Lagging</option>
                </select>
              </div>
              <div className="col-span-3">
                <input value={newMetric.indicator} onChange={(event) => setNewMetric((prev) => ({ ...prev, indicator: event.target.value }))} className="w-full px-2 py-2 border border-slate-300 rounded-xl text-[10px]" placeholder="Metric" />
              </div>
              <div className="col-span-3">
                <input value={newMetric.baselineValue} onChange={(event) => setNewMetric((prev) => ({ ...prev, baselineValue: event.target.value }))} className="w-full px-2 py-2 border border-slate-300 rounded-xl text-[10px]" placeholder="Baseline" />
              </div>
              <div className="col-span-3">
                <input value={newMetric.targetValue} onChange={(event) => setNewMetric((prev) => ({ ...prev, targetValue: event.target.value }))} className="w-full px-2 py-2 border border-slate-300 rounded-xl text-[10px]" placeholder="Target" />
              </div>
              <div className="col-span-1 flex justify-end">
                <button type="button" onClick={addMetric} className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {(draft.metrics || []).map((metric, index) => (
                <div key={`${metric.indicator}-${index}`} className="grid grid-cols-12 gap-2 items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-2">
                  <div className="col-span-2">
                    <select value={metric.metricType} onChange={(event) => updateMetric(index, 'metricType', event.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]">
                      <option value="Leading">Leading</option>
                      <option value="Lagging">Lagging</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input value={metric.indicator} onChange={(event) => updateMetric(index, 'indicator', event.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]" />
                  </div>
                  <div className="col-span-3">
                    <input value={metric.baselineValue} onChange={(event) => updateMetric(index, 'baselineValue', event.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]" />
                  </div>
                  <div className="col-span-3">
                    <input value={metric.targetValue} onChange={(event) => updateMetric(index, 'targetValue', event.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-[10px]" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeMetric(index)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-600 font-bold">Business Problem Manager</p>
            <h3 className="text-lg font-bold text-slate-900">Define and structure the Business-Problem attributes</h3>
          </div>
          <button type="button" aria-label="Close Business Problem Manager" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4 p-5">
          <div className="col-span-4 border-r border-slate-200 pr-4">
            <div className="space-y-2">
              {ATTRIBUTE_OPTIONS.map((attribute) => (
                <button
                  key={attribute}
                  type="button"
                  onClick={() => setSelectedAttribute(attribute)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-xs font-semibold transition ${
                    selectedAttribute === attribute
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {attribute === 'Description' && <Target className="w-3.5 h-3.5" />}
                  {attribute === 'Stakeholders' && <Users className="w-3.5 h-3.5" />}
                  {attribute === 'Causal Chain' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {attribute === 'Root Cause' && <Building2 className="w-3.5 h-3.5" />}
                  {attribute === 'Remediation Timing' && <Clock3 className="w-3.5 h-3.5" />}
                  {attribute === 'Metrics' && <Gauge className="w-3.5 h-3.5" />}
                  <span>{attribute}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-8 space-y-4">
            {renderAttributeEditor()}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="font-bold uppercase tracking-wide text-slate-600 mb-2">Structured summary</p>
              <p><span className="font-semibold">Description:</span> {draft.problemDescription || 'Not defined'}</p>
              <p><span className="font-semibold">Stakeholders:</span> {(draft.impactedStakeholders || []).join(', ') || 'Not defined'}</p>
              <p><span className="font-semibold">Causal chain:</span> {draft.causalChainToDollarImpact || 'Not defined'}</p>
              <p><span className="font-semibold">Root cause(s):</span> {(draft.rootCauses && draft.rootCauses.length ? draft.rootCauses : draft.rootCause ? [draft.rootCause] : []).join(', ') || 'Not defined'}</p>
              <p><span className="font-semibold">Timing(s):</span> {(draft.remediationTimings && draft.remediationTimings.length ? draft.remediationTimings : draft.targetRemediationTiming ? [draft.targetRemediationTiming] : []).join(', ') || 'Not defined'}</p>
              <p><span className="font-semibold">Metrics:</span> {(draft.metrics || []).map((metric) => `${metric.indicator}: ${metric.baselineValue} → ${metric.targetValue}`).join(' | ') || 'Not defined'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const next = syncDerivedFields(draft);
              onSave(next);
              onClose();
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Save business problem
          </button>
        </div>
      </div>
    </div>
  );
};
