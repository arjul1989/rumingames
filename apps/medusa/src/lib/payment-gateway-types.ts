/** Payment gateway identifiers. Shared contract with @gorumin/types storefront. */
export type PaymentGatewayId = "mercadopago" | "wompi"

export const PAYMENT_GATEWAYS: readonly PaymentGatewayId[] = [
  "mercadopago",
  "wompi",
]

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
}
