import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { applyCartGatewayPricing } from "../../../../../lib/apply-cart-gateway-pricing"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cartId = req.params.id
  const country = (
    (req.body as { country?: string } | undefined)?.country ??
    (req.query?.country as string | undefined) ??
    "co"
  ).toLowerCase()

  const breakdown = await applyCartGatewayPricing(req.scope, cartId, country)
  if (!breakdown) {
    return res.status(404).json({ message: "Unable to apply pricing to cart" })
  }

  res.json({ breakdown, applied: true })
}
