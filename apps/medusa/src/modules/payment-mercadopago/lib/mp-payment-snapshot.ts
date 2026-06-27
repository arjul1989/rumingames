/** Fields from Mercado Pago GET /v1/payments stored on Medusa payment.data. */
export type MpPaymentSnapshot = {
  mp_status: string
  mp_status_detail?: string
  mp_payment_method_id?: string
  mp_transaction_amount?: number
  mp_transaction_amount_refunded?: number
  mp_currency_id?: string
  mp_net_received_amount?: number
  mp_total_paid_amount?: number
  mp_coupon_amount?: number
  mp_taxes_amount?: number
  mp_shipping_amount?: number
  mp_installments?: number
  mp_collector_id?: number
  mp_date_approved?: string
  mp_date_created?: string
  mp_money_release_status?: string
  mp_money_release_date?: string
  mp_fee_details?: unknown[]
  mp_refunds?: unknown[]
  mp_charges_details?: unknown[]
  mp_transaction_details?: Record<string, unknown>
  mp_payer?: Record<string, unknown>
  mp_snapshot_at: string
}

export function buildMpPaymentSnapshot(raw: Record<string, unknown>): MpPaymentSnapshot {
  const tx = raw.transaction_details as Record<string, unknown> | undefined
  return {
    mp_status: String(raw.status ?? ""),
    mp_status_detail: raw.status_detail ? String(raw.status_detail) : undefined,
    mp_payment_method_id: raw.payment_method_id
      ? String(raw.payment_method_id)
      : undefined,
    mp_transaction_amount: Number(raw.transaction_amount ?? 0),
    mp_transaction_amount_refunded: Number(raw.transaction_amount_refunded ?? 0),
    mp_currency_id: raw.currency_id ? String(raw.currency_id) : undefined,
    mp_net_received_amount:
      tx?.net_received_amount != null
        ? Number(tx.net_received_amount)
        : undefined,
    mp_total_paid_amount:
      tx?.total_paid_amount != null ? Number(tx.total_paid_amount) : undefined,
    mp_coupon_amount: Number(raw.coupon_amount ?? 0),
    mp_taxes_amount: Number(raw.taxes_amount ?? 0),
    mp_shipping_amount: Number(raw.shipping_amount ?? 0),
    mp_installments: Number(raw.installments ?? 1),
    mp_collector_id:
      raw.collector_id != null ? Number(raw.collector_id) : undefined,
    mp_date_approved: raw.date_approved ? String(raw.date_approved) : undefined,
    mp_date_created: raw.date_created ? String(raw.date_created) : undefined,
    mp_money_release_status: raw.money_release_status
      ? String(raw.money_release_status)
      : undefined,
    mp_money_release_date: raw.money_release_date
      ? String(raw.money_release_date)
      : undefined,
    mp_fee_details: Array.isArray(raw.fee_details) ? raw.fee_details : undefined,
    mp_refunds: Array.isArray(raw.refunds) ? raw.refunds : undefined,
    mp_charges_details: Array.isArray(raw.charges_details)
      ? raw.charges_details
      : undefined,
    mp_transaction_details: tx,
    mp_payer:
      raw.payer && typeof raw.payer === "object"
        ? (raw.payer as Record<string, unknown>)
        : undefined,
    mp_snapshot_at: new Date().toISOString(),
  }
}
