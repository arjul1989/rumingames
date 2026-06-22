import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CMS_MODULE } from "../modules/cms"
import type CmsModuleService from "../modules/cms/service"
import { resolveRelatedProducts, slugify } from "../lib/cms"

// Verifies the CMS layer end to end (US-4.1..4.5). Run:
//   npx medusa exec ./src/scripts/verify-cms.ts
export default async function verifyCms({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cms = container.resolve<CmsModuleService>(CMS_MODULE)

  const [category] = await cms.listArticleCategories({ slug: "noticias" })
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
    pagination: { take: 1 },
  })
  const productId = products[0]?.id

  const [tag] = await cms.createArticleTags([
    { name: "Lanzamiento", slug: `lanzamiento-${Date.now()}` },
  ])

  const [streamer] = await cms.createStreamers([
    { name: "ProGamerCO", slug: `progamer-${Date.now()}`, is_featured: true },
  ])

  const article = await cms.createArticles({
    title: "Nuevo lanzamiento gaming en Colombia",
    slug: slugify(`nuevo-lanzamiento-${Date.now()}`),
    excerpt: "Lo último en cards y recargas.",
    body: "# Novedades\n\nContenido en **Markdown**.",
    status: "published",
    published_at: new Date(),
    category_id: category?.id ?? null,
    streamer_id: streamer.id,
    related_product_ids: productId ? [productId] : [],
    tag_ids: [tag.id],
  })

  const fetched = await cms.retrieveArticle(article.id, {
    relations: ["category", "streamer"],
  })
  logger.info(
    `[article] category=${fetched.category?.name} tags=${fetched.tag_ids?.length} streamer=${fetched.streamer?.name}`
  )

  const published = await cms.listArticles({ status: "published" })
  logger.info(`[list] published count=${published.length}`)

  const related = await resolveRelatedProducts(container, fetched.related_product_ids)
  logger.info(`[related] resolved ${related.length} product(s): ${related.map((p) => p.title).join(", ")}`)

  const featured = await cms.listStreamers({ is_featured: true })
  logger.info(`[streamers] featured=${featured.length}`)

  // Cleanup.
  await cms.deleteArticles([article.id])
  await cms.deleteArticleTags([tag.id])
  await cms.deleteStreamers([streamer.id])
  logger.info("CMS verification cleanup done.")
}
