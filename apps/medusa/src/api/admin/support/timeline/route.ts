import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { buildCustomerTimeline } from "../../../../lib/support/build-customer-timeline"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const email = String((req.query as { email?: string }).email ?? "").trim()
  if (!email) {
    res.status(400).json({ message: "Parámetro email requerido." })
    return
  }

  const timeline = await buildCustomerTimeline(req.scope, email)
  res.json(timeline)
}
