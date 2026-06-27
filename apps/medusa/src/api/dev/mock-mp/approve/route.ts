import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isMockMpEnabled, mockStorefrontBase } from "../../../../lib/dev-mocks"
import { approveMockMpPayment } from "../../../../lib/dev-mocks/mp-webhook"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isMockMpEnabled()) {
    return res.status(404).json({ message: "Mock MP disabled" })
  }

  const body = (req.body ?? {}) as {
    payment_id?: string
    order_id?: string
    country_code?: string
    return_url?: string
  }

  const paymentId = body.payment_id
  if (!paymentId) {
    return res.status(400).send("Falta payment_id")
  }

  const ok = await approveMockMpPayment(req.scope, paymentId)
  if (!ok) {
    return res.status(404).send("Pago mock no encontrado")
  }

  const cc = body.country_code ?? "co"
  const storefront = mockStorefrontBase()
  const redirectUrl =
    body.return_url ||
    (body.order_id
      ? `${storefront}/${cc}/order/${body.order_id}/confirmed`
      : `${storefront}/${cc}/checkout/success`)

  return res.redirect(302, redirectUrl)
}
