import { MedusaService } from "@medusajs/framework/utils"
import Article from "./models/article"
import ArticleCategory from "./models/article-category"
import ArticleTag from "./models/article-tag"
import FeaturedGame from "./models/featured-game"
import Streamer from "./models/streamer"

// CMS module service (US-4.1 / RUM-29). Auto-generates CRUD for articles,
// categories, tags, streamers and featured games.
class CmsModuleService extends MedusaService({
  Article,
  ArticleCategory,
  ArticleTag,
  FeaturedGame,
  Streamer,
}) {}

export default CmsModuleService
