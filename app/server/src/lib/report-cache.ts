/**
 * In-memory daily report cache.
 * Keys scoped by: reportType + serialised filters.
 * Auto-expires after TTL (default 5 min for hot data, 1hr for cold).
 * Invalidated on Socket.IO events via clearReportCache().
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const HOT_TTL_MS  = 5 * 60 * 1000;   // 5 min – summary, realtime KPIs
const COLD_TTL_MS = 60 * 60 * 1000;  // 1 hr  – historical aggregations

function buildKey(report: string, filters: Record<string, unknown>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce((acc, k) => {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        acc[k] = filters[k];
      }
      return acc;
    }, {} as Record<string, unknown>);
  return `report:${report}:${JSON.stringify(sorted)}`;
}

export function getCached<T>(report: string, filters: Record<string, unknown>): T | null {
  const key = buildKey(report, filters);
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

const MAX_CACHE_ITEMS = 1000;

export function setCache<T>(report: string, filters: Record<string, unknown>, data: T, ttlMs?: number): void {
  // Guard to prevent memory leaks under heavy usage
  if (store.size >= MAX_CACHE_ITEMS) {
    const now = Date.now();
    // 1. Evict expired entries first
    for (const [key, entry] of store.entries()) {
      if (now > entry.expiresAt) {
        store.delete(key);
      }
    }
    // 2. If still full, evict oldest 10% of items to release RAM
    if (store.size >= MAX_CACHE_ITEMS) {
      const keys = Array.from(store.keys());
      const toDeleteCount = Math.floor(MAX_CACHE_ITEMS * 0.1);
      for (let i = 0; i < toDeleteCount; i++) {
        store.delete(keys[i]);
      }
    }
  }

  const ttl = ttlMs ?? (['summary'].includes(report) ? HOT_TTL_MS : COLD_TTL_MS);
  const key = buildKey(report, filters);
  store.set(key, { data, expiresAt: Date.now() + ttl });
}

/**
 * Flush report caches.
 * Called from Socket.IO event handlers when underlying data changes.
 * @param report - specific report type to clear, or omit to clear all
 */
export function clearReportCache(report?: string): void {
  if (!report) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(`report:${report}:`)) {
      store.delete(key);
    }
  }
}

/** Map socket events → which report caches to invalidate */
export function invalidateCacheForEvent(event: string): void {
  switch (event) {
    case 'order_updated':
      clearReportCache('summary');
      clearReportCache('customers');
      clearReportCache('delivery');
      break;
    case 'inventory_updated':
      clearReportCache('summary');
      clearReportCache('inventory');
      clearReportCache('production');
      clearReportCache('materials');
      break;
    case 'shipping_updated':
      clearReportCache('summary');
      clearReportCache('delivery');
      break;
    case 'production_updated':
      clearReportCache('summary');
      clearReportCache('production');
      clearReportCache('materials');
      break;
    default:
      clearReportCache(); // unknown → flush all
  }
}
