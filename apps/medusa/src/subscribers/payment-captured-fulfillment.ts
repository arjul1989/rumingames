import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { fulfillDigitalOrder } from "../lib/fulfill-digital-order"
import { fundAndFulfillDigitalOrder } from "../lib/funding/fund-and-fulfill-order"
import { isPerOrderFundingEnabled } from "../lib/funding/funding-config"
import { isMockFazerEnabled } from "../lib/dev-mocks"

// When a payment is captured, fulfill the order's digital line items against
// Fazer Cards (US-2.4 / RUM-19). Resolves the order from the payment via the
// order <-> payment_collection module link.
export default async function paymentCapturedFulfillmentHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  if (!process.env.FAZER_API_KEY && !isMockFazerEnabled()) {
    logger.info("Skipping fulfillment: FAZER_API_KEY not set.")
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let orderId: string | undefined
  try {
    const { data } = await query.graph({
      entity: "payment",
      fields: ["id", "payment_collection.order.id"],
      filters: { id: event.data.id },
    })
    orderId = data?.[0]?.payment_collection?.order?.id
  } catch (e) {
    logger.error(`Could not resolve order from payment ${event.data.id}: ${(e as Error).message}`)
    return
  }

  if (!orderId) {
    logger.warn(`No order found for captured payment ${event.data.id}.`)
    return
  }

  await (isPerOrderFundingEnabled() ? fundAndFulfillDigitalOrder : fulfillDigitalOrder)(
    container,
    { orderId }
  )
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
