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
  entity_type?: "individual" | "association"
  first_name?: string
  last_name?: string
  identification?: { type?: string; number?: string }
  address?: {
    zip_code?: string
    street_name?: string
    street_number?: string
    neighborhood?: string
    city?: string
    federal_unit?: string
  }
  phone?: {
    area_code?: string
    number?: string
  }
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
  callback_url?: string
  transaction_details?: {
    financial_institution?: string
  }
  additional_info?: {
    ip_address?: string
  }
  metadata?: Record<string, unknown>
}

export interface MpPayment {
  id: number
  status: MpPaymentStatus
  status_detail?: string
  transaction_amount: number
  currency_id?: string
  external_reference?: string
  payment_method_id?: string
  transaction_details?: {
    external_resource_url?: string
    financial_institution?: string
  }
  point_of_interaction?: {
    transaction_data?: {
      ticket_url?: string
      bank_transfer_url?: string
    }
  }
}

export interface MpRefund {
  id: number
  payment_id: number
  amount: number
  status?: string
}

export interface MpCustomer {
  id: string
  email?: string
  first_name?: string
  last_name?: string
}

export interface MpSavedCard {
  id: string
  customer_id?: string
  expiration_month?: number
  expiration_year?: number
  first_six_digits?: string
  last_four_digits?: string
  payment_method?: {
    id?: string
    name?: string
    payment_type_id?: string
    thumbnail?: string
  }
  issuer?: { id?: string; name?: string }
  cardholder?: { name?: string }
}
