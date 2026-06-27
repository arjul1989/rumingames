import { model } from "@medusajs/framework/utils"

// Mirror of a Fazer Cards catalog category (gift card or top-up game).
const FazerCategory = model.define("fazer_category", {
  id: model.id().primaryKey(),
  fazer_category_id: model.text(),
  kind: model.enum(["giftcard", "topup"]),
  name: model.text(),
  note: model.text().nullable(),
  region: model.text().nullable(),
  platform: model.text().nullable(),
  image_url: model.text().nullable(),
  enabled: model.boolean().default(true),
  offer_count: model.number().default(0),
  last_synced_at: model.dateTime().nullable(),
})

export default FazerCategory
