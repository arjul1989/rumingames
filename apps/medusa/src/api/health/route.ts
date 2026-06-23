import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { emitMonitorAlert } from "../../lib/monitoring"

type CheckResult = { status: "ok" | "error"; latency_ms?: number; message?: string }

// Deep health check for uptime monitoring (US-10.3 / RUM-67). Returns 200 when
// healthy, 503 when a critical dependency is down. Cloud Monitoring / GitHub
// Actions can poll this endpoint.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const started = Date.now()
  const checks: Record<string, CheckResult> = {}

  // Database connectivity (required).
  try {
    const t0 = Date.now()
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    await query.graph({
      entity: "region",
      fields: ["id"],
      pagination: { take: 1 },
    })
    checks.database = { status: "ok", latency_ms: Date.now() - t0 }
  } catch (e) {
    checks.database = { status: "error", message: (e as Error).message }
  }

  // Redis is optional in dev but used for cache/events in production.
  if (process.env.REDIS_URL) {
    try {
      const t0 = Date.now()
      const cache = req.scope.resolve(Modules.CACHE)
      await cache.set("health:ping", "1", 10)
      checks.redis = { status: "ok", latency_ms: Date.now() - t0 }
    } catch (e) {
      checks.redis = { status: "error", message: (e as Error).message }
    }
  }

  const healthy = Object.values(checks).every((c) => c.status === "ok")
  const body = {
    status: healthy ? "ok" : "degraded",
    service: "gorumin-medusa",
    checks,
    uptime_ms: Date.now() - started,
  }

  if (!healthy) {
    await emitMonitorAlert(req.scope, {
      event_type: "health.check.failed",
      severity: "CRITICAL",
      message: "Health check failed — dependency unavailable",
      context: { checks },
    })
    return res.status(503).json(body)
  }

  res.json(body)
}
