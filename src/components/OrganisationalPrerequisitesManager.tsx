import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Edit3,
  FolderGit2,
  Layers,
  PauseCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X
} from 'lucide-react';
import type {
  OrganisationalPrerequisiteItem,
  PrerequisiteCategoryKey
} from '../types/orchestration';
import {
  AVAILABLE_PREREQUISITE_AI_AGENTS,
  CANONICAL_PREREQUISITE_SPECS,
  PREREQUISITE_CATEGORIES,
  PREREQUISITE_CATEGORY_LABEL_MAP,
  buildDefaultOrganisationalPrerequisites,
  computePrerequisitesCoverageStats,
  searchOrganisationalPrerequisites
} from '../utils/orgPrerequisites';

interface OrganisationalPrerequisitesManagerProps {
  industryName: string;
  prerequisites: OrganisationalPrerequisiteItem[];
  canManage: boolean;
  persistenceSource: 'mongodb' | 'memory' | null;
  onUpdatePrerequisites: (
    updated: OrganisationalPrerequisiteItem[],
    actionSummary?: string
  ) => void | Promise<void>;
  onSyncFromWorkspace: () => void | Promise<void>;
}

const SOURCE_SYSTEM_PRESETS = [
  'Planview Portfolios',
  'Jira Cloud',
  'Microsoft Planner',
  'Planview Portfolios, Jira Cloud & Microsoft Planner (Custom Ready)',
  'ServiceNow GRC & Risk Ledger',
  'Custom Enterprise Repository'
];

export const OrganisationalPrerequisitesManager: React.FC<
  OrganisationalPrerequisitesManagerProps
> = ({
  industryName,
  prerequisites,
  canManage,
  persistenceSource,
  onUpdatePrerequisites,
  onSyncFromWorkspace
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PrerequisiteCategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit draft state
  const [editLabel, setEditLabel] = useState('');
  const [editSourceSystem, setEditSourceSystem] = useState('');
  const [editOwner, setEditOwner] = useState('');
  const [editSyncStatus, setEditSyncStatus] = useState<'Synced' | 'Configured' | 'Pending Review'>('Synced');
  const [editContent, setEditContent] = useState('');
  const [editTargetAgents, setEditTargetAgents] = useState<string[]>([]);
  const [editTagsText, setEditTagsText] = useState('');

  // Add custom pre-requisite draft state
  const [newCategoryKey, setNewCategoryKey] = useState<PrerequisiteCategoryKey>('knowledge_sources');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSourceSystem, setNewSourceSystem] = useState('Planview Portfolios & Custom Connector');
  const [newOwner, setNewOwner] = useState(`${industryName} Governance Lead`);
  const [newContent, setNewContent] = useState('');
  const [newTargetAgents, setNewTargetAgents] = useState<string[]>([
    'Supervisor Agent',
    'Strategy Explorer',
    'Risk Sentinel'
  ]);
  const [newTagsText, setNewTagsText] = useState(industryName);

  const coverageStats = useMemo(
    () => computePrerequisitesCoverageStats(prerequisites),
    [prerequisites]
  );

  const filteredItems = useMemo(
    () => searchOrganisationalPrerequisites(prerequisites, searchQuery, selectedCategory),
    [prerequisites, searchQuery, selectedCategory]
  );

  const visibleCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return PREREQUISITE_CATEGORIES;
    }
    return PREREQUISITE_CATEGORIES.filter((cat) => cat.key === selectedCategory);
  }, [selectedCategory]);

  const showNotice = (message: string) => {
    setStatusFeedback(message);
    setTimeout(() => {
      setStatusFeedback((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  const commitChange = async (
    nextItems: OrganisationalPrerequisiteItem[],
    summary: string
  ) => {
    setIsSaving(true);
    try {
      await onUpdatePrerequisites(nextItems, summary);
      showNotice(summary);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (item: OrganisationalPrerequisiteItem) => {
    if (!canManage) return;
    const nextEnabled = !item.enabledForAgents;
    const nextItems = prerequisites.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            enabledForAgents: nextEnabled,
            updatedAt: new Date().toISOString()
          }
        : entry
    );
    await commitChange(
      nextItems,
      `${nextEnabled ? 'Enabled' : 'Paused'} AI-Agent feed for "${item.label}".`
    );
  };

  const openEditor = (item: OrganisationalPrerequisiteItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditSourceSystem(item.sourceSystem);
    setEditOwner(item.owner);
    setEditSyncStatus(item.syncStatus);
    setEditContent(item.content);
    setEditTargetAgents(item.targetAgents);
    setEditTagsText(item.tags.join(', '));
  };

  const handleSaveEdit = async (item: OrganisationalPrerequisiteItem) => {
    if (!canManage) return;
    const parsedTags = editTagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);

    const nextItems = prerequisites.map((entry) =>
      entry.id === item.id
        ? {
            ...entry,
            label: item.isCanonical ? item.label : editLabel.trim() || item.label,
            sourceSystem: editSourceSystem.trim() || entry.sourceSystem,
            owner: editOwner.trim() || entry.owner,
            syncStatus: editSyncStatus,
            content: editContent.trim() || entry.content,
            targetAgents: editTargetAgents.length > 0 ? editTargetAgents : ['Supervisor Agent'],
            tags: parsedTags,
            updatedAt: new Date().toISOString()
          }
        : entry
    );
    setEditingId(null);
    await commitChange(nextItems, `Updated configuration for "${item.label}".`);
  };

  const handleResetCanonical = async (item: OrganisationalPrerequisiteItem) => {
    if (!canManage || !item.isCanonical) return;
    const freshDefaults = buildDefaultOrganisationalPrerequisites({ name: industryName });
    const spec = CANONICAL_PREREQUISITE_SPECS.find((s) => s.id === item.id);
    const defaultMatch = freshDefaults.find((d) => d.id === item.id);
    if (!spec || !defaultMatch) return;

    const nextItems = prerequisites.map((entry) =>
      entry.id === item.id
        ? {
            ...defaultMatch,
            updatedAt: new Date().toISOString()
          }
        : entry
    );
    setEditingId(null);
    await commitChange(nextItems, `Reset "${spec.label}" to baseline governance configuration.`);
  };

  const handleDeleteCustom = async (item: OrganisationalPrerequisiteItem) => {
    if (!canManage || item.isCanonical) return;
    const nextItems = prerequisites.filter((entry) => entry.id !== item.id);
    setEditingId(null);
    await commitChange(nextItems, `Removed custom pre-requisite "${item.label}".`);
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !newLabel.trim()) return;

    const customItem: OrganisationalPrerequisiteItem = {
      id: `custom-${Date.now()}`,
      categoryKey: newCategoryKey,
      categoryLabel: PREREQUISITE_CATEGORY_LABEL_MAP[newCategoryKey],
      label: newLabel.trim(),
      description:
        newDescription.trim() ||
        `Custom ${PREREQUISITE_CATEGORY_LABEL_MAP[newCategoryKey]} knowledge input configured for ${industryName}.`,
      content:
        newContent.trim() ||
        `Custom organisational knowledge rule "${newLabel.trim()}" connected via ${newSourceSystem.trim() || 'Custom Repository'}.`,
      sourceSystem: newSourceSystem.trim() || 'Custom Enterprise Source',
      owner: newOwner.trim() || `${industryName} Governance Lead`,
      targetAgents: newTargetAgents.length > 0 ? newTargetAgents : ['Supervisor Agent'],
      enabledForAgents: true,
      syncStatus: 'Configured',
      isCanonical: false,
      tags: newTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
      updatedAt: new Date().toISOString()
    };

    const nextItems = [...prerequisites, customItem];
    setIsAddFormOpen(false);
    setNewLabel('');
    setNewDescription('');
    setNewContent('');
    await commitChange(
      nextItems,
      `Added "${customItem.label}" under ${customItem.categoryLabel}.`
    );
  };

  const handleToggleAgentSelection = (
    agentName: string,
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selected.includes(agentName)) {
      setter(selected.filter((a) => a !== agentName));
    } else {
      setter([...selected, agentName]);
    }
  };

  return (
    <section
      data-testid="org-prerequisites-manager"
      aria-label="Organisational and Industry Pre-Requisites Knowledge Base"
      className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5"
    >
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <h2 className="text-lg font-bold text-slate-900">
              Organisational &amp; Industry Pre-Requisites Knowledge Base
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {industryName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Configure the 4 authoritative pre-requisite domains feeding Planview Anvi AI Agents across Strategy &amp; Governance, Business Context, Execution Data, and Knowledge Sources.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600 tabular-nums">
            <span className="font-semibold text-indigo-700">
              {coverageStats.enabledCount}/{coverageStats.totalCount} Feeding AI Agents
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>4 Governance Domains</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              {persistenceSource === 'mongodb' ? 'Persisted in MongoDB' : 'Persisted in Session Store'}
            </span>
            {!canManage && (
              <>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span className="font-semibold text-amber-700">Read-Only Role</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="sync-prerequisites-workspace-btn"
            disabled={!canManage || isSaving}
            onClick={async () => {
              setIsSaving(true);
              try {
                await onSyncFromWorkspace();
                showNotice(`Synchronized pre-requisite baseline from live ${industryName} workspace data.`);
              } finally {
                setIsSaving(false);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>Sync from Workspace</span>
          </button>

          <button
            type="button"
            data-testid="open-add-prerequisite-btn"
            disabled={!canManage}
            onClick={() => setIsAddFormOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pre-Requisite</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          data-testid="prerequisites-feedback-banner"
          className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {statusFeedback}
          </span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add Custom Pre-Requisite Inline Panel */}
      {isAddFormOpen && canManage && (
        <form
          onSubmit={handleCreateCustom}
          data-testid="add-prerequisite-form"
          className="rounded-xl border border-indigo-200 bg-slate-50 p-4 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Add Organisational / Industry Pre-Requisite
            </h3>
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Close add form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pre-Requisite Domain *
              </label>
              <select
                data-testid="new-prereq-category-select"
                value={newCategoryKey}
                onChange={(e) => setNewCategoryKey(e.target.value as PrerequisiteCategoryKey)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              >
                {PREREQUISITE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pre-Requisite Label *
              </label>
              <input
                type="text"
                required
                data-testid="new-prereq-label-input"
                placeholder="e.g. Regional Carbon Compliance Mandate"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Source System / Repository
              </label>
              <input
                type="text"
                data-testid="new-prereq-source-input"
                placeholder="e.g. Planview Portfolios, Jira Cloud, Microsoft Planner"
                value={newSourceSystem}
                onChange={(e) => setNewSourceSystem(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['Planview Portfolios', 'Jira Cloud', 'Microsoft Planner'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewSourceSystem(preset)}
                    className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-indigo-50 text-[11px] font-medium text-slate-600 hover:text-indigo-700 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Accountable Owner
              </label>
              <input
                type="text"
                data-testid="new-prereq-owner-input"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Knowledge Context &amp; AI-Agent Guidance *
            </label>
            <textarea
              rows={2}
              required
              data-testid="new-prereq-content-input"
              placeholder="Specify policy constraints, quantitative thresholds, portfolio rules, or market signals..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Short Description
              </label>
              <input
                type="text"
                placeholder="Optional concise summary"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={newTagsText}
                onChange={(e) => setNewTagsText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
              />
            </div>
          </div>

          <div>
            <span className="block font-semibold text-slate-700 mb-1.5">
              Target AI Agents Receiving This Context
            </span>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PREREQUISITE_AI_AGENTS.map((agentName) => {
                const checked = newTargetAgents.includes(agentName);
                return (
                  <label
                    key={agentName}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      checked
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        handleToggleAgentSelection(agentName, newTargetAgents, setNewTargetAgents)
                      }
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>{agentName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddFormOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-new-prerequisite-btn"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Pre-Requisite</span>
            </button>
          </div>
        </form>
      )}

      {/* Domain Filter Tabs & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter pre-requisites by governance domain"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            data-testid="prereq-filter-all"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Domains ({coverageStats.enabledCount}/{coverageStats.totalCount})
          </button>

          {PREREQUISITE_CATEGORIES.map((cat) => {
            const catStats = coverageStats.byCategory[cat.key];
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`prereq-filter-${cat.key}`}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label} ({catStats.enabled}/{catStats.total})
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="prerequisites-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by label, Planview, Jira, Planner, or agent..."
            className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Domains List */}
      <div className="space-y-5">
        {visibleCategories.map((category) => {
          const categoryItems = filteredItems.filter((item) => item.categoryKey === category.key);
          const catStats = coverageStats.byCategory[category.key];

          return (
            <div
              key={category.key}
              data-testid={`prereq-domain-${category.key}`}
              className="rounded-2xl border border-slate-200 bg-slate-50/40 overflow-hidden"
            >
              {/* Domain Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900">{category.label}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums">
                  <span className="hidden md:inline">{category.subtitle}</span>
                  <span className="font-semibold text-indigo-700 whitespace-nowrap">
                    {catStats.enabled} / {catStats.total} Active
                  </span>
                </div>
              </div>

              {/* Items */}
              {categoryItems.length === 0 ? (
                <div className="p-4 text-xs text-slate-500">
                  No pre-requisites in <strong>{category.label}</strong> match your search filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 bg-white">
                  {categoryItems.map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <div
                        key={item.id}
                        data-testid={`prereq-item-${item.id}`}
                        className={`p-4 transition-colors ${
                          item.enabledForAgents ? 'bg-white' : 'bg-slate-50/70 opacity-80'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">
                                {item.label}
                              </span>
                              {!item.isCanonical && (
                                <span className="text-[11px] font-semibold text-indigo-700">
                                  Custom
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500">{item.description}</p>
                            <p className="text-xs text-slate-800 leading-relaxed">{item.content}</p>

                            {/* Unboxed Metadata Line */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[11px] text-slate-600">
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                                Source: {item.sourceSystem}
                              </span>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span>Owner: {item.owner}</span>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span
                                className={
                                  item.syncStatus === 'Synced'
                                    ? 'font-semibold text-emerald-700'
                                    : item.syncStatus === 'Configured'
                                      ? 'font-semibold text-indigo-700'
                                      : 'font-semibold text-amber-700'
                                }
                              >
                                {item.syncStatus}
                              </span>
                              <span className="text-slate-300" aria-hidden="true">·</span>
                              <span>Agents: {item.targetAgents.join(', ')}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={!canManage || isSaving}
                              data-testid={`toggle-prereq-${item.id}`}
                              onClick={() => void handleToggleEnabled(item)}
                              aria-label={`${item.enabledForAgents ? 'Pause' : 'Enable'} AI-Agent feed for ${item.label}`}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                                item.enabledForAgents
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {item.enabledForAgents ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Feeding AI Agents</span>
                                </>
                              ) : (
                                <>
                                  <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Paused</span>
                                </>
                              )}
                            </button>

                            {canManage && (
                              <button
                                type="button"
                                data-testid={`edit-prereq-${item.id}`}
                                onClick={() => (isEditing ? setEditingId(null) : openEditor(item))}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{isEditing ? 'Close' : 'Configure'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Inline Configurator */}
                        {isEditing && canManage && (
                          <div
                            data-testid={`editor-prereq-${item.id}`}
                            className="mt-4 pt-4 border-t border-slate-200 space-y-3 text-xs bg-slate-50/80 rounded-xl p-3.5"
                          >
                            {!item.isCanonical && (
                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                  Custom Pre-Requisite Label
                                </label>
                                <input
                                  type="text"
                                  value={editLabel}
                                  onChange={(e) => setEditLabel(e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-1">
                                <label className="block font-semibold text-slate-700 mb-1">
                                  Source System / Repository
                                </label>
                                <input
                                  type="text"
                                  data-testid={`prereq-source-input-${item.id}`}
                                  value={editSourceSystem}
                                  onChange={(e) => setEditSourceSystem(e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                  Accountable Owner
                                </label>
                                <input
                                  type="text"
                                  data-testid={`prereq-owner-input-${item.id}`}
                                  value={editOwner}
                                  onChange={(e) => setEditOwner(e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                                />
                              </div>

                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                  Sync Status
                                </label>
                                <select
                                  data-testid={`prereq-status-select-${item.id}`}
                                  value={editSyncStatus}
                                  onChange={(e) =>
                                    setEditSyncStatus(
                                      e.target.value as 'Synced' | 'Configured' | 'Pending Review'
                                    )
                                  }
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                                >
                                  <option value="Synced">Synced</option>
                                  <option value="Configured">Configured</option>
                                  <option value="Pending Review">Pending Review</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-medium text-slate-500">
                                Quick Source Presets:
                              </span>
                              {SOURCE_SYSTEM_PRESETS.map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setEditSourceSystem(preset)}
                                  className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-indigo-50 text-[11px] font-medium text-slate-600 hover:text-indigo-700 cursor-pointer"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Configured Knowledge Base Context for AI Agents
                              </label>
                              <textarea
                                rows={3}
                                data-testid={`prereq-content-input-${item.id}`}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <span className="block font-semibold text-slate-700 mb-1">
                                  Target AI Agents
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {AVAILABLE_PREREQUISITE_AI_AGENTS.map((agentName) => {
                                    const checked = editTargetAgents.includes(agentName);
                                    return (
                                      <label
                                        key={agentName}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium cursor-pointer ${
                                          checked
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                                            : 'border-slate-200 bg-white text-slate-600'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() =>
                                            handleToggleAgentSelection(
                                              agentName,
                                              editTargetAgents,
                                              setEditTargetAgents
                                            )
                                          }
                                          className="rounded border-slate-300 text-indigo-600"
                                        />
                                        <span>{agentName}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                  Tags (comma-separated)
                                </label>
                                <input
                                  type="text"
                                  value={editTagsText}
                                  onChange={(e) => setEditTagsText(e.target.value)}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <div>
                                {item.isCanonical ? (
                                  <button
                                    type="button"
                                    data-testid={`reset-prereq-${item.id}`}
                                    onClick={() => void handleResetCanonical(item)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-medium cursor-pointer"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Default</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    data-testid={`delete-prereq-${item.id}`}
                                    onClick={() => void handleDeleteCustom(item)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Custom Entry</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  data-testid={`save-prereq-${item.id}`}
                                  disabled={isSaving}
                                  onClick={() => void handleSaveEdit(item)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  <span>Save Configuration</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
