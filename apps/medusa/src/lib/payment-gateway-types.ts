/** Payment gateway identifiers. Shared contract with @gorumin/types storefront. */
import type { GatewayFeeConfig } from "./country-pricing-types"

export type PaymentGatewayId = "mercadopago" | "wompi" | "epayco"

export const PAYMENT_GATEWAYS: readonly PaymentGatewayId[] = [
  "mercadopago",
  "wompi",
  "epayco",
]

export const PAYMENT_GATEWAY_PROVIDER_IDS: Record<PaymentGatewayId, string> = {
  mercadopago: "pp_mercadopago_mercadopago",
  wompi: "pp_wompi_wompi",
  epayco: "pp_epayco_epayco",
}

export interface CountryPaymentGatewayView {
  country_code: string
  active_gateway: PaymentGatewayId
}

export interface PaymentGatewayAvailability {
  configured: boolean
  mock: boolean
}

export interface CountryPaymentGatewayAdminView extends CountryPaymentGatewayView {
  available_gateways: Record<PaymentGatewayId, PaymentGatewayAvailability>
  gateway_fees?: GatewayFeeConfig[]
}
