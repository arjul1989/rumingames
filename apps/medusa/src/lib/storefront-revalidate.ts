import { listFazerMappedProductHandles } from "./fazer-category-product-map"

const CATALOG_PATHS = ["/co/store", "/co"]
const COMMUNITY_PATHS = ["/co/noticias", "/co/streamers"]

function productPaths(handles: string[]): string[] {
  return handles.map((handle) => `/co/products/${handle}`)
}

async function postRevalidate(paths: string[]): Promise<boolean> {
  const base = process.env.STOREFRONT_URL?.replace(/\/$/, "")
  const secret = process.env.REVALIDATE_SECRET

  if (!base || !secret) {
    console.warn(
      "Storefront revalidate skipped: set STOREFRONT_URL and REVALIDATE_SECRET on Medusa."
    )
    return false
  }

  const uniquePaths = [...new Set(paths)]

  try {
    const res = await fetch(`${base}/api/revalidate?secret=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: uniquePaths }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn(`Storefront revalidate failed (${res.status}): ${text}`)
      return false
    }
    return true
  } catch (e) {
    console.warn(`Storefront revalidate error: ${(e as Error).message}`)
    return false
  }
}

/** Ask the Next.js storefront to drop cached product pages after catalog sync. */
export async function revalidateStorefrontCatalog(
  productHandles?: string[]
): Promise<boolean> {
  const handles = productHandles?.length
    ? productHandles
    : listFazerMappedProductHandles()
  return postRevalidate([...CATALOG_PATHS, ...productPaths(handles)])
}

/** Purge cached community pages (noticias, streamers, home). */
export async function revalidateStorefrontCommunity(): Promise<boolean> {
  return postRevalidate([...CATALOG_PATHS, ...COMMUNITY_PATHS])
}

/** Full storefront cache purge after a content sync (catalog + CMS). */
export async function revalidateStorefrontAll(
  productHandles?: string[]
): Promise<boolean> {
  const handles = productHandles?.length
    ? productHandles
    : listFazerMappedProductHandles()
  return postRevalidate([
    ...CATALOG_PATHS,
    ...COMMUNITY_PATHS,
    ...productPaths(handles),
  ])
}
