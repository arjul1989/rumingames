import { ExecArgs } from "@medusajs/framework/types"
import { ensureFazerCatalogProducts } from "../lib/ensure-fazer-catalog-products"
import { runCatalogSync } from "../lib/catalog-sync"
import { pushFazerCatalogToStorefront } from "../lib/push-fazer-catalog-to-storefront"
import { revalidateStorefrontAll } from "../lib/storefront-revalidate"
import seedProductImages from "./seed-product-images"
import seedCmsRealContent from "./seed-cms-real-content"
import seedArticleImages from "./seed-article-images"
import syncFeaturedGames from "./sync-featured-games"

type SyncMode = "fast" | "push" | "full"

function resolveMode(): SyncMode {
  const raw = (process.env.SYNC_MODE ?? "fast").toLowerCase()
  if (raw === "full") return "full"
  if (raw === "push") return "push"
  return "fast"
}

// Sync storefront content (CMS + product images + optional catalog push).
//
// Modes (SYNC_MODE env):
//   fast (default) — CMS + images + cache purge (~30 s, no Fazer API)
//   push           — fast + push variant prices from DB (~10–15 min)
//   full           — live Fazer API pull + CMS (~25+ min, nightly/admin only)
//
// Run locally or against prod via infra/gcp/sync-prod.sh
export default async function syncStorefrontContent({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const mode = resolveMode()

  logger.info(`=== Storefront content sync (${mode} mode) ===`)

  if (mode !== "fast") {
    logger.info("=== Ensure Fazer catalog products ===")
    const products = await ensureFazerCatalogProducts(container)
    logger.info(
      `Fazer catalog products: ${products.created} created, ${products.existing} existing.`
    )
  }

  if (mode === "full") {
    logger.info("=== Fazer catalog sync (live API pull) ===")
    const catalog = await runCatalogSync(container, { fullSync: true })
    logger.info(`Catalog sync: ${catalog.message}`)
  } else if (mode === "push") {
    logger.info("=== Push catalog from DB to Medusa variants ===")
    const push = await pushFazerCatalogToStorefront(container)
    logger.info(
      `Storefront push: ${push.variants_updated} variants, ${push.prices_updated} prices, ` +
        `${push.errors} errors, revalidated=${push.revalidated}`
    )
  }

  logger.info("=== CMS + product images ===")
  await seedProductImages({ container } as ExecArgs)
  await seedCmsRealContent({ container } as ExecArgs)
  await seedArticleImages({ container } as ExecArgs)
  await syncFeaturedGames({ container } as ExecArgs)

  logger.info("=== Purge storefront cache ===")
  const revalidated = await revalidateStorefrontAll()
  logger.info(
    revalidated
      ? "Storefront cache purged (catalog + community pages)."
      : "Cache purge skipped — set STOREFRONT_URL and REVALIDATE_SECRET."
  )

  logger.info(`=== Storefront content sync complete (${mode}) ===`)
}
