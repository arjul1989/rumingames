import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"
import { resolveLineItemQuantity } from "../lib/fulfill-digital-order"
import { resolveMoneyAmount } from "../lib/resolve-money-amount"
import { sendEmail } from "../lib/email/send-email"
import { storefrontUrl, getStorefrontBaseUrl } from "../lib/storefront-url"

/** Resend order confirmation + digital code emails (prod-safe URLs). */
export default async function resendOrderEmails({ container }: ExecArgs) {
  const orderId = process.env.ORDER_ID
  const toOverride = process.env.TO_EMAIL?.trim().toLowerCase()
  const displayIdFilter = process.env.DISPLAY_ID

  if (!orderId && !displayIdFilter) {
    throw new Error("Set ORDER_ID or DISPLAY_ID.")
  }

  const base = getStorefrontBaseUrl()
  console.log(`Storefront base URL for emails: ${base}`)

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const delivery = container.resolve<DigitalDeliveryModuleService>(
    DIGITAL_DELIVERY_MODULE
  )

  const filters: Record<string, unknown> = orderId
    ? { id: orderId }
    : { display_id: Number(displayIdFilter) }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "shipping_address.first_name",
      "shipping_address.country_code",
      "summary.totals.current_order_total",
      "summary.totals.raw_current_order_total",
      "items.title",
      "items.quantity",
      "items.raw_quantity",
      "items.detail.quantity",
      "items.detail.subtotal",
      "items.detail.raw_subtotal",
      "items.subtotal",
      "items.total",
      "items.raw_total",
    ],
    filters,
  })

  const order = orders[0] as
    | {
        id: string
        display_id?: number
        email?: string | null
        currency_code?: string
        shipping_address?: { first_name?: string | null; country_code?: string } | null
        summary?: {
          totals?: {
            current_order_total?: unknown
            raw_current_order_total?: unknown
          }
        }
        items?: Array<{
          title?: string
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

  if (!order) {
    throw new Error("Order not found.")
  }

  const to = toOverride || order.email?.trim().toLowerCase()
  if (!to) {
    throw new Error("Order has no email; set TO_EMAIL.")
  }

  const cc = order.shipping_address?.country_code?.toLowerCase() ?? "co"
  const orderUrl = storefrontUrl(`/account/orders/details/${order.id}`, cc)
  const accountUrl = storefrontUrl("/account", cc)

  const total = resolveMoneyAmount(
    order.summary?.totals?.current_order_total ??
      order.summary?.totals?.raw_current_order_total
  )

  await sendEmail(container, {
    to,
    template: "order-placed",
    order_id: order.id,
    data: {
      first_name: order.shipping_address?.first_name ?? "",
      display_id: order.display_id ?? order.id,
      order_id: order.id,
      email: to,
      total,
      currency_code: order.currency_code ?? "cop",
      items: (order.items ?? []).map((item) => ({
        title: item.title ?? "Producto",
        quantity: resolveLineItemQuantity(item),
        total: resolveMoneyAmount(
          item.detail?.subtotal ??
            item.detail?.raw_subtotal ??
            item.subtotal ??
            item.total ??
            item.raw_total
        ),
      })),
      order_url: orderUrl,
      account_url: accountUrl,
    },
  })
  console.log(`Sent order-placed → ${to}`)
  console.log(`  order_url: ${orderUrl}`)
  console.log(`  account_url: ${accountUrl}`)

  const deliveries = await delivery.listDigitalDeliveries({
    order_id: order.id,
    status: "delivered",
  })
  const row = deliveries[0]
  if (!row) {
    console.log("No delivered digital code; skipped digital-code-delivered.")
    return
  }

  const code = await delivery.revealCode(row.id)
  if (!code) {
    throw new Error("Could not decrypt digital code.")
  }

  const product = order.items?.[0]?.title ?? "Producto digital"
  await sendEmail(container, {
    to,
    template: "digital-code-delivered",
    order_id: order.id,
    data: {
      product,
      display_id: order.display_id ?? order.id,
      code,
      orders_url: orderUrl,
      account_url: accountUrl,
    },
  })
  console.log(`Sent digital-code-delivered → ${to}`)
  console.log(`  orders_url: ${orderUrl}`)
}
