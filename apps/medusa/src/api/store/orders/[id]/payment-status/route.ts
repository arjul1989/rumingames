import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { normalizePaymentStatus } from "../../../../../lib/payment-status"

// Real-time payment status for the post-checkout page (US-3.4 / RUM-26).
// The order id is an unguessable token, so this is readable without auth to
// support guest checkout polling. Only a coarse status is returned.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "status",
      "payment_status",
      "payment_collections.payments.data",
    ],
    filters: { id: orderId },
  })
  const order = orders[0]

  if (!order) {
    return res.status(404).json({ message: "Orden no encontrada." })
  }

  const payments = order.payment_collections?.flatMap(
    (pc: { payments?: { data?: Record<string, unknown> }[] }) => pc.payments ?? []
  )
  const mpStatus = payments?.find((p) => p?.data?.mp_status)?.data?.mp_status as
    | string
    | undefined

  const status = normalizePaymentStatus(order.payment_status, mpStatus)

  res.json({
    order_id: order.id,
    status,
    payment_status: order.payment_status,
    mp_status: mpStatus ?? null,
  })
}
