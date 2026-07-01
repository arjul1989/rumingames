import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { CartPricingBreakdown } from "./country-pricing-types"
import { buildCartPricingBreakdown } from "./country-pricing"
import {
  getCountryPricingConfig,
  getPaymentGatewayFee,
} from "./country-pricing-config"
import { getCountryPaymentGateway } from "./payment-gateway-config"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"

type CartItem = {
  quantity?: number | null
  title?: string | null
  variant?: {
    id?: string | null
    metadata?: Record<string, unknown> | null
    title?: string | null
  } | null
}

export async function buildCartPricingBreakdownForCart(
  container: MedusaContainer,
  cart: { items?: CartItem[] | null },
  countryCode: string
): Promise<CartPricingBreakdown | null> {
  const items = cart.items ?? []
  if (!items.length) return null

  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const country = await getCountryPricingConfig(container, countryCode)
  const gatewayConfig = await getCountryPaymentGateway(container, countryCode)
  const gatewayFee = await getPaymentGatewayFee(
    container,
    countryCode,
    gatewayConfig.active_gateway
  )

  const variantIds = items
    .map((item) => item.variant?.id)
    .filter((id): id is string => Boolean(id))

  const offerBySku = new Map<
    string,
    {
      wholesale_price_usd: number
      retail_price_usd: number | null
      margin_pct: number
      commission_fixed_local: number | null
      face_value_amount: number | null
      face_value_currency: string | null
    }
  >()

  if (variantIds.length) {
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "metadata"],
      filters: { id: variantIds },
    })

    const skuByVariant = new Map<string, string>()
    for (const variant of variants as Array<{
      id?: string
      metadata?: Record<string, unknown>
    }>) {
      const sku = variant.metadata?.fazer_sku_id
      if (variant.id && typeof sku === "string" && sku) {
        skuByVariant.set(variant.id, sku)
      }
    }

    const skuIds = [...new Set(skuByVariant.values())]
    if (skuIds.length) {
      const offers = (
        await Promise.all(
          skuIds.map((sku) => supplier.listFazerOffers({ fazer_sku_id: sku }))
        )
      ).flat()
      for (const offer of offers) {
        offerBySku.set(offer.fazer_sku_id, {
          wholesale_price_usd: offer.wholesale_price_usd,
          retail_price_usd: offer.retail_price_usd ?? null,
          margin_pct: offer.margin_pct,
          commission_fixed_local: offer.commission_fixed_local ?? null,
          face_value_amount: offer.face_value_amount ?? null,
          face_value_currency: offer.face_value_currency ?? null,
        })
      }
    }

    return buildCartPricingBreakdown({
      country_code: countryCode.toLowerCase(),
      gateway: gatewayConfig.active_gateway,
      country: {
        fx_rate: country.fx_rate,
        local_currency_code: country.local_currency_code,
        taxes: country.taxes,
      },
      gatewayFee,
      lines: items.map((item) => {
        const variantId = item.variant?.id
        const sku =
          (variantId ? skuByVariant.get(variantId) : null) ??
          (typeof item.variant?.metadata?.fazer_sku_id === "string"
            ? item.variant.metadata.fazer_sku_id
            : null)
        const offer = sku ? offerBySku.get(sku) : undefined
        const quantity = item.quantity ?? 1

        if (!offer) {
          return {
            wholesale_price_usd: 0,
            retail_price_usd: 0,
            margin_pct: 0,
            quantity,
            fazer_sku_id: sku,
            title: item.title ?? item.variant?.title ?? null,
          }
        }

        return {
          wholesale_price_usd: offer.wholesale_price_usd,
          retail_price_usd: offer.retail_price_usd,
          margin_pct: offer.margin_pct,
          face_value_amount: offer.face_value_amount,
          face_value_currency: offer.face_value_currency,
          commission_fixed_local: offer.commission_fixed_local,
          quantity,
          fazer_sku_id: sku,
          title: item.title ?? item.variant?.title ?? null,
        }
      }),
    })
  }

  return null
}
