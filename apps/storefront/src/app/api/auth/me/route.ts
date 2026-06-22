import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"
import { getSessionToken } from "@lib/bff/auth"

export const OPTIONS = options

// GET /api/auth/me — current customer from the session cookie (US-5.3 / RUM-37).
export const GET = withBff(async (req: NextRequest) => {
  const token = getSessionToken(req)
  if (!token) return json(req, { customer: null }, 200)

  const me = await medusaFetch<{ customer: unknown }>("/store/customers/me", { token })
  if (!me.ok) return json(req, { customer: null }, 200)
  return json(req, { customer: me.data?.customer ?? null })
}, { bucket: "auth" })
