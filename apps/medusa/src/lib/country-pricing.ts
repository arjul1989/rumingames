import type {
  CartPricingBreakdown,
  CountryTaxRule,
  GatewayFeeConfig,
  LinePricingBreakdown,
  PricingTaxLine,
} from "./country-pricing-types"
import type { PaymentGatewayId } from "./payment-gateway-types"
import { salePriceUsd } from "./fazer-meta"

export interface LinePricingInput {
  wholesale_price_usd: number
  retail_price_usd?: number | null
  margin_pct?: number
  face_value_usd?: number | null
  face_value_amount?: number | null
  face_value_currency?: string | null
  quantity?: number
  commission_fixed_local?: number | null
  fazer_sku_id?: string | null
  title?: string | null
}

export interface CountryPricingInput {
  fx_rate: number
  local_currency_code: string
  taxes: CountryTaxRule[]
}

export interface GatewayFeeInput {
  commission_pct: number
  commission_fixed_local: number
}

const roundLocal = (value: number) => Math.round(value)
const roundUsd = (value: number) => Math.round(value * 100) / 100

export function resolveRetailPriceUsd(input: LinePricingInput): number {
  if (input.retail_price_usd != null && input.retail_price_usd > 0) {
    return input.retail_price_usd
  }
  const margin = input.margin_pct ?? 0
  return salePriceUsd(input.wholesale_price_usd, margin)
}

/** Nominal product value in USD (gift card denomination), not sale price with margin. */
export function resolveFaceValueUsd(input: LinePricingInput): number {
  if (input.face_value_usd != null && input.face_value_usd > 0) {
    return input.face_value_usd
  }
  const amount = input.face_value_amount
  const currency = input.face_value_currency?.toUpperCase()
  if (amount != null && amount > 0 && currency === "USD") {
    return amount
  }
  return resolveRetailPriceUsd(input)
}

export function computeTaxLines(
  baseLocal: number,
  fxRate: number,
  taxes: CountryTaxRule[]
): PricingTaxLine[] {
  return taxes
    .filter((tax) => tax.rate_pct > 0)
    .map((tax) => {
      const amountLocal = roundLocal(baseLocal * (tax.rate_pct / 100))
      return {
        name: tax.name,
        rate_pct: tax.rate_pct,
        amount_local: amountLocal,
        amount_usd: roundUsd(amountLocal / fxRate),
      }
    })
}

export function computeLinePricing(
  input: LinePricingInput,
  country: CountryPricingInput
): LinePricingBreakdown {
  const quantity = input.quantity ?? 1
  const retailUsd = resolveRetailPriceUsd(input)
  const faceUsd = resolveFaceValueUsd(input)
  const marginPct = input.margin_pct ?? 0
  const unitSubtotalLocal = roundLocal(retailUsd * country.fx_rate)
  const subtotalLocal = unitSubtotalLocal * quantity
  const subtotalUsd = roundUsd(retailUsd * quantity)
  const faceValueLocal = roundLocal(faceUsd * country.fx_rate) * quantity
  const faceValueUsd = roundUsd(faceUsd * quantity)
  const marginUsd = roundUsd(Math.max(0, subtotalUsd - faceValueUsd))
  const marginLocal = Math.max(0, subtotalLocal - faceValueLocal)
  const taxes = computeTaxLines(subtotalLocal, country.fx_rate, country.taxes)
  const taxTotalLocal = taxes.reduce((sum, tax) => sum + tax.amount_local, 0)
  const taxTotalUsd = roundUsd(taxTotalLocal / country.fx_rate)

  return {
    fazer_sku_id: input.fazer_sku_id ?? null,
    title: input.title ?? null,
    wholesale_price_usd: input.wholesale_price_usd,
    retail_price_usd: retailUsd,
    face_value_usd: faceValueUsd,
    face_value_local: faceValueLocal,
    margin_pct: marginPct,
    margin_usd: marginUsd,
    margin_local: marginLocal,
    quantity,
    fx_rate: country.fx_rate,
    local_currency_code: country.local_currency_code,
    subtotal_local: subtotalLocal,
    subtotal_usd: subtotalUsd,
    taxes,
    tax_total_local: taxTotalLocal,
    tax_total_usd: taxTotalUsd,
    total_before_commission_local: subtotalLocal + taxTotalLocal,
    total_before_commission_usd: roundUsd(subtotalUsd + taxTotalUsd),
  }
}

export function computeGatewayCommission(
  amountLocal: number,
  fee: GatewayFeeInput,
  overrideFixedLocal?: number | null
): number {
  if (overrideFixedLocal != null) {
    return roundLocal(overrideFixedLocal)
  }
  return roundLocal(amountLocal * (fee.commission_pct / 100) + fee.commission_fixed_local)
}

export function aggregateTaxLines(lines: LinePricingBreakdown[]): PricingTaxLine[] {
  const byName = new Map<string, PricingTaxLine>()
  for (const line of lines) {
    for (const tax of line.taxes) {
      const existing = byName.get(tax.name)
      if (existing) {
        existing.amount_local += tax.amount_local
        existing.amount_usd = roundUsd(existing.amount_usd + tax.amount_usd)
      } else {
        byName.set(tax.name, { ...tax })
      }
    }
  }
  return [...byName.values()]
}

export function buildCartPricingBreakdown(input: {
  country_code: string
  gateway: PaymentGatewayId
  country: CountryPricingInput
  gatewayFee: GatewayFeeConfig
  lines: LinePricingInput[]
  commission_fixed_local_override?: number | null
}): CartPricingBreakdown {
  const lineBreakdowns = input.lines.map((line) =>
    computeLinePricing(line, input.country)
  )

  const singleLineCommissionOverride =
    input.lines.length === 1 ? input.lines[0]?.commission_fixed_local : undefined
  const commissionOverride =
    singleLineCommissionOverride !== undefined && singleLineCommissionOverride !== null
      ? singleLineCommissionOverride
      : input.commission_fixed_local_override

  const subtotalLocal = lineBreakdowns.reduce((sum, line) => sum + line.subtotal_local, 0)
  const subtotalUsd = roundUsd(lineBreakdowns.reduce((sum, line) => sum + line.subtotal_usd, 0))
  const faceValueUsd = roundUsd(
    lineBreakdowns.reduce((sum, line) => sum + line.face_value_usd, 0)
  )
  const faceValueLocal = lineBreakdowns.reduce((sum, line) => sum + line.face_value_local, 0)
  const marginUsd = roundUsd(lineBreakdowns.reduce((sum, line) => sum + line.margin_usd, 0))
  const marginLocal = lineBreakdowns.reduce((sum, line) => sum + line.margin_local, 0)
  const marginPct =
    input.lines.length === 1
      ? (input.lines[0]?.margin_pct ?? 0)
      : faceValueUsd > 0
        ? roundUsd((marginUsd / faceValueUsd) * 100)
        : 0
  const taxes = aggregateTaxLines(lineBreakdowns)
  const taxTotalLocal = taxes.reduce((sum, tax) => sum + tax.amount_local, 0)
  const taxTotalUsd = roundUsd(taxTotalLocal / input.country.fx_rate)
  const beforeCommissionLocal = subtotalLocal + taxTotalLocal

  const commissionLocal = computeGatewayCommission(
    beforeCommissionLocal,
    {
      commission_pct: input.gatewayFee.commission_pct,
      commission_fixed_local: input.gatewayFee.commission_fixed_local,
    },
    commissionOverride
  )
  const commissionUsd = roundUsd(commissionLocal / input.country.fx_rate)
  const totalLocal = beforeCommissionLocal + commissionLocal
  const totalUsd = roundUsd(totalLocal / input.country.fx_rate)

  return {
    country_code: input.country_code,
    gateway: input.gateway,
    fx_rate: input.country.fx_rate,
    local_currency_code: input.country.local_currency_code,
    lines: lineBreakdowns,
    face_value_usd: faceValueUsd,
    face_value_local: faceValueLocal,
    margin_pct: marginPct,
    margin_usd: marginUsd,
    margin_local: marginLocal,
    subtotal_usd: subtotalUsd,
    subtotal_local: subtotalLocal,
    taxes,
    tax_total_local: taxTotalLocal,
    tax_total_usd: taxTotalUsd,
    commission_local: commissionLocal,
    commission_usd: commissionUsd,
    commission_is_zero: commissionLocal === 0,
    commission_pct: input.gatewayFee.commission_pct,
    commission_fixed_local: input.gatewayFee.commission_fixed_local,
    total_local: totalLocal,
    total_usd: totalUsd,
  }
}

/** COP amount to persist on Medusa variant (subtotal + taxes, before gateway commission). */
export function resolveMedusaVariantCopTotal(line: LinePricingBreakdown): number {
  return line.total_before_commission_local
}
