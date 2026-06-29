import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"
import { resolveOrderEmailItems, resolveOrderTotal } from "../lib/resolve-order-money"
import { sendDigitalCodesEmail } from "../lib/send-digital-codes-email"
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
      "items.id",
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
          id?: string
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

  const total = resolveOrderTotal(order)

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
      items: resolveOrderEmailItems(order),
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
  if (!deliveries.length) {
    console.log("No delivered digital code; skipped digital-code-delivered.")
    return
  }

  const itemsById = new Map(
    (order.items ?? [])
      .filter((item) => item.id)
      .map((item) => [item.id!, item.title ?? "Producto digital"])
  )

  const codes: Array<{ product: string; code: string }> = []
  for (const row of deliveries) {
    const code = await delivery.revealCode(row.id)
    if (!code) continue
    codes.push({
      product: itemsById.get(row.line_item_id) ?? "Producto digital",
      code,
    })
  }

  if (!codes.length) {
    throw new Error("Could not decrypt digital codes.")
  }

  await sendDigitalCodesEmail(container, {
    to,
    display_id: order.display_id ?? order.id,
    order_id: order.id,
    codes,
    country_code: cc,
  })
  console.log(`Sent digital-code-delivered (${codes.length} codes) → ${to}`)
  console.log(`  orders_url: ${orderUrl}`)
}
