export type WompiTransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR"

export interface WompiTransaction {
  id: string
  reference: string
  amount_in_cents: number
  currency: string
  customer_email: string
  payment_method_type?: string
  status: WompiTransactionStatus
  status_message?: string
  redirect_url?: string | null
}

export interface WompiApiEnvelope<T> {
  data: T
}
