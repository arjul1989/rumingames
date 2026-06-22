// Typed surface for the Mercado Pago payments REST API (v1).
// Docs: https://www.mercadopago.com.co/developers/en/reference

export type MpPaymentStatus =
  | "pending"
  | "approved"
  | "authorized"
  | "in_process"
  | "in_mediation"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"

export interface MpPayer {
  email?: string
  first_name?: string
  last_name?: string
  identification?: { type?: string; number?: string }
}

// Payload built from the Mercado Pago Brick formData on the frontend.
export interface MpCreatePaymentInput {
  transaction_amount: number
  description?: string
  token?: string
  installments?: number
  payment_method_id?: string
  issuer_id?: string
  payer?: MpPayer
  external_reference?: string
  statement_descriptor?: string
  notification_url?: string
}

export interface MpPayment {
  id: number
  status: MpPaymentStatus
  status_detail?: string
  transaction_amount: number
  currency_id?: string
  external_reference?: string
  payment_method_id?: string
}

export interface MpRefund {
  id: number
  payment_id: number
  amount: number
  status?: string
}
