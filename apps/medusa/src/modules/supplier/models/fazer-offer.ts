import { model } from "@medusajs/framework/utils"

// Individual Fazer wholesale SKU (denomination / top-up pack).
const FazerOffer = model.define("fazer_offer", {
  id: model.id().primaryKey(),
  fazer_sku_id: model.text(),
  fazer_category_id: model.text(),
  kind: model.enum(["giftcard", "topup"]),
  offer_id: model.text(),
  name: model.text(),
  wholesale_price_usd: model.float(),
  face_value_label: model.text(),
  face_value_amount: model.float().nullable(),
  face_value_currency: model.text().nullable(),
  stock: model.number().nullable(),
  min_order_quantity: model.number().nullable(),
  max_order_quantity: model.number().nullable(),
  field_schema: model.json().nullable(),
  platform: model.text().nullable(),
  region: model.text().nullable(),
  image_url: model.text().nullable(),
  margin_pct: model.float().default(15),
  enabled: model.boolean().default(true),
  status: model
    .enum(["active", "inactive", "out_of_stock"])
    .default("active"),
  sale_price_cop: model.float().nullable(),
  sale_price_usd: model.float().nullable(),
  retail_price_usd: model.float().nullable(),
  commission_fixed_local: model.float().nullable(),
  usd_cop_rate: model.float().nullable(),
  medusa_variant_id: model.text().nullable(),
  medusa_product_id: model.text().nullable(),
  last_synced_at: model.dateTime().nullable(),
})

export default FazerOffer
