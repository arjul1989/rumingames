// USD -> COP price conversion with margin (US-2.2 / US-5.5).
// Sale price = supplier USD price * FX rate * (1 + margin%). Rounded to a
// clean COP figure since Colombian pesos are not used with decimals.

export const DEFAULT_USD_COP_RATE = 4000
export const DEFAULT_MARGIN_PCT = 15
const ROUND_TO = 100

export function getUsdCopRate(): number {
  const raw = Number(process.env.EXCHANGE_RATE_USD_COP)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_USD_COP_RATE
}

export function getDefaultMarginPct(): number {
  const raw = Number(process.env.DEFAULT_MARGIN_PCT)
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_MARGIN_PCT
}

// Default % deviation in the FX rate that triggers a price refresh job.
export const DEFAULT_RATE_CHANGE_THRESHOLD_PCT = 2

export function getRateChangeThresholdPct(): number {
  const raw = Number(process.env.RATE_CHANGE_THRESHOLD_PCT)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RATE_CHANGE_THRESHOLD_PCT
}

/**
 * Per-category margin overrides, configured via the CATEGORY_MARGINS env var
 * as a JSON object mapping category slug -> margin %, e.g.
 *   CATEGORY_MARGINS='{"gift-cards":12,"top-ups":18}'
 * Falls back to the global default margin when a category is missing/invalid.
 */
export function getCategoryMargins(): Record<string, number> {
  const raw = process.env.CATEGORY_MARGINS
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const pct = Number(value)
      if (Number.isFinite(pct) && pct >= 0) out[key] = pct
    }
    return out
  } catch {
    return {}
  }
}

/** Resolve the effective margin for a category, falling back to the global default. */
export function getMarginForCategory(category?: string | null): number {
  if (category) {
    const margins = getCategoryMargins()
    if (category in margins) return margins[category]
  }
  return getDefaultMarginPct()
}

/** True when the FX rate moved by more than the threshold % (absolute change). */
export function rateChangedBeyondThreshold(
  previousRate: number,
  currentRate: number,
  thresholdPct: number = getRateChangeThresholdPct()
): boolean {
  if (!Number.isFinite(previousRate) || previousRate <= 0) return true
  if (!Number.isFinite(currentRate) || currentRate <= 0) return false
  const changePct = (Math.abs(currentRate - previousRate) / previousRate) * 100
  return changePct > thresholdPct
}

/**
 * Compute the COP sale price from a USD supplier price.
 * @param usd supplier price in USD
 * @param rate USD->COP exchange rate
 * @param marginPct markup percentage applied over cost
 * @returns integer COP price rounded to the nearest 100
 */
export function computeCopPrice(
  usd: number,
  rate: number = getUsdCopRate(),
  marginPct: number = getDefaultMarginPct()
): number {
  if (!Number.isFinite(usd) || usd < 0) {
    throw new Error(`Invalid USD price: ${usd}`)
  }
  const raw = usd * rate * (1 + marginPct / 100)
  return Math.round(raw / ROUND_TO) * ROUND_TO
}
