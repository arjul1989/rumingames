/** Payment gateway identifiers. Add new gateways here as integrations ship. */
export type PaymentGatewayId = "mercadopago" | "wompi" | "epayco"

export const PAYMENT_GATEWAYS: readonly PaymentGatewayId[] = [
  "mercadopago",
  "wompi",
  "epayco",
]

export const PAYMENT_GATEWAY_LABELS: Record<PaymentGatewayId, string> = {
  mercadopago: "Mercado Pago",
  wompi: "Wompi",
  epayco: "ePayco",
}

/** Medusa payment provider id for each gateway (pp_{moduleId}_{moduleId}). */
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
}
