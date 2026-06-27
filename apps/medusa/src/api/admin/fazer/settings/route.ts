import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getFazerConfig, updateFazerConfig } from "../../../../lib/fazer-config"
import { getUsdCopRate, getDefaultMarginPct } from "../../../../lib/pricing"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const config = await getFazerConfig(req.scope)
  res.json({
    ...config,
    env_usd_cop_rate: getUsdCopRate(),
    env_default_margin_pct: getDefaultMarginPct(),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    usd_cop_rate?: number
    default_margin_pct?: number
  }
  const patch: { usd_cop_rate?: number; default_margin_pct?: number } = {}
  if (typeof body.usd_cop_rate === "number" && body.usd_cop_rate > 0) {
    patch.usd_cop_rate = body.usd_cop_rate
  }
  if (typeof body.default_margin_pct === "number" && body.default_margin_pct >= 0) {
    patch.default_margin_pct = body.default_margin_pct
  }
  const config = await updateFazerConfig(req.scope, patch)
  res.json(config)
}
