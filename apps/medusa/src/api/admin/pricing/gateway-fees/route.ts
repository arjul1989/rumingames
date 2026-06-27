import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { PaymentGatewayId } from "../../../../lib/payment-gateway-types"
import { PAYMENT_GATEWAYS } from "../../../../lib/payment-gateway-types"
import {
  getPaymentGatewayFee,
  updatePaymentGatewayFee,
} from "../../../../lib/country-pricing-config"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const country = ((req.query?.country as string | undefined) ?? "co").toLowerCase()
  const fees = await Promise.all(
    PAYMENT_GATEWAYS.map((gateway) => getPaymentGatewayFee(req.scope, country, gateway))
  )
  res.json({ country_code: country, fees })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    country_code?: string
    gateway?: PaymentGatewayId
    commission_pct?: number
    commission_fixed_local?: number
  }

  const countryCode = (body.country_code ?? "co").toLowerCase()
  const gateway = body.gateway

  if (!gateway) {
    return res.status(400).json({ message: "gateway is required" })
  }

  const fee = await updatePaymentGatewayFee(req.scope, countryCode, gateway, {
    commission_pct: body.commission_pct,
    commission_fixed_local: body.commission_fixed_local,
  })

  res.json({ fee })
}
