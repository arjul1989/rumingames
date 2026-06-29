import { ExecArgs } from "@medusajs/framework/types"
import { CMS_MODULE } from "../modules/cms"
import type CmsModuleService from "../modules/cms/service"

// Updates article cover images to Gorumin AI-generated art (storefront /public/articles).
// Run: npx medusa exec ./src/scripts/seed-article-images.ts

const ARTICLE_COVERS: Record<string, string> = {
  // Demo articles (cms-seed.ts)
  "ofertas-steam-gift-cards": "/articles/steam-gift-cards.jpg",
  "guia-recargar-free-fire": "/articles/free-fire-diamantes.jpg",
  "valorant-champions-final": "/articles/valorant-champions.jpg",
  // Real content (seed-cms-real-content.ts)
  "gta-6-portada-preventas-junio-2026": "/articles/gta-6-portada.jpg",
  "state-of-play-junio-2026-anuncios": "/articles/state-of-play.jpg",
  "crimson-desert-lanzamiento-marzo-2026": "/articles/crimson-desert.jpg",
  "switch-2-aumento-precio-2026": "/articles/switch-2-precio.jpg",
  "filtraciones-nintendo-ocarina-remake-2026": "/articles/ocarina-remake.jpg",
  "monster-hunter-stories-3-marzo-2026": "/articles/monster-hunter-stories-3.jpg",
  "ea-sports-ufc-6-lanzamiento-junio-2026": "/articles/ufc-6.jpg",
  "star-fox-regreso-junio-2026": "/articles/star-fox.jpg",
  "devil-may-cry-5-switch-2-junio-2026": "/articles/devil-may-cry-5.jpg",
  "marathon-bungie-lanzamiento-marzo-2026": "/articles/marathon-bungie.jpg",
}

function coverUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`
}

export default async function seedArticleImages({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const cms = container.resolve<CmsModuleService>(CMS_MODULE)

  let updated = 0
  for (const [slug, path] of Object.entries(ARTICLE_COVERS)) {
    const [article] = await cms.listArticles({ slug })
    if (!article) continue

    const cover_image = coverUrl(path)
    await cms.updateArticles({ id: article.id, cover_image })
    updated++
    logger.info(`✓ ${slug} → ${cover_image}`)
  }

  logger.info(`Article cover images ready (${updated} updated).`)
}
