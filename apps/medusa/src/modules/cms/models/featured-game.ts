import { model } from "@medusajs/framework/utils"

// Featured game spotlight for the home hero. Editors pick 1–3 published entries
// via `home_position`; `related_product_ids` links to store products for buy CTAs.
const FeaturedGame = model
  .define("featured_game", {
    id: model.id().primaryKey(),
    title: model.text(),
    slug: model.text(),
    excerpt: model.text().nullable(),
    body: model.text().nullable(),
    cover_image: model.text().nullable(),
    status: model.enum(["draft", "published", "archived"]).default("draft"),
    published_at: model.dateTime().nullable(),
    related_product_ids: model.json().nullable(),
    /** Home slot 1–3; null means not shown on the home hero. */
    home_position: model.number().nullable(),
  })
  .indexes([
    { on: ["slug"], unique: true },
    { on: ["status"] },
    { on: ["home_position"] },
  ])

export default FeaturedGame
