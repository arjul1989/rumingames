import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms"
import type CmsModuleService from "../../../../../modules/cms/service"
import { slugify } from "../../../../../lib/cms"

const RELATIONS = ["category", "streamer"]

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  try {
    const article = await cms.retrieveArticle(req.params.id, { relations: RELATIONS })
    res.json({ article })
  } catch {
    res.status(404).json({ message: "Artículo no encontrado." })
  }
}

// Update an article. Sets published_at when transitioning to published
// (US-4.1 / RUM-29, US-4.2 / RUM-30).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as Record<string, any>
  const id = req.params.id

  let current
  try {
    current = await cms.retrieveArticle(id)
  } catch {
    return res.status(404).json({ message: "Artículo no encontrado." })
  }

  const update: Record<string, unknown> = { id }
  if (body.title !== undefined) update.title = body.title
  if (body.slug !== undefined) update.slug = slugify(body.slug)
  if (body.excerpt !== undefined) update.excerpt = body.excerpt
  if (body.body !== undefined) update.body = body.body
  if (body.cover_image !== undefined) update.cover_image = body.cover_image
  if (body.author !== undefined) update.author = body.author
  if (body.category_id !== undefined) update.category_id = body.category_id
  if (body.streamer_id !== undefined) update.streamer_id = body.streamer_id
  if (Array.isArray(body.related_product_ids)) update.related_product_ids = body.related_product_ids
  if (Array.isArray(body.tag_ids)) update.tag_ids = body.tag_ids

  if (body.status !== undefined && body.status !== current.status) {
    update.status = body.status
    // Stamp publish time the first time it goes live.
    if (body.status === "published" && !current.published_at) {
      update.published_at = new Date()
    }
  }

  await cms.updateArticles(update)
  const article = await cms.retrieveArticle(id, { relations: RELATIONS })
  res.json({ article })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  await cms.deleteArticles([req.params.id])
  res.json({ id: req.params.id, deleted: true })
}
