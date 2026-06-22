import { model } from "@medusajs/framework/utils"
import Article from "./article"

// Editorial sections: Noticias, Reviews, Esports, Streamers, Guías (US-4.1 / RUM-29).
const ArticleCategory = model
  .define("article_category", {
    id: model.id().primaryKey(),
    name: model.text(),
    slug: model.text(),
    articles: model.hasMany(() => Article, { mappedBy: "category" }),
  })
  .indexes([{ on: ["slug"], unique: true }])

export default ArticleCategory
