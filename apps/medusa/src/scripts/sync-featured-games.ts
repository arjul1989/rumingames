import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms"
import type CmsModuleService from "../modules/cms/service"

type GameSeed = {
  slug: string
  title: string
  excerpt: string
  cover_image: string
  home_position: number
  related_handles: string[]
  days_ago: number
}

const HOME_GAMES: GameSeed[] = [
  {
    slug: "gta-vi-destacado",
    title: "GTA VI — prepárate para Vice City",
    excerpt:
      "La secuela más esperada llega pronto. Recarga tu billetera y ten listo tu saldo para el lanzamiento.",
    cover_image: "/articles/gta-6-portada.jpg",
    home_position: 1,
    related_handles: ["steam-gift-card", "riot-points"],
    days_ago: 0,
  },
  {
    slug: "monster-hunter-stories-3-destacado",
    title: "Monster Hunter Stories 3",
    excerpt:
      "Una nueva aventura de crianza y combate. Consigue tu gift card y no te quedes sin jugar.",
    cover_image: "/articles/monster-hunter-stories-3.jpg",
    home_position: 2,
    related_handles: ["steam-gift-card"],
    days_ago: 2,
  },
  {
    slug: "star-fox-destacado",
    title: "Star Fox — el regreso de Fox McCloud",
    excerpt:
      "Nintendo revive la saga de combate aéreo en Switch 2. Carga tu eShop y vuela el día del lanzamiento.",
    cover_image: "/articles/star-fox.jpg",
    home_position: 3,
    related_handles: ["nintendo-gift-card"],
    days_ago: 1,
  },
]

// Keeps the 3 home featured-game slots in sync (images, copy, products).
// Run: npx medusa exec ./src/scripts/sync-featured-games.ts
export default async function syncFeaturedGames({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cms = container.resolve<CmsModuleService>(CMS_MODULE)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    pagination: { take: 100 },
  })
  const byHandle = new Map(
    products.map((p: { id: string; handle: string }) => [p.handle, p.id])
  )

  const now = Date.now()
  const daysAgo = (n: number) => new Date(now - n * 86400000)

  for (const game of HOME_GAMES) {
    const related_product_ids = game.related_handles
      .map((h) => byHandle.get(h))
      .filter(Boolean) as string[]

    const payload = {
      title: game.title,
      excerpt: game.excerpt,
      body: null,
      cover_image: game.cover_image,
      status: "published" as const,
      published_at: daysAgo(game.days_ago),
      related_product_ids,
      home_position: game.home_position,
    }

    const [existing] = await cms.listFeaturedGames({ slug: game.slug }, { take: 1 })

    if (existing) {
      await cms.updateFeaturedGames({ id: existing.id, ...payload })
      logger.info(`Updated featured game: ${game.slug}`)
      continue
    }

    await cms.createFeaturedGames({
      slug: game.slug,
      ...payload,
    } as Parameters<CmsModuleService["createFeaturedGames"]>[0])
    logger.info(`Created featured game: ${game.slug}`)
  }

  // Clear home slots from old entries no longer in the lineup.
  const keepSlugs = new Set(HOME_GAMES.map((g) => g.slug))
  const allGames = await cms.listFeaturedGames({}, { take: 50 })
  for (const game of allGames) {
    if (game.home_position && !keepSlugs.has(game.slug)) {
      await cms.updateFeaturedGames({ id: game.id, home_position: null })
      logger.info(`Removed from home: ${game.slug}`)
    }
  }

  logger.info("Featured games home lineup synced.")
}
