import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { getAuthActorId } from "../../../../../lib/auth-context"
import { DIGITAL_DELIVERY_MODULE } from "../../../../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../../../../modules/digital-delivery/service"

// Reveals delivered digital codes for an order the customer owns (US-2.4 / RUM-19).
// Auth is enforced by middleware; here we verify ownership before decrypting.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderId = req.params.id
  const customerId = getAuthActorId(req)

  if (!customerId) {
    return res.status(401).json({ message: "No autenticado." })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id"],
    filters: { id: orderId },
  })
  const order = orders[0]

  if (!order || order.customer_id !== customerId) {
    // Don't leak existence of other customers' orders.
    return res.status(404).json({ message: "Orden no encontrada." })
  }

  const delivery = req.scope.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const deliveries = await delivery.listDigitalDeliveries({ order_id: orderId })

  const codes = await Promise.all(
    deliveries.map(async (d) => ({
      line_item_id: d.line_item_id,
      status: d.status,
      code: d.status === "delivered" ? await delivery.revealCode(d.id) : null,
    }))
  )

  res.json({ order_id: orderId, codes })
}
