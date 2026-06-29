import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms"
import type CmsModuleService from "../modules/cms/service"

type ArticleSeed = {
  slug: string
  title: string
  excerpt: string
  body: string
  cover_image: string
  related_handles: string[]
  tag_slugs: string[]
  days_ago: number
}

// Top 3 gaming headlines (late June 2026). Run:
// npx medusa exec ./src/scripts/sync-latest-news.ts
const LATEST_NEWS: ArticleSeed[] = [
  {
    slug: "gta-6-precio-79-dolares-2026",
    title: "GTA 6 confirma precio: 79,99 USD y edición Ultimate a 99,99 USD",
    excerpt:
      "Rockstar fija el precio estándar en 79,99 dólares para PS5 y Xbox Series. Las copias físicas traerán código de descarga, sin disco.",
    body: `**Rumin Noticias** — Rockstar Games confirmó oficialmente el precio de **Grand Theft Auto VI**: **79,99 USD** en PlayStation 5 y Xbox Series X|S, con la **Ultimate Edition a 99,99 USD**.

Es un aumento de 10 dólares respecto al estándar de 70 USD de esta generación, y abre la puerta a que otros grandes títulos sigan el mismo camino. Las reservas ya están abiertas y las copias físicas **no incluirán disco**: solo un código de descarga en la caja.

El lanzamiento sigue fijado para el **19 de noviembre de 2026**. Rockstar promete una experiencia de un solo jugador al estreno, sin nuevo GTA Online anunciado por ahora.

**¿Listo para Vice City?** Recarga **PlayStation Store** o **Xbox** en Gorumin y ten saldo disponible el día del lanzamiento.`,
    cover_image: "/articles/gta-6-portada.jpg",
    related_handles: ["playstation-gift-card", "xbox-gift-card"],
    tag_slugs: ["lanzamientos", "playstation"],
    days_ago: 0,
  },
  {
    slug: "gta-6-ia-redes-sociales-npcs-2026",
    title: "GTA 6: IA en NPCs, redes sociales in-game e influencers en Vice City",
    excerpt:
      "Nuevos detalles filtrados desde tiendas: vídeos virales en el móvil del personaje, misiones vía influencers y eventos orgánicos con IA.",
    body: `**Rumin Noticias** — Tras la oleada de imágenes y preventas, **GTA VI** sigue dando de qué hablar. Listados de Amazon Brasil y Kabum revelan mecánicas inéditas para la saga.

Los **NPC tendrán rutinas con IA avanzada**, generando eventos aleatorios por todo el mapa. El teléfono del protagonista mostrará **vídeos virales en tiempo real** y podrás seguir **influencers de Vice City** en redes para desbloquear misiones secundarias secretas.

También se confirma que podrás **cambiar de personaje en cualquier momento** durante la aventura. El juego llega el **19 de noviembre** a PS5 y Xbox Series X|S.

**¿A explorar Vice City?** Carga tu wallet de consola con gift cards de Gorumin — entrega digital inmediata.`,
    cover_image: "/articles/state-of-play.jpg",
    related_handles: ["playstation-gift-card", "steam-gift-card"],
    tag_slugs: ["lanzamientos", "playstation"],
    days_ago: 1,
  },
  {
    slug: "onimusha-way-of-the-sword-capcom-spotlight-2026",
    title: "Onimusha: Way of the Sword sorprende con gameplay extenso en Capcom Spotlight",
    excerpt:
      "Capcom repasa combate, enemigos y el regreso de la saga samurái. Lanzamiento confirmado para el 25 de septiembre en consolas y PC.",
    body: `**Rumin Noticias** — **Onimusha: Way of the Sword** fue una de las grandes estrellas del **Capcom Spotlight**. El director Satoru Nihei presentó gameplay extenso, nuevos enemigos demoníacos y el combate con espada y magia que define el regreso de la saga.

A pesar de rumores sobre un posible adelanto, Capcom mantiene la fecha: **25 de septiembre de 2026** en PS5, Xbox Series, Nintendo Switch 2 y PC. Ya hay demo disponible (excepto en Switch 2) y recompensas por reserva.

Si te gustan los action de la casa de Resident Evil, este es uno de los grandes del año.

**¿A cazar demonios?** Recarga **Steam** o **PlayStation Store** en Gorumin y reserva tu copia digital hoy.`,
    cover_image: "/articles/devil-may-cry-5.jpg",
    related_handles: ["steam-gift-card", "playstation-gift-card"],
    tag_slugs: ["lanzamientos", "steam"],
    days_ago: 2,
  },
]

export default async function syncLatestNews({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cms = container.resolve<CmsModuleService>(CMS_MODULE)

  const [noticias] = await cms.listArticleCategories({ slug: "noticias" })
  if (!noticias) {
    throw new Error("Categoría 'noticias' no encontrada. Ejecuta seed-cms-real-content primero.")
  }

  const tags = await cms.listArticleTags({}, { take: 50 })
  const tagBySlug = new Map(tags.map((t) => [t.slug, t.id]))

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

  const staleSlugs = [
    "gta-6-portada-preventas-junio-2026",
    "state-of-play-junio-2026-anuncios",
    "crimson-desert-lanzamiento-marzo-2026",
  ]
  for (const slug of staleSlugs) {
    const [existing] = await cms.listArticles({ slug }, { take: 1 })
    if (existing) {
      await cms.updateArticles({ id: existing.id, published_at: daysAgo(30) })
    }
  }

  for (const article of LATEST_NEWS) {
    const related_product_ids = article.related_handles
      .map((h) => byHandle.get(h))
      .filter(Boolean) as string[]

    const tag_ids = article.tag_slugs
      .map((s) => tagBySlug.get(s))
      .filter(Boolean) as string[]

    const payload = {
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      cover_image: article.cover_image,
      status: "published" as const,
      published_at: daysAgo(article.days_ago),
      related_product_ids,
      tag_ids,
      category_id: noticias.id,
    }

    const [existing] = await cms.listArticles({ slug: article.slug }, { take: 1 })

    if (existing) {
      await cms.updateArticles({ id: existing.id, ...payload })
      logger.info(`Updated article: ${article.slug}`)
    } else {
      await cms.createArticles({ slug: article.slug, ...payload })
      logger.info(`Created article: ${article.slug}`)
    }
  }

  logger.info("Latest 3 news articles synced for home carousel.")
}
