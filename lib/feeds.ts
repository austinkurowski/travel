import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

type FeedMessage = ReturnType<typeof GtfsRealtimeBindings.transit_realtime.FeedMessage.decode>;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * TTL cache with in-flight de-duplication.
 *
 * The bus feed is a single ~1.6 MB protobuf covering every NYC bus, so we want
 * one download per interval no matter how many boards or browser tabs ask.
 */
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

async function fetchWithTimeout(url: string, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchGtfsFeed(url: string, ttlMs = 15_000): Promise<FeedMessage> {
  return cached(`pb:${url}`, ttlMs, async () => {
    const res = await fetchWithTimeout(url);
    const buffer = new Uint8Array(await res.arrayBuffer());
    return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);
  });
}

export function fetchJsonFeed<T>(url: string, ttlMs = 60_000): Promise<T> {
  return cached(`json:${url}`, ttlMs, async () => {
    const res = await fetchWithTimeout(url);
    return (await res.json()) as T;
  });
}

/** protobuf.js hands back Longs for 64-bit fields; normalise to a plain number. */
function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return Number.isFinite(Number(value)) ? Number(value) : null;
  if (typeof value === 'object' && 'toNumber' in (value as Record<string, unknown>)) {
    return (value as { toNumber(): number }).toNumber();
  }
  return null;
}

/**
 * Reads a numeric protobuf field only when it was actually on the wire.
 *
 * protobuf.js exposes unset optional fields as prototype defaults, so a plain
 * `?? ` chain sees an absent `delay` as a real `0` and stops there — which would
 * report every late bus as on time.
 */
export function presentNumber(source: unknown, key: string): number | null {
  if (!source || typeof source !== 'object') return null;
  if (!Object.prototype.hasOwnProperty.call(source, key)) return null;
  return toNumber((source as Record<string, unknown>)[key]);
}
