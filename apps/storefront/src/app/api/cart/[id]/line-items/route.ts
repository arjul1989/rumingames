import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

const CART_FIELDS =
  "*items,*items.variant,*items.product,*region,total,subtotal,tax_total,discount_total"

// POST /api/cart/:id/line-items — add a line item (body: { variant_id, quantity }).
export const POST = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as {
      variant_id?: string
      quantity?: number
    }
    if (!body.variant_id) return error(req, "variant_id es requerido", 422)

    const res = await medusaFetch(`/store/carts/${id}/line-items`, {
      method: "POST",
      body: { variant_id: body.variant_id, quantity: body.quantity ?? 1 },
      query: { fields: CART_FIELDS },
    })
    if (!res.ok) return error(req, res.error || "No se pudo agregar el producto", res.status)
    return json(req, res.data)
  },
  { bucket: "cart" }
)
