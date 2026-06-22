import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

// GET /api/orders/:id/payment-status — normalized payment status for polling
// after checkout (US-5.1 / RUM-35). The order id acts as the access token.
export const GET = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const res = await medusaFetch(`/store/orders/${id}/payment-status`)
    if (!res.ok) return error(req, res.error || "No disponible", res.status)
    return json(req, res.data)
  },
  { bucket: "orders" }
)
