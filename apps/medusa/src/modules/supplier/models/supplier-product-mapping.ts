import { model } from "@medusajs/framework/utils"

// Maps a Medusa product/variant to its Fazer Cards supplier SKU (US-1.3 / RUM-12).
const SupplierProductMapping = model
  .define("supplier_product_mapping", {
    id: model.id().primaryKey(),
    medusa_product_id: model.text(),
    medusa_variant_id: model.text().nullable(),
    fazer_sku_id: model.text(),
    fazer_category_id: model.text().nullable(),
    kind: model.enum(["giftcard", "topup"]).nullable(),
    platform: model.text().nullable(),
    region: model.text().nullable(),
    face_value_label: model.text().nullable(),
    face_value_amount: model.float().nullable(),
    face_value_currency: model.text().nullable(),
    image_url: model.text().nullable(),
    stock: model.number().nullable(),
    enabled: model.boolean().default(true),
    last_synced_price_usd: model.float().nullable(),
    last_synced_price_cop: model.float().nullable(),
    sale_price_usd: model.float().nullable(),
    usd_cop_rate: model.float().nullable(),
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
    { on: ["platform"] },
    { on: ["fazer_category_id"] },
  ])

export default SupplierProductMapping
