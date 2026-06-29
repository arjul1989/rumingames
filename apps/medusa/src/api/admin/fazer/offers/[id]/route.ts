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
import { resolveOfferCopForCountry } from "../../../../../lib/resolve-offer-pricing"
import { getCountryPricingConfig } from "../../../../../lib/country-pricing-config"

const STATUSES = ["active", "inactive", "out_of_stock"] as const

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const body = (req.body ?? {}) as {
    margin_pct?: number
    retail_price_usd?: number | null
    commission_fixed_local?: number | null
    enabled?: boolean
    status?: string
  }

  const offer = await supplier.retrieveFazerOffer(req.params.id)
  const update: Record<string, unknown> = { id: offer.id }
  const countryPricing = await getCountryPricingConfig(req.scope, "co")

  const nextRetailUsd =
    body.retail_price_usd !== undefined
      ? body.retail_price_usd
      : offer.retail_price_usd
  const nextMargin =
    typeof body.margin_pct === "number" && !Number.isNaN(body.margin_pct)
      ? body.margin_pct
      : offer.margin_pct
  const nextCommissionOverride =
    body.commission_fixed_local !== undefined
      ? body.commission_fixed_local
      : offer.commission_fixed_local

  if (typeof body.margin_pct === "number" && !Number.isNaN(body.margin_pct)) {
    update.margin_pct = body.margin_pct
  }
  if (body.retail_price_usd !== undefined) {
    update.retail_price_usd = body.retail_price_usd
  }
  if (body.commission_fixed_local !== undefined) {
    update.commission_fixed_local = body.commission_fixed_local
  }

  if (
    body.margin_pct !== undefined ||
    body.retail_price_usd !== undefined
  ) {
    const priced = await resolveOfferCopForCountry(req.scope, {
      wholesale_price_usd: offer.wholesale_price_usd,
      retail_price_usd: nextRetailUsd,
      margin_pct: nextMargin,
    })
    update.sale_price_usd = priced.sale_price_usd
    update.sale_price_cop = priced.cop
    update.usd_cop_rate = countryPricing.fx_rate
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
    const margin = nextMargin
    const rate = countryPricing.fx_rate
    const priced = await resolveOfferCopForCountry(req.scope, {
      wholesale_price_usd: offer.wholesale_price_usd,
      retail_price_usd: nextRetailUsd,
      margin_pct: margin,
    })
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
      sale_price_usd: priced.sale_price_usd,
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
