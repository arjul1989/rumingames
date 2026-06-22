import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"

// Public single streamer profile by slug, with their published articles
// (US-4.4 / RUM-32, US-7.4 / RUM-40).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)

  const [streamer] = await cms.listStreamers({ slug: req.params.slug })

  if (!streamer) {
    return res.status(404).json({ message: "Streamer no encontrado." })
  }

  const articles = await cms.listArticles(
    { streamer_id: streamer.id, status: "published" },
    { relations: ["category"], order: { published_at: "DESC" } }
  )

  res.json({ streamer: { ...streamer, articles } })
}
