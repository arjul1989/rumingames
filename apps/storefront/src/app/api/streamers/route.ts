import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

// GET /api/streamers — community streamer profiles (US-5.1 / RUM-35).
export const GET = withBff(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams
  const res = await medusaFetch("/store/streamers", {
    query: {
      featured: sp.get("featured") || undefined,
      limit: sp.get("limit") || "50",
      offset: sp.get("offset") || "0",
    },
    revalidate: 120,
  })

  if (!res.ok) return error(req, res.error || "No se pudieron cargar streamers", res.status)
  return json(req, res.data)
}, { bucket: "streamers" })
