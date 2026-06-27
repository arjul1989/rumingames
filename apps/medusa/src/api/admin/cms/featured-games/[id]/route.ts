import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../../modules/cms"
import type CmsModuleService from "../../../../../modules/cms/service"
import { slugify } from "../../../../../lib/cms"

function normalizeHomePosition(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = Number(value)
  if (![1, 2, 3].includes(n)) return null
  return n
}

async function findHomePositionConflict(
  cms: CmsModuleService,
  position: number,
  excludeId?: string
) {
  const [existing] = await cms.listFeaturedGames(
    { home_position: position },
    { take: 1 }
  )
  if (!existing || existing.id === excludeId) return null
  return existing
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  try {
    const featured_game = await cms.retrieveFeaturedGame(req.params.id)
    res.json({ featured_game })
  } catch {
    res.status(404).json({ message: "Videojuego no encontrado." })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as Record<string, unknown>
  const id = req.params.id

  let current
  try {
    current = await cms.retrieveFeaturedGame(id)
  } catch {
    return res.status(404).json({ message: "Videojuego no encontrado." })
  }

  if (body.home_position !== undefined) {
    const homePosition = normalizeHomePosition(body.home_position)
    if (homePosition !== null) {
      const conflict = await findHomePositionConflict(cms, homePosition, id)
      if (conflict) {
        return res.status(400).json({
          message: `La posición ${homePosition} del home ya está ocupada por "${conflict.title}".`,
        })
      }
    }
  }

  const update: Record<string, unknown> = { id }
  if (body.title !== undefined) update.title = body.title
  if (body.slug !== undefined) update.slug = slugify(String(body.slug))
  if (body.excerpt !== undefined) update.excerpt = body.excerpt
  if (body.body !== undefined) update.body = body.body
  if (body.cover_image !== undefined) update.cover_image = body.cover_image
  if (Array.isArray(body.related_product_ids)) update.related_product_ids = body.related_product_ids
  if (body.home_position !== undefined) update.home_position = normalizeHomePosition(body.home_position)

  if (body.status !== undefined && body.status !== current.status) {
    update.status = body.status
    if (body.status === "published" && !current.published_at) {
      update.published_at = new Date()
    }
  }

  await cms.updateFeaturedGames(update)
  const featured_game = await cms.retrieveFeaturedGame(id)
  res.json({ featured_game })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  await cms.deleteFeaturedGames([req.params.id])
  res.json({ id: req.params.id, deleted: true })
}
