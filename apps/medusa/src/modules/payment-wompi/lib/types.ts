export type WompiTransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR"

export type WompiThreeDsStep =
  | "CHALLENGE"
  | "AUTHENTICATION"
  | "SUPPORTED_VERSION"

export type WompiThreeDsStepStatus =
  | "PENDING"
  | "COMPLETED"
  | "ERROR"
  | "Non-Authenticated"

export interface WompiThreeDsAuth {
  current_step?: WompiThreeDsStep
  current_step_status?: WompiThreeDsStepStatus
  three_ds_method_data?: string
}

export interface WompiPaymentMethodExtra {
  brand?: string
  last_four?: string
  is_three_ds?: boolean
  three_ds_auth_type?: string
  three_ds_auth?: WompiThreeDsAuth
}

export interface WompiTransaction {
  id: string
  reference: string
  amount_in_cents: number
  currency: string
  customer_email: string
  payment_method_type?: string
  payment_method?: {
    type?: string
    installments?: number
    extra?: WompiPaymentMethodExtra
  }
  status: WompiTransactionStatus
  status_message?: string | null
  redirect_url?: string | null
}

export interface WompiApiEnvelope<T> {
  data: T
}

export interface WompiAcceptanceToken {
  acceptance_token: string
  permalink: string
  type: string
}

export interface WompiMerchant {
  presigned_acceptance: WompiAcceptanceToken
  presigned_personal_data_auth: WompiAcceptanceToken
}

export interface WompiCardToken {
  id: string
  brand: string
  last_four: string
  exp_month: string
  exp_year: string
  card_holder: string
}

export interface WompiBrowserInfo {
  browser_color_depth: string
  browser_screen_height: string
  browser_screen_width: string
  browser_language: string
  browser_user_agent: string
  browser_tz: string
}

export interface CreateWompiThreeDsTransactionInput {
  reference: string
  amountPesos: number
  currency?: string
  customerEmail: string
  cardToken: string
  installments?: number
  acceptanceToken: string
  acceptPersonalAuth: string
  redirectUrl?: string
  customerData?: {
    full_name?: string
    phone_number?: string
    legal_id?: string
    legal_id_type?: string
  }
  browserInfo: WompiBrowserInfo
  ip?: string
}
