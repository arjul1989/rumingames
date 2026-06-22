import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../modules/cms"
import type CmsModuleService from "../../../modules/cms/service"

// Public list of article categories (US-7.3 / RUM-47), used by the storefront
// to render the category filter on the news listing.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const categories = await cms.listArticleCategories({}, { order: { name: "ASC" } })
  res.json({ categories })
}
