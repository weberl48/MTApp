import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function createRedis() {
  // KV_REST_API_* are the names the Vercel Marketplace "Upstash for Redis"
  // integration injects (and keeps rotated). UPSTASH_REDIS_REST_* stays first
  // for manual/local setups.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

  if (!url || !token) return null

  return new Redis({ url, token })
}

const redis = createRedis()

/** General API rate limit: 60 requests per 60 seconds per IP */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '60 s'),
      prefix: 'ratelimit:api',
    })
  : null

/** Auth rate limit: 5 attempts per 60 seconds per IP (stricter for login/signup) */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      prefix: 'ratelimit:auth',
    })
  : null

/**
 * Frontend error sink: 40 reports per 60 seconds **per user**.
 *
 * Deliberately its own bucket, keyed by user id rather than IP, and excluded
 * from `apiRateLimit` in the proxy. The shared API bucket is 60/60s per IP, and
 * a practice's staff sit behind one office NAT — so one person's render loop
 * emitting errors could burn the whole office's allowance and 429 everybody's
 * real requests. Telemetry must never be able to take the app down with it.
 *
 * 40 leaves headroom above the client-side gate (20/min per tab) for a user
 * with a couple of tabs open, while still bounding the damage.
 */
export const errorRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, '60 s'),
      prefix: 'ratelimit:errors',
    })
  : null

/** AI helper rate limit: 20 questions per hour per user (cost control) */
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '3600 s'),
      prefix: 'ratelimit:ai',
    })
  : null
