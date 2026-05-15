# Reports Domain – Cache Architecture

## Cache Implementation

File: `server/src/lib/report-cache.ts`

```typescript
// In-memory Map (NOT Redis)
type CacheKey = string;
const cache = new Map<CacheKey, { data: any; expiresAt: number }>();

// TTL Constants
const HOT_TTL_MS  = 5 * 60 * 1000;   // 5 minutes → summary
const COLD_TTL_MS = 60 * 60 * 1000;  // 1 hour    → all other reports

// Cache key = {reportType}:{JSON.stringify(filters)}
// Example: "summary:{"from":"2026-05-01","to":"2026-05-10",...}"
```

## getCached / setCache Pattern

```typescript
// Controller pattern
export const getReportSummary = asyncHandler(async (req, res) => {
  const filters = parseFilters(req.query);
  
  // 1. Check cache
  const cached = getCached('summary', filters);
  if (cached) return sendSuccess(res, cached);

  // 2. Query DB (expensive)
  const result = await buildSummaryData(filters);
  
  // 3. Store in cache
  setCache('summary', filters, result);
  sendSuccess(res, result);
});
```

## Cache Invalidation via Socket Events

```typescript
// report-cache.ts
export function invalidateCacheForEvent(event: string): void {
  const mappings: Record<string, string[]> = {
    'order_updated':              ['summary', 'customers', 'delivery'],
    'inventory_updated':          ['summary', 'inventory', 'production', 'materials'],
    'shipping_updated':           ['summary', 'delivery'],
    'production_order_updated':   ['summary', 'production'],      // ← event missing!
    'material_stock_changed':     ['summary', 'materials'],       // ← event missing!
  };
  const keys = mappings[event] || [];
  if (keys.length === 0) {
    cache.clear();  // Unknown event → flush everything
    return;
  }
  // Delete all keys matching the report types
  keys.forEach(type => {
    for (const key of cache.keys()) {
      if (key.startsWith(type + ':')) cache.delete(key);
    }
  });
}
```

## Cache Warming

No pre-warming. Cache starts cold on server start.
First request after startup hits DB → sets cache → subsequent requests are fast.

## Cache Risks

| Risk | Impact |
|------|--------|
| Server restart = cold cache | First post-restart report requests are slow |
| In-memory only | Cannot share cache across multiple server instances |
| No cache metrics | Cannot tell hit rate or which reports are slow |
| Filter permutations = many cache entries | Each unique date range = separate cache entry |
| Large filter JSON as cache key | String comparison expensive at scale |

## Recommended Upgrade Path

Replace in-memory Map with Redis:

```typescript
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getCached(type, filters) {
  const key = `report:${type}:${hash(filters)}`;
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

async function setCache(type, filters, data) {
  const key = `report:${type}:${hash(filters)}`;
  const ttl = type === 'summary' ? 300 : 3600;  // seconds
  await redis.setex(key, ttl, JSON.stringify(data));
}
```

Benefits: Survives restart, shareable across instances, TTL managed by Redis.
