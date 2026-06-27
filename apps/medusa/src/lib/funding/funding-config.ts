/** Per-transaction Fazer funding via Binance (Épica 13 / US-13.1). */

export type FundingPaymentMethod = "binancepay" | "trc20" | "bep20" | "ton" | "aptos"

export interface FundingConfig {
  enabled: boolean
  paymentMethod: FundingPaymentMethod
  maxUsdPerOrder: number
  paymentPollAttempts: number
  paymentPollDelayMs: number
  mockBinance: boolean
}

const DEFAULT_METHOD: FundingPaymentMethod = "binancepay"

export function isPerOrderFundingEnabled(): boolean {
  return process.env.FUNDING_ENABLED === "true"
}

export function getFundingConfig(): FundingConfig {
  const maxRaw = Number(process.env.FUNDING_MAX_USD_PER_ORDER ?? "500")
  const pollAttempts = Number(process.env.FUNDING_PAYMENT_POLL_ATTEMPTS ?? "20")
  const pollDelayMs = Number(process.env.FUNDING_PAYMENT_POLL_DELAY_MS ?? "3000")
  const method = (process.env.FAZER_FUNDING_METHOD ?? DEFAULT_METHOD) as FundingPaymentMethod

  return {
    enabled: isPerOrderFundingEnabled(),
    paymentMethod: method,
    maxUsdPerOrder: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 500,
    paymentPollAttempts: Number.isFinite(pollAttempts) && pollAttempts > 0 ? pollAttempts : 20,
    paymentPollDelayMs: Number.isFinite(pollDelayMs) && pollDelayMs > 0 ? pollDelayMs : 3000,
    mockBinance:
      process.env.NODE_ENV !== "production" && process.env.MOCK_BINANCE === "true",
  }
}

export function isBinanceConfigured(): boolean {
  return Boolean(process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET)
}

export function isBinancePayConfigured(): boolean {
  return Boolean(
    process.env.BINANCE_PAY_MERCHANT_ID &&
      process.env.BINANCE_PAY_CERTIFICATE_SN &&
      process.env.BINANCE_PAY_PRIVATE_KEY
  )
}
