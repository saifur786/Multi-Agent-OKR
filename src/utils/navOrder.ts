export type ActiveNavView =
  | 'studio'
  | 'lifecycle'
  | 'traceability'
  | 'decisions'
  | 'knowledge'
  | 'advisory'
  | 'performance'
  | 'heatmap'
  | 'strategy'
  | 'trajectory';

export const PRIMARY_NAV_VIEW: ActiveNavView = 'studio';

export const DEFAULT_SECONDARY_NAV_ORDER: ActiveNavView[] = [
  'lifecycle',
  'traceability',
  'decisions',
  'advisory',
  'performance',
  'trajectory',
  'heatmap',
  'strategy',
  'knowledge'
];

export const DEFAULT_NAV_ORDER: ActiveNavView[] = [
  PRIMARY_NAV_VIEW,
  ...DEFAULT_SECONDARY_NAV_ORDER
];

export const NAV_ORDER_STORAGE_KEY = 'planview_anvi_nav_button_order_v1';

const VALID_SECONDARY_SET = new Set<ActiveNavView>(DEFAULT_SECONDARY_NAV_ORDER);

export function normalizeNavOrder(savedOrder: unknown): ActiveNavView[] {
  const seen = new Set<ActiveNavView>();
  const secondary: ActiveNavView[] = [];

  if (Array.isArray(savedOrder)) {
    for (const item of savedOrder) {
      if (typeof item !== 'string') continue;
      const view = item as ActiveNavView;
      if (view === PRIMARY_NAV_VIEW) continue;
      if (VALID_SECONDARY_SET.has(view) && !seen.has(view)) {
        seen.add(view);
        secondary.push(view);
      }
    }
  }

  for (const view of DEFAULT_SECONDARY_NAV_ORDER) {
    if (!seen.has(view)) {
      seen.add(view);
      secondary.push(view);
    }
  }

  return [PRIMARY_NAV_VIEW, ...secondary];
}

export function reorderSecondaryNavButtons(
  currentOrder: ActiveNavView[],
  draggedView: ActiveNavView,
  targetView: ActiveNavView
): ActiveNavView[] {
  const normalized = normalizeNavOrder(currentOrder);
  if (draggedView === PRIMARY_NAV_VIEW || draggedView === targetView) {
    return normalized;
  }

  const secondary = normalized.slice(1);
  const fromIndex = secondary.indexOf(draggedView);
  if (fromIndex === -1) {
    return normalized;
  }

  // Dropping onto the primary button places the dragged item right after it (index 0 of secondary)
  const targetIndex = targetView === PRIMARY_NAV_VIEW ? 0 : secondary.indexOf(targetView);
  if (targetIndex === -1) {
    return normalized;
  }

  const nextSecondary = [...secondary];
  const [moved] = nextSecondary.splice(fromIndex, 1);
  nextSecondary.splice(targetIndex, 0, moved);

  return [PRIMARY_NAV_VIEW, ...nextSecondary];
}

export function shiftSecondaryNavButton(
  currentOrder: ActiveNavView[],
  view: ActiveNavView,
  direction: 'prev' | 'next'
): ActiveNavView[] {
  const normalized = normalizeNavOrder(currentOrder);
  if (view === PRIMARY_NAV_VIEW) return normalized;

  const secondary = normalized.slice(1);
  const idx = secondary.indexOf(view);
  if (idx === -1) return normalized;

  const swapIdx = direction === 'prev' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= secondary.length) return normalized;

  const nextSecondary = [...secondary];
  const temp = nextSecondary[idx];
  nextSecondary[idx] = nextSecondary[swapIdx];
  nextSecondary[swapIdx] = temp;

  return [PRIMARY_NAV_VIEW, ...nextSecondary];
}

export function areNavOrdersEqual(a: ActiveNavView[], b: ActiveNavView[]): boolean {
  const normA = normalizeNavOrder(a);
  const normB = normalizeNavOrder(b);
  return normA.length === normB.length && normA.every((item, idx) => item === normB[idx]);
}

export interface MinimalStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function loadPersistedNavOrder(storage?: MinimalStorageLike | null): ActiveNavView[] {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return DEFAULT_NAV_ORDER;
  try {
    const raw = store.getItem(NAV_ORDER_STORAGE_KEY);
    if (!raw) return DEFAULT_NAV_ORDER;
    const parsed = JSON.parse(raw);
    return normalizeNavOrder(parsed);
  } catch {
    return DEFAULT_NAV_ORDER;
  }
}

export function savePersistedNavOrder(
  order: ActiveNavView[],
  storage?: MinimalStorageLike | null
): ActiveNavView[] {
  const normalized = normalizeNavOrder(order);
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (store) {
    try {
      store.setItem(NAV_ORDER_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore storage quota / privacy mode failures
    }
  }
  return normalized;
}

export interface UserPreferences {
  navButtonOrder: ActiveNavView[];
  updatedAt?: string;
}

export const USER_PREFERENCES_STORAGE_KEY = 'planview_anvi_user_preferences_v1';

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  navButtonOrder: DEFAULT_NAV_ORDER
};

export function normalizeUserPreferences(raw: unknown): UserPreferences {
  if (raw && typeof raw === 'object') {
    const candidate = raw as { navButtonOrder?: unknown; updatedAt?: unknown };
    return {
      navButtonOrder: normalizeNavOrder(candidate.navButtonOrder),
      ...(typeof candidate.updatedAt === 'string' && candidate.updatedAt
        ? { updatedAt: candidate.updatedAt }
        : {})
    };
  }
  return { navButtonOrder: DEFAULT_NAV_ORDER };
}

export function loadPersistedUserPreferences(storage?: MinimalStorageLike | null): UserPreferences {
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (!store) return { navButtonOrder: DEFAULT_NAV_ORDER };
  try {
    const rawPrefs = store.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (rawPrefs) {
      return normalizeUserPreferences(JSON.parse(rawPrefs));
    }
    // Migrate seamlessly from legacy nav order key if present
    const legacyOrder = store.getItem(NAV_ORDER_STORAGE_KEY);
    if (legacyOrder) {
      return {
        navButtonOrder: normalizeNavOrder(JSON.parse(legacyOrder))
      };
    }
    return { navButtonOrder: DEFAULT_NAV_ORDER };
  } catch {
    return { navButtonOrder: DEFAULT_NAV_ORDER };
  }
}

export function savePersistedUserPreferences(
  prefs: Partial<UserPreferences> | ActiveNavView[],
  storage?: MinimalStorageLike | null
): UserPreferences {
  const normalized = Array.isArray(prefs)
    ? { navButtonOrder: normalizeNavOrder(prefs), updatedAt: new Date().toISOString() }
    : normalizeUserPreferences({
        ...prefs,
        updatedAt: prefs.updatedAt || new Date().toISOString()
      });

  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : null);
  if (store) {
    try {
      store.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(normalized));
      store.setItem(NAV_ORDER_STORAGE_KEY, JSON.stringify(normalized.navButtonOrder));
    } catch {
      // Ignore storage quota / privacy mode failures
    }
  }
  return normalized;
}

