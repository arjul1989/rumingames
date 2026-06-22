import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"
import { resolveRegionId } from "@lib/bff/region"

export const OPTIONS = options

// GET /api/products — list catalog products with COP pricing (US-5.1 / RUM-35).
// Query: q, category_id, limit, offset, region (ISO2 country, default "co").
export const GET = withBff(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams
  const regionId = await resolveRegionId(sp.get("region") || undefined)

  const res = await medusaFetch<{
    products: unknown[]
    count: number
    offset: number
    limit: number
  }>("/store/products", {
    query: {
      region_id: regionId,
      q: sp.get("q") || undefined,
      category_id: sp.getAll("category_id"),
      handle: sp.get("handle") || undefined,
      limit: sp.get("limit") || "20",
      offset: sp.get("offset") || "0",
      fields:
        "id,title,handle,thumbnail,status,*variants,*variants.calculated_price,*categories,*images",
    },
    revalidate: 30,
  })

  if (!res.ok) return error(req, res.error || "No se pudieron cargar productos", res.status)
  return json(req, res.data)
}, { bucket: "products" })
