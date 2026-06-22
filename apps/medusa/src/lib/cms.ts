import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"

// Builds a URL-safe slug from a title (US-4.1 / RUM-29).
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
}

export interface RelatedProduct {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  /** First variant id, so the storefront can offer add-to-cart (US-7.3 / RUM-47). */
  variant_id: string | null
}

// Resolves Medusa product details for an article's related_product_ids
// (US-4.3 / RUM-31, add-to-cart US-7.3 / RUM-47). Returns [] when there are none.
export async function resolveRelatedProducts(
  container: MedusaContainer,
  productIds: unknown
): Promise<RelatedProduct[]> {
  const ids = Array.isArray(productIds) ? (productIds as string[]).filter(Boolean) : []
  if (!ids.length) {
    return []
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "thumbnail", "variants.id"],
    filters: { id: ids },
  })
  const byId = new Map(
    data.map((p: { id: string; title: string; handle: string; thumbnail: string | null; variants?: { id: string }[] }) => [
      p.id,
      {
        id: p.id,
        title: p.title,
        handle: p.handle,
        thumbnail: p.thumbnail ?? null,
        variant_id: p.variants?.[0]?.id ?? null,
      } as RelatedProduct,
    ])
  )
  // Preserve the editor-defined ordering.
  return ids.map((id) => byId.get(id)).filter(Boolean) as RelatedProduct[]
}
