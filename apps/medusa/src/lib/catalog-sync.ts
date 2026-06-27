import { MedusaContainer } from "@medusajs/framework"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { SUPPLIER_MODULE } from "../modules/supplier"
import { FAZER_MODULE } from "../modules/fazer"
import type SupplierModuleService from "../modules/supplier/service"
import type FazerModuleService from "../modules/fazer/service"
import type { FazerCatalogItem } from "../modules/fazer/lib/types"
import { runFullFazerCatalogSync } from "./fazer-full-sync"
import { resolveFazerRate } from "./fazer-config"
import { pushFazerCatalogToStorefront } from "./push-fazer-catalog-to-storefront"
import { revalidateStorefrontCatalog } from "./storefront-revalidate"
import {
  computeCopPrice,
  getMarginForCategory,
} from "./pricing"
import { salePriceUsd } from "./fazer-meta"

export interface CatalogSyncOptions {
  categories?: string[]
  rate?: number
  marginPct?: number
  catalog?: FazerCatalogItem[]
  /** When true (default), mirror the full Fazer catalog before repricing mappings. */
  fullSync?: boolean
}

export interface CatalogSyncResult {
  status: "success" | "partial" | "failed"
  products_synced: number
  prices_updated: number
  errors: number
  message?: string
  categories_synced?: number
  offers_synced?: number
  images_updated?: number
  variants_provisioned?: number
}

export async function runCatalogSync(
  container: MedusaContainer,
  options: CatalogSyncOptions = {}
): Promise<CatalogSyncResult> {
  const logger = container.resolve("logger")
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  const rate = options.rate ?? (await resolveFazerRate(container))
  const startedAt = new Date()

  // Fast path: push Medusa variants from supplier DB — no Fazer API calls.
  if (options.fullSync === false && !options.catalog) {
    const storefrontPush = await pushFazerCatalogToStorefront(container)
    const message =
      `Storefront push: ${storefrontPush.variants_updated} variants, ` +
      `${storefrontPush.prices_updated} prices, ${storefrontPush.errors} errors.`
    const storefrontNote = storefrontPush.revalidated
      ? " Cache purged."
      : " Cache not purged (check REVALIDATE_SECRET)."

    await supplier.createPriceSyncLogs([
      {
        status: storefrontPush.errors === 0 ? "success" : "partial",
        products_synced: storefrontPush.variants_updated,
        prices_updated: storefrontPush.prices_updated,
        errors: storefrontPush.errors,
        message: message + storefrontNote,
        usd_cop_rate: rate,
        started_at: startedAt,
        finished_at: new Date(),
      },
    ])

    logger.info(message + storefrontNote)
    return {
      status: storefrontPush.errors === 0 ? "success" : "partial",
      products_synced: storefrontPush.variants_updated,
      prices_updated: storefrontPush.prices_updated,
      errors: storefrontPush.errors,
      message: message + storefrontNote,
    }
  }

  let fullResult = {
    categories_synced: 0,
    offers_synced: 0,
    mappings_updated: 0,
    prices_updated: 0,
    images_updated: 0,
    variants_provisioned: 0,
    errors: 0,
  }

  const ranFullSync = options.fullSync !== false && !options.catalog

  if (ranFullSync) {
    try {
      fullResult = await runFullFazerCatalogSync(container)
    } catch (e) {
      const message = `Full catalog sync failed: ${(e as Error).message}`
      logger.error(message)
      await supplier.createPriceSyncLogs([
        {
          status: "failed",
          products_synced: 0,
          prices_updated: 0,
          errors: 1,
          message,
          usd_cop_rate: rate,
          started_at: startedAt,
          finished_at: new Date(),
        },
      ])
      return { status: "failed", products_synced: 0, prices_updated: 0, errors: 1, message }
    }
  }

  let catalogItems: FazerCatalogItem[] = []
  if (options.catalog) {
    catalogItems = options.catalog
  }

  const itemBySku = new Map(catalogItems.map((i) => [i.id, i]))
  const mappings = await supplier.listSupplierProductMappings({})

  let productsSynced = fullResult.mappings_updated
  let pricesUpdated = fullResult.prices_updated
  let errors = fullResult.errors

  if (options.catalog) {
    for (const mapping of mappings) {
      try {
        const item = itemBySku.get(mapping.fazer_sku_id)
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
        const marginPct =
          mapping.margin_pct ?? options.marginPct ?? getMarginForCategory(item.category)
        const cop = computeCopPrice(item.price_usd, rate, marginPct)
        const saleUsd = salePriceUsd(item.price_usd, marginPct)

        await supplier.updateSupplierProductMappings({
          id: mapping.id,
          status: mapping.enabled === false ? "inactive" : status,
          last_synced_price_usd: item.price_usd,
          last_synced_price_cop: cop,
          sale_price_usd: saleUsd,
          usd_cop_rate: rate,
          last_synced_at: new Date(),
        })
        productsSynced++

        if (mapping.medusa_variant_id && mapping.enabled !== false && status === "active") {
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
  }

  const status: CatalogSyncResult["status"] =
    errors === 0 ? "success" : productsSynced > 0 ? "partial" : "failed"
  const message =
    `Synced ${productsSynced} mappings, ${pricesUpdated} prices, ` +
    `${fullResult.categories_synced} categories, ${fullResult.offers_synced} offers, ` +
    `${fullResult.variants_provisioned} variants provisioned, ${errors} errors.`

  // Full sync already pushed variants per mapping; only purge cache here.
  const storefrontPush = ranFullSync
    ? {
        variants_updated: fullResult.mappings_updated,
        prices_updated: fullResult.prices_updated,
        errors: 0,
        revalidated: await revalidateStorefrontCatalog(),
      }
    : await pushFazerCatalogToStorefront(container)

  const storefrontNote =
    ` Storefront: ${storefrontPush.variants_updated} variants, ${storefrontPush.prices_updated} prices` +
    (storefrontPush.revalidated ? ", cache purged." : ", cache not purged (check REVALIDATE_SECRET).")

  await supplier.createPriceSyncLogs([
    {
      status,
      products_synced: productsSynced,
      prices_updated: pricesUpdated,
      errors: errors + storefrontPush.errors,
      message: message + storefrontNote,
      usd_cop_rate: rate,
      started_at: startedAt,
      finished_at: new Date(),
    },
  ])

  logger.info(`Catalog sync finished: ${message}${storefrontNote}`)
  return {
    status,
    products_synced: productsSynced,
    prices_updated: pricesUpdated + (ranFullSync ? 0 : storefrontPush.prices_updated),
    errors: errors + storefrontPush.errors,
    message: message + storefrontNote,
    categories_synced: fullResult.categories_synced,
    offers_synced: fullResult.offers_synced,
    images_updated: fullResult.images_updated,
    variants_provisioned: fullResult.variants_provisioned,
  }
}

async function fetchCatalog(container: MedusaContainer): Promise<FazerCatalogItem[]> {
  const fazer = container.resolve<FazerModuleService>(FAZER_MODULE)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const mappings = await supplier.listSupplierProductMappings({})
  const skuIds = mappings.map((m) => m.fazer_sku_id).filter(Boolean)
  if (!skuIds.length) return []
  return fazer.listCatalogItemsForSkus(skuIds)
}
