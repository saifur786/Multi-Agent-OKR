/**
 * Planview Anvi - Enterprise Governance, Policies & Market Data Configuration Modal
 * Configures and manages organizational market data, historical performance vectors,
 * OKR policies & rules, strategic themes, and HR org directory.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Database,
  Sliders,
  CheckCircle2,
  X,
  Plus,
  BookOpen,
  Scale,
  Sparkles,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  IndustryDataBundle,
  OrgDirectoryMember,
  OkrEnterprisePolicy
} from '../types/orchestration';
import { eventBus } from '../utils/eventBus';

interface EnterpriseGovernanceModalProps {
  industry: IndustryDataBundle;
  orgDirectory: OrgDirectoryMember[];
  onUpdateOrgDirectory: React.Dispatch<React.SetStateAction<OrgDirectoryMember[]>>;
  policies: OkrEnterprisePolicy[];
  onUpdatePolicies: React.Dispatch<React.SetStateAction<OkrEnterprisePolicy[]>>;
  onClose: () => void;
}

export const EnterpriseGovernanceModal: React.FC<EnterpriseGovernanceModalProps> = ({
  industry,
  orgDirectory,
  onUpdateOrgDirectory,
  policies,
  onUpdatePolicies,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'policies' | 'marketData' | 'orgChart' | 'themes'>('policies');
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Policy form state
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyCategory, setNewPolicyCategory] = useState<OkrEnterprisePolicy['category']>('SMART Threshold');
  const [newPolicyDesc, setNewPolicyDesc] = useState('');
  const [newPolicyMinScore, setNewPolicyMinScore] = useState(75);
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);

  // New Org Member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) return;

    const newPol: OkrEnterprisePolicy = {
      id: `pol-${Date.now()}`,
      ruleName: newPolicyName,
      category: newPolicyCategory,
      description: newPolicyDesc,
      minMeasurableScore: newPolicyMinScore,
      minAmbitionScore: 70,
      maxKrsPerObjective: 4,
      mandatoryMetadataFields: ['owner', 'budget', 'causalChainToDollarImpact'],
      governanceFrequency: 'Bi-Weekly',
      status: 'Enforced'
    };

    onUpdatePolicies([...policies, newPol]);
    setIsAddingPolicy(false);
    setNewPolicyName('');
    setNewPolicyDesc('');

    eventBus.publish({
      topic: 'GOVERNANCE_POLICY_VALIDATED',
      sourceAgent: 'Enterprise Policy Controller',
      targetAgent: 'Supervisor Agent',
      summary: `New OKR Policy Enforced: "${newPol.ruleName}" (Min Score: ${newPol.minMeasurableScore}%)`,
      payload: { policyId: newPol.id, ruleName: newPol.ruleName },
      latencyMs: 14,
      severity: 'info'
    });

    setFeedback(`Enforced enterprise policy: "${newPol.ruleName}". Supervisor Agent will validate subsequent OKRs.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMem: OrgDirectoryMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName,
      role: newMemberRole || 'Strategic Stream Lead',
      department: newMemberDept || 'Executive Technology',
      title: newMemberRole || 'Director',
      email: newMemberEmail || `${newMemberName.toLowerCase().replace(/\s+/g, '.')}@${industry.name.toLowerCase().replace(/\s+/g, '')}.com`,
      fteCapacity: 1.0
    };

    onUpdateOrgDirectory([...orgDirectory, newMem]);
    setIsAddingMember(false);
    setNewMemberName('');
    setNewMemberRole('');

    setFeedback(`Registered ${newMem.name} in organizational HR directory. Ownership verified.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Enterprise Governance, Policies &amp; Organizational Directory
              </h3>
              <p className="text-xs text-slate-500">
                {industry.name} ({industry.quarter}) • Planview Anvi Governance Suite
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'policies'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            OKR Policies &amp; Rules ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('orgChart')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orgChart'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            HR Org Directory ({orgDirectory.length})
          </button>
          <button
            onClick={() => setActiveTab('marketData')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'marketData'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Market Data &amp; Vectors (5 Pillars)
          </button>
          <button
            onClick={() => setActiveTab('themes')}
            className={`pb-2.5 px-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Strategic Themes ({industry.traceability[1]?.length || 2})
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: OKR POLICIES & RULES */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Enforced Enterprise OKR Policies</h4>
                  <p className="text-xs text-slate-500">Rules applied by the Supervisor Agent to confirm structural adequacy.</p>
                </div>
                <button
                  onClick={() => setIsAddingPolicy((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Rule</span>
                </button>
              </div>

              {isAddingPolicy && (
                <form onSubmit={handleCreatePolicy} className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-3 text-xs">
                  <h5 className="font-bold text-indigo-900">Configure New Enterprise OKR Policy</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Rule Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mandatory Leading Indicator Threshold"
                        value={newPolicyName}
                        onChange={(e) => setNewPolicyName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Category</label>
                      <select
                        value={newPolicyCategory}
                        onChange={(e) => setNewPolicyCategory(e.target.value as any)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="SMART Threshold">SMART Threshold</option>
                        <option value="Cadence">Cadence</option>
                        <option value="Ownership">Ownership</option>
                        <option value="Ambition">Ambition</option>
                        <option value="Checkpoints">Checkpoints</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Rule Description</label>
                    <textarea
                      rows={2}
                      placeholder="Specify enforcement logic..."
                      value={newPolicyDesc}
                      onChange={(e) => setNewPolicyDesc(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingPolicy(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-xs"
                    >
                      Enforce Policy
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {policies.map((p) => (
                  <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{p.ruleName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status} &bull; {p.governanceFrequency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{p.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Min Measurable: <strong>{p.minMeasurableScore}%</strong></span>
                      <span>&bull;</span>
                      <span>Max KRs/Obj: <strong>{p.maxKrsPerObjective}</strong></span>
                      <span>&bull;</span>
                      <span>Required Fields: <strong>{p.mandatoryMetadataFields.join(', ')}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: HR ORG DIRECTORY */}
          {activeTab === 'orgChart' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Individual Enterprise HR Directory</h4>
                  <p className="text-xs text-slate-500">Verified owners used by the Supervisor Agent to confirm OKR accountability.</p>
                </div>
                <button
                  onClick={() => setIsAddingMember((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              {isAddingMember && (
                <form onSubmit={handleCreateMember} className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-3 text-xs">
                  <h5 className="font-bold text-indigo-900">Add New Organizational Member</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Arthur Pendelton"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Title / Role</label>
                      <input
                        type="text"
                        placeholder="e.g. VP Network Architecture"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Optical Core Engineering"
                        value={newMemberDept}
                        onChange={(e) => setNewMemberDept(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Corporate Email</label>
                      <input
                        type="email"
                        placeholder="e.g. arthur.p@apextelecom.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingMember(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-xs"
                    >
                      Register Member
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {orgDirectory.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{m.name}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">&check; Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{m.role} &bull; {m.department}</p>
                    <p className="text-[10px] text-indigo-600 font-mono">{m.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MARKET DATA & 5 PILLARS */}
          {activeTab === 'marketData' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">5-Pillar Vector Knowledge Base &amp; Market Feeds</h4>
              <div className="space-y-3">
                {industry.knowledgeBase.map((kb) => (
                  <div key={kb.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{kb.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {kb.metric} ({kb.trend})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{kb.summary}</p>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <strong>Ingested Vectors:</strong> {kb.vectorChunks.map((v) => v.source).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STRATEGIC THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Corporate Strategy &amp; Growth Vision Themes (Layer 1)</h4>
              <div className="space-y-3">
                {(industry.traceability[1] || []).map((theme) => (
                  <div key={theme.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{theme.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        Budget: {theme.budget} &bull; Progress: {theme.progress}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Executive Sponsor: <strong>{theme.owner}</strong></p>
                    <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong>AI Strategic Recommendation:</strong> {theme.ai.recommend}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            Done &amp; Apply Governance
          </button>
        </div>
      </div>
    </div>
  );
};
