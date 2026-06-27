import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { CountryTaxRule } from "../../../../lib/country-pricing-types"
import {
  getCountryPricingConfig,
  updateCountryPricingConfig,
  listPaymentGatewayFeesForCountry,
} from "../../../../lib/country-pricing-config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const country = ((req.query?.country as string | undefined) ?? "co").toLowerCase()
  const [config, gateway_fees] = await Promise.all([
    getCountryPricingConfig(req.scope, country),
    listPaymentGatewayFeesForCountry(req.scope, country),
  ])
  res.json({ config, gateway_fees })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    country_code?: string
    fx_rate?: number
    local_currency_code?: string
    taxes?: CountryTaxRule[]
  }

  const countryCode = (body.country_code ?? "co").toLowerCase()
  const config = await updateCountryPricingConfig(req.scope, countryCode, {
    fx_rate: body.fx_rate,
    local_currency_code: body.local_currency_code,
    taxes: body.taxes,
  })

  res.json({ config })
}
