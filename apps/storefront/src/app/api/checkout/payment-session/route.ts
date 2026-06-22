import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

const DEFAULT_PROVIDER =
  process.env.NEXT_PUBLIC_PAYMENT_PROVIDER_ID || "pp_mercadopago_mercadopago"

// POST /api/checkout/payment-session — ensure a payment collection for the cart
// and initiate a provider session (US-5.1 / RUM-35). Body: { cart_id, provider_id? }.
export const POST = withBff(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    cart_id?: string
    provider_id?: string
  }
  if (!body.cart_id) return error(req, "cart_id es requerido", 422)
  const providerId = body.provider_id || DEFAULT_PROVIDER

  // 1) Create (or reuse) the payment collection for the cart.
  const pc = await medusaFetch<{ payment_collection: { id: string } }>(
    "/store/payment-collections",
    { method: "POST", body: { cart_id: body.cart_id } }
  )
  if (!pc.ok) return error(req, pc.error || "No se pudo crear la colección de pago", pc.status)
  const collectionId = pc.data?.payment_collection?.id
  if (!collectionId) return error(req, "Colección de pago inválida", 500)

  // 2) Initiate the provider payment session.
  const session = await medusaFetch(
    `/store/payment-collections/${collectionId}/payment-sessions`,
    { method: "POST", body: { provider_id: providerId } }
  )
  if (!session.ok)
    return error(req, session.error || "No se pudo iniciar el pago", session.status)

  return json(req, session.data)
}, { bucket: "checkout" })
