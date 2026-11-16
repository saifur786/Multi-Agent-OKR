import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NAV_ORDER,
  NAV_ORDER_STORAGE_KEY,
  PRIMARY_NAV_VIEW,
  USER_PREFERENCES_STORAGE_KEY,
  areNavOrdersEqual,
  loadPersistedNavOrder,
  loadPersistedUserPreferences,
  normalizeNavOrder,
  normalizeUserPreferences,
  reorderSecondaryNavButtons,
  savePersistedNavOrder,
  savePersistedUserPreferences,
  shiftSecondaryNavButton
} from './navOrder';

test('normalizeNavOrder always places studio primary first and restores missing defaults', () => {
  assert.equal(DEFAULT_NAV_ORDER[0], 'studio');

  const normalized = normalizeNavOrder(['knowledge', 'studio', 'unknown-tab', 'traceability', 'knowledge']);
  assert.equal(normalized[0], PRIMARY_NAV_VIEW);
  assert.equal(normalized[1], 'knowledge');
  assert.equal(normalized[2], 'traceability');
  assert.equal(DEFAULT_NAV_ORDER.includes('decisions'), true);
  assert.equal(new Set(normalized).size, DEFAULT_NAV_ORDER.length);
  assert.equal(normalized.length, DEFAULT_NAV_ORDER.length);
  assert.equal(normalized.includes('decisions'), true);
});

test('reorderSecondaryNavButtons moves target buttons while keeping studio pinned at index 0', () => {
  const reordered = reorderSecondaryNavButtons(DEFAULT_NAV_ORDER, 'knowledge', 'lifecycle');
  assert.equal(reordered[0], 'studio');
  assert.equal(reordered[1], 'knowledge');
  assert.equal(reordered[2], 'lifecycle');

  // Dragging studio itself is a no-op
  const unchanged = reorderSecondaryNavButtons(reordered, 'studio', 'traceability');
  assert.deepEqual(unchanged, reordered);

  // Dropping onto studio moves dragged secondary item right after studio (index 1)
  const droppedOnPrimary = reorderSecondaryNavButtons(DEFAULT_NAV_ORDER, 'strategy', 'studio');
  assert.equal(droppedOnPrimary[0], 'studio');
  assert.equal(droppedOnPrimary[1], 'strategy');
});

test('shiftSecondaryNavButton moves focused secondary items left/right without displacing studio', () => {
  const shiftedRight = shiftSecondaryNavButton(DEFAULT_NAV_ORDER, 'lifecycle', 'next');
  assert.equal(shiftedRight[0], 'studio');
  assert.equal(shiftedRight[1], 'traceability');
  assert.equal(shiftedRight[2], 'lifecycle');

  // Shifting first secondary item left does not displace studio
  const boundaryLeft = shiftSecondaryNavButton(DEFAULT_NAV_ORDER, 'lifecycle', 'prev');
  assert.deepEqual(boundaryLeft, DEFAULT_NAV_ORDER);
});

test('savePersistedNavOrder and loadPersistedNavOrder preserve user order cleanly', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    }
  };

  const customOrder = reorderSecondaryNavButtons(DEFAULT_NAV_ORDER, 'heatmap', 'lifecycle');
  savePersistedNavOrder(customOrder, mockStorage);
  const loaded = loadPersistedNavOrder(mockStorage);

  assert.equal(areNavOrdersEqual(customOrder, loaded), true);
  assert.equal(loaded[0], 'studio');
  assert.equal(loaded[1], 'heatmap');
});

test('normalizeUserPreferences, savePersistedUserPreferences, and legacy migration work cleanly', () => {
  const normalized = normalizeUserPreferences({ navButtonOrder: ['advisory', 'studio'] });
  assert.equal(normalized.navButtonOrder[0], 'studio');
  assert.equal(normalized.navButtonOrder[1], 'advisory');
  assert.equal(normalized.navButtonOrder.length, DEFAULT_NAV_ORDER.length);

  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    }
  };

  // Legacy key migration when USER_PREFERENCES_STORAGE_KEY is absent
  const legacyOrder = reorderSecondaryNavButtons(DEFAULT_NAV_ORDER, 'strategy', 'lifecycle');
  store.set(NAV_ORDER_STORAGE_KEY, JSON.stringify(legacyOrder));
  const migrated = loadPersistedUserPreferences(mockStorage);
  assert.equal(migrated.navButtonOrder[0], 'studio');
  assert.equal(migrated.navButtonOrder[1], 'strategy');

  // Saving userPreferences writes normalized payload to both keys
  const customOrder = reorderSecondaryNavButtons(DEFAULT_NAV_ORDER, 'trajectory', 'lifecycle');
  const saved = savePersistedUserPreferences({ navButtonOrder: customOrder }, mockStorage);
  assert.ok(store.has(USER_PREFERENCES_STORAGE_KEY));
  const reloaded = loadPersistedUserPreferences(mockStorage);
  assert.equal(areNavOrdersEqual(saved.navButtonOrder, reloaded.navButtonOrder), true);
  assert.equal(reloaded.navButtonOrder[0], 'studio');
  assert.equal(reloaded.navButtonOrder[1], 'trajectory');
});
