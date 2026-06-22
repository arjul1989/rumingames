import { NextRequest } from "next/server"
import { withBff, options } from "@lib/bff/handler"
import { json, error } from "@lib/bff/http"
import { medusaFetch } from "@lib/bff/medusa"
import { resolveRegionId } from "@lib/bff/region"

export const OPTIONS = options

// GET /api/products/:handle — single product by handle (US-5.1 / RUM-35).
export const GET = withBff(
  async (req: NextRequest, ctx: { params: Promise<{ handle: string }> }) => {
    const { handle } = await ctx.params
    const regionId = await resolveRegionId(req.nextUrl.searchParams.get("region") || undefined)

    const res = await medusaFetch<{ products: unknown[] }>("/store/products", {
      query: {
        handle,
        region_id: regionId,
        limit: 1,
        fields:
          "id,title,subtitle,description,handle,thumbnail,status,*variants,*variants.calculated_price,*categories,*images,*options,*options.values",
      },
      revalidate: 30,
    })

    if (!res.ok) return error(req, res.error || "Producto no encontrado", res.status)
    const product = res.data?.products?.[0]
    if (!product) return error(req, "Producto no encontrado", 404)
    return json(req, { product })
  },
  { bucket: "product-detail" }
)
