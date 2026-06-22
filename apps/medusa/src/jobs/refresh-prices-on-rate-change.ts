import { MedusaContainer } from "@medusajs/framework"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { runCatalogSync } from "../lib/catalog-sync"
import { getLiveUsdCopRate } from "../lib/exchange-rate"
import { getRateChangeThresholdPct, rateChangedBeyondThreshold } from "../lib/pricing"

// Daily FX guard (US-5.5 / RUM-39): compares the current USD->COP rate against
// the rate applied in the last sync. If it drifted beyond the configured
// threshold, it re-runs the catalog sync so COP prices stay accurate.
export default async function refreshPricesOnRateChangeJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  if (!process.env.FAZER_API_KEY) {
    logger.info("Skipping FX price refresh: FAZER_API_KEY not set.")
    return
  }

  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const { rate: currentRate, source } = await getLiveUsdCopRate()

  const [lastLog] = await supplier.listPriceSyncLogs(
    {},
    { order: { created_at: "DESC" }, take: 1 }
  )
  const previousRate = lastLog?.usd_cop_rate ?? 0
  const threshold = getRateChangeThresholdPct()

  if (!rateChangedBeyondThreshold(previousRate, currentRate, threshold)) {
    logger.info(
      `FX unchanged (prev=${previousRate}, now=${currentRate}, source=${source}, threshold=${threshold}%). Skipping price refresh.`
    )
    return
  }

  logger.info(
    `FX moved beyond ${threshold}% (prev=${previousRate}, now=${currentRate}, source=${source}). Re-syncing prices.`
  )
  await runCatalogSync(container, {
    categories: ["gift-cards", "top-ups"],
    rate: currentRate,
  })
}

export const config = {
  name: "refresh-prices-on-rate-change",
  // Every day at 05:00, after the regular 04:00 catalog sync.
  schedule: "0 5 * * *",
}
