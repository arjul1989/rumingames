import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

const CART_FIELDS =
  "*items,*items.variant,*items.product,*region,total,subtotal,tax_total,discount_total"

// POST /api/cart/:id/line-items/:line — update quantity (body: { quantity }).
export const POST = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ id: string; line: string }> }) => {
    const { id, line } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as { quantity?: number }
    if (typeof body.quantity !== "number")
      return error(req, "quantity numérico es requerido", 422)

    const res = await medusaFetch(`/store/carts/${id}/line-items/${line}`, {
      method: "POST",
      body: { quantity: body.quantity },
      query: { fields: CART_FIELDS },
    })
    if (!res.ok) return error(req, res.error || "No se pudo actualizar la línea", res.status)
    return json(req, res.data)
  },
  { bucket: "cart" }
)

// DELETE /api/cart/:id/line-items/:line — remove a line item.
export const DELETE = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ id: string; line: string }> }) => {
    const { id, line } = await ctx.params
    const res = await medusaFetch(`/store/carts/${id}/line-items/${line}`, {
      method: "DELETE",
    })
    if (!res.ok) return error(req, res.error || "No se pudo eliminar la línea", res.status)
    return json(req, res.data)
  },
  { bucket: "cart" }
)
