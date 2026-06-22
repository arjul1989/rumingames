// Per-country configuration (US-6.3 / RUM-43). Single source of truth for the
// supported markets: currency, payment provider, supplier flags and locale.
// The MVP only enables Colombia (co); add new entries here to scale to mx/ar.

export interface CountryConfig {
  /** ISO 3166-1 alpha-2, lowercase (matches the Medusa region country + URL segment). */
  code: string
  /** Display label for selectors/footers. */
  label: string
  /** ISO 4217 currency used by the Medusa region. */
  currency: string
  /** BCP-47 locale for date/number formatting and hreflang. */
  locale: string
  /** Medusa payment provider id used to initiate checkout sessions. */
  paymentProviderId: string
  /** Whether the Fazer Cards supplier is enabled for this market. */
  fazerEnabled: boolean
  /** Whether the market is live (false => "Próximamente" / redirect to default). */
  active: boolean
}

export const COUNTRIES: Record<string, CountryConfig> = {
  co: {
    code: "co",
    label: "Colombia",
    currency: "cop",
    locale: "es-CO",
    paymentProviderId:
      process.env.NEXT_PUBLIC_PAYMENT_PROVIDER_ID || "pp_mercadopago_mercadopago",
    fazerEnabled: true,
    active: true,
  },
}

export const DEFAULT_COUNTRY = "co"

/** Country codes that are live in this MVP. */
export const ACTIVE_COUNTRY_CODES = Object.values(COUNTRIES)
  .filter((c) => c.active)
  .map((c) => c.code)

export function isSupportedCountry(code?: string | null): boolean {
  if (!code) return false
  const cfg = COUNTRIES[code.toLowerCase()]
  return Boolean(cfg && cfg.active)
}

export function getCountryConfig(code?: string | null): CountryConfig {
  const cfg = code ? COUNTRIES[code.toLowerCase()] : undefined
  return cfg ?? COUNTRIES[DEFAULT_COUNTRY]
}
