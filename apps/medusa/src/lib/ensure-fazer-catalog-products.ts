import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { CATALOG, PLATFORM_LABELS, type CatalogProduct } from "../data/catalog"
import { listFazerMappedProductHandles } from "./fazer-category-product-map"

export interface EnsureFazerCatalogProductsResult {
  created: number
  existing: number
}

async function resolveSeedContext(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    pagination: { take: 1 },
  })
  const shippingProfileId = (shippingProfiles[0] as { id: string } | undefined)?.id
  if (!shippingProfileId) {
    throw new Error("No shipping profile found; run db:migrate first.")
  }

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    pagination: { take: 1 },
  })
  const salesChannelId = (salesChannels[0] as { id: string } | undefined)?.id
  if (!salesChannelId) {
    throw new Error("No sales channel found; run db:migrate first.")
  }

  const { data: productTypes } = await query.graph({
    entity: "product_type",
    fields: ["id", "value"],
    pagination: { take: 20 },
  })
  const productTypeIdByValue = new Map(
    (productTypes as Array<{ id: string; value: string }>).map((t) => [t.value, t.id])
  )

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
    pagination: { take: 20 },
  })
  const categoryIdByName = new Map(
    (categories as Array<{ id: string; name: string }>).map((c) => [c.name, c.id])
  )

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
    pagination: { take: 1 },
  })
  const stockLocationId = (stockLocations[0] as { id: string } | undefined)?.id

  return {
    shippingProfileId,
    salesChannelId,
    productTypeIdByValue,
    categoryIdByName,
    stockLocationId,
  }
}

function catalogEntryByHandle(handle: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.handle === handle)
}

/**
 * Creates Medusa products from CATALOG when referenced by the Fazer map but missing in the DB.
 */
export async function ensureFazerCatalogProducts(
  container: MedusaContainer
): Promise<EnsureFazerCatalogProductsResult> {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const requiredHandles = listFazerMappedProductHandles()

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: requiredHandles },
    pagination: { take: 50 },
  })
  const existingHandles = new Set(
    (existingProducts as Array<{ handle: string }>).map((p) => p.handle)
  )

  const missingHandles = requiredHandles.filter((h) => !existingHandles.has(h))
  if (!missingHandles.length) {
    return { created: 0, existing: existingHandles.size }
  }

  const ctx = await resolveSeedContext(container)
  const toCreate: CatalogProduct[] = []

  for (const handle of missingHandles) {
    const entry = catalogEntryByHandle(handle)
    if (!entry) {
      logger.warn(`Fazer catalog ensure: no CATALOG entry for handle ${handle}; skip.`)
      continue
    }
    toCreate.push(entry)
  }

  if (!toCreate.length) {
    return { created: 0, existing: existingHandles.size }
  }

  await createProductsWorkflow(container).run({
    input: {
      products: toCreate.map((product) => ({
        title: product.title,
        handle: product.handle,
        description: product.description,
        status: ProductStatus.PUBLISHED,
        type_id: ctx.productTypeIdByValue.get(product.product_type),
        category_ids: [ctx.categoryIdByName.get(PLATFORM_LABELS[product.platform])!],
        shipping_profile_id: ctx.shippingProfileId,
        metadata: {
          platform: product.platform,
          product_type: product.product_type,
          delivery_type: product.delivery_type,
          region: "co",
        },
        options: [
          {
            title: product.option_title,
            values: product.variants.map((v) => v.label),
          },
        ],
        variants: product.variants.map((v) => ({
          title: v.label,
          sku: v.sku,
          options: { [product.option_title]: v.label },
          metadata: {
            fazer_sku_id: v.fazer_sku_id ?? "",
            face_value_usd: v.face_value_usd ?? null,
          },
          prices: [{ amount: v.cop, currency_code: "cop" }],
        })),
        sales_channels: [{ id: ctx.salesChannelId }],
      })),
    },
  })

  if (ctx.stockLocationId) {
    const { data: inventoryItems } = await query.graph({
      entity: "inventory_item",
      fields: ["id"],
      pagination: { take: 5000 },
    })
    const existingLevels = await query.graph({
      entity: "inventory_level",
      fields: ["inventory_item_id"],
      filters: { location_id: ctx.stockLocationId },
      pagination: { take: 5000 },
    })
    const leveled = new Set(
      (existingLevels.data as Array<{ inventory_item_id: string }>).map(
        (l) => l.inventory_item_id
      )
    )
    const newLevels = (inventoryItems as Array<{ id: string }>)
      .filter((item) => !leveled.has(item.id))
      .map((item) => ({
        location_id: ctx.stockLocationId!,
        stocked_quantity: 1_000_000,
        inventory_item_id: item.id,
      }))

    if (newLevels.length) {
      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: newLevels },
      })
    }
  }

  for (const product of toCreate) {
    logger.info(`Fazer catalog ensure: created product ${product.handle}`)
  }

  return { created: toCreate.length, existing: existingHandles.size }
}
