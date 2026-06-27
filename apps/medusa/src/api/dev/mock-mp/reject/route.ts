import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isMockMpEnabled, mockStorefrontBase } from "../../../../lib/dev-mocks"
import { rejectMockMpPayment } from "../../../../lib/dev-mocks/mp-webhook"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isMockMpEnabled()) {
    return res.status(404).json({ message: "Mock MP disabled" })
  }

  const body = (req.body ?? {}) as {
    payment_id?: string
    return_url?: string
  }

  const paymentId = body.payment_id
  if (!paymentId) {
    return res.status(400).send("Falta payment_id")
  }

  const ok = await rejectMockMpPayment(req.scope, paymentId)
  if (!ok) {
    return res.status(404).send("Pago mock no encontrado")
  }

  const redirectUrl =
    body.return_url ||
    `${mockStorefrontBase()}/co/checkout/failure?reason=${encodeURIComponent("Pago rechazado (simulador local)")}`

  return res.redirect(302, redirectUrl)
}
