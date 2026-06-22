import { model } from "@medusajs/framework/utils"

// Audit log of catalog/price synchronization runs against Fazer Cards.
const PriceSyncLog = model.define("price_sync_log", {
  id: model.id().primaryKey(),
  status: model.enum(["success", "partial", "failed"]),
  // Counters for observability of each run.
  products_synced: model.number().default(0),
  prices_updated: model.number().default(0),
  errors: model.number().default(0),
  message: model.text().nullable(),
  // USD->COP rate applied in this run; used to detect FX drift between runs.
  usd_cop_rate: model.number().nullable(),
  started_at: model.dateTime(),
  finished_at: model.dateTime().nullable(),
})

export default PriceSyncLog
