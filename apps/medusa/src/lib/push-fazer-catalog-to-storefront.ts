import { MedusaContainer } from "@medusajs/framework"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { applyFazerOfferVisibility } from "./apply-fazer-offer-visibility"
import { revalidateStorefrontCatalog } from "./storefront-revalidate"
import { syncMedusaVariantFromFazer } from "./sync-medusa-variant"

export interface PushFazerCatalogToStorefrontResult {
  variants_updated: number
  prices_updated: number
  errors: number
  revalidated: boolean
}

/** Pushes Fazer mapping prices + enabled flags into Medusa variants and purges storefront cache. */
export async function pushFazerCatalogToStorefront(
  container: MedusaContainer
): Promise<PushFazerCatalogToStorefrontResult> {
  const logger = container.resolve("logger")
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  const mappings = await supplier.listSupplierProductMappings({})
  const offers = await supplier.listFazerOffers({})
  const offerBySku = new Map(offers.map((o) => [o.fazer_sku_id, o]))

  let variantsUpdated = 0
  let pricesUpdated = 0
  let errors = 0

  for (const mapping of mappings) {
    if (!mapping.medusa_variant_id) continue

    const offer = offerBySku.get(mapping.fazer_sku_id)
    const enabled = mapping.enabled !== false && offer?.enabled !== false
    const status = (mapping.status ?? offer?.status ?? "active") as
      | "active"
      | "inactive"
      | "out_of_stock"

    try {
      await applyFazerOfferVisibility(container, {
        variantId: mapping.medusa_variant_id,
        enabled,
        status,
      })
      variantsUpdated++

      const cop = mapping.last_synced_price_cop ?? offer?.sale_price_cop
      if (enabled && status === "active" && cop != null && cop > 0) {
        await syncMedusaVariantFromFazer(container, {
          variantId: mapping.medusa_variant_id,
          productId: mapping.medusa_product_id,
          faceValueLabel: mapping.face_value_label ?? offer?.face_value_label ?? offer?.name ?? mapping.fazer_sku_id,
          imageUrl: mapping.image_url ?? offer?.image_url,
          cop,
          fazerSkuId: mapping.fazer_sku_id,
        })
        pricesUpdated++
      }
    } catch (e) {
      errors++
      logger.error(
        `Storefront push failed for ${mapping.fazer_sku_id}: ${(e as Error).message}`
      )
    }
  }

  const revalidated = await revalidateStorefrontCatalog()

  logger.info(
    `Storefront push: ${variantsUpdated} variants, ${pricesUpdated} prices, ${errors} errors, revalidated=${revalidated}`
  )

  return {
    variants_updated: variantsUpdated,
    prices_updated: pricesUpdated,
    errors,
    revalidated,
  }
}
