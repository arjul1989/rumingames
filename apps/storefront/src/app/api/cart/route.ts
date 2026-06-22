import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"
import { resolveRegionId } from "@lib/bff/region"

export const OPTIONS = options

const CART_COOKIE = "_gorumin_cart_id"
const CART_FIELDS =
  "*items,*items.variant,*items.product,*region,+items.thumbnail,*promotions,total,subtotal,tax_total,shipping_total,discount_total"

// GET /api/cart — retrieve the current cart (?id= or _gorumin_cart_id cookie).
export const GET = withBff(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id") || req.cookies.get(CART_COOKIE)?.value
  if (!id) return json(req, { cart: null })

  const res = await medusaFetch<{ cart: unknown }>(`/store/carts/${id}`, {
    query: { fields: CART_FIELDS },
  })
  if (!res.ok) return error(req, res.error || "Carrito no encontrado", res.status)
  return json(req, res.data)
}, { bucket: "cart" })

// POST /api/cart — create a cart for a region (body: { region?, items? }).
export const POST = withBff(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    region?: string
    email?: string
    items?: { variant_id: string; quantity: number }[]
  }
  const region_id = await resolveRegionId(body.region)
  if (!region_id) return error(req, "No hay regiones configuradas", 500)

  const res = await medusaFetch<{ cart: { id: string } }>("/store/carts", {
    method: "POST",
    body: { region_id, email: body.email, items: body.items },
    query: { fields: CART_FIELDS },
  })
  if (!res.ok) return error(req, res.error || "No se pudo crear el carrito", res.status)

  const out = json(req, res.data, 201)
  const cartId = res.data?.cart?.id
  if (cartId) {
    out.cookies.set(CART_COOKIE, cartId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  }
  return out
}, { bucket: "cart" })
