import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms"
import type CmsModuleService from "../modules/cms/service"

// Demo content for the community CMS (Epic 4 / Epic 7). Idempotent-ish: skips
// seeding when articles already exist. Run with:
//   npx medusa exec ./src/migration-scripts/cms-seed.ts
export default async function cms_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cms = container.resolve<CmsModuleService>(CMS_MODULE)

  const existing = await cms.listArticles({}, { take: 1 })
  const existingGames = await cms.listFeaturedGames({}, { take: 1 })

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    pagination: { take: 50 },
  })
  const byHandle = new Map(products.map((p: { id: string; handle: string }) => [p.handle, p.id]))
  const steamId = byHandle.get("steam-gift-card")
  const riotId = byHandle.get("riot-points")
  const ffId = byHandle.get("free-fire-diamantes")
  const nintendoId = byHandle.get("nintendo-gift-card")

  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000)

  if (!existingGames.length && steamId) {
    await cms.createFeaturedGames([
      {
        title: "GTA VI — prepárate para Vice City",
        slug: "gta-vi-destacado",
        excerpt:
          "La secuela más esperada llega pronto. Recarga tu billetera y ten listo tu saldo para el lanzamiento.",
        body: null,
        cover_image: "/articles/gta-6-portada.jpg",
        status: "published",
        published_at: daysAgo(0),
        related_product_ids: [steamId, riotId].filter(Boolean),
        home_position: 1,
      },
      {
        title: "Monster Hunter Stories 3",
        slug: "monster-hunter-stories-3-destacado",
        excerpt:
          "Una nueva aventura de crianza y combate. Consigue tu gift card y no te quedes sin jugar.",
        body: null,
        cover_image: "/articles/monster-hunter-stories-3.jpg",
        status: "published",
        published_at: daysAgo(2),
        related_product_ids: [steamId].filter(Boolean),
        home_position: 2,
      },
      {
        title: "Star Fox — el regreso de Fox McCloud",
        slug: "star-fox-destacado",
        excerpt:
          "Nintendo revive la saga de combate aéreo en Switch 2. Carga tu eShop y vuela el día del lanzamiento.",
        body: null,
        cover_image: "/articles/star-fox.jpg",
        status: "published",
        published_at: daysAgo(1),
        related_product_ids: [nintendoId].filter(Boolean),
        home_position: 3,
      },
    ])
    logger.info("Featured games demo content seeded.")
  }

  if (existing.length) {
    logger.info("CMS already has articles, skipping article seed.")
    return
  }

  logger.info("Seeding CMS demo content...")

  // Fetch-or-create helpers (categories/tags/streamers may already exist).
  const ensureCategory = async (name: string, slug: string) => {
    const [found] = await cms.listArticleCategories({ slug })
    if (found) return found
    const [created] = await cms.createArticleCategories([{ name, slug }])
    return created
  }
  const ensureTag = async (name: string, slug: string) => {
    const [found] = await cms.listArticleTags({ slug })
    if (found) return found
    const [created] = await cms.createArticleTags([{ name, slug }])
    return created
  }
  const ensureStreamer = async (
    data: Record<string, unknown> & { slug: string }
  ) => {
    const [found] = await cms.listStreamers({ slug: data.slug })
    if (found) return found
    const [created] = await cms.createStreamers([data])
    return created
  }

  const noticias = await ensureCategory("Noticias", "noticias")
  const reviews = await ensureCategory("Reviews", "reviews")
  const esports = await ensureCategory("Esports", "esports")

  const tagSteam = await ensureTag("Steam", "steam")
  const tagValorant = await ensureTag("Valorant", "valorant")
  const tagFreeFire = await ensureTag("Free Fire", "free-fire")

  const streamer = await ensureStreamer({
    name: "LunaPlay",
    slug: "lunaplay",
    avatar: "https://i.pravatar.cc/300?img=47",
    bio: "Creadora de contenido gaming desde Bogotá. Valorant, Free Fire y mucho más en vivo.",
    twitch_url: "https://twitch.tv/lunaplay",
    youtube_url: "https://youtube.com/@lunaplay",
    is_featured: true,
  })


  await cms.createArticles([
    {
      title: "Las mejores ofertas de gift cards de Steam este mes",
      slug: "ofertas-steam-gift-cards",
      excerpt:
        "Aprovecha la temporada de rebajas: te contamos cómo recargar tu billetera de Steam al mejor precio en Colombia.",
      body: "La temporada de ofertas ya llegó y es el momento perfecto para llenar tu biblioteca.\n\nCon una gift card de Steam puedes comprar los juegos que tienes en tu lista de deseos, DLCs y contenido adicional. La entrega es digital e inmediata: recibes tu código por correo y lo canjeas en segundos.\n\nEn Gorumin tienes denominaciones desde 20.000 COP, ideales para cualquier presupuesto.",
      cover_image: "/articles/steam-gift-cards.jpg",
      author: "Equipo Gorumin",
      status: "published",
      published_at: daysAgo(1),
      related_product_ids: [steamId, riotId].filter(Boolean),
      tag_ids: [tagSteam.id],
      category_id: noticias.id,
    },
    {
      title: "Guía: cómo recargar diamantes en Free Fire de forma segura",
      slug: "guia-recargar-free-fire",
      excerpt:
        "Todo lo que necesitas saber para recargar diamantes con tu ID de jugador sin riesgos.",
      body: "Recargar diamantes en Free Fire es muy sencillo cuando lo haces desde una tienda confiable.\n\nSolo necesitas tu ID de jugador, que encuentras en tu perfil dentro del juego. Lo ingresas al momento de comprar y los diamantes se acreditan directamente en tu cuenta.\n\nNunca compartas tu contraseña: para una recarga legítima solo se necesita tu ID.",
      cover_image: "/articles/free-fire-diamantes.jpg",
      author: "LunaPlay",
      status: "published",
      published_at: daysAgo(3),
      related_product_ids: [ffId].filter(Boolean),
      tag_ids: [tagFreeFire.id],
      category_id: reviews.id,
      streamer_id: streamer.id,
    },
    {
      title: "Valorant Champions: lo que dejó la gran final",
      slug: "valorant-champions-final",
      excerpt:
        "Resumen de la final más vista del año y lo que significa para la escena competitiva latinoamericana.",
      body: "La gran final de Valorant Champions nos regaló uno de los mejores partidos de la temporada.\n\nEl nivel de juego, las jugadas clutch y el ambiente marcaron un antes y un después para la región. La escena latinoamericana sigue creciendo y promete mucho para el próximo año.",
      cover_image: "/articles/valorant-champions.jpg",
      author: "Equipo Gorumin",
      status: "published",
      published_at: daysAgo(5),
      related_product_ids: [riotId].filter(Boolean),
      tag_ids: [tagValorant.id],
      category_id: esports.id,
    },
  ])

  logger.info("CMS demo content seeded.")
}
