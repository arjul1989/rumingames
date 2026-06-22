/** Supported storefront country codes (expand as we launch new regions). */
export type CountryCode = "co"

export const DEFAULT_COUNTRY: CountryCode = "co"

export const SUPPORTED_COUNTRIES: readonly CountryCode[] = ["co"]

// ---------------------------------------------------------------------------
// Digital catalog model (US-1.2 / RUM-11)
// Shared between the Medusa seed and the Fazer Cards sync (Epic 2 / RUM-15).
// ---------------------------------------------------------------------------

/** Gaming platform / brand a product belongs to. */
export type Platform =
  | "steam"
  | "playstation"
  | "nintendo"
  | "xbox"
  | "riot"
  | "free_fire"

export const PLATFORMS: readonly Platform[] = [
  "steam",
  "playstation",
  "nintendo",
  "xbox",
  "riot",
  "free_fire",
]

/** Human-readable category name shown in the storefront, keyed by platform. */
export const PLATFORM_LABELS: Record<Platform, string> = {
  steam: "Steam",
  playstation: "PlayStation",
  nintendo: "Nintendo",
  xbox: "Xbox",
  riot: "Riot Games",
  free_fire: "Free Fire",
}

/**
 * Native Medusa product types we use. A product belongs to exactly one.
 * - gift_card: prepaid wallet/credit delivered as a redeemable code.
 * - game_topup: in-game currency; may require a player/account id at checkout.
 * - subscription: time-based access (e.g. Game Pass, PS Plus).
 */
export type ProductTypeSlug = "gift_card" | "game_topup" | "subscription"

export const PRODUCT_TYPES: readonly ProductTypeSlug[] = [
  "gift_card",
  "game_topup",
  "subscription",
]

/**
 * How the purchased item reaches the customer.
 * - digital_code: a code is emailed / revealed in the account.
 * - topup_id: fulfilled against a player id collected at checkout.
 */
export type DeliveryType = "digital_code" | "topup_id"

/** Convention for `product.metadata` on every digital product. */
export interface DigitalProductMetadata {
  platform: Platform
  product_type: ProductTypeSlug
  delivery_type: DeliveryType
  region: CountryCode
}

/** Convention for `variant.metadata` — links a variant to its supplier SKU. */
export interface DigitalVariantMetadata {
  /** Fazer Cards SKU id (filled by the catalog sync in Epic 2). */
  fazer_sku_id: string
  /** Face value of the card in USD, for margin/price reconciliation. */
  face_value_usd?: number
}
