export type FazerSkuKind = "giftcard" | "topup"

export interface ParsedFazerSku {
  kind: FazerSkuKind
  category_id: string
  offer_id: string
}

/** Stable id stored in supplier_product_mapping.fazer_sku_id */
export function formatFazerSku(
  kind: FazerSkuKind,
  categoryId: string,
  offerId: string
): string {
  return `${kind}:${categoryId}:${offerId}`
}

export function parseFazerSku(skuId: string): ParsedFazerSku | null {
  const parts = skuId.split(":")
  if (parts.length < 3) return null
  const kind = parts[0]
  if (kind !== "giftcard" && kind !== "topup") return null
  return {
    kind,
    category_id: parts[1],
    offer_id: parts.slice(2).join(":"),
  }
}
