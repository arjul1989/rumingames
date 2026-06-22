import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms"
import type CmsModuleService from "../../../../../modules/cms/service"
import { slugify } from "../../../../../lib/cms"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  try {
    const streamer = await cms.retrieveStreamer(req.params.id)
    res.json({ streamer })
  } catch {
    res.status(404).json({ message: "Streamer no encontrado." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as Record<string, any>
  const update: Record<string, unknown> = { id: req.params.id }
  for (const key of ["name", "avatar", "bio", "twitch_url", "youtube_url"]) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  if (body.slug !== undefined) update.slug = slugify(body.slug)
  if (body.is_featured !== undefined) update.is_featured = Boolean(body.is_featured)

  await cms.updateStreamers(update)
  const streamer = await cms.retrieveStreamer(req.params.id)
  res.json({ streamer })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  await cms.deleteStreamers([req.params.id])
  res.json({ id: req.params.id, deleted: true })
}
