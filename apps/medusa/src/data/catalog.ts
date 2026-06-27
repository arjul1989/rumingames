// Digital catalog definition for Colombia (US-1.2 / RUM-11).
// Mirrors the shared contract in @gorumin/types. Kept local to the backend so
// the Medusa build doesn't need to bundle the workspace types package.
// The real catalog is synced from Fazer Cards in Epic 2 (RUM-15); these entries
// are representative examples that exercise every product type & delivery mode.

export type Platform =
  | "steam"
  | "playstation"
  | "nintendo"
  | "xbox"
  | "riot"
  | "free_fire"

export type ProductTypeSlug = "gift_card" | "game_topup" | "subscription"

export type DeliveryType = "digital_code" | "topup_id"

export const PLATFORM_LABELS: Record<Platform, string> = {
  steam: "Steam",
  playstation: "PlayStation",
  nintendo: "Nintendo",
  xbox: "Xbox",
  riot: "Riot Games",
  free_fire: "Free Fire",
}

export const PRODUCT_TYPES: readonly ProductTypeSlug[] = [
  "gift_card",
  "game_topup",
  "subscription",
]

export interface CatalogVariant {
  /** Shown as the option value, e.g. "20.000 COP". */
  label: string
  /** Stock keeping unit. */
  sku: string
  /** Price in COP (whole pesos, no decimals). */
  cop: number
  /** Reference face value in USD for margin reconciliation. */
  face_value_usd?: number
  /** Fazer Cards SKU id — populated by the sync job later. */
  fazer_sku_id?: string
}

export interface CatalogProduct {
  title: string
  handle: string
  platform: Platform
  product_type: ProductTypeSlug
  delivery_type: DeliveryType
  description: string
  /** Label of the variant option (e.g. "Valor", "Diamantes", "Plan"). */
  option_title: string
  variants: CatalogVariant[]
}

export const CATALOG: CatalogProduct[] = [
  {
    title: "Steam Gift Card",
    handle: "steam-gift-card",
    platform: "steam",
    product_type: "gift_card",
    delivery_type: "digital_code",
    description:
      "Recarga tu billetera de Steam y compra juegos, DLC y más. Entrega digital inmediata por correo.",
    option_title: "Valor",
    variants: [
      { label: "20.000 COP", sku: "STEAM-CO-20000", cop: 20000, face_value_usd: 5 },
      { label: "50.000 COP", sku: "STEAM-CO-50000", cop: 50000, face_value_usd: 12 },
      { label: "100.000 COP", sku: "STEAM-CO-100000", cop: 100000, face_value_usd: 25 },
    ],
  },
  {
    title: "PlayStation Store Gift Card",
    handle: "playstation-gift-card",
    platform: "playstation",
    product_type: "gift_card",
    delivery_type: "digital_code",
    description:
      "Saldo para PlayStation Store: juegos, complementos y suscripciones. Código entregado al instante.",
    option_title: "Valor",
    variants: [
      { label: "40.000 COP", sku: "PSN-CO-40000", cop: 40000, face_value_usd: 10 },
      { label: "80.000 COP", sku: "PSN-CO-80000", cop: 80000, face_value_usd: 20 },
    ],
  },
  {
    title: "Nintendo eShop Gift Card",
    handle: "nintendo-gift-card",
    platform: "nintendo",
    product_type: "gift_card",
    delivery_type: "digital_code",
    description:
      "Recarga tu cuenta de Nintendo eShop para Switch. Entrega digital inmediata.",
    option_title: "Valor",
    variants: [
      { label: "50.000 COP", sku: "NIN-CO-50000", cop: 50000, face_value_usd: 12 },
      { label: "100.000 COP", sku: "NIN-CO-100000", cop: 100000, face_value_usd: 25 },
    ],
  },
  {
    title: "Riot Points (Valorant / LoL)",
    handle: "riot-points",
    platform: "riot",
    product_type: "gift_card",
    delivery_type: "digital_code",
    description:
      "Riot Points para Valorant y League of Legends. Canjea el código en tu cuenta Riot.",
    option_title: "Valor",
    variants: [
      { label: "25.000 COP", sku: "RIOT-CO-25000", cop: 25000, face_value_usd: 6 },
      { label: "60.000 COP", sku: "RIOT-CO-60000", cop: 60000, face_value_usd: 15 },
    ],
  },
  {
    title: "Free Fire Diamantes",
    handle: "free-fire-diamantes",
    platform: "free_fire",
    product_type: "game_topup",
    delivery_type: "topup_id",
    description:
      "Recarga de diamantes para Free Fire. Requiere tu ID de jugador al finalizar la compra.",
    option_title: "Diamantes",
    variants: [
      { label: "100 💎", sku: "FF-CO-100", cop: 12000, face_value_usd: 3 },
      { label: "310 💎", sku: "FF-CO-310", cop: 35000, face_value_usd: 9 },
      { label: "520 💎", sku: "FF-CO-520", cop: 58000, face_value_usd: 15 },
    ],
  },
  {
    title: "Xbox Game Pass Ultimate",
    handle: "xbox-game-pass-ultimate",
    platform: "xbox",
    product_type: "subscription",
    delivery_type: "digital_code",
    description:
      "Suscripción a Xbox Game Pass Ultimate. Código canjeable para acceder a cientos de juegos.",
    option_title: "Plan",
    variants: [
      { label: "1 mes", sku: "XGP-CO-1M", cop: 45000, face_value_usd: 11 },
      { label: "3 meses", sku: "XGP-CO-3M", cop: 120000, face_value_usd: 30 },
    ],
  },
  {
    title: "Xbox Gift Card",
    handle: "xbox-gift-card",
    platform: "xbox",
    product_type: "gift_card",
    delivery_type: "digital_code",
    description:
      "Saldo para Microsoft Store y Xbox. Canjea el código en tu cuenta Microsoft.",
    option_title: "Valor",
    variants: [
      { label: "10 USD", sku: "XBOX-CO-10000", cop: 42000, face_value_usd: 10 },
    ],
  },
  {
    title: "Créditos Xbox",
    handle: "xbox-game-credits",
    platform: "xbox",
    product_type: "game_topup",
    delivery_type: "digital_code",
    description:
      "Créditos y moneda virtual para juegos en Xbox: Apex, Call of Duty, EA FC, Halo y más.",
    option_title: "Paquete",
    variants: [
      { label: "Básico", sku: "XBOX-CR-PLACEHOLDER", cop: 10000, face_value_usd: 3 },
    ],
  },
]
