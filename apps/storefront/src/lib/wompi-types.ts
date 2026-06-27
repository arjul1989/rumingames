export type WompiBrowserInfo = {
  browser_color_depth: string
  browser_screen_height: string
  browser_screen_width: string
  browser_language: string
  browser_user_agent: string
  browser_tz: string
}

export type WompiAcceptanceToken = {
  acceptance_token: string
  permalink: string
  type: string
}

export type WompiThreeDsAuth = {
  current_step?: "CHALLENGE" | "AUTHENTICATION" | "SUPPORTED_VERSION"
  current_step_status?: "PENDING" | "COMPLETED" | "ERROR" | "Non-Authenticated"
  three_ds_method_data?: string
}

export type WompiTransactionView = {
  id: string
  reference: string
  status: "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR"
  status_message?: string | null
  payment_method?: {
    extra?: {
      three_ds_auth?: WompiThreeDsAuth
    }
  }
}

export type WompiCardTokenInput = {
  number: string
  cvc: string
  exp_month: string
  exp_year: string
  card_holder: string
}

export type WompiCardToken = {
  id: string
  brand: string
  last_four: string
}
