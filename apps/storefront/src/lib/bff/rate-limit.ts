import { NextRequest } from "next/server"

// Basic in-memory fixed-window rate limiter per client IP (US-5.1 / RUM-35).
// This is intentionally simple and process-local; for multi-instance
// deployments swap the store for Redis/Upstash. It is enough to throttle
// abusive bursts against the public BFF.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function windowMs(): number {
  const raw = Number(process.env.BFF_RATE_LIMIT_WINDOW_MS)
  return Number.isFinite(raw) && raw > 0 ? raw : 60_000
}

function maxRequests(): number {
  const raw = Number(process.env.BFF_RATE_LIMIT_MAX)
  return Number.isFinite(raw) && raw > 0 ? raw : 120
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}

export interface RateLimitResult {
  ok: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(req: NextRequest, keySuffix = ""): RateLimitResult {
  const limit = maxRequests()
  const now = Date.now()
  const key = `${clientIp(req)}:${keySuffix}`

  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs() }
    buckets.set(key, bucket)
  }
  bucket.count++

  // Opportunistic cleanup to keep the map bounded.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k)
    }
  }

  const remaining = Math.max(0, limit - bucket.count)
  return { ok: bucket.count <= limit, limit, remaining, resetAt: bucket.resetAt }
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    "x-ratelimit-limit": String(r.limit),
    "x-ratelimit-remaining": String(r.remaining),
    "x-ratelimit-reset": String(Math.ceil(r.resetAt / 1000)),
  }
}
