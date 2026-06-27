import { ExecArgs } from "@medusajs/framework/types"
import { runCatalogSync } from "../lib/catalog-sync"

// Pulls live Fazer wholesale prices into Medusa variant COP prices.
// Run: FAZER_API_KEY=... npx medusa exec ./src/scripts/sync-fazer-prices.ts
export default async function syncFazerPrices({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const result = await runCatalogSync(container)
  logger.info(`Fazer price sync: ${JSON.stringify(result)}`)
}
