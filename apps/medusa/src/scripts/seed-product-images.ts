import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"
import { CATALOG } from "../data/catalog"
import type { Platform } from "../data/catalog"

// Sets product thumbnails from Gorumin platform card art (storefront /public/platforms).
// Run: npx medusa exec ./src/scripts/seed-product-images.ts

const PLATFORM_BY_HANDLE = Object.fromEntries(
  CATALOG.map((p) => [p.handle, p.platform])
) as Record<string, Platform>

function thumbnailUrl(platform: Platform): string {
  const base = (process.env.STOREFRONT_URL ?? "http://localhost:8000").replace(/\/$/, "")
  const paths: Record<Platform, string> = {
    steam: "/platforms/steam.png",
    playstation: "/platforms/playstation.png",
    nintendo: "/platforms/nintendo.png",
    xbox: "/platforms/xbox.png",
    riot: "/platforms/riot.png",
    free_fire: "/platforms/free-fire.png",
  }
  return `${base}${paths[platform]}`
}

export default async function seedProductImages({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "thumbnail", "metadata"],
    pagination: { take: 100 },
  })

  let updated = 0
  for (const product of products as Array<{
    id: string
    handle: string
    thumbnail?: string | null
    metadata?: Record<string, unknown> | null
  }>) {
    const platform = PLATFORM_BY_HANDLE[product.handle]
    if (!platform) continue

    const thumbnail = thumbnailUrl(platform)
    const metadata = {
      ...(product.metadata ?? {}),
      platform,
    }

    await productModule.updateProducts({
      id: product.id,
      thumbnail,
      metadata,
    })
    updated++
    logger.info(`✓ ${product.handle} → ${thumbnail}`)
  }

  logger.info(`Product images ready (${updated} updated).`)
}
