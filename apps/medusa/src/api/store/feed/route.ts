import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../../../modules/cms"
import type CmsModuleService from "../../../modules/cms/service"

type FeedItem = {
  type: "article" | "product" | "streamer_highlight"
  date: string
  data: Record<string, unknown>
}

const WINDOW = 50

// Unified community feed mixing articles, new products and featured streamers
// (US-4.5 / RUM-33). Sorted by date desc and paginated.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { limit = "20", offset = "0" } = req.query as Record<string, string>

  const items: FeedItem[] = []

  // Published articles.
  const articles = await cms.listArticles(
    { status: "published" },
    { relations: ["category"], take: WINDOW, order: { published_at: "DESC" } }
  )
  for (const a of articles) {
    items.push({
      type: "article",
      date: (a.published_at ?? a.created_at)?.toString?.() ?? new Date().toISOString(),
      data: a as unknown as Record<string, unknown>,
    })
  }

  // Recently created published products.
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "thumbnail", "created_at", "status"],
    filters: { status: "published" },
    pagination: { take: WINDOW, order: { created_at: "DESC" } },
  })
  for (const p of products) {
    items.push({ type: "product", date: String(p.created_at), data: p })
  }

  // Featured streamers.
  const streamers = await cms.listStreamers(
    { is_featured: true },
    { take: WINDOW, order: { updated_at: "DESC" } }
  )
  for (const s of streamers) {
    items.push({
      type: "streamer_highlight",
      date: (s.updated_at ?? s.created_at)?.toString?.() ?? new Date().toISOString(),
      data: s as unknown as Record<string, unknown>,
    })
  }

  // Merge, sort by date desc, paginate.
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const start = Number(offset)
  const page = items.slice(start, start + Number(limit))

  res.json({ items: page, count: items.length, limit: Number(limit), offset: start })
}
