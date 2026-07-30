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

/** AI helper rate limit: 20 questions per hour per user (cost control) */
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '3600 s'),
      prefix: 'ratelimit:ai',
    })
  : null
