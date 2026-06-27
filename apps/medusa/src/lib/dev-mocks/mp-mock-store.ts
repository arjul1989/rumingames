import type { MpPayment, MpPaymentStatus } from "../../modules/payment-mercadopago/lib/types"

export type MockMpRecord = {
  id: number
  status: MpPaymentStatus
  status_detail?: string
  transaction_amount: number
  external_reference: string
  payment_method_id?: string
  currency_id: string
}

let nextId = 900_000_001

const payments = new Map<number, MockMpRecord>()

export function createMockMpPayment(input: {
  transaction_amount: number
  external_reference: string
  payment_method_id?: string
}): MpPayment {
  const id = nextId++
  const record: MockMpRecord = {
    id,
    status: "pending",
    status_detail: "pending_waiting_transfer",
    transaction_amount: input.transaction_amount,
    external_reference: input.external_reference,
    payment_method_id: input.payment_method_id,
    currency_id: "COP",
  }
  payments.set(id, record)

  const simulatorUrl = buildSimulatorUrl(id, input.external_reference)

  return {
    id,
    status: "pending",
    status_detail: record.status_detail,
    transaction_amount: input.transaction_amount,
    external_reference: input.external_reference,
    payment_method_id: input.payment_method_id,
    currency_id: "COP",
    transaction_details: {
      external_resource_url: simulatorUrl,
    },
    point_of_interaction: {
      transaction_data: {
        bank_transfer_url: simulatorUrl,
        ticket_url: simulatorUrl,
      },
    },
  }
}

export function getMockMpPayment(id: number | string): MpPayment | null {
  const record = payments.get(Number(id))
  if (!record) return null
  return {
    id: record.id,
    status: record.status,
    status_detail: record.status_detail,
    transaction_amount: record.transaction_amount,
    external_reference: record.external_reference,
    payment_method_id: record.payment_method_id,
    currency_id: record.currency_id,
  }
}

export function setMockMpPaymentStatus(
  id: number | string,
  status: MpPaymentStatus,
  status_detail?: string
): MpPayment | null {
  const record = payments.get(Number(id))
  if (!record) return null
  record.status = status
  record.status_detail =
    status_detail ??
    (status === "approved"
      ? "accredited"
      : status === "rejected"
        ? "cc_rejected_other_reason"
        : record.status_detail)
  return getMockMpPayment(id)
}

function buildSimulatorUrl(paymentId: number, sessionId: string): string {
  const base = (process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000").replace(/\/$/, "")
  const qs = new URLSearchParams({
    payment_id: String(paymentId),
    session_id: sessionId,
  })
  return `${base}/dev/mock-mp?${qs.toString()}`
}
