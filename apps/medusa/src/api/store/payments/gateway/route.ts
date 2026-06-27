import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCountryPaymentGatewayAdmin } from "../../../../lib/payment-gateway-config"

// Storefront resolver: which encapsulated checkout to load for a country.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const country = ((req.query?.country as string | undefined) ?? "co").toLowerCase()
  const config = await getCountryPaymentGatewayAdmin(req.scope, country)
  res.json({
    country_code: config.country_code,
    active_gateway: config.active_gateway,
    available_gateways: config.available_gateways,
  })
}
