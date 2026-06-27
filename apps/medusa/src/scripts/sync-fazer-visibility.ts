import { ExecArgs } from "@medusajs/framework/types"
import { pushFazerCatalogToStorefront } from "../lib/push-fazer-catalog-to-storefront"

// Pushes Fazer enabled/status flags to Medusa variant stock (storefront visibility).
// Run after disabling offers in admin if the storefront still shows them:
//   npx medusa exec ./src/scripts/sync-fazer-visibility.ts
export default async function syncFazerVisibility({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const result = await pushFazerCatalogToStorefront(container)
  logger.info(
    `Fazer visibility sync: ${result.variants_updated} variants, ${result.prices_updated} prices, revalidated=${result.revalidated}.`
  )
}
