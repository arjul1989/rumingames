import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"
import { normalizePaymentStatus } from "../lib/payment-status"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"

// Verifies RUM-26 (status + cancel) and RUM-27 (refund -> deliveries).
// Run: npx medusa exec ./src/scripts/verify-payments.ts
export default async function verifyPayments({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderModule = container.resolve(Modules.ORDER)
  const delivery = container.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)

  const mkOrder = (email: string) =>
    orderModule.createOrders({
      currency_code: "cop",
      email,
      items: [{ title: "Steam Gift Card", quantity: 1, unit_price: 23000 }],
    })

  // ---- RUM-26: unpaid order -> status pending, then cancel ----
  const o1 = await mkOrder("status@test.com")
  const { data: fetched } = await query.graph({
    entity: "order",
    fields: ["id", "status", "payment_status"],
    filters: { id: o1.id },
  })
  const status = normalizePaymentStatus(fetched[0].payment_status)
  logger.info(`[status] payment_status=${fetched[0].payment_status} -> public=${status} (expected pending)`)

  await cancelOrderWorkflow(container).run({ input: { order_id: o1.id } })
  const { data: afterCancel } = await query.graph({
    entity: "order",
    fields: ["id", "status"],
    filters: { id: o1.id },
  })
  logger.info(`[cancel] order status=${afterCancel[0].status} (expected canceled)`)

  // ---- RUM-27: refund marks deliveries refunded ----
  const o2 = await mkOrder("refund@test.com")
  await delivery.createDigitalDeliveries([
    { order_id: o2.id, line_item_id: "li_test", status: "delivered" },
  ])
  const count = await delivery.markOrderRefunded(o2.id)
  const rows = await delivery.listDigitalDeliveries({ order_id: o2.id })
  logger.info(`[refund] markOrderRefunded count=${count}, row status=${rows[0]?.status} (expected refunded)`)

  // ---- Cleanup ----
  await delivery.deleteDigitalDeliveries(rows.map((r) => r.id))
  await orderModule.deleteOrders([o1.id, o2.id])
  logger.info("Payments verification cleanup done.")
}
