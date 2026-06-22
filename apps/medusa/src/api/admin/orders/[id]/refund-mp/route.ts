import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { refundPaymentWorkflow } from "@medusajs/medusa/core-flows"

// Admin action to refund an order's payment through Mercado Pago (US-3.5 / RUM-27).
// Runs Medusa's refund workflow (which calls the provider's refundPayment and
// emits payment.refunded -> digital_deliveries are marked refunded by a subscriber).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id
  const body = (req.body ?? {}) as { amount?: number }
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "payment_collections.payments.id",
      "payment_collections.payments.amount",
      "payment_collections.payments.captured_at",
    ],
    filters: { id: orderId },
  })
  const order = orders[0]
  if (!order) {
    return res.status(404).json({ message: "Orden no encontrada." })
  }

  const payments = order.payment_collections?.flatMap(
    (pc: { payments?: { id: string; captured_at?: string }[] }) => pc.payments ?? []
  ) ?? []
  // Prefer a captured payment; fall back to the first one.
  const payment = payments.find((p) => p.captured_at) ?? payments[0]

  if (!payment) {
    return res.status(400).json({ message: "La orden no tiene un pago para reembolsar." })
  }

  try {
    await refundPaymentWorkflow(req.scope).run({
      input: {
        payment_id: payment.id,
        amount: body.amount,
        created_by: req.auth_context?.actor_id,
      },
    })
  } catch (e) {
    return res.status(400).json({ message: `Refund falló: ${(e as Error).message}` })
  }

  res.json({ order_id: orderId, payment_id: payment.id, refunded: true })
}
