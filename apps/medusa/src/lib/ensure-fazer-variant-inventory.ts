import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  batchInventoryItemLevelsWorkflow,
  createInventoryLevelsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"

const DIGITAL_STOCK = 1_000_000

async function getVariantInventoryLevels(
  container: MedusaContainer,
  variantId: string
): Promise<Array<{ id: string; inventory_item_id: string; location_id: string }>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory_item_id"],
    filters: { id: variantId },
  })

  const itemIds = (
    (variants[0] as { inventory_items?: Array<{ inventory_item_id: string }> } | undefined)
      ?.inventory_items ?? []
  ).map((i) => i.inventory_item_id)

  if (!itemIds.length) return []

  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "location_levels.id", "location_levels.location_id"],
    filters: { id: itemIds },
  })

  const levels: Array<{ id: string; inventory_item_id: string; location_id: string }> = []
  for (const item of items as Array<{
    id: string
    location_levels?: Array<{ id: string; location_id: string }>
  }>) {
    for (const level of item.location_levels ?? []) {
      levels.push({
        id: level.id,
        inventory_item_id: item.id,
        location_id: level.location_id,
      })
    }
  }
  return levels
}

async function resolveDefaultStockLocationId(
  container: MedusaContainer
): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
    pagination: { take: 1 },
  })
  return (data[0] as { id: string } | undefined)?.id ?? null
}

/** Ensure a Fazer-linked variant is purchasable on the storefront (virtual stock). */
export async function ensureFazerVariantInventory(
  container: MedusaContainer,
  variantId: string,
  visible: boolean
): Promise<void> {
  const stockedQuantity = visible ? DIGITAL_STOCK : 0
  const levels = await getVariantInventoryLevels(container, variantId)

  if (levels.length) {
    await batchInventoryItemLevelsWorkflow(container).run({
      input: {
        update: levels.map((level) => ({
          id: level.id,
          inventory_item_id: level.inventory_item_id,
          location_id: level.location_id,
          stocked_quantity: stockedQuantity,
        })),
      },
    })
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory_item_id"],
    filters: { id: variantId },
  })
  const itemIds = (
    (variants[0] as { inventory_items?: Array<{ inventory_item_id: string }> } | undefined)
      ?.inventory_items ?? []
  )
    .map((i) => i.inventory_item_id)
    .filter(Boolean)

  const stockLocationId = await resolveDefaultStockLocationId(container)
  if (itemIds.length && stockLocationId) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: itemIds.map((inventory_item_id) => ({
          inventory_item_id,
          location_id: stockLocationId,
          stocked_quantity: stockedQuantity,
        })),
      },
    })
    return
  }

  // Provisioned variants may lack inventory links — digital goods don't need warehouse stock.
  await updateProductVariantsWorkflow(container).run({
    input: {
      product_variants: [
        {
          id: variantId,
          manage_inventory: false,
        },
      ],
    },
  })
}
