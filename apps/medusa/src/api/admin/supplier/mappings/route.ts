import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../../../../modules/supplier"
import type SupplierModuleService from "../../../../modules/supplier/service"

// List supplier (Fazer Cards) product mappings enriched with the Medusa product
// and variant titles (US-2.3 / RUM-17). Admin-authenticated by middleware.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { status, limit = "100", offset = "0" } = req.query as Record<string, string>
  const filters: Record<string, unknown> = {}
  if (status) filters.status = status

  const [mappings, count] = await supplier.listAndCountSupplierProductMappings(
    filters,
    { take: Number(limit), skip: Number(offset), order: { created_at: "DESC" } }
  )

  const productIds = [...new Set(mappings.map((m) => m.medusa_product_id).filter(Boolean))]
  const variantIds = [...new Set(mappings.map((m) => m.medusa_variant_id).filter(Boolean))] as string[]

  const productTitle = new Map<string, string>()
  const variantTitle = new Map<string, string>()

  if (productIds.length) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "title"],
      filters: { id: productIds },
    })
    data.forEach((p: { id: string; title: string }) => productTitle.set(p.id, p.title))
  }
  if (variantIds.length) {
    const { data } = await query.graph({
      entity: "product_variant",
      fields: ["id", "title"],
      filters: { id: variantIds },
    })
    data.forEach((v: { id: string; title: string }) => variantTitle.set(v.id, v.title))
  }

  const enriched = mappings.map((m) => ({
    ...m,
    product_title: productTitle.get(m.medusa_product_id) ?? null,
    variant_title: m.medusa_variant_id ? variantTitle.get(m.medusa_variant_id) ?? null : null,
  }))

  res.json({ mappings: enriched, count, limit: Number(limit), offset: Number(offset) })
}
