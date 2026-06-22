import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

// GET /api/articles/:slug — single published article with related products
// and tags resolved by the backend (US-5.1 / RUM-35).
export const GET = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ slug: string }> }) => {
    const { slug } = await ctx.params
    const res = await medusaFetch(`/store/articles/${encodeURIComponent(slug)}`, {
      revalidate: 60,
    })
    if (!res.ok) return error(req, res.error || "Artículo no encontrado", res.status)
    return json(req, res.data)
  },
  { bucket: "article-detail" }
)
