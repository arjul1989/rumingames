import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"
import { getSessionToken } from "@lib/bff/auth"

export const OPTIONS = options

// GET /api/orders/:id/digital-codes — reveal purchased codes (US-5.3 / RUM-37).
// Requires an authenticated customer; the backend additionally enforces that
// the order belongs to the requesting customer (ownership).
export const GET = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const token = getSessionToken(req)
    if (!token) return error(req, "No autenticado", 401)

    const { id } = await ctx.params
    const res = await medusaFetch(`/store/orders/${id}/digital-codes`, { token })
    if (!res.ok)
      return error(req, res.error || "No se pudieron obtener los códigos", res.status)
    return json(req, res.data)
  },
  { bucket: "orders" }
)
