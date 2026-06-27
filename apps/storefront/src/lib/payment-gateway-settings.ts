"use server"

import { sdk } from "@lib/config"
import type { CountryPaymentGatewayView, PaymentGatewayId } from "@gorumin/types"

export type StorePaymentGatewaySettings = CountryPaymentGatewayView & {
  available_gateways: Record<
    PaymentGatewayId,
    { configured: boolean; mock: boolean }
  >
}

const DEFAULT_GATEWAY: StorePaymentGatewaySettings = {
  country_code: "co",
  active_gateway: "mercadopago",
  available_gateways: {
    mercadopago: { configured: true, mock: false },
    wompi: { configured: false, mock: false },
    epayco: { configured: false, mock: false },
  },
}

export async function getPaymentGatewaySettings(
  countryCode: string
): Promise<StorePaymentGatewaySettings> {
  try {
    return await sdk.client.fetch<StorePaymentGatewaySettings>(
      "/store/payments/gateway",
      {
        method: "GET",
        query: { country: countryCode.toLowerCase() },
        cache: "no-store",
      }
    )
  } catch {
    return { ...DEFAULT_GATEWAY, country_code: countryCode.toLowerCase() }
  }
}
