import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"
import { computeCopPrice } from "../../../../../lib/pricing"
import { salePriceUsd } from "../../../../../lib/fazer-meta"
import { resolveFazerRate } from "../../../../../lib/fazer-config"
import { syncMedusaVariantFromFazer } from "../../../../../lib/sync-medusa-variant"

const STATUSES = ["active", "inactive", "out_of_stock"] as const

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const body = (req.body ?? {}) as {
    margin_pct?: number
    status?: string
    enabled?: boolean
  }

  const mapping = await supplier.retrieveSupplierProductMapping(req.params.id)
  const update: Record<string, unknown> = { id: mapping.id }

  if (typeof body.margin_pct === "number" && !Number.isNaN(body.margin_pct)) {
    update.margin_pct = body.margin_pct
  }
  if (typeof body.enabled === "boolean") {
    update.enabled = body.enabled
  }
  if (body.status && STATUSES.includes(body.status as (typeof STATUSES)[number])) {
    update.status = body.status
  }

  const wholesale = mapping.last_synced_price_usd
  const margin = (update.margin_pct as number) ?? mapping.margin_pct
  const rate = await resolveFazerRate(req.scope)

  if (wholesale != null) {
    update.last_synced_price_cop = computeCopPrice(wholesale, rate, margin)
    update.sale_price_usd = salePriceUsd(wholesale, margin)
    update.usd_cop_rate = rate
  }

  const [updated] = await supplier.updateSupplierProductMappings([update])

  const offers = await supplier.listFazerOffers({ fazer_sku_id: mapping.fazer_sku_id })
  if (offers[0]) {
    await supplier.updateFazerOffers([
      {
        id: offers[0].id,
        margin_pct: margin,
        enabled: (update.enabled as boolean) ?? offers[0].enabled,
        sale_price_cop: update.last_synced_price_cop as number,
        sale_price_usd: update.sale_price_usd as number,
        usd_cop_rate: rate,
      },
    ])
  }

  const enabled = (update.enabled as boolean | undefined) ?? mapping.enabled
  const status = (update.status as string | undefined) ?? mapping.status
  if (
    mapping.medusa_variant_id &&
    wholesale != null &&
    enabled !== false &&
    status === "active"
  ) {
    const cop = computeCopPrice(wholesale, rate, margin)
    await syncMedusaVariantFromFazer(req.scope, {
      variantId: mapping.medusa_variant_id,
      productId: mapping.medusa_product_id,
      faceValueLabel: mapping.face_value_label ?? offers[0]?.face_value_label ?? mapping.fazer_sku_id,
      imageUrl: mapping.image_url ?? offers[0]?.image_url,
      cop,
      fazerSkuId: mapping.fazer_sku_id,
    })
  }

  res.json({ mapping: updated })
}
