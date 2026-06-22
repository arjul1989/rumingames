import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json } from "@lib/bff/http"
import { clearSessionCookie } from "@lib/bff/auth"

export const OPTIONS = options

// POST /api/auth/logout — clear the customer session cookie (US-5.3 / RUM-37).
export const POST = withBff(async (req: NextRequest) => {
  const out = json(req, { success: true })
  clearSessionCookie(out)
  return out
}, { bucket: "auth" })
