import { model } from "@medusajs/framework/utils"

// Free-form tag catalog for articles (US-4.1 / RUM-29). Articles reference
// these by id via their `tag_ids` field.
const ArticleTag = model
  .define("article_tag", {
    id: model.id().primaryKey(),
    name: model.text(),
    slug: model.text(),
  })
  .indexes([{ on: ["slug"], unique: true }])

export default ArticleTag
