import type { MedusaContainer } from "@medusajs/framework"
import crypto from "node:crypto"
import { SUPPLIER_MODULE } from "../../modules/supplier"
import { FAZER_MODULE } from "../../modules/fazer"
import type SupplierModuleService from "../../modules/supplier/service"
import type FazerModuleService from "../../modules/fazer/service"
import {
  getFundingConfig,
  type FundingPaymentMethod,
} from "./funding-config"
import {
  isFazerPaymentConfirmed,
  sendFazerFundingPayment,
} from "./binance-client"
import { logSupportTrace } from "../support/log-support-trace"

const POLL_ATTEMPTS = 20
const POLL_DELAY_MS = 3000

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function networkLabel(method: string): string {
  const m = method.toLowerCase()
  if (m === "trc20") return "USDT TRC20"
  if (m === "bep20") return "USDT BEP20"
  if (m === "ton") return "USDT TON"
  if (m === "aptos") return "USDT Aptos"
  if (m === "binancepay") return "Binance Pay"
  return method
}

export async function createWalletTopup(
  container: MedusaContainer,
  input: { amount_usd: number; method?: string; created_by?: string }
) {
  const amount = Number(input.amount_usd)
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Monto inválido.")
  }

  const config = getFundingConfig()
  const method = (input.method ?? config.paymentMethod) as FundingPaymentMethod
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const fazer = container.resolve<FazerModuleService>(FAZER_MODULE)
  const idempotencyKey = `wallet-topup:${crypto.randomUUID()}`

  const topup = await supplier.createFazerWalletTopups({
    amount_usd: amount,
    method,
    status: "draft",
    idempotency_key: idempotencyKey,
    created_by: input.created_by ?? null,
  })

  let payment
  try {
    payment = await fazer.createPayment({
      method,
      amount_usd: amount,
      idempotency_key: idempotencyKey,
    })
    await logSupportTrace(container, {
      ref_type: "wallet_topup",
      ref_id: topup.id,
      stage: "fazer_payment",
      label: "Crear pago Fazer (recarga saldo)",
      endpoint: "POST /payments",
      method: "POST",
      request: { method, amount_usd: amount },
      response: payment,
    })
  } catch (err) {
    await supplier.updateFazerWalletTopups({
      id: topup.id,
      status: "failed",
      error_message: (err as Error).message,
    })
    throw err
  }

  const updated = await supplier.updateFazerWalletTopups({
    id: topup.id,
    status: "payment_created",
    fazer_payment_id: payment.id,
    fazer_pay_to: payment.pay_to ?? null,
    fazer_pay_url: payment.pay_url ?? null,
    error_message: null,
  })

  return {
    topup: updated,
    instructions: {
      amount_usd: amount,
      method,
      network: networkLabel(method),
      pay_to: payment.pay_to ?? null,
      pay_url: payment.pay_url ?? null,
      fazer_payment_id: payment.id,
    },
  }
}

export async function sendWalletTopupBinance(
  container: MedusaContainer,
  topupId: string
) {
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const topup = await supplier.retrieveFazerWalletTopup(topupId)
  if (!topup.fazer_payment_id) {
    throw new Error("El top-up no tiene pago Fazer asociado.")
  }
  if (topup.status !== "payment_created" && topup.status !== "awaiting_confirmation") {
    throw new Error(`Estado inválido para envío Binance: ${topup.status}`)
  }

  const idempotencyKey = topup.idempotency_key
  let binanceResult
  try {
    binanceResult = await sendFazerFundingPayment({
      fazerPaymentId: topup.fazer_payment_id,
      amountUsd: topup.amount_usd,
      method: topup.method,
      payTo: topup.fazer_pay_to,
      payUrl: topup.fazer_pay_url,
      idempotencyKey,
    })
    await logSupportTrace(container, {
      ref_type: "wallet_topup",
      ref_id: topup.id,
      stage: "binance",
      label: "Envío Binance (recarga saldo)",
      endpoint: "Binance API",
      method: "POST",
      request: {
        amount_usd: topup.amount_usd,
        method: topup.method,
        pay_to: topup.fazer_pay_to,
      },
      response: binanceResult,
    })
  } catch (err) {
    await supplier.updateFazerWalletTopups({
      id: topup.id,
      status: "failed",
      error_message: (err as Error).message,
    })
    throw err
  }

  return supplier.updateFazerWalletTopups({
    id: topup.id,
    status: "binance_sent",
    binance_transfer_id: binanceResult.transferId,
    error_message: null,
  })
}

export async function confirmWalletTopup(
  container: MedusaContainer,
  topupId: string,
  binanceTxId: string
) {
  const txId = binanceTxId.trim()
  if (!txId) throw new Error("ID de transacción Binance requerido.")

  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const fazer = container.resolve<FazerModuleService>(FAZER_MODULE)
  const topup = await supplier.retrieveFazerWalletTopup(topupId)
  if (!topup.fazer_payment_id) {
    throw new Error("El top-up no tiene pago Fazer asociado.")
  }

  await supplier.updateFazerWalletTopups({
    id: topup.id,
    binance_tx_id: txId,
    status: "awaiting_confirmation",
    error_message: null,
  })

  try {
    await fazer.confirmPayment(topup.fazer_payment_id, { tx_id: txId })
    await logSupportTrace(container, {
      ref_type: "wallet_topup",
      ref_id: topup.id,
      stage: "fazer_payment",
      label: "Confirmar pago Fazer con TX Binance",
      endpoint: `POST /payments/${topup.fazer_payment_id}/confirm`,
      method: "POST",
      request: { tx_id: txId },
      response: { submitted: true },
    })
  } catch {
    // Fazer may confirm via polling only; continue.
  }

  let confirmed = false
  let lastPayment
  for (let i = 0; i < POLL_ATTEMPTS && !confirmed; i++) {
    if (i > 0) await sleep(POLL_DELAY_MS)
    lastPayment = await fazer.getPayment(topup.fazer_payment_id)
    confirmed = isFazerPaymentConfirmed(lastPayment.status)
    await logSupportTrace(container, {
      ref_type: "wallet_topup",
      ref_id: topup.id,
      stage: "fazer_payment",
      label: `Poll pago Fazer (${i + 1}/${POLL_ATTEMPTS})`,
      endpoint: `GET /payments/${topup.fazer_payment_id}`,
      method: "GET",
      response: lastPayment,
    })
  }

  if (!confirmed) {
    await supplier.updateFazerWalletTopups({
      id: topup.id,
      status: "awaiting_confirmation",
      error_message:
        "Pago aún no confirmado en Fazer. Verifica el TX y reintenta.",
    })
    throw new Error(
      "Fazer no confirmó el pago aún. Revisa el ID de transacción o espera unos minutos."
    )
  }

  return supplier.updateFazerWalletTopups({
    id: topup.id,
    status: "completed",
    confirmed_at: new Date(),
    error_message: null,
  })
}

export function serializeWalletTopup(topup: Record<string, unknown>) {
  return {
    id: topup.id,
    amount_usd: topup.amount_usd,
    method: topup.method,
    status: topup.status,
    fazer_payment_id: topup.fazer_payment_id ?? null,
    fazer_pay_to: topup.fazer_pay_to ?? null,
    fazer_pay_url: topup.fazer_pay_url ?? null,
    binance_transfer_id: topup.binance_transfer_id ?? null,
    binance_tx_id: topup.binance_tx_id ?? null,
    error_message: topup.error_message ?? null,
    confirmed_at: topup.confirmed_at ?? null,
    created_at: topup.created_at,
  }
}
