import type { PaymentGatewayId } from "./payment-gateway"

/** Named tax rule for a country (e.g. IVA 19%). */
export interface CountryTaxRule {
  name: string
  rate_pct: number
}

export interface PricingTaxLine {
  name: string
  rate_pct: number
  amount_local: number
  amount_usd: number
}

export interface GatewayFeeConfig {
  country_code: string
  gateway: PaymentGatewayId
  commission_pct: number
  commission_fixed_local: number
}

export interface CountryPricingConfig {
  country_code: string
  fx_rate: number
  local_currency_code: string
  taxes: CountryTaxRule[]
}

export interface LinePricingBreakdown {
  fazer_sku_id?: string | null
  title?: string | null
  wholesale_price_usd: number
  retail_price_usd: number
  /** Nominal product value in USD (e.g. $5 gift card), before store margin. */
  face_value_usd: number
  face_value_local: number
  margin_pct: number
  margin_usd: number
  margin_local: number
  quantity: number
  fx_rate: number
  local_currency_code: string
  subtotal_local: number
  subtotal_usd: number
  taxes: PricingTaxLine[]
  tax_total_local: number
  tax_total_usd: number
  total_before_commission_local: number
  total_before_commission_usd: number
}

export interface CartPricingBreakdown {
  country_code: string
  gateway: PaymentGatewayId
  fx_rate: number
  local_currency_code: string
  lines: LinePricingBreakdown[]
  /** Sum of nominal face values in USD (shown as "Precio en USD"). */
  face_value_usd: number
  face_value_local: number
  margin_pct: number
  margin_usd: number
  margin_local: number
  subtotal_usd: number
  subtotal_local: number
  taxes: PricingTaxLine[]
  tax_total_local: number
  tax_total_usd: number
  commission_local: number
  commission_usd: number
  commission_is_zero: boolean
  commission_pct: number
  commission_fixed_local: number
  total_local: number
  total_usd: number
}
