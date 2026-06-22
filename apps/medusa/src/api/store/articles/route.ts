import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../modules/cms"
import type CmsModuleService from "../../../modules/cms/service"

// Public list of published articles (US-4.1 / RUM-29).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const { category_id, limit = "12", offset = "0" } = req.query as Record<string, string>

  const filters: Record<string, unknown> = { status: "published" }
  if (category_id) filters.category_id = category_id

  const [articles, count] = await cms.listAndCountArticles(filters, {
    relations: ["category"],
    take: Number(limit),
    skip: Number(offset),
    order: { published_at: "DESC" },
  })

  res.json({ articles, count, limit: Number(limit), offset: Number(offset) })
}
