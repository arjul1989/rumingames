import { MedusaService } from "@medusajs/framework/utils"
import Article from "./models/article"
import ArticleCategory from "./models/article-category"
import ArticleTag from "./models/article-tag"
import Streamer from "./models/streamer"

// CMS module service (US-4.1 / RUM-29). Auto-generates CRUD for articles,
// categories, tags and streamers (listArticles, createArticles, etc.).
class CmsModuleService extends MedusaService({
  Article,
  ArticleCategory,
  ArticleTag,
  Streamer,
}) {}

export default CmsModuleService
