import { HttpTypes } from "@medusajs/types"
import {
  PLATFORM_LABELS,
  type Platform,
  type ProductTypeSlug,
  type DeliveryType,
} from "@gorumin/types"

// Helpers for reading the digital-product metadata contract (@gorumin/types)
// off Medusa products and presenting it in the storefront (Epic 7 / US-7.5).

export const PRODUCT_TYPE_LABELS: Record<ProductTypeSlug, string> = {
  gift_card: "Gift Card",
  game_topup: "Recarga",
  subscription: "Suscripción",
}

export function getPlatform(product: HttpTypes.StoreProduct): Platform | null {
  const value = product.metadata?.platform as Platform | undefined
  return value ?? null
}

export function getPlatformLabel(product: HttpTypes.StoreProduct): string | null {
  const platform = getPlatform(product)
  return platform ? PLATFORM_LABELS[platform] : null
}

export function getProductType(
  product: HttpTypes.StoreProduct
): ProductTypeSlug | null {
  const value = product.metadata?.product_type as ProductTypeSlug | undefined
  return value ?? null
}

export function getProductTypeLabel(
  product: HttpTypes.StoreProduct
): string | null {
  const type = getProductType(product)
  return type ? PRODUCT_TYPE_LABELS[type] : null
}

export function getDeliveryType(
  product: HttpTypes.StoreProduct
): DeliveryType | null {
  const value = product.metadata?.delivery_type as DeliveryType | undefined
  return value ?? null
}

/** True when the item is fulfilled against a player/account id (top-ups). */
export function requiresPlayerId(product: HttpTypes.StoreProduct): boolean {
  return getDeliveryType(product) === "topup_id"
}

/** Format a COP amount the Colombian way: "$50.000" (no decimals). */
export function formatCop(amount: number, currencyCode = "COP"): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `$${Math.round(amount).toLocaleString("es-CO")}`
  }
}
