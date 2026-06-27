import { MedusaContainer } from "@medusajs/framework"
import type {
  CountryPricingConfig,
  CountryTaxRule,
  GatewayFeeConfig,
} from "./country-pricing-types"
import type { PaymentGatewayId } from "./payment-gateway-types"
import { PAYMENT_GATEWAYS } from "./payment-gateway-types"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { getUsdCopRate } from "./pricing"

const DEFAULT_GATEWAY_FEES: Record<PaymentGatewayId, Omit<GatewayFeeConfig, "country_code">> = {
  mercadopago: {
    gateway: "mercadopago",
    commission_pct: 0,
    commission_fixed_local: 0,
  },
  wompi: {
    gateway: "wompi",
    commission_pct: 3,
    commission_fixed_local: 800,
  },
  epayco: {
    gateway: "epayco",
    commission_pct: 2.5,
    commission_fixed_local: 600,
  },
}

function configId(countryCode: string): string {
  return countryCode.toLowerCase()
}

function feeId(countryCode: string, gateway: PaymentGatewayId): string {
  return `${countryCode.toLowerCase()}_${gateway}`
}

function normalizeTaxes(raw: unknown): CountryTaxRule[] {
  if (!Array.isArray(raw)) return []
  const taxes: CountryTaxRule[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const name = String((item as { name?: unknown }).name ?? "").trim()
    const rate_pct = Number((item as { rate_pct?: unknown }).rate_pct)
    if (!name || !Number.isFinite(rate_pct) || rate_pct < 0) continue
    taxes.push({ name, rate_pct })
  }
  return taxes
}

export async function getCountryPricingConfig(
  container: MedusaContainer,
  countryCode = "co"
): Promise<CountryPricingConfig> {
  const normalized = countryCode.toLowerCase()
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const existing = await supplier.listCountryPricingConfigs({
    country_code: normalized,
  })

  if (existing[0]) {
    return {
      country_code: existing[0].country_code,
      fx_rate: existing[0].fx_rate,
      local_currency_code: existing[0].local_currency_code,
      taxes: normalizeTaxes(existing[0].taxes),
    }
  }

  const [created] = await supplier.createCountryPricingConfigs([
    {
      id: configId(normalized),
      country_code: normalized,
      fx_rate: getUsdCopRate(),
      local_currency_code: "cop",
      taxes: [],
    },
  ])

  return {
    country_code: created.country_code,
    fx_rate: created.fx_rate,
    local_currency_code: created.local_currency_code,
    taxes: normalizeTaxes(created.taxes),
  }
}

export async function updateCountryPricingConfig(
  container: MedusaContainer,
  countryCode: string,
  patch: Partial<{
    fx_rate: number
    local_currency_code: string
    taxes: CountryTaxRule[]
  }>
): Promise<CountryPricingConfig> {
  const normalized = countryCode.toLowerCase()
  await getCountryPricingConfig(container, normalized)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  const update: Record<string, unknown> = { id: configId(normalized) }
  if (typeof patch.fx_rate === "number" && patch.fx_rate > 0) {
    update.fx_rate = patch.fx_rate
  }
  if (typeof patch.local_currency_code === "string" && patch.local_currency_code.trim()) {
    update.local_currency_code = patch.local_currency_code.toLowerCase()
  }
  if (patch.taxes) {
    update.taxes = patch.taxes
  }

  const [updated] = await supplier.updateCountryPricingConfigs([update])
  return {
    country_code: updated.country_code,
    fx_rate: updated.fx_rate,
    local_currency_code: updated.local_currency_code,
    taxes: normalizeTaxes(updated.taxes),
  }
}

export async function getPaymentGatewayFee(
  container: MedusaContainer,
  countryCode: string,
  gateway: PaymentGatewayId
): Promise<GatewayFeeConfig> {
  const normalized = countryCode.toLowerCase()
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const existing = await supplier.listPaymentGatewayFees({
    country_code: normalized,
    gateway,
  })

  if (existing[0]) {
    return {
      country_code: existing[0].country_code,
      gateway: existing[0].gateway as PaymentGatewayId,
      commission_pct: existing[0].commission_pct,
      commission_fixed_local: existing[0].commission_fixed_local,
    }
  }

  const defaults = DEFAULT_GATEWAY_FEES[gateway]
  const [created] = await supplier.createPaymentGatewayFees([
    {
      id: feeId(normalized, gateway),
      country_code: normalized,
      gateway,
      commission_pct: defaults.commission_pct,
      commission_fixed_local: defaults.commission_fixed_local,
    },
  ])

  return {
    country_code: created.country_code,
    gateway: created.gateway as PaymentGatewayId,
    commission_pct: created.commission_pct,
    commission_fixed_local: created.commission_fixed_local,
  }
}

export async function listPaymentGatewayFeesForCountry(
  container: MedusaContainer,
  countryCode: string
): Promise<GatewayFeeConfig[]> {
  const normalized = countryCode.toLowerCase()
  const fees: GatewayFeeConfig[] = []
  for (const gateway of PAYMENT_GATEWAYS) {
    fees.push(await getPaymentGatewayFee(container, normalized, gateway))
  }
  return fees
}

export async function updatePaymentGatewayFee(
  container: MedusaContainer,
  countryCode: string,
  gateway: PaymentGatewayId,
  patch: Partial<{ commission_pct: number; commission_fixed_local: number }>
): Promise<GatewayFeeConfig> {
  const normalized = countryCode.toLowerCase()
  await getPaymentGatewayFee(container, normalized, gateway)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  const update: Record<string, unknown> = {
    id: feeId(normalized, gateway),
  }
  if (typeof patch.commission_pct === "number" && patch.commission_pct >= 0) {
    update.commission_pct = patch.commission_pct
  }
  if (
    typeof patch.commission_fixed_local === "number" &&
    patch.commission_fixed_local >= 0
  ) {
    update.commission_fixed_local = patch.commission_fixed_local
  }

  const [updated] = await supplier.updatePaymentGatewayFees([update])
  return {
    country_code: updated.country_code,
    gateway: updated.gateway as PaymentGatewayId,
    commission_pct: updated.commission_pct,
    commission_fixed_local: updated.commission_fixed_local,
  }
}

export { DEFAULT_GATEWAY_FEES }
