import { MedusaContainer } from "@medusajs/framework"
import {
  computeLinePricing,
  resolveMedusaVariantCopTotal,
} from "./country-pricing"
import { getCountryPricingConfig } from "./country-pricing-config"

type OfferLike = {
  wholesale_price_usd: number
  retail_price_usd?: number | null
  margin_pct: number
}

export async function resolveOfferCopForCountry(
  container: MedusaContainer,
  offer: OfferLike,
  countryCode = "co"
): Promise<{
  cop: number
  retail_price_usd: number
  sale_price_usd: number
}> {
  const country = await getCountryPricingConfig(container, countryCode)
  const line = computeLinePricing(
    {
      wholesale_price_usd: offer.wholesale_price_usd,
      retail_price_usd: offer.retail_price_usd,
      margin_pct: offer.margin_pct,
    },
    {
      fx_rate: country.fx_rate,
      local_currency_code: country.local_currency_code,
      taxes: country.taxes,
    }
  )

  return {
    cop: resolveMedusaVariantCopTotal(line),
    retail_price_usd: line.retail_price_usd,
    sale_price_usd: line.retail_price_usd,
  }
}
