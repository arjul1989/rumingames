import type { MedusaRequest } from "@medusajs/framework/http"

// In-memory fixed-window rate limiter for webhook endpoints (US-10.1 / RUM-65).
// Process-local; for multi-instance deployments back it with Redis. Enough to
// blunt abusive bursts against public webhook URLs.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function clientIp(req: MedusaRequest): string {
  const fwd = (req.headers["x-forwarded-for"] as string | undefined) || ""
  if (fwd) return fwd.split(",")[0].trim()
  return (req.headers["x-real-ip"] as string | undefined) || req.ip || "unknown"
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key bucket key (e.g. "fazer-webhook:<ip>")
 * @param limit max requests per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit = 60, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count++

  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
  }

  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  }
}
