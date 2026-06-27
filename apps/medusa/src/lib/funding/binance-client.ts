import crypto from "node:crypto"
import type { FazerPayment } from "../../modules/fazer/lib/types"
import { getFundingConfig, isBinanceConfigured, isBinancePayConfigured } from "./funding-config"

export interface BinanceFundingInput {
  fazerPaymentId: string
  amountUsd: number
  method: string
  payTo?: string | null
  payUrl?: string | null
  idempotencyKey: string
}

export interface BinanceFundingResult {
  transferId: string
  status: "sent" | "mock"
}

export class BinanceFundingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BinanceFundingError"
  }
}

/**
 * Sends funds to Fazer according to the payment instructions returned by POST /payments.
 * Uses Binance Pay when merchant credentials are set; otherwise Spot wallet withdraw (USDT).
 */
export async function sendFazerFundingPayment(
  input: BinanceFundingInput
): Promise<BinanceFundingResult> {
  const config = getFundingConfig()

  if (config.mockBinance) {
    return {
      transferId: `mock-binance-${input.idempotencyKey}`,
      status: "mock",
    }
  }

  if (isBinancePayConfigured()) {
    return sendViaBinancePay(input)
  }

  if (isBinanceConfigured() && input.payTo) {
    return sendViaSpotWithdraw(input)
  }

  throw new BinanceFundingError(
    "Binance no está configurado. Define BINANCE_PAY_* o BINANCE_API_KEY/SECRET."
  )
}

async function sendViaBinancePay(input: BinanceFundingInput): Promise<BinanceFundingResult> {
  const baseUrl =
    process.env.BINANCE_PAY_BASE_URL?.replace(/\/$/, "") ??
    "https://bpay.binanceapi.com"
  const merchantId = process.env.BINANCE_PAY_MERCHANT_ID!
  const certSn = process.env.BINANCE_PAY_CERTIFICATE_SN!
  const privateKey = process.env.BINANCE_PAY_PRIVATE_KEY!.replace(/\\n/g, "\n")

  const body = {
    merchantId,
    merchantTradeNo: input.idempotencyKey.slice(0, 32),
    orderAmount: input.amountUsd.toFixed(2),
    currency: "USDT",
    description: `Fazer funding ${input.fazerPaymentId}`,
  }

  const timestamp = Date.now()
  const nonce = crypto.randomBytes(16).toString("hex")
  const payload = JSON.stringify(body)
  const signPayload = `${timestamp}\n${nonce}\n${payload}\n`
  const signature = crypto.createSign("RSA-SHA256").update(signPayload).sign(privateKey, "base64")

  const response = await fetch(`${baseUrl}/binancepay/openapi/v2/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "BinancePay-Timestamp": String(timestamp),
      "BinancePay-Nonce": nonce,
      "BinancePay-Certificate-SN": certSn,
      "BinancePay-Signature": signature,
    },
    body: payload,
  })

  const json = (await response.json()) as {
    status?: string
    code?: string
    data?: { prepayId?: string; qrContent?: string }
    errorMessage?: string
  }

  if (!response.ok || json.status === "FAIL") {
    throw new BinanceFundingError(
      json.errorMessage ?? `Binance Pay HTTP ${response.status}`
    )
  }

  return {
    transferId: json.data?.prepayId ?? input.idempotencyKey,
    status: "sent",
  }
}

async function sendViaSpotWithdraw(input: BinanceFundingInput): Promise<BinanceFundingResult> {
  const apiKey = process.env.BINANCE_API_KEY!
  const apiSecret = process.env.BINANCE_API_SECRET!
  const baseUrl =
    process.env.BINANCE_API_BASE_URL?.replace(/\/$/, "") ?? "https://api.binance.com"

  const network = resolveWithdrawNetwork(input.method)
  const params = new URLSearchParams({
    coin: "USDT",
    address: input.payTo!,
    amount: input.amountUsd.toFixed(2),
    network,
    timestamp: String(Date.now()),
  })

  const signature = crypto.createHmac("sha256", apiSecret).update(params.toString()).digest("hex")
  params.set("signature", signature)

  const response = await fetch(`${baseUrl}/sapi/v1/capital/withdraw/apply?${params}`, {
    method: "POST",
    headers: { "X-MBX-APIKEY": apiKey },
  })

  const json = (await response.json()) as { id?: string; msg?: string; code?: number }
  if (!response.ok || json.code) {
    throw new BinanceFundingError(json.msg ?? `Binance withdraw HTTP ${response.status}`)
  }

  return {
    transferId: String(json.id ?? input.idempotencyKey),
    status: "sent",
  }
}

function resolveWithdrawNetwork(method: string): string {
  switch (method) {
    case "trc20":
      return "TRX"
    case "bep20":
      return "BSC"
    case "ton":
      return "TON"
    case "aptos":
      return "APT"
    default:
      return process.env.BINANCE_USDT_NETWORK ?? "TRX"
  }
}

export function paymentInstructionsFromFazer(payment: FazerPayment): BinanceFundingInput["payTo"] {
  return payment.pay_to ?? null
}

export function isFazerPaymentConfirmed(status?: string): boolean {
  const normalized = (status ?? "").toLowerCase()
  return normalized === "completed" || normalized === "confirmed" || normalized === "paid"
}
