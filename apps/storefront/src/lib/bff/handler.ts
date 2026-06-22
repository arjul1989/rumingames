import { NextRequest, NextResponse } from "next/server"
import { corsHeaders, error, preflight } from "./http"
import { rateLimit, rateLimitHeaders } from "./rate-limit"

type Ctx = { params: Promise<Record<string, string>> }
type Handler = (req: NextRequest, ctx: Ctx) => Promise<NextResponse> | NextResponse

interface WithBffOptions {
  /** Distinct key so different routes get independent rate-limit buckets. */
  bucket?: string
}

// Wraps a route handler with CORS, rate limiting and uniform error handling
// (US-5.1 / RUM-35). Returned responses already carry CORS + rate-limit headers.
export function withBff(handler: Handler, options: WithBffOptions = {}): Handler {
  return async (req: NextRequest, ctx: Ctx) => {
    const rl = rateLimit(req, options.bucket ?? new URL(req.url).pathname)
    if (!rl.ok) {
      return error(req, "Demasiadas solicitudes. Intenta más tarde.", 429, {
        ...rateLimitHeaders(rl),
        "retry-after": String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
      })
    }
    try {
      const res = await handler(req, ctx)
      const headers = { ...corsHeaders(req), ...rateLimitHeaders(rl) }
      for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
      return res
    } catch (e) {
      return error(req, (e as Error).message || "Error interno", 500, rateLimitHeaders(rl))
    }
  }
}

export function options(req: NextRequest): NextResponse {
  return preflight(req)
}
