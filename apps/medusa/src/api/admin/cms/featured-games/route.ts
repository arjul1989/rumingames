import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CMS_MODULE } from "../../../../modules/cms"
import type CmsModuleService from "../../../../modules/cms/service"
import { slugify } from "../../../../lib/cms"

// List featured games for the admin.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const { status, q, limit = "50", offset = "0" } = req.query as Record<string, string>

  const filters: Record<string, unknown> = {}
  if (status) filters.status = status
  if (q) filters.title = { $ilike: `%${q}%` }

  const [featured_games, count] = await cms.listAndCountFeaturedGames(filters, {
    take: Number(limit),
    skip: Number(offset),
    order: { home_position: "ASC", created_at: "DESC" },
  })

  res.json({ featured_games, count, limit: Number(limit), offset: Number(offset) })
}

// Create a featured game entry.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cms = req.scope.resolve<CmsModuleService>(CMS_MODULE)
  const body = (req.body ?? {}) as Record<string, unknown>

  if (!body.title) {
    return res.status(400).json({ message: "`title` es obligatorio." })
  }

  const homePosition = normalizeHomePosition(body.home_position)
  if (homePosition !== null) {
    const conflict = await findHomePositionConflict(cms, homePosition)
    if (conflict) {
      return res.status(400).json({
        message: `La posición ${homePosition} del home ya está ocupada por "${conflict.title}".`,
      })
    }
  }

  const status = (body.status as string) ?? "draft"
  const featured_game = await cms.createFeaturedGames({
    title: body.title as string,
    slug: body.slug ? slugify(String(body.slug)) : slugify(String(body.title)),
    excerpt: (body.excerpt as string) ?? null,
    body: (body.body as string) ?? null,
    cover_image: (body.cover_image as string) ?? null,
    status,
    published_at: status === "published" ? new Date() : null,
    related_product_ids: Array.isArray(body.related_product_ids) ? body.related_product_ids : [],
    home_position: homePosition,
  } as unknown as Parameters<CmsModuleService["createFeaturedGames"]>[0])

  res.status(201).json({ featured_game })
}

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
