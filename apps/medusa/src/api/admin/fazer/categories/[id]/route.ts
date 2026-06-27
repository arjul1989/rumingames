import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"
import { applyFazerOfferVisibility } from "../../../../../lib/apply-fazer-offer-visibility"
import { revalidateStorefrontCatalog } from "../../../../../lib/storefront-revalidate"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const body = (req.body ?? {}) as { enabled?: boolean }

  const update: Record<string, unknown> = { id: req.params.id }
  if (typeof body.enabled === "boolean") update.enabled = body.enabled

  const [category] = await supplier.updateFazerCategories([update])

  const productHandles = new Set<string>()
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  if (typeof body.enabled === "boolean") {
    const offers = await supplier.listFazerOffers({
      fazer_category_id: category.fazer_category_id,
    })
    for (const offer of offers) {
      const status = body.enabled
        ? offer.status === "inactive"
          ? "active"
          : offer.status
        : "inactive"

      await supplier.updateFazerOffers([
        {
          id: offer.id,
          enabled: body.enabled,
          status,
        },
      ])

      const mappings = await supplier.listSupplierProductMappings({
        fazer_sku_id: offer.fazer_sku_id,
      })
      const mapping = mappings[0]
      if (!mapping) continue

      await supplier.updateSupplierProductMappings([
        {
          id: mapping.id,
          enabled: body.enabled,
          status: body.enabled ? mapping.status : "inactive",
        },
      ])

      if (mapping.medusa_variant_id) {
        await applyFazerOfferVisibility(req.scope, {
          variantId: mapping.medusa_variant_id,
          enabled: body.enabled,
          status: (body.enabled ? status : "inactive") as
            | "active"
            | "inactive"
            | "out_of_stock",
        })
      }

      if (mapping.medusa_product_id) {
        const { data } = await query.graph({
          entity: "product",
          fields: ["handle"],
          filters: { id: mapping.medusa_product_id },
        })
        const handle = (data[0] as { handle?: string } | undefined)?.handle
        if (handle) productHandles.add(handle)
      }
    }
  }

  if (productHandles.size) {
    await revalidateStorefrontCatalog([...productHandles])
  }

  res.json({ category })
}
