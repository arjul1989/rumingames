import { model } from "@medusajs/framework/utils"
import Article from "./article"

// Community streamer profiles (US-4.4 / RUM-32).
const Streamer = model
  .define("streamer", {
    id: model.id().primaryKey(),
    name: model.text(),
    slug: model.text(),
    avatar: model.text().nullable(),
    bio: model.text().nullable(),
    twitch_url: model.text().nullable(),
    youtube_url: model.text().nullable(),
    is_featured: model.boolean().default(false),
    articles: model.hasMany(() => Article, { mappedBy: "streamer" }),
  })
  .indexes([{ on: ["slug"], unique: true }, { on: ["is_featured"] }])

export default Streamer
