import { model } from "@medusajs/framework/utils"

// Singleton-style admin config for Fazer pricing (FX + default margin).
const FazerConfig = model.define("fazer_config", {
  id: model.id().primaryKey(),
  usd_cop_rate: model.float().default(4000),
  default_margin_pct: model.float().default(15),
  last_full_sync_at: model.dateTime().nullable(),
})

export default FazerConfig
