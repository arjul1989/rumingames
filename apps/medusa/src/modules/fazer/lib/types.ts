// Typed surface for the Fazer Cards reseller API (https://api.fzr.cards/api/v2).

export interface FazerCatalogItem {
  id: string
  name: string
  category?: string
  price_usd: number
  currency?: string
  in_stock?: boolean
}

export interface FazerCatalogPage {
  items: FazerCatalogItem[]
  total?: number
  limit?: number
  offset?: number
}

export interface FazerCatalogParams {
  category?: string
  limit?: number
  offset?: number
}

export interface FazerBalance {
  balance_usd: number
  currency: string
}

export interface FazerCreateOrderInput {
  sku_id: string
  quantity: number
  /** Idempotency key reused across retries to avoid double-charging. */
  idempotency_key: string
  /** Player/account id for top-up products that require it. */
  external_id?: string
}

export type FazerOrderStatus =
  | "created"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"

export interface FazerOrder {
  id: string
  status: FazerOrderStatus
  sku_id: string
  quantity: number
  /** Delivered codes, present once status === "completed". */
  codes?: string[]
  error?: string
}

export interface FazerGiftCardOffer {
  card_id: string
  name: string
  price_usd: string
  stock?: number
  min_order_quantity?: number
  max_order_quantity?: number
}

export interface FazerTopupOffer {
  offer_id: string
  name: string
  price_usd: string
}

export interface FazerTopupField {
  key: string
  label: string
  type: string
  options?: Array<{ label: string; value: string }>
}

export interface FazerCategorySummary {
  category_id: string
  name: string
  note?: string
  imageurl?: string | null
}

export interface FazerCategoryListPage {
  items: FazerCategorySummary[]
  meta: {
    total: number
    limit: number
    next_cursor: string | null
    has_more: boolean
  }
}

export interface FazerGiftCardCategoryDetail {
  category_id: string
  name: string
  note?: string
  imageurl?: string | null
  offers: FazerGiftCardOffer[]
}

export interface FazerTopupCategoryDetail {
  category_id: string
  name: string
  note?: string
  imageurl?: string | null
  offers: FazerTopupOffer[]
  fields?: FazerTopupField[]
}

export type FazerPaymentMethodCode =
  | "trc20"
  | "bep20"
  | "ton"
  | "aptos"
  | "binancepay"
  | "card"
  | string

export interface FazerPaymentMethod {
  code: FazerPaymentMethodCode
  label: string
  min_amount_usd?: string
  max_amount_usd?: string
}

export type FazerPaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "expired"
  | string

export interface FazerPayment {
  id: string
  method: FazerPaymentMethodCode
  amount_usd: string
  status?: FazerPaymentStatus
  pay_to?: string
  pay_url?: string
}

export interface FazerCreatePaymentInput {
  method: FazerPaymentMethodCode
  amount_usd: number | string
  idempotency_key: string
}
