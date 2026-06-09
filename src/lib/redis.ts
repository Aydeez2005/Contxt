import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

// In-memory fallback when Redis is not configured (dev/test only)
const memStore = new Map<string, { value: unknown; expiresAt: number }>();

function memGet<T>(key: string): T | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
  return entry.value as T;
}
function memSet(key: string, value: unknown, exSeconds = 3600) {
  memStore.set(key, { value, expiresAt: Date.now() + exSeconds * 1000 });
}
function memDel(key: string) { memStore.delete(key); }

function isRedisConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

export const redis = {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisConfigured()) return memGet<T>(key);
    return getRedis().get<T>(key);
  },
  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<void> {
    if (!isRedisConfigured()) { memSet(key, value, opts?.ex); return; }
    if (opts?.ex) { await getRedis().set(key, value, { ex: opts.ex }); }
    else { await getRedis().set(key, value); }
  },
  async del(key: string): Promise<void> {
    if (!isRedisConfigured()) { memDel(key); return; }
    await getRedis().del(key);
  },
};
