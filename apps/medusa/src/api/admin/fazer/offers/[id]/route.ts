import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"
import { computeCopPrice } from "../../../../../lib/pricing"
import { salePriceUsd } from "../../../../../lib/fazer-meta"
import { resolveFazerRate } from "../../../../../lib/fazer-config"
import { applyFazerOfferVisibility } from "../../../../../lib/apply-fazer-offer-visibility"
import { revalidateStorefrontCatalog } from "../../../../../lib/storefront-revalidate"
import { syncMedusaVariantFromFazer } from "../../../../../lib/sync-medusa-variant"

const STATUSES = ["active", "inactive", "out_of_stock"] as const

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const body = (req.body ?? {}) as {
    margin_pct?: number
    enabled?: boolean
    status?: string
  }

  const offer = await supplier.retrieveFazerOffer(req.params.id)
  const update: Record<string, unknown> = { id: offer.id }

  if (typeof body.margin_pct === "number" && !Number.isNaN(body.margin_pct)) {
    update.margin_pct = body.margin_pct
    const rate = await resolveFazerRate(req.scope)
    update.sale_price_usd = salePriceUsd(offer.wholesale_price_usd, body.margin_pct)
    update.sale_price_cop = computeCopPrice(offer.wholesale_price_usd, rate, body.margin_pct)
    update.usd_cop_rate = rate
  }
  if (typeof body.enabled === "boolean") {
    update.enabled = body.enabled
    if (!body.enabled) update.status = "inactive"
    else if (offer.stock === 0 && offer.kind === "giftcard") update.status = "out_of_stock"
    else update.status = "active"
  }
  if (body.status && STATUSES.includes(body.status as (typeof STATUSES)[number])) {
    update.status = body.status
  }

  const [updated] = await supplier.updateFazerOffers([update])

  const mappings = await supplier.listSupplierProductMappings({ fazer_sku_id: offer.fazer_sku_id })
  const mapping = mappings[0]
  if (mapping) {
    const margin = (update.margin_pct as number) ?? mapping.margin_pct
    const rate = (update.usd_cop_rate as number) ?? (await resolveFazerRate(req.scope))
    const cop =
      (update.sale_price_cop as number) ??
      computeCopPrice(offer.wholesale_price_usd, rate, margin)
    const enabled = (update.enabled as boolean | undefined) ?? mapping.enabled
    const status: (typeof STATUSES)[number] =
      enabled === false
        ? "inactive"
        : STATUSES.includes((update.status ?? mapping.status) as (typeof STATUSES)[number])
          ? ((update.status ?? mapping.status) as (typeof STATUSES)[number])
          : mapping.status

    await supplier.updateSupplierProductMappings({
      id: mapping.id,
      margin_pct: margin,
      enabled,
      status,
      last_synced_price_cop: cop,
      sale_price_usd: salePriceUsd(offer.wholesale_price_usd, margin),
      usd_cop_rate: rate,
      face_value_label: offer.face_value_label,
    })

    if (mapping.medusa_variant_id && enabled && status === "active") {
      await syncMedusaVariantFromFazer(req.scope, {
        variantId: mapping.medusa_variant_id,
        productId: mapping.medusa_product_id,
        faceValueLabel: offer.face_value_label,
        imageUrl: offer.image_url ?? mapping.image_url,
        cop,
        fazerSkuId: offer.fazer_sku_id,
      })
    }

    if (mapping.medusa_variant_id) {
      await applyFazerOfferVisibility(req.scope, {
        variantId: mapping.medusa_variant_id,
        enabled,
        status: status as "active" | "inactive" | "out_of_stock",
      })
    }
  }

  if (mapping?.medusa_product_id) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["handle"],
      filters: { id: mapping.medusa_product_id },
    })
    const handle = (data[0] as { handle?: string } | undefined)?.handle
    await revalidateStorefrontCatalog(handle ? [handle] : undefined)
  } else if (mapping) {
    await revalidateStorefrontCatalog()
  }

  res.json({ offer: updated })
}
