import { model } from "@medusajs/framework/utils"
import ArticleCategory from "./article-category"
import Streamer from "./streamer"

// News/blog article for the community section (US-4.1 / RUM-29).
// `related_product_ids` holds Medusa product ids for monetized content
// (US-4.3 / RUM-31); details are resolved at the API layer.
const Article = model
  .define("article", {
    id: model.id().primaryKey(),
    title: model.text(),
    slug: model.text(),
    excerpt: model.text().nullable(),
    body: model.text(),
    cover_image: model.text().nullable(),
    author: model.text().nullable(),
    status: model.enum(["draft", "published", "archived"]).default("draft"),
    published_at: model.dateTime().nullable(),
    related_product_ids: model.json().nullable(),
    // Tags referenced by id (kept simple; the article_tag table is the catalog).
    tag_ids: model.json().nullable(),
    // SEO / Open Graph overrides (US-4.1 / §3.2). Fall back to title/excerpt/
    // cover_image at the rendering layer when empty.
    seo_title: model.text().nullable(),
    seo_description: model.text().nullable(),
    og_image: model.text().nullable(),
    category: model.belongsTo(() => ArticleCategory, { mappedBy: "articles" }).nullable(),
    streamer: model.belongsTo(() => Streamer, { mappedBy: "articles" }).nullable(),
  })
  .indexes([
    { on: ["slug"], unique: true },
    { on: ["status"] },
    { on: ["published_at"] },
  ])

export default Article
