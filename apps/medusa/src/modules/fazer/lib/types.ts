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
