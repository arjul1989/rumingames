import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_DELIVERY_MODULE } from "../../../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../../../modules/digital-delivery/service"

// List digital deliveries for the fulfillment admin panel (US-2.4 / RUM-19).
// Codes are never returned here — only delivery status and metadata.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const dd = req.scope.resolve<DigitalDeliveryModuleService>(DIGITAL_DELIVERY_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { status, limit = "100", offset = "0" } = req.query as Record<string, string>
  const filters: Record<string, unknown> = {}
  if (status) filters.status = status

  const [deliveries, count] = await dd.listAndCountDigitalDeliveries(filters, {
    take: Number(limit),
    skip: Number(offset),
    order: { created_at: "DESC" },
  })

  const orderIds = [...new Set(deliveries.map((d) => d.order_id).filter(Boolean))]
  const display = new Map<string, number>()
  const emailByOrder = new Map<string, string>()
  if (orderIds.length) {
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "email"],
      filters: { id: orderIds },
    })
    data.forEach((row) => {
      const o = row as { id: string; display_id?: number | string; email?: string | null }
      if (!o.id) return
      if (o.display_id != null) display.set(o.id, Number(o.display_id))
      if (o.email) emailByOrder.set(o.id, o.email)
    })
  }

  const enriched = deliveries.map((d) => ({
    id: d.id,
    order_id: d.order_id,
    display_id: display.get(d.order_id) ?? null,
    email: emailByOrder.get(d.order_id) ?? null,
    line_item_id: d.line_item_id,
    fazer_order_id: d.fazer_order_id,
    status: d.status,
    error_message: d.error_message,
    delivered_at: d.delivered_at,
    created_at: d.created_at,
  }))

  res.json({ deliveries: enriched, count, limit: Number(limit), offset: Number(offset) })
}
