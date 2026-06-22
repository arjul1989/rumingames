import { ExecArgs } from "@medusajs/framework/types"
import { CMS_MODULE } from "../modules/cms"
import type CmsModuleService from "../modules/cms/service"

const CATEGORIES = [
  { name: "Noticias", slug: "noticias" },
  { name: "Reviews", slug: "reviews" },
  { name: "Esports", slug: "esports" },
  { name: "Streamers", slug: "streamers" },
  { name: "Guías", slug: "guias" },
]

// Seeds the default editorial categories idempotently (US-4.1 / RUM-29).
// Run: npx medusa exec ./src/scripts/seed-cms.ts
export default async function seedCms({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const cms = container.resolve<CmsModuleService>(CMS_MODULE)

  const existing = await cms.listArticleCategories({})
  const existingSlugs = new Set(existing.map((c) => c.slug))

  const toCreate = CATEGORIES.filter((c) => !existingSlugs.has(c.slug))
  if (toCreate.length) {
    await cms.createArticleCategories(toCreate)
  }
  logger.info(`CMS categories ready (${toCreate.length} created, ${existing.length} existed).`)
}
