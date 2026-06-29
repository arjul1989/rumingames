import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, OrderWorkflowEvents } from "@medusajs/framework/utils"
import { resolveOrderEmailItems, resolveOrderTotal } from "../lib/resolve-order-money"
import { sendEmail } from "../lib/email/send-email"
import { storefrontUrl } from "../lib/storefront-url"

// Sends the purchase confirmation email when an order is placed.
export default async function orderPlacedEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "shipping_address.first_name",
      "shipping_address.country_code",
      "total",
      "subtotal",
      "summary.totals.current_order_total",
      "summary.totals.raw_current_order_total",
      "payment_collections.amount",
      "payment_collections.captured_amount",
      "payment_collections.payments.amount",
      "payment_collections.payments.captured_amount",
      "items.title",
      "items.unit_price",
      "items.raw_unit_price",
      "items.quantity",
      "items.raw_quantity",
      "items.detail.quantity",
      "items.detail.subtotal",
      "items.detail.raw_subtotal",
      "items.subtotal",
      "items.total",
      "items.raw_total",
    ],
    filters: { id: event.data.id },
  })

  const order = orders[0] as
    | {
        id: string
        display_id?: number | string
        email?: string | null
        currency_code?: string
        shipping_address?: { first_name?: string | null; country_code?: string } | null
        total?: unknown
        subtotal?: unknown
        summary?: {
          totals?: {
            current_order_total?: unknown
            raw_current_order_total?: unknown
          }
        }
        payment_collections?: Array<{
          amount?: unknown
          captured_amount?: unknown
          payments?: Array<{ amount?: unknown; captured_amount?: unknown }>
        }>
        items?: Array<{
          title?: string
          unit_price?: unknown
          raw_unit_price?: unknown
          quantity?: unknown
          raw_quantity?: { value?: string }
          detail?: {
            quantity?: unknown
            subtotal?: unknown
            raw_subtotal?: unknown
          }
          subtotal?: unknown
          total?: unknown
          raw_total?: unknown
        }>
      }
    | undefined

  if (!order?.email) {
    logger.warn(`order.placed: no email for order ${event.data.id}`)
    return
  }

  const cc =
    order.shipping_address?.country_code?.toLowerCase() ?? "co"

  const total = resolveOrderTotal(order)

  try {
    await sendEmail(container, {
      to: order.email,
      template: "order-placed",
      data: {
        first_name: order.shipping_address?.first_name ?? "",
        display_id: order.display_id ?? order.id,
        order_id: order.id,
        email: order.email,
        total,
        currency_code: order.currency_code ?? "cop",
        items: resolveOrderEmailItems(order),
        order_url: storefrontUrl(`/account/orders/details/${order.id}`, cc),
        account_url: storefrontUrl("/account", cc),
      },
    })
    logger.info(`Order confirmation email queued for ${order.email}`)
  } catch (e) {
    logger.error(`Order confirmation email failed: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.PLACED,
}
