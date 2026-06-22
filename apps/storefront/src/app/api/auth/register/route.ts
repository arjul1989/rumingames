import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"
import { setSessionCookie } from "@lib/bff/auth"

export const OPTIONS = options

// POST /api/auth/register — register a new customer (US-5.3 / RUM-37).
// Obtains a registration token, creates the customer, then logs in.
export const POST = withBff(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string
    password?: string
    first_name?: string
    last_name?: string
    phone?: string
  }
  if (!body.email || !body.password) return error(req, "email y password requeridos", 422)

  const reg = await medusaFetch<{ token: string }>("/auth/customer/emailpass/register", {
    method: "POST",
    body: { email: body.email, password: body.password },
  })
  if (!reg.ok || !reg.data?.token) {
    return error(req, reg.error || "No se pudo registrar (¿email ya existe?)", reg.status || 400)
  }

  const created = await medusaFetch<{ customer: unknown }>("/store/customers", {
    method: "POST",
    token: reg.data.token,
    body: {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
    },
  })
  if (!created.ok) return error(req, created.error || "No se pudo crear el cliente", created.status)

  // The registration token has no actor yet; re-authenticate so the session
  // cookie carries a customer-scoped JWT (actor_id set) usable by /auth/me etc.
  const auth = await medusaFetch<{ token: string }>("/auth/customer/emailpass", {
    method: "POST",
    body: { email: body.email, password: body.password },
  })
  const token = auth.ok && auth.data?.token ? auth.data.token : reg.data.token

  const out = json(req, { customer: created.data?.customer ?? null }, 201)
  setSessionCookie(out, token)
  return out
}, { bucket: "auth" })
