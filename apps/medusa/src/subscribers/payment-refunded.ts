import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, PaymentEvents } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"

// When a payment is refunded (admin action or MP webhook), mark the order's
// digital deliveries as refunded (US-3.5 / RUM-27).
export default async function paymentRefundedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const delivery = container.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)

  // Resolve the order from the refunded payment via the module link.
  const { data } = await query.graph({
    entity: "payment",
    fields: ["id", "payment_collection.order.id"],
    filters: { id: event.data.id },
  })
  const orderId = data?.[0]?.payment_collection?.order?.id
  if (!orderId) {
    logger.warn(`payment.refunded: could not resolve order for payment ${event.data.id}.`)
    return
  }

  const updated = await delivery.markOrderRefunded(orderId)
  logger.info(`Marked ${updated} digital deliveries refunded for order ${orderId}.`)
}

export const config: SubscriberConfig = {
  event: PaymentEvents.REFUNDED,
}
