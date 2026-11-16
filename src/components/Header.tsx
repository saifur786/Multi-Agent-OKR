import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Building2,
  Briefcase,
  ShoppingBag,
  Zap,
  Target,
  DollarSign,
  Activity,
  Layers,
  Database,
  Radio,
  RotateCcw,
  Plus,
  Users,
  LineChart,
  Flame,
  TrendingUp,
  Sliders,
  ShieldCheck,
  AlertOctagon,
  GripVertical,
  HelpCircle,
  Compass,
  X,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  AlertTriangle,
  Info,
  Bot,
  LogIn,
  LogOut,
  Send
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { IndustryDataBundle, IndustryKey } from '../types/orchestration';
import { StatusBadge } from './StatusBadge';
import {
  ActiveNavView,
  DEFAULT_NAV_ORDER,
  UserPreferences,
  areNavOrdersEqual,
  normalizeNavOrder,
  reorderSecondaryNavButtons,
  shiftSecondaryNavButton
} from '../utils/navOrder';
import {
  NotificationCategory,
  NotificationScope,
  PortfolioNotification,
  countUnreadNotifications,
  filterPortfolioNotifications,
  groupNotificationsByIndustryAndOrg
} from '../utils/headerNotifications';
import type { SelectableAccountProfile } from '../utils/agenticCommunication';

export type { ActiveNavView };

interface HeaderProps {
  industry: IndustryDataBundle;
  industriesList: string[];
  selectedIndustry: IndustryKey;
  onSelectIndustry: (ind: IndustryKey) => void;
  activeView: ActiveNavView;
  onSelectView: (view: ActiveNavView) => void;
  userPreferences: UserPreferences;
  onUpdateNavButtonOrder: (nextOrder: ActiveNavView[]) => void;
  eventCount: number;
  isEventBusOpen: boolean;
  onToggleEventBus: () => void;
  onOpenAddCustomIndustry: () => void;
  onOpenGovernance?: () => void;
  activeDisasterCount?: number;
  notifications: PortfolioNotification[];
  readNotificationIds: string[];
  dismissedNotificationIds: string[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onDismissNotification: (id: string) => void;
  onOpenNotification: (notification: PortfolioNotification) => void;
  onOpenGeminiChat?: () => void;
  onOpenAgenticValidator?: () => void;
  demoUsers?: SelectableAccountProfile[];
  currentDemoUser?: SelectableAccountProfile;
  onSelectDemoUser?: (user: SelectableAccountProfile) => void;
  workerAgentStatuses?: Array<{ id: string; name: string; status: 'active' | 'idle' | 'error' | string; label: string; reason?: string; action?: string }>;
  onSelectWorkerAgent?: (agent: { id: string; name: string; status: 'active' | 'idle' | 'error' | string; label: string; reason?: string; action?: string }) => void;
  canCreateOkr?: boolean;
  canMonitor?: boolean;
  canEscalateNotification?: boolean;
  canManagePolicy?: boolean;
  canManageDashboards?: boolean;
  activeUserRoleSummary?: string;
  assignedIndustry?: string;
  onSendEscalation?: (payload: {
    targetRole: string;
    targetOwner?: string;
    severity: 'critical' | 'high' | 'warning';
    title: string;
    summary: string;
  }) => Promise<void>;
}

const DEFAULT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Banking: Building2,
  'IT Consulting': Briefcase,
  Retail: ShoppingBag,
  'Power Suppliers': Zap,
  Telco: Radio
};

interface NavButtonMeta {
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
  shortHint: string;
  helpSummary: string;
}

const NAV_BUTTON_META: Record<ActiveNavView, NavButtonMeta> = {
  studio: {
    label: 'OKR & Program Studio',
    ariaLabel: 'Switch to OKR & Program Management Studio',
    icon: <Sliders className="w-3.5 h-3.5" />,
    shortHint: 'Primary studio for HITL prioritisation, OKR Health Checker & programs',
    helpSummary: 'Author OKRs, scan all 6 Business Problem dimensions with OKRHealthChecker, manage programs, and run disaster simulations.'
  },
  lifecycle: {
    label: '6-Stage Multi-Agent Lifecycle',
    ariaLabel: 'Switch to 6-Stage Multi-Agent Lifecycle View',
    icon: <Activity className="w-3.5 h-3.5" />,
    shortHint: 'End-to-end 6-stage supervisor-worker orchestration pipeline',
    helpSummary: 'Step through Strategy Explorer, OKR Quality, Alignment, Risk Radar, Reporting, and Retrospective agents.'
  },
  traceability: {
    label: '7-Layer Traceability',
    ariaLabel: 'Switch to 7-Layer Planview Traceability Explorer',
    icon: <Layers className="w-3.5 h-3.5" />,
    shortHint: 'Strategic Themes to Value Outcomes dependency lineage',
    helpSummary: 'Inspect parent-child linkage across all 7 Planview layers and remediate unlinked orphan epics.'
  },
  advisory: {
    label: 'Advisory Committee Outcomes',
    ariaLabel: 'Switch to Advisory Committee Multi-Agent Outcomes',
    icon: <Users className="w-3.5 h-3.5" />,
    shortHint: 'Multi-agent consensus scoring & polynomial attainment verdicts',
    helpSummary: 'Review committee verdicts across Quality, Novelty, SMART rigor, and regression attainment probability.'
  },
  performance: {
    label: 'Accuracy Analytics (R² & CI)',
    ariaLabel: 'Switch to Advisory Performance & Accuracy Analytics',
    icon: <LineChart className="w-3.5 h-3.5" />,
    shortHint: 'Historical R² model calibration & confidence intervals',
    helpSummary: 'Audit multi-cycle R² fit, mean absolute error, and confidence interval convergence over time.'
  },
  trajectory: {
    label: 'Target vs. Predicted Trajectory',
    ariaLabel: 'Switch to Target vs. Predicted Trajectory View',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    shortHint: 'Quarterly attainment forecast with HITL & disaster curves',
    helpSummary: 'Compare baseline targets against AI polynomial predictions, human overrides, and shock impacts.'
  },
  heatmap: {
    label: 'Utilisation Heatmap',
    ariaLabel: 'Switch to 7-Layer Resource Utilisation Heatmap',
    icon: <Flame className="w-3.5 h-3.5" />,
    shortHint: 'Squad capacity load & bottleneck rebalancing matrix',
    helpSummary: 'Pinpoint over-allocated teams (>100% load) across layers and simulate capacity rebalancing.'
  },
  strategy: {
    label: 'Strategic Portfolio Planner',
    ariaLabel: 'Switch to Strategic Portfolio Planner',
    icon: <Target className="w-3.5 h-3.5" />,
    shortHint: 'Portfolio theme funding & strategic trade-off planner',
    helpSummary: 'Model strategic theme allocations, compare ROI envelopes, and align capital with growth mandates.'
  },
  knowledge: {
    label: 'AI Knowledge Base (5 Pillars)',
    ariaLabel: 'Switch to AI Knowledge Base 5 Pillars',
    icon: <Database className="w-3.5 h-3.5" />,
    shortHint: '5-pillar organizational memory & vector telemetry feeds',
    helpSummary: 'Toggle historical performance, market benchmarks, VoC, project runner, and resource feeds for agents.'
  }
};

export const Header: React.FC<HeaderProps> = ({
  industry,
  industriesList,
  selectedIndustry,
  onSelectIndustry,
  activeView,
  onSelectView,
  userPreferences,
  onUpdateNavButtonOrder,
  eventCount,
  isEventBusOpen,
  onToggleEventBus,
  onOpenAddCustomIndustry,
  onOpenGovernance,
  activeDisasterCount = 0,
  notifications,
  readNotificationIds,
  dismissedNotificationIds,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDismissNotification,
  onOpenNotification,
  onOpenGeminiChat,
  onOpenAgenticValidator,
  demoUsers = [],
  currentDemoUser,
  onSelectDemoUser,
  workerAgentStatuses = [],
  onSelectWorkerAgent,
  canCreateOkr = true,
  canMonitor = true,
  canEscalateNotification = false,
  canManagePolicy = true,
  canManageDashboards = true,
  activeUserRoleSummary,
  assignedIndustry,
  onSendEscalation
}) => {
  const { user, authReady, isSigningIn, authError, signInWithGoogle, signOutUser } = useFirebase();
  const navOrder = normalizeNavOrder(userPreferences.navButtonOrder);
  const [draggedView, setDraggedView] = useState<ActiveNavView | null>(null);
  const [dragOverView, setDragOverView] = useState<ActiveNavView | null>(null);
  const [isNavHelpOpen, setIsNavHelpOpen] = useState<boolean>(false);
  const [isCompactWorkspaceView, setIsCompactWorkspaceView] = useState<boolean>(false);

  // Notification Center & Escalation Composer state
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [notifScope, setNotifScope] = useState<NotificationScope>('all');
  const [notifCategory, setNotifCategory] = useState<'all' | NotificationCategory>('all');
  const [notifIndustryFilter, setNotifIndustryFilter] = useState<string>('ALL');
  const [isEscalationOpen, setIsEscalationOpen] = useState<boolean>(false);
  const [escalationTargetRole, setEscalationTargetRole] = useState<string>('okr-creator');
  const [escalationTargetOwner, setEscalationTargetOwner] = useState<string>('');
  const [escalationSeverity, setEscalationSeverity] = useState<'critical' | 'high' | 'warning'>('high');
  const [escalationTitle, setEscalationTitle] = useState<string>('');
  const [escalationSummary, setEscalationSummary] = useState<string>('');
  const [isSendingEscalation, setIsSendingEscalation] = useState<boolean>(false);

  const notificationContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1024px)');
    const syncWorkspaceViewMode = () => setIsCompactWorkspaceView(mediaQuery.matches);
    syncWorkspaceViewMode();
    mediaQuery.addEventListener('change', syncWorkspaceViewMode);
    return () => mediaQuery.removeEventListener('change', syncWorkspaceViewMode);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isNotificationCenterOpen &&
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(target)
      ) {
        setIsNotificationCenterOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationCenterOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotificationCenterOpen]);

  const readSet = useMemo(() => new Set(readNotificationIds), [readNotificationIds]);
  const dismissedSet = useMemo(() => new Set(dismissedNotificationIds), [dismissedNotificationIds]);

  const visibleAllNotifications = useMemo(
    () => notifications.filter((item) => !dismissedSet.has(item.id)),
    [notifications, dismissedSet]
  );

  const unreadCount = useMemo(
    () => countUnreadNotifications(notifications, readSet, dismissedSet),
    [notifications, readSet, dismissedSet]
  );

  const criticalOkrTotal = useMemo(
    () => visibleAllNotifications.filter((n) => n.category === 'critical_okr').length,
    [visibleAllNotifications]
  );

  const disasterTotal = useMemo(
    () => visibleAllNotifications.filter((n) => n.category === 'disaster_event').length,
    [visibleAllNotifications]
  );

  const escalationTotal = useMemo(
    () => visibleAllNotifications.filter((n) => n.category === 'escalation').length,
    [visibleAllNotifications]
  );

  const ownerAlertTotal = useMemo(
    () => visibleAllNotifications.filter((n) => n.category === 'retrospective_owner_alert').length,
    [visibleAllNotifications]
  );

  const filteredNotifications = useMemo(
    () =>
      filterPortfolioNotifications(
        notifications,
        {
          scope: notifScope,
          activeIndustryKey: selectedIndustry,
          category: notifCategory,
          industryFilter: notifScope === 'current' ? selectedIndustry : notifIndustryFilter
        },
        dismissedSet
      ),
    [notifications, notifScope, selectedIndustry, notifCategory, notifIndustryFilter, dismissedSet]
  );

  const groupedNotifications = useMemo(
    () => groupNotificationsByIndustryAndOrg(filteredNotifications, selectedIndustry),
    [filteredNotifications, selectedIndustry]
  );

  const notificationIndustries = useMemo(() => {
    const keys = new Set<string>(industriesList);
    visibleAllNotifications.forEach((n) => keys.add(n.industryKey));
    return Array.from(keys);
  }, [industriesList, visibleAllNotifications]);

  const isCustomNavOrder = !areNavOrdersEqual(navOrder, DEFAULT_NAV_ORDER);
  const activeMeta = NAV_BUTTON_META[activeView];

  const commitNavOrder = (nextOrder: ActiveNavView[]) => {
    onUpdateNavButtonOrder(normalizeNavOrder(nextOrder));
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Row 1: Brand & Operational Controls (Policies, Notifications, Event Bus, Orchestrate Pipeline) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-50 shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
                  Planview Anvi
                </h1>
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                  Multi-Agent Orchestrator
                </span>
                {industry.isCustom && (
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                    Custom Domain
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5">
                <span className="font-semibold text-slate-700">{industry.name}</span>
                <span aria-hidden="true">•</span>
                <span>{industry.sector}</span>
                <span aria-hidden="true">•</span>
                <span className="font-medium text-indigo-600 tabular-nums">{industry.quarter}</span>
              </p>
            </div>
          </div>

          {/* Right Operational Controls Cluster */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-1.5 min-w-0">
            {onOpenAgenticValidator && (
              <button
                type="button"
                data-testid="open-agentic-validator-btn"
                onClick={onOpenAgenticValidator}
                aria-label="Validate Google Agentic AI & MongoDB Communication"
                title="Probe all 8 Google Agentic AI channels & MongoDB knowledge store"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>AI Agents</span>
              </button>
            )}

            {onOpenGeminiChat && (
              <button
                type="button"
                data-testid="open-gemini-copilot-btn"
                onClick={onOpenGeminiChat}
                aria-label="Open Gemini Strategy & OKR Copilot"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>AI Copilot</span>
              </button>
            )}

            {demoUsers.length > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 whitespace-nowrap shrink-0"
                title={activeUserRoleSummary || currentDemoUser?.accountabilities || 'Select application role'}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">User</span>
                <select
                  aria-label="Select demo application role"
                  data-testid="user-role-switcher"
                  value={currentDemoUser?.id || demoUsers[0].id}
                  onChange={(event) => {
                    const nextUser = demoUsers.find((u) => u.id === event.target.value) || demoUsers[0];
                    onSelectDemoUser?.(nextUser);
                  }}
                  className="max-w-[145px] bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  {demoUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label} ({u.industry || 'All'}) · {u.email}
                    </option>
                  ))}
                </select>
                {assignedIndustry && (
                  <span className="hidden xl:inline-flex px-1.5 py-0.5 rounded bg-indigo-100/80 text-indigo-800 text-[9px] font-bold">
                    {assignedIndustry}
                  </span>
                )}
              </div>
            )}

            {onOpenGovernance && (
              <button
                type="button"
                onClick={canManagePolicy ? onOpenGovernance : undefined}
                disabled={!canManagePolicy}
                aria-label="Configure Enterprise Governance, Policies & Org Data"
                title={canManagePolicy ? 'Manage policies, rules & org directory' : 'Requires Policy Manager or Super Admin role'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Policies &amp; Org</span>
              </button>
            )}

            {activeDisasterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsNotificationCenterOpen(true);
                  setNotifCategory('disaster_event');
                }}
                aria-label="View Active Crisis & Disasters"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 transition-all cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>Crisis ({activeDisasterCount})</span>
              </button>
            )}

            {/* Header Notification Center */}
            <div className="relative" ref={notificationContainerRef}>
              <button
                type="button"
                data-testid="notification-center-trigger"
                onClick={() => {
                  setIsNotificationCenterOpen((prev) => !prev);
                }}
                aria-label="Open Notification Center"
                aria-expanded={isNotificationCenterOpen}
                aria-controls="header-notification-center-panel"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isNotificationCenterOpen
                    ? 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-400/50'
                    : unreadCount > 0
                    ? 'bg-white text-slate-800 border-red-200 hover:bg-red-50/50'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bell
                  className={`w-3.5 h-3.5 shrink-0 ${
                    unreadCount > 0 || disasterTotal > 0 ? 'text-red-600' : 'text-slate-500'
                  }`}
                />
                <span>Alerts</span>
                <span
                  data-testid="notification-unread-badge"
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums leading-none ${
                    unreadCount > 0
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {unreadCount}
                </span>
              </button>

              {isNotificationCenterOpen && (
                <div
                  id="header-notification-center-panel"
                  role="region"
                  aria-label="Portfolio Notification Center"
                  className="absolute right-0 mt-2 w-[440px] max-w-[calc(100vw-2rem)] max-h-[78vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden"
                >
                  {/* Panel Header */}
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-red-600 shrink-0" />
                        <h2 className="text-xs font-bold text-slate-900">
                          Notification Center
                        </h2>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 tabular-nums">
                          {unreadCount} unread
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                        {criticalOkrTotal} critical OKR alert{criticalOkrTotal === 1 ? '' : 's'} · {disasterTotal} active disaster{disasterTotal === 1 ? '' : 's'} across industries
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={onMarkAllNotificationsRead}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer whitespace-nowrap"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Mark all read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotificationCenterOpen(false)}
                        aria-label="Close Notification Center"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Purpose & Alert Criteria Hint */}
                  <div className="px-4 py-2 bg-indigo-50/60 border-b border-slate-200 text-[11px] text-slate-600 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>
                        Alerts trigger by <strong className="text-slate-800">Industry &amp; Role</strong> on critical OKRs, disasters, Retrospective owner alerts &amp; Monitor escalations.
                      </span>
                    </div>
                    {canEscalateNotification && onSendEscalation && (
                      <button
                        type="button"
                        data-testid="toggle-escalation-composer-btn"
                        onClick={() => setIsEscalationOpen((prev) => !prev)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isEscalationOpen ? 'Hide' : 'Escalate'}</span>
                      </button>
                    )}
                  </div>

                  {isEscalationOpen && canEscalateNotification && onSendEscalation && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!escalationTitle.trim() || !escalationSummary.trim() || isSendingEscalation) return;
                        setIsSendingEscalation(true);
                        try {
                          await onSendEscalation({
                            targetRole: escalationTargetRole,
                            targetOwner: escalationTargetOwner.trim() || undefined,
                            severity: escalationSeverity,
                            title: escalationTitle.trim(),
                            summary: escalationSummary.trim()
                          });
                          setEscalationTitle('');
                          setEscalationSummary('');
                          setEscalationTargetOwner('');
                          setIsEscalationOpen(false);
                          setNotifCategory('escalation');
                        } finally {
                          setIsSendingEscalation(false);
                        }
                      }}
                      className="px-4 py-3 bg-violet-50/70 border-b border-violet-200 space-y-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-violet-900">Send Role Escalation Notification ({selectedIndustry})</span>
                        <span className="text-[10px] text-violet-700">From: {currentDemoUser?.label || 'Monitor'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <select
                          aria-label="Target Role"
                          data-testid="escalation-target-role"
                          value={escalationTargetRole}
                          onChange={(e) => setEscalationTargetRole(e.target.value)}
                          className="rounded-md border border-violet-200 bg-white px-2 py-1 text-[11px] font-medium"
                        >
                          <option value="okr-creator">OKR Creator</option>
                          <option value="policy-manager">Policy Manager</option>
                          <option value="super-admin">Super Admin</option>
                          <option value="monitor">Operations Monitor</option>
                        </select>
                        <select
                          aria-label="Escalation Severity"
                          value={escalationSeverity}
                          onChange={(e) => setEscalationSeverity(e.target.value as 'critical' | 'high' | 'warning')}
                          className="rounded-md border border-violet-200 bg-white px-2 py-1 text-[11px] font-medium"
                        >
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="warning">Warning</option>
                        </select>
                        <input
                          value={escalationTargetOwner}
                          onChange={(e) => setEscalationTargetOwner(e.target.value)}
                          placeholder="Target owner (opt.)"
                          className="rounded-md border border-violet-200 bg-white px-2 py-1 text-[11px]"
                        />
                      </div>
                      <input
                        data-testid="escalation-title-input"
                        value={escalationTitle}
                        onChange={(e) => setEscalationTitle(e.target.value)}
                        placeholder="Escalation headline (e.g. Q2 SLA breach needs OKR reprioritisation)"
                        className="w-full rounded-md border border-violet-200 bg-white px-2.5 py-1.5 text-[11px]"
                        required
                      />
                      <div className="flex gap-1.5">
                        <input
                          data-testid="escalation-summary-input"
                          value={escalationSummary}
                          onChange={(e) => setEscalationSummary(e.target.value)}
                          placeholder="Action requested from target role..."
                          className="flex-1 rounded-md border border-violet-200 bg-white px-2.5 py-1.5 text-[11px]"
                          required
                        />
                        <button
                          type="submit"
                          data-testid="send-escalation-btn"
                          disabled={isSendingEscalation || !escalationTitle.trim() || !escalationSummary.trim()}
                          className="px-3 py-1.5 rounded-md bg-violet-700 hover:bg-violet-800 disabled:opacity-60 text-white font-semibold text-[11px] cursor-pointer shrink-0"
                        >
                          {isSendingEscalation ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Scope & Category Filters */}
                  <div className="px-4 py-2.5 border-b border-slate-200 space-y-2 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] shrink-0">
                        <button
                          type="button"
                          onClick={() => setNotifScope('all')}
                          className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                            notifScope === 'all'
                              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Industries
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifScope('current')}
                          className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap ${
                            notifScope === 'current'
                              ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Current: {selectedIndustry}
                        </button>
                      </div>

                      {notifScope === 'all' && (
                        <select
                          aria-label="Filter notifications by industry"
                          value={notifIndustryFilter}
                          onChange={(e) => setNotifIndustryFilter(e.target.value)}
                          className="text-[11px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[140px]"
                        >
                          <option value="ALL">All Industries</option>
                          {notificationIndustries.map((indKey) => (
                            <option key={indKey} value={indKey}>
                              {indKey}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {(
                        [
                          { id: 'all', label: `All (${visibleAllNotifications.length})` },
                          { id: 'critical_okr', label: `Critical OKRs (${criticalOkrTotal})` },
                          { id: 'disaster_event', label: `Disasters (${disasterTotal})` },
                          { id: 'escalation', label: `Escalations (${escalationTotal})` },
                          { id: 'retrospective_owner_alert', label: `Owner Alerts (${ownerAlertTotal})` }
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setNotifCategory(tab.id)}
                          className={`px-2 py-1 rounded-md font-medium border cursor-pointer transition-colors tabular-nums ${
                            notifCategory === tab.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alert List Grouped by Industry & Organisation */}
                  <div className="overflow-y-auto divide-y divide-slate-200 flex-1">
                    {groupedNotifications.length === 0 ? (
                      <div className="p-6 text-center space-y-1.5">
                        <p className="text-xs font-semibold text-slate-800">
                          No critical OKRs or active disasters in this filter
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Alerts appear here as soon as an OKR moves to Behind / P0 - Critical, a disaster triggers, or a role escalation is sent.
                        </p>
                      </div>
                    ) : (
                      groupedNotifications.map((group) => (
                        <div key={group.industryKey} className="bg-white">
                          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 truncate">
                                <span>{group.industryKey}</span>
                                <span className="text-slate-300" aria-hidden="true">·</span>
                                <span className="text-indigo-700 truncate">{group.organisationName}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">{group.sector}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600 tabular-nums whitespace-nowrap shrink-0">
                              {group.criticalOkrCount} OKR · {group.disasterCount} Disaster
                            </span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {group.items.map((item) => {
                              const isRead = readSet.has(item.id);
                              const isDisaster = item.category === 'disaster_event';
                              const isEscalation = item.category === 'escalation';
                              const isOwnerAlert = item.category === 'retrospective_owner_alert';
                              return (
                                <div
                                  key={item.id}
                                  data-testid="notification-item"
                                  data-notification-id={item.id}
                                  className={`px-4 py-3 transition-colors ${
                                    isRead
                                      ? 'bg-white'
                                      : isDisaster
                                      ? 'bg-red-50/40'
                                      : isEscalation
                                      ? 'bg-violet-50/40'
                                      : isOwnerAlert
                                      ? 'bg-indigo-50/40'
                                      : 'bg-amber-50/35'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                          isDisaster
                                            ? 'bg-red-100 text-red-800 border-red-200'
                                            : isEscalation
                                            ? 'bg-violet-100 text-violet-800 border-violet-200'
                                            : isOwnerAlert
                                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                            : item.severity === 'critical'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                        }`}
                                      >
                                        {isDisaster ? (
                                          <Flame className="w-3 h-3" />
                                        ) : isEscalation ? (
                                          <Send className="w-3 h-3" />
                                        ) : (
                                          <AlertTriangle className="w-3 h-3" />
                                        )}
                                        <span>
                                          {isDisaster
                                            ? 'Disaster Event'
                                            : isEscalation
                                            ? 'Role Escalation'
                                            : isOwnerAlert
                                            ? 'OKR Owner Alert'
                                            : 'Critical OKR'}
                                        </span>
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-700 tabular-nums">
                                        {item.statusLabel}
                                      </span>
                                      {(item.targetRole || item.targetOwner) && (
                                        <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">
                                          To: {item.targetOwner || item.targetRole}
                                        </span>
                                      )}
                                      {!isRead && (
                                        <span className="text-[10px] font-bold text-indigo-700">
                                          • Unread
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                                      {item.detectedAt}
                                    </span>
                                  </div>

                                  <h3 className="text-xs font-semibold text-slate-900 mt-1.5 leading-snug">
                                    {item.title}
                                  </h3>
                                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                    {item.summary}
                                  </p>
                                  {item.impactMetric && (
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 tabular-nums">
                                      {item.impactMetric}
                                    </p>
                                  )}

                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onOpenNotification(item);
                                        setIsNotificationCenterOpen(false);
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold cursor-pointer transition-colors"
                                    >
                                      <span>
                                        {isDisaster
                                          ? 'Inspect Crisis in Studio'
                                          : isOwnerAlert
                                          ? 'Review Lesson & OKR'
                                          : 'Review OKR in Studio'}
                                      </span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>

                                    <div className="flex items-center gap-1">
                                      {!isRead && (
                                        <button
                                          type="button"
                                          onClick={() => onMarkNotificationRead(item.id)}
                                          title="Mark as read"
                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-medium text-slate-600 cursor-pointer"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>Mark read</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => onDismissNotification(item.id)}
                                        title="Dismiss alert"
                                        aria-label={`Dismiss alert ${item.title}`}
                                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Event Bus Drawer Toggle Button */}
            <button
              type="button"
              onClick={onToggleEventBus}
              aria-label="Toggle Event Bus Drawer"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isEventBusOpen
                  ? 'bg-violet-50 text-violet-700 border-violet-300 ring-1 ring-violet-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>Event Bus</span>
              <span className="px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-800 text-[10px] font-bold tabular-nums leading-none">
                {eventCount}
              </span>
            </button>

            {/* Industry-Level OKR & Program Orchestrate Pipeline Cluster */}

            {/* Google Firebase Authentication Control */}
            {authReady && (
              user ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 text-xs shrink-0">
                  <span className="font-semibold text-slate-800 max-w-[96px] truncate">
                    {user.displayName || user.email}
                  </span>
                  <button
                    type="button"
                    data-testid="firebase-signout-btn"
                    onClick={() => void signOutUser()}
                    aria-label="Sign out of Google account"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-medium text-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="firebase-signin-btn"
                  disabled={isSigningIn}
                  onClick={() => void signInWithGoogle()}
                  title={authError || 'Sign in with Google to sync preferences & AI Copilot chats'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{isSigningIn ? 'Signing in...' : 'Sign in'}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Row 2: Industry / Organisation Selector + Custom Industry */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {industriesList.map((ind) => {
              const Icon = DEFAULT_ICONS[ind] || Building2;
              const isActive = selectedIndustry === ind;
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => onSelectIndustry(ind)}
                  aria-label={`Select ${ind} industry`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[130px]">{ind}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={onOpenAddCustomIndustry}
              aria-label="Add Custom Industry and invoke Strategy Agent"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Custom Industry</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 whitespace-nowrap">
            Active Industry &amp; Organisation: <strong className="text-slate-800">{selectedIndustry} · {industry.name}</strong>
          </span>
        </div>

        {workerAgentStatuses.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap shrink-0">
                <span>Worker Agent Status</span>
                <span className="font-normal normal-case tracking-normal text-slate-400">(Click for logs)</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {workerAgentStatuses.map((agent) => {
                  const actionText = agent.action || 'Continue monitoring the current workflow.';
                  const reasonText = agent.reason || 'Live status is healthy and ready for the next stage.';
                  return (
                    <div key={agent.id} className="group relative inline-flex">
                      <button
                        type="button"
                        data-testid={`worker-agent-btn-${agent.id}`}
                        onClick={() => onSelectWorkerAgent?.(agent)}
                        aria-label={`Inspect last 5 logs for ${agent.name} (${agent.label})`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          agent.status === 'active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
                            : agent.status === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100/80'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                        title={`${agent.name}: ${reasonText} (Click for last 5 KB logs)`}
                      >
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          agent.status === 'active' ? 'bg-emerald-500' : agent.status === 'error' ? 'bg-red-500' : 'bg-slate-400'
                        }`} />
                        <span>{agent.name}</span>
                        <span className="text-[9px] uppercase">{agent.label}</span>
                      </button>

                      <div className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg opacity-0 translate-y-[-4px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">Agent Status · Click for Last 5 Logs</div>
                        <p className="mt-1 text-[11px] font-semibold text-slate-800">{reasonText}</p>
                        <p className="mt-1 text-[10px] text-slate-600">Action: {actionText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!isCompactWorkspaceView && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs min-w-0">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 whitespace-nowrap">
                  <Compass className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Primary Workspace Views</span>
                </span>
                <span className="text-slate-300" aria-hidden="true">|</span>
                <span className="text-slate-600 truncate">
                  Active: <strong className="font-semibold text-slate-900">{activeMeta.label}</strong>
                  <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
                  <span>{activeMeta.shortHint}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 tabular-nums">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Attainment <strong className="text-slate-900">{industry.attainment}%</strong></span>
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Portfolio <strong className="text-slate-900">{industry.totalBudget}</strong></span>
                  </span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">
                    Agents Active <strong className="text-slate-900">{industry.activeAgents}</strong>
                  </span>
                  <StatusBadge status={industry.overallHealth} />
                </div>

                <button
                  type="button"
                  onClick={() => setIsNavHelpOpen((prev) => !prev)}
                  aria-expanded={isNavHelpOpen}
                  aria-controls="workspace-nav-help-panel"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isNavHelpOpen
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isNavHelpOpen ? 'Close Nav Help' : 'Navigation Tips & Help'}</span>
                </button>
              </div>
            </div>

            <nav
              className="bg-slate-50/90 border border-slate-200 rounded-xl p-1.5 flex flex-wrap items-center gap-1.5"
              aria-label="Primary Workspace Views"
            >
              {navOrder.map((view) => {
                const meta = NAV_BUTTON_META[view];
                const isPrimary = view === 'studio';
                const isActive = activeView === view;
                const isDragging = draggedView === view;
                const isDropTarget = dragOverView === view && draggedView && draggedView !== view;

                return (
                  <button
                    key={view}
                    type="button"
                    data-nav-view={view}
                    draggable={!isPrimary}
                    onClick={() => onSelectView(view)}
                    onDragStart={(e) => {
                      if (isPrimary) {
                        e.preventDefault();
                        return;
                      }
                      setDraggedView(view);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', view);
                    }}
                    onDragOver={(e) => {
                      if (!draggedView || draggedView === view || draggedView === 'studio') return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverView !== view) {
                        setDragOverView(view);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverView === view) {
                        setDragOverView(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const source = (draggedView || e.dataTransfer.getData('text/plain')) as ActiveNavView;
                      if (source && source !== 'studio' && source !== view) {
                        commitNavOrder(reorderSecondaryNavButtons(navOrder, source, view));
                      }
                      setDraggedView(null);
                      setDragOverView(null);
                    }}
                    onDragEnd={() => {
                      setDraggedView(null);
                      setDragOverView(null);
                    }}
                    onKeyDown={(e) => {
                      if (isPrimary || !e.altKey) return;
                      if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        commitNavOrder(shiftSecondaryNavButton(navOrder, view, 'prev'));
                      } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        commitNavOrder(shiftSecondaryNavButton(navOrder, view, 'next'));
                      }
                    }}
                    title={
                      isPrimary
                        ? `Primary Workspace (Pinned First): ${meta.shortHint}`
                        : `${meta.shortHint} — Drag tab or press Alt + Left/Right to reorder`
                    }
                    aria-label={meta.ariaLabel}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isPrimary
                        ? isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs border border-indigo-600'
                          : 'bg-white text-indigo-800 font-semibold border border-indigo-300 hover:bg-indigo-50 shadow-2xs'
                        : isActive
                          ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-300'
                          : 'bg-transparent text-slate-600 font-medium border border-transparent hover:bg-white/80 hover:text-slate-900 hover:border-slate-200/80'
                    } ${isDragging ? 'opacity-50 scale-[0.98]' : ''} ${
                      isDropTarget ? 'ring-2 ring-indigo-500 bg-indigo-50/80 border-indigo-300' : ''
                    }`}
                  >
                    {!isPrimary && (
                      <GripVertical
                        className={`w-3 h-3 shrink-0 cursor-grab transition-colors ${
                          isActive ? 'text-slate-400' : 'text-slate-300 group-hover:text-slate-500'
                        }`}
                      />
                    )}
                    <span className={isPrimary ? (isActive ? 'text-white' : 'text-indigo-600') : isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'}>
                      {meta.icon}
                    </span>
                    <span>{meta.label}</span>
                    {isPrimary && (
                      <span className={`text-[10px] font-medium pl-1 border-l ${isActive ? 'border-indigo-400 text-indigo-100' : 'border-indigo-200 text-indigo-600'}`}>
                        Primary
                      </span>
                    )}
                  </button>
                );
              })}

              {isCustomNavOrder && (
                <button
                  type="button"
                  onClick={() => commitNavOrder(DEFAULT_NAV_ORDER)}
                  aria-label="Reset navigation button order"
                  title="Reset action buttons to default sequence"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0 ml-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset order</span>
                </button>
              )}
            </nav>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-0.5">
              <span>
                <strong className="font-semibold text-slate-700">Tip:</strong> Drag any secondary workspace tab or press{' '}
                <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-700">Alt + ←/→</kbd>{' '}
                while focused to save your preferred sequence. <span className="text-slate-400">·</span>{' '}
                <span className="text-slate-700 font-medium">OKR &amp; Program Studio</span> stays pinned first for quick health checks and overrides.
              </span>
              {!isNavHelpOpen && (
                <button
                  type="button"
                  onClick={() => setIsNavHelpOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer whitespace-nowrap"
                >
                  Browse view guide
                </button>
              )}
            </div>

            {isNavHelpOpen && (
              <div
                id="workspace-nav-help-panel"
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">
                      Workspace Navigation Guide &amp; Customization Tips
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Select any workspace below to navigate directly, or reorder secondary tabs to match your executive review cadence.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNavHelpOpen(false)}
                    aria-label="Close navigation help"
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {navOrder.map((view, idx) => {
                    const meta = NAV_BUTTON_META[view];
                    const isCurrent = activeView === view;
                    return (
                      <button
                        key={view}
                        type="button"
                        onClick={() => {
                          onSelectView(view);
                          setIsNavHelpOpen(false);
                        }}
                        className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isCurrent
                            ? 'bg-white border-indigo-500 ring-1 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 truncate">
                            <span className="text-indigo-600 shrink-0">{meta.icon}</span>
                            <span className="truncate">{meta.label}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                            {view === 'studio' ? 'Pinned #1' : `#${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                          {meta.helpSummary}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-medium pt-0.5">
                          <span className={isCurrent ? 'text-indigo-700' : 'text-slate-500'}>
                            {isCurrent ? 'Currently open' : 'Open view'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
