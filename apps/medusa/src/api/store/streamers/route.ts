import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../modules/cms"
import type CmsModuleService from "../../../modules/cms/service"

// Public list of streamer profiles (US-5.1 / RUM-35). Supports ?featured=true
// to return only highlighted streamers for the community sections.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const { featured, limit = "50", offset = "0" } = req.query as Record<string, string>

  const filters: Record<string, unknown> = {}
  if (featured === "true") filters.is_featured = true

  const streamers = await cms.listStreamers(filters, {
    take: Number(limit),
    skip: Number(offset),
    order: { is_featured: "DESC", updated_at: "DESC" },
  })

  res.json({
    streamers,
    count: streamers.length,
    limit: Number(limit),
    offset: Number(offset),
  })
}
