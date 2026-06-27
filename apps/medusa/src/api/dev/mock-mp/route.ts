import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isMockMpEnabled } from "../../../lib/dev-mocks"
import { renderMpSimulatorPage } from "../../../lib/dev-mocks/mp-simulator-page"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isMockMpEnabled()) {
    return res.status(404).send("Mock MP desactivado. Define MOCK_MP=true en desarrollo.")
  }

  const paymentId = String(req.query.payment_id ?? "")
  if (!paymentId) {
    return res.status(400).send("Falta payment_id")
  }

  const html = renderMpSimulatorPage({
    paymentId,
    sessionId: String(req.query.session_id ?? ""),
    orderId: String(req.query.order_id ?? ""),
    countryCode: String(req.query.country_code ?? "co"),
  })

  res.setHeader("Content-Type", "text/html; charset=utf-8")
  return res.send(html)
}
