import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"
import { slugify } from "../../../../lib/cms"

const RELATIONS = ["category", "streamer"]

// List articles for the admin (US-4.1 / RUM-29) with pagination and filters.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const { status, category_id, streamer_id, q, limit = "20", offset = "0" } =
    req.query as Record<string, string>

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (category_id) filters.category_id = category_id
  if (streamer_id) filters.streamer_id = streamer_id
  if (q) filters.title = { $ilike: `%${q}%` }

  const [articles, count] = await cms.listAndCountArticles(filters, {
    relations: RELATIONS,
    take: Number(limit),
    skip: Number(offset),
    order: { created_at: "DESC" },
  })

  res.json({ articles, count, limit: Number(limit), offset: Number(offset) })
}

// Create an article (US-4.1 / RUM-29, US-4.3 / RUM-31).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as Record<string, any>

  if (!body.title || !body.body) {
    return res.status(400).json({ message: "`title` y `body` son obligatorios." })
  }

  const status = body.status ?? "draft"
  const article = await cms.createArticles({
    title: body.title,
    slug: body.slug ? slugify(body.slug) : slugify(body.title),
    excerpt: body.excerpt ?? null,
    body: body.body,
    cover_image: body.cover_image ?? null,
    author: body.author ?? null,
    status,
    published_at: status === "published" ? new Date() : null,
    related_product_ids: Array.isArray(body.related_product_ids) ? body.related_product_ids : [],
    tag_ids: Array.isArray(body.tag_ids) ? body.tag_ids : [],
    category_id: body.category_id ?? null,
    streamer_id: body.streamer_id ?? null,
    seo_title: body.seo_title ?? null,
    seo_description: body.seo_description ?? null,
    og_image: body.og_image ?? null,
  })

  res.status(201).json({ article })
}
