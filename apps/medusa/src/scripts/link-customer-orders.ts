import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"
import { linkGuestOrdersToCustomer } from "../lib/link-guest-orders-to-customer"
import { sendEmail } from "../lib/email/send-email"
import { storefrontUrl } from "../lib/storefront-url"

export default async function linkCustomerOrders({ container }: ExecArgs) {
  const customerId = process.env.CUSTOMER_ID
  const orderId = process.env.ORDER_ID
  const resendCode = process.env.RESEND_CODE === "true"

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const delivery = container.resolve<DigitalDeliveryModuleService>(
    DIGITAL_DELIVERY_MODULE
  )

  if (customerId) {
    const { data: customers } = await query.graph({
      entity: "customer",
      fields: ["id", "email"],
      filters: { id: customerId },
    })
    const customer = customers[0] as { id: string; email?: string } | undefined
    if (!customer?.email) {
      throw new Error("Customer not found or missing email.")
    }
    const linked = await linkGuestOrdersToCustomer(
      container,
      customer.id,
      customer.email
    )
    console.log(`Linked ${linked} order(s) to ${customer.id}`)
  }

  if (!orderId) return

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "items.title"],
    filters: { id: orderId },
  })
  const order = orders[0] as
    | {
        id: string
        display_id?: number
        email?: string
        items?: Array<{ title?: string }>
      }
    | undefined

  if (!order) {
    throw new Error(`Order ${orderId} not found.`)
  }

  if (customerId && order.email) {
    await linkGuestOrdersToCustomer(container, customerId, order.email)
  }

  if (!resendCode) return

  const deliveries = await delivery.listDigitalDeliveries({
    order_id: orderId,
    status: "delivered",
  })
  const row = deliveries[0]
  if (!row) {
    throw new Error("No delivered digital code for this order.")
  }

  const code = await delivery.revealCode(row.id)
  if (!code) {
    throw new Error("Could not decrypt digital code.")
  }

  const product = order.items?.[0]?.title ?? "Producto digital"
  await sendEmail(container, {
    to: order.email ?? "",
    template: "digital-code-delivered",
    data: {
      product,
      display_id: order.display_id ?? order.id,
      code,
      orders_url: storefrontUrl(`/account/orders/details/${order.id}`),
      account_url: storefrontUrl("/account"),
    },
  })
  console.log(`Digital code email resent to ${order.email}`)
}
