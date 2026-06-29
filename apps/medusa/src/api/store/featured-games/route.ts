import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../modules/cms"
import type CmsModuleService from "../../../modules/cms/service"

// Public list of published featured games.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const { limit = "12", offset = "0" } = req.query as Record<string, string>

  const [featured_games, count] = await cms.listAndCountFeaturedGames(
    { status: "published" },
    {
      take: Number(limit),
      skip: Number(offset),
      order: { published_at: "DESC" },
    }
  )

  res.json({ featured_games, count, limit: Number(limit), offset: Number(offset) })
}
