import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"
import { slugify } from "../../../../lib/cms"

// List article tags for the editor's tag picker (US-4.1 / RUM-29).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const tags = await cms.listArticleTags({}, { order: { name: "ASC" } })
  res.json({ tags })
}

// Create a tag on the fly from the article editor.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as { name?: string }
  if (!body.name) {
    return res.status(400).json({ message: "`name` es obligatorio." })
  }
  const slug = slugify(body.name)
  const [existing] = await cms.listArticleTags({ slug })
  if (existing) {
    return res.json({ tag: existing })
  }
  const [tag] = await cms.createArticleTags([{ name: body.name, slug }])
  res.status(201).json({ tag })
}
