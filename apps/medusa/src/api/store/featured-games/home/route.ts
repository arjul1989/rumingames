import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"
import { resolveRelatedProducts } from "../../../../lib/cms"

// Published featured games slotted for the home hero (positions 1–3).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)

  const published = await cms.listFeaturedGames(
    { status: "published" },
    { order: { home_position: "ASC" }, take: 50 }
  )

  const featured_games = published
    .filter((game) => game.home_position && game.home_position >= 1 && game.home_position <= 3)
    .sort((a, b) => (a.home_position ?? 0) - (b.home_position ?? 0))
    .slice(0, 3)

  const games = await Promise.all(
    featured_games.map(async (game) => ({
      ...game,
      related_products: await resolveRelatedProducts(req.scope, game.related_product_ids),
    }))
  )

  res.json({ featured_games: games, count: games.length })
}
