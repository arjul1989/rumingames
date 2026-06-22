import { model } from "@medusajs/framework/utils"

// Maps a Medusa product/variant to its Fazer Cards supplier SKU (US-1.3 / RUM-12).
// Granularity is per-variant, since each value tier is a distinct Fazer SKU.
const SupplierProductMapping = model
  .define("supplier_product_mapping", {
    id: model.id().primaryKey(),
    medusa_product_id: model.text(),
    medusa_variant_id: model.text().nullable(),
    fazer_sku_id: model.text(),
    // Last wholesale price seen from Fazer, in USD (for margin reconciliation).
    last_synced_price_usd: model.float().nullable(),
    // Markup applied over the supplier price to compute the COP sale price.
    margin_pct: model.float().default(15),
    status: model
      .enum(["active", "inactive", "out_of_stock"])
      .default("active"),
    last_synced_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["fazer_sku_id"], unique: true },
    { on: ["medusa_variant_id"] },
    { on: ["status"] },
  ])

export default SupplierProductMapping
