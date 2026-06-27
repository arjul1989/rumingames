import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { PaymentGatewayId } from "../../../../lib/payment-gateway-types"
import {
  getCountryPaymentGatewayAdmin,
  listCountryPaymentGatewaysAdmin,
  updateCountryPaymentGateway,
} from "../../../../lib/payment-gateway-config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const country = (req.query?.country as string | undefined)?.toLowerCase()

  if (country) {
    res.json(await getCountryPaymentGatewayAdmin(req.scope, country))
    return
  }

  res.json({ countries: await listCountryPaymentGatewaysAdmin(req.scope) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as Partial<{
    country_code: string
    active_gateway: PaymentGatewayId
  }>

  const countryCode = body.country_code?.toLowerCase()
  const activeGateway = body.active_gateway

  if (!countryCode || !activeGateway) {
    return res.status(400).json({
      message: "country_code and active_gateway are required",
    })
  }

  try {
    const config = await updateCountryPaymentGateway(
      req.scope,
      countryCode,
      activeGateway
    )
    res.json(config)
  } catch (e) {
    res.status(400).json({ message: (e as Error).message })
  }
}
