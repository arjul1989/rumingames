import type { HttpTypes } from "@medusajs/types"
import type { Platform } from "@gorumin/types"

/** Local platform card art served from /public/platforms. */
export const PLATFORM_IMAGES: Record<string, string> = {
  steam: "/platforms/steam.png",
  playstation: "/platforms/playstation.png",
  "play-station": "/platforms/playstation.png",
  nintendo: "/platforms/nintendo.png",
  xbox: "/platforms/xbox.png",
  riot: "/platforms/riot.png",
  "riot-games": "/platforms/riot.png",
  free_fire: "/platforms/free-fire.png",
  "free-fire": "/platforms/free-fire.png",
}

const HANDLE_PLATFORM: Record<string, string> = {
  "steam-gift-card": "steam",
  "playstation-gift-card": "playstation",
  "nintendo-gift-card": "nintendo",
  "xbox-game-pass-ultimate": "xbox",
  "riot-points": "riot",
  "free-fire-diamantes": "free_fire",
}

export function imageForPlatformKey(key: string | null | undefined): string | null {
  if (!key) return null
  return PLATFORM_IMAGES[key] ?? null
}

export function imageForPlatform(platform: Platform | string | null | undefined): string | null {
  return imageForPlatformKey(platform ?? null)
}

export function imageForProduct(product: HttpTypes.StoreProduct): string | null {
  if (product.thumbnail) return product.thumbnail
  const fazerImage = product.metadata?.fazer_image_url
  if (typeof fazerImage === "string" && fazerImage) return fazerImage
  const metaPlatform = product.metadata?.platform as Platform | undefined
  if (metaPlatform) {
    const fromMeta = imageForPlatform(metaPlatform)
    if (fromMeta) return fromMeta
  }
  const fromHandle = HANDLE_PLATFORM[product.handle ?? ""]
  return imageForPlatformKey(fromHandle)
}

/** Line item fields used to resolve product art (cart or order). */
type LineItemLike = {
  thumbnail?: string | null
  product_title?: string | null
  title?: string | null
  product_handle?: string | null
  variant?: HttpTypes.StoreProductVariant | null
  product?: HttpTypes.StoreProduct | null
}

/** Resolve line-item art: thumbnail → fazer image → product platform → handle mapping. */
export function imageForLineItem(item: LineItemLike): string | null {
  if (item.thumbnail) return item.thumbnail

  const variantMeta = item.variant?.metadata as Record<string, unknown> | undefined
  const fazerImage = variantMeta?.fazer_image_url
  if (typeof fazerImage === "string" && fazerImage) return fazerImage

  const product =
    item.product ??
    (item as HttpTypes.StoreCartLineItem & { product?: HttpTypes.StoreProduct })
      .product ??
    item.variant?.product

  if (product) {
    const productFazer = product.metadata?.fazer_image_url
    if (typeof productFazer === "string" && productFazer) return productFazer
    const fromProduct = imageForProduct(product)
    if (fromProduct) return fromProduct
  }

  const handle = item.product_handle ?? ""
  return imageForPlatformKey(HANDLE_PLATFORM[handle])
}

export function imageForCategory(category: HttpTypes.StoreProductCategory): string | null {
  const fromHandle = imageForPlatformKey(category.handle ?? "")
  if (fromHandle) return fromHandle
  const normalized = category.name?.toLowerCase().replace(/\s+/g, "-")
  return imageForPlatformKey(normalized)
}

/** Absolute URL for Medusa product thumbnails (seed scripts). */
export function absolutePlatformImage(
  platform: Platform | string,
  storefrontUrl = process.env.STOREFRONT_URL ?? "http://localhost:8000"
): string {
  const path = imageForPlatformKey(platform) ?? "/platforms/steam.png"
  return `${storefrontUrl.replace(/\/$/, "")}${path}`
}
