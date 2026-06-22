import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"
import { resolveRelatedProducts } from "../../../../lib/cms"

// Public single published article by slug, with related products resolved
// (US-4.1 / RUM-29, US-4.3 / RUM-31).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)

  const [article] = await cms.listArticles(
    { slug: req.params.slug, status: "published" },
    { relations: ["category", "streamer"] }
  )

  if (!article) {
    return res.status(404).json({ message: "Artículo no encontrado." })
  }

  const related_products = await resolveRelatedProducts(req.scope, article.related_product_ids)
  const tags = Array.isArray(article.tag_ids) && article.tag_ids.length
    ? await cms.listArticleTags({ id: article.tag_ids })
    : []
  res.json({ article: { ...article, related_products, tags } })
}
