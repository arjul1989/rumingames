import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { fulfillDigitalOrder } from "../../../../../lib/fulfill-digital-order"

// Admin action to retry digital fulfillment for an order (US-5.2 / RUM-36).
// Safe to call repeatedly: fulfillDigitalOrder is idempotent per line item
// (already-delivered lines are skipped, failed ones are retried).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!process.env.FAZER_API_KEY) {
    return res.status(503).json({ message: "FAZER_API_KEY no está configurado." })
  }
  try {
    const result = await fulfillDigitalOrder(req.scope, { orderId: req.params.id })
    res.json({ order_id: req.params.id, ...result })
  } catch (e) {
    res.status(400).json({ message: `Retry falló: ${(e as Error).message}` })
  }
}
