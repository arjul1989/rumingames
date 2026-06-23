import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"

const TIMEOUT_MINUTES = 30

// Cancels orders that haven't been paid within 30 minutes (US-3.4 / RUM-26),
// freeing reserved state and keeping the order list clean.
export default async function cancelUnpaidOrdersJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000).toISOString()

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "status", "payment_status", "created_at"],
    filters: {
      status: ["pending", "requires_action"],
      created_at: { $lt: cutoff },
    },
  })

  const unpaid = orders.filter((order) => {
    const ps = (order as { payment_status?: string }).payment_status
    return !ps || ["not_paid", "awaiting", "requires_action"].includes(ps)
  })

  if (!unpaid.length) {
    return
  }

  let canceled = 0
  for (const order of unpaid) {
    try {
      await cancelOrderWorkflow(container).run({ input: { order_id: order.id } })
      canceled++
    } catch (e) {
      logger.warn(
        `Could not cancel unpaid order #${order.display_id ?? order.id}: ${(e as Error).message}`
      )
    }
  }

  logger.info(`Cancelled ${canceled}/${unpaid.length} unpaid orders older than ${TIMEOUT_MINUTES}m.`)
}

export const config = {
  name: "cancel-unpaid-orders",
  // Every 5 minutes.
  schedule: "*/5 * * * *",
}
