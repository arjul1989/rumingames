import { MedusaContainer } from "@medusajs/framework"
import { runCatalogSync } from "../lib/catalog-sync"

// Scheduled daily catalog sync against Fazer Cards (US-2.2 / RUM-17).
// Only runs when the Fazer module is configured (FAZER_API_KEY present).
export default async function syncFazerCatalogJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  if (!process.env.FAZER_API_KEY) {
    logger.info("Skipping Fazer catalog sync: FAZER_API_KEY not set.")
    return
  }
  await runCatalogSync(container, {
    categories: ["gift-cards", "top-ups"],
  })
}

export const config = {
  name: "sync-fazer-catalog",
  // Every day at 04:00.
  schedule: "0 4 * * *",
}
