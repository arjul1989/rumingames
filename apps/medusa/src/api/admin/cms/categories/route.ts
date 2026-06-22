import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"
import { slugify } from "../../../../lib/cms"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const categories = await cms.listArticleCategories({}, { order: { name: "ASC" } })
  res.json({ categories })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as { name?: string; slug?: string }
  if (!body.name) {
    return res.status(400).json({ message: "`name` es obligatorio." })
  }
  const category = await cms.createArticleCategories({
    name: body.name,
    slug: body.slug ? slugify(body.slug) : slugify(body.name),
  })
  res.status(201).json({ category })
}
