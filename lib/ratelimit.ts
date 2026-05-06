import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialise if env vars are present (skips in local dev without Upstash).
function makeRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const redis = makeRedis();

function limiter(tokens: number, window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(tokens, window) });
}

// Auth endpoints — tight limits to prevent brute force
export const authLimiter = limiter(5, '15 m');

// Admin mutation endpoints (test email, test reminder)
export const adminActionLimiter = limiter(10, '1 h');

// General API reads/writes
export const apiLimiter = limiter(60, '1 m');
