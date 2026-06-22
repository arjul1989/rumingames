import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

const CART_FIELDS =
  "*items,*items.variant,*items.product,*region,total,subtotal,tax_total,shipping_total,discount_total,email"

// POST /api/cart/:id — update cart fields (email, billing_address, etc.).
export const POST = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const res = await medusaFetch(`/store/carts/${id}`, {
      method: "POST",
      body,
      query: { fields: CART_FIELDS },
    })
    if (!res.ok) return error(req, res.error || "No se pudo actualizar el carrito", res.status)
    return json(req, res.data)
  },
  { bucket: "cart" }
)
