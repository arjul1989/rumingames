import { HttpTypes } from "@medusajs/types"

type VariantWithPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: { calculated_amount?: number }
  metadata?: Record<string, unknown> | null
}

export function isStorefrontPurchasableVariant(
  variant: VariantWithPrice
): boolean {
  const meta = variant.metadata ?? {}
  if (meta.fazer_enabled === false) return false
  if (meta.fazer_status === "inactive") return false
  if (!variant.calculated_price?.calculated_amount) return false

  // Fazer digital SKUs: availability comes from Fazer status, not warehouse stock.
  const fazerSku = meta.fazer_sku_id
  if (typeof fazerSku === "string" && fazerSku.length > 0) {
    return true
  }

  if (!variant.manage_inventory) return true
  if (variant.allow_backorder) return true
  return (variant.inventory_quantity ?? 0) > 0
}

export function filterStorefrontProducts(
  products: HttpTypes.StoreProduct[]
): HttpTypes.StoreProduct[] {
  return products
    .map((product) => {
      const variants = (product.variants ?? []).filter((v) =>
        isStorefrontPurchasableVariant(v as VariantWithPrice)
      )
      if (!variants.length) return null
      return { ...product, variants }
    })
    .filter(Boolean) as HttpTypes.StoreProduct[]
}
