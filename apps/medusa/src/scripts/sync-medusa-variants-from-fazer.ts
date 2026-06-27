import { ExecArgs } from "@medusajs/framework/types"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { syncMedusaVariantFromFazer } from "../lib/sync-medusa-variant"
import { computeCopPrice } from "../lib/pricing"
import { resolveFazerRate } from "../lib/fazer-config"

// Pushes Fazer mapping data into Medusa variant title, thumbnail, option and COP price.
// Run: npx medusa exec ./src/scripts/sync-medusa-variants-from-fazer.ts
export default async function syncMedusaVariantsFromFazer({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const rate = await resolveFazerRate(container)
  const mappings = await supplier.listSupplierProductMappings({})

  let synced = 0
  for (const mapping of mappings) {
    if (!mapping.medusa_variant_id || mapping.last_synced_price_usd == null) continue
    const margin = mapping.margin_pct ?? 15
    const cop =
      mapping.last_synced_price_cop ??
      computeCopPrice(mapping.last_synced_price_usd, rate, margin)
    const face =
      mapping.face_value_label ??
      (await supplier.listFazerOffers({ fazer_sku_id: mapping.fazer_sku_id }))[0]
        ?.face_value_label ??
      mapping.fazer_sku_id

    await syncMedusaVariantFromFazer(container, {
      variantId: mapping.medusa_variant_id,
      productId: mapping.medusa_product_id,
      faceValueLabel: face,
      imageUrl: mapping.image_url,
      cop,
      fazerSkuId: mapping.fazer_sku_id,
    })
    synced++
  }

  logger.info(`Synced ${synced} Medusa variants from Fazer mappings.`)
}
