import type { MedusaContainer } from "@medusajs/framework"
import { Modules, PaymentWebhookEvents } from "@medusajs/framework/utils"
import { setMockMpPaymentStatus } from "./mp-mock-store"

const PROVIDER = "mercadopago_mercadopago"

export async function emitMockMpWebhook(
  container: MedusaContainer,
  paymentId: string | number
): Promise<void> {
  const eventBus = container.resolve(Modules.EVENT_BUS)
  await eventBus.emit({
    name: PaymentWebhookEvents.WebhookReceived,
    data: {
      provider: PROVIDER,
      payload: {
        data: {
          type: "payment",
          id: String(paymentId),
          data: { id: String(paymentId) },
        },
        rawData: JSON.stringify({
          type: "payment",
          id: `mock-${paymentId}`,
          data: { id: String(paymentId) },
        }),
        headers: {},
      },
    },
  })
}

export async function approveMockMpPayment(
  container: MedusaContainer,
  paymentId: string | number
): Promise<boolean> {
  const updated = setMockMpPaymentStatus(paymentId, "approved")
  if (!updated) return false
  await emitMockMpWebhook(container, paymentId)
  return true
}

export async function rejectMockMpPayment(
  container: MedusaContainer,
  paymentId: string | number
): Promise<boolean> {
  const updated = setMockMpPaymentStatus(paymentId, "rejected")
  if (!updated) return false
  await emitMockMpWebhook(container, paymentId)
  return true
}
