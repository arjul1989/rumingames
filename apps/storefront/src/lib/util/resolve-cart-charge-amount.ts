import { HttpTypes } from "@medusajs/types"

type GoruminPricingMeta = {
  total_local?: number
}

/** COP amount to charge after gateway commission (from apply-pricing metadata or cart total). */
export function resolveCartChargeAmount(cart: HttpTypes.StoreCart): number {
  const pricing = (
    cart.metadata as { gorumin_pricing?: GoruminPricingMeta } | null | undefined
  )?.gorumin_pricing

  if (pricing?.total_local != null && pricing.total_local > 0) {
    return pricing.total_local
  }

  const total = Number(cart.total ?? 0)
  return Number.isFinite(total) && total > 0 ? total : 0
}
