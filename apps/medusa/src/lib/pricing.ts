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
