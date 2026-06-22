import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

// GET /api/articles — list published news articles (US-5.1 / RUM-35).
export const GET = withBff(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams
  const res = await medusaFetch("/store/articles", {
    query: {
      limit: sp.get("limit") || "20",
      offset: sp.get("offset") || "0",
      category_id: sp.get("category_id") || undefined,
    },
    revalidate: 60,
  })

  if (!res.ok) return error(req, res.error || "No se pudieron cargar artículos", res.status)
  return json(req, res.data)
}, { bucket: "articles" })
