import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"
import { setSessionCookie } from "@lib/bff/auth"

export const OPTIONS = options

// POST /api/auth/login — email/password login (US-5.3 / RUM-37).
// On success the customer JWT is stored in an httpOnly cookie.
export const POST = withBff(async (req: NextRequest) => {
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
  if (!body.email || !body.password) return error(req, "email y password requeridos", 422)

  const auth = await medusaFetch<{ token: string }>("/auth/customer/emailpass", {
    method: "POST",
    body: { email: body.email, password: body.password },
  })
  if (!auth.ok || !auth.data?.token) {
    return error(req, "Credenciales inválidas", 401)
  }

  const me = await medusaFetch<{ customer: unknown }>("/store/customers/me", {
    token: auth.data.token,
  })

  const out = json(req, { customer: me.data?.customer ?? null })
  setSessionCookie(out, auth.data.token)
  return out
}, { bucket: "auth" })
