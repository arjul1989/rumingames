import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"

export const OPTIONS = options

// GET /api/categories — product categories tree (US-5.1 / RUM-35).
export const GET = withBff(async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams
  const res = await medusaFetch<{ product_categories: unknown[]; count: number }>(
    "/store/product-categories",
    {
      query: {
        limit: sp.get("limit") || "100",
        offset: sp.get("offset") || "0",
        fields: "id,name,handle,description,parent_category_id,rank,*category_children",
      },
      revalidate: 300,
    }
  )

  if (!res.ok) return error(req, res.error || "No se pudieron cargar categorías", res.status)
  return json(req, res.data)
}, { bucket: "categories" })
