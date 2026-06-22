import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

// GET /api/feed — unified community feed (articles + products + streamers)
// (US-5.1 / RUM-35).
export const GET = withBff(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams
  const res = await medusaFetch("/store/feed", {
    query: {
      limit: sp.get("limit") || "20",
      offset: sp.get("offset") || "0",
    },
    revalidate: 30,
  })

  if (!res.ok) return error(req, res.error || "No se pudo cargar el feed", res.status)
  return json(req, res.data)
}, { bucket: "feed" })
