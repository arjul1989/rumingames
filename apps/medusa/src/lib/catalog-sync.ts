import { MedusaContainer } from "@medusajs/framework"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { SUPPLIER_MODULE } from "../modules/supplier"
import { FAZER_MODULE } from "../modules/fazer"
import type SupplierModuleService from "../modules/supplier/service"
import type FazerModuleService from "../modules/fazer/service"
import type { FazerCatalogItem } from "../modules/fazer/lib/types"
import {
  computeCopPrice,
  getDefaultMarginPct,
  getUsdCopRate,
} from "./pricing"

export interface CatalogSyncOptions {
  /** Restrict the sync to these Fazer categories (gift-cards, top-ups, ...). */
  categories?: string[]
  rate?: number
  marginPct?: number
  /** Inject a catalog to bypass the network (used in tests). */
  catalog?: FazerCatalogItem[]
}

export interface CatalogSyncResult {
  status: "success" | "partial" | "failed"
  products_synced: number
  prices_updated: number
  errors: number
  message?: string
}

// Pulls the supplier catalog, reconciles supplier_product_mapping rows and
// recomputes COP prices for linked variants (US-2.2 / RUM-17).
export async function runCatalogSync(
  container: MedusaContainer,
  options: CatalogSyncOptions = {}
): Promise<CatalogSyncResult> {
  const logger = container.resolve("logger")
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  const rate = options.rate ?? getUsdCopRate()
  const startedAt = new Date()

  let catalogItems: FazerCatalogItem[]
  try {
    catalogItems = options.catalog ?? (await fetchCatalog(container, options))
  } catch (e) {
    const message = `Catalog fetch failed: ${(e as Error).message}`
    logger.error(message)
    await supplier.createPriceSyncLogs([
      {
        status: "failed",
        products_synced: 0,
        prices_updated: 0,
        errors: 1,
        message,
        started_at: startedAt,
        finished_at: new Date(),
      },
    ])
    return { status: "failed", products_synced: 0, prices_updated: 0, errors: 1, message }
  }

  const itemBySku = new Map(catalogItems.map((i) => [i.id, i]))
  const mappings = await supplier.listSupplierProductMappings({})

  let productsSynced = 0
  let pricesUpdated = 0
  let errors = 0

  for (const mapping of mappings) {
    try {
      const item = itemBySku.get(mapping.fazer_sku_id)

      // SKU gone from supplier catalog -> deactivate.
      if (!item) {
        await supplier.updateSupplierProductMappings({
          id: mapping.id,
          status: "inactive",
          last_synced_at: new Date(),
        })
        productsSynced++
        continue
      }

      const status = item.in_stock === false ? "out_of_stock" : "active"
      await supplier.updateSupplierProductMappings({
        id: mapping.id,
        status,
        last_synced_price_usd: item.price_usd,
        last_synced_at: new Date(),
      })
      productsSynced++

      // Recompute and update the linked Medusa variant price.
      if (mapping.medusa_variant_id && status === "active") {
        const marginPct = mapping.margin_pct ?? options.marginPct ?? getDefaultMarginPct()
        const cop = computeCopPrice(item.price_usd, rate, marginPct)
        await updateProductVariantsWorkflow(container).run({
          input: {
            product_variants: [
              {
                id: mapping.medusa_variant_id,
                prices: [{ amount: cop, currency_code: "cop" }],
              },
            ],
          },
        })
        pricesUpdated++
      }
    } catch (e) {
      errors++
      logger.error(
        `Sync error for mapping ${mapping.id} (${mapping.fazer_sku_id}): ${(e as Error).message}`
      )
    }
  }

  const status: CatalogSyncResult["status"] =
    errors === 0 ? "success" : productsSynced > 0 ? "partial" : "failed"
  const message = `Synced ${productsSynced} mappings, updated ${pricesUpdated} prices, ${errors} errors.`

  await supplier.createPriceSyncLogs([
    {
      status,
      products_synced: productsSynced,
      prices_updated: pricesUpdated,
      errors,
      message,
      started_at: startedAt,
      finished_at: new Date(),
    },
  ])

  logger.info(`Catalog sync finished: ${message}`)
  return { status, products_synced: productsSynced, prices_updated: pricesUpdated, errors, message }
}

async function fetchCatalog(
  container: MedusaContainer,
  options: CatalogSyncOptions
): Promise<FazerCatalogItem[]> {
  const fazer = container.resolve<FazerModuleService>(FAZER_MODULE)
  const categories = options.categories ?? [undefined as unknown as string]
  const all: FazerCatalogItem[] = []
  for (const category of categories) {
    let offset = 0
    const limit = 100
    // Paginate through each category until exhausted.
    while (true) {
      const page = await fazer.getCatalog({ category, limit, offset })
      all.push(...page.items)
      if (page.items.length < limit) break
      offset += limit
    }
  }
  return all
}
