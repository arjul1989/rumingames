import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules, OrderWorkflowEvents } from "@medusajs/framework/utils"

type GoruminPricingMeta = Record<string, unknown>

// Copies gorumin_pricing from the source cart onto the order when Medusa omits it.
export default async function persistOrderPricingMetadataHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderModule = container.resolve(Modules.ORDER)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "metadata", "cart.metadata"],
    filters: { id: event.data.id },
  })

  const order = orders[0] as
    | {
        id?: string
        metadata?: Record<string, unknown> | null
        cart?: { metadata?: Record<string, unknown> | null } | null
      }
    | undefined

  if (!order?.id) return

  const orderMeta = (order.metadata ?? {}) as Record<string, unknown>
  if (orderMeta.gorumin_pricing) return

  const cartPricing = (
    order.cart?.metadata as { gorumin_pricing?: GoruminPricingMeta } | null | undefined
  )?.gorumin_pricing

  if (!cartPricing) return

  await orderModule.updateOrders([
    {
      id: order.id,
      metadata: {
        ...orderMeta,
        gorumin_pricing: cartPricing,
      },
    },
  ])
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
}
