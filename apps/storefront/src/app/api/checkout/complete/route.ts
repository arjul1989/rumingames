import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

const CART_COOKIE = "_gorumin_cart_id"

// POST /api/checkout/complete — complete the cart and place the order
// (US-5.1 / RUM-35). Body: { cart_id }. Clears the cart cookie on success.
export const POST = withBff(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as { cart_id?: string }
  const cartId = body.cart_id || req.cookies.get(CART_COOKIE)?.value
  if (!cartId) return error(req, "cart_id es requerido", 422)

  const res = await medusaFetch<{ type: string; order?: unknown; cart?: unknown }>(
    `/store/carts/${cartId}/complete`,
    { method: "POST" }
  )
  if (!res.ok) return error(req, res.error || "No se pudo completar la orden", res.status)

  const out = json(req, res.data)
  if (res.data?.type === "order") out.cookies.delete(CART_COOKIE)
  return out
}, { bucket: "checkout" })
