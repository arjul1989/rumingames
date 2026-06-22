import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"
import { slugify } from "../../../../lib/cms"

// List streamer profiles (US-4.4 / RUM-32).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const { limit = "50", offset = "0" } = req.query as Record<string, string>
  const [streamers, count] = await cms.listAndCountStreamers(
    {},
    { take: Number(limit), skip: Number(offset), order: { is_featured: "DESC", name: "ASC" } }
  )
  res.json({ streamers, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as Record<string, any>
  if (!body.name) {
    return res.status(400).json({ message: "`name` es obligatorio." })
  }
  const streamer = await cms.createStreamers({
    name: body.name,
    slug: body.slug ? slugify(body.slug) : slugify(body.name),
    avatar: body.avatar ?? null,
    bio: body.bio ?? null,
    twitch_url: body.twitch_url ?? null,
    youtube_url: body.youtube_url ?? null,
    is_featured: Boolean(body.is_featured),
  })
  res.status(201).json({ streamer })
}
