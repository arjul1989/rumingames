import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getMpPaymentConfig, updateMpPaymentConfig } from "../../../../lib/mp-payment-config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const config = await getMpPaymentConfig(req.scope)
  res.json({
    ...config,
    mercadopago_configured: Boolean(process.env.MP_ACCESS_TOKEN),
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Partial<{
    enable_cards: boolean
    enable_pse: boolean
    enable_efecty: boolean
    enable_manual_test: boolean
  }>
  const patch: Record<string, boolean> = {}
  for (const key of [
    "enable_cards",
    "enable_pse",
    "enable_efecty",
    "enable_manual_test",
  ] as const) {
    if (typeof body[key] === "boolean") patch[key] = body[key]!
  }
  const config = await updateMpPaymentConfig(req.scope, patch)
  res.json(config)
}
