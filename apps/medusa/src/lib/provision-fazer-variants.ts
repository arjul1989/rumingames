import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { randomBytes } from "node:crypto"
import { runSql } from "./run-sql"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import {
  buildFazerVariantSku,
  resolveFazerCategoryProduct,
} from "./fazer-category-product-map"
import { ensureFazerCatalogProducts } from "./ensure-fazer-catalog-products"
import { computeCopPrice } from "./pricing"
import { getFazerConfig } from "./fazer-config"
import { formatVariantTitle, syncMedusaVariantFromFazer } from "./sync-medusa-variant"
import { salePriceUsd } from "./fazer-meta"

export interface ProvisionFazerVariantsResult {
  offers_considered: number
  variants_created: number
  mappings_created: number
  skipped: number
  errors: number
}

interface ProductContext {
  productId: string
  optionTitle: string
  optionId: string
  optionValues: Set<string>
}

/** Avoid duplicate option combos when several Fazer regions share one Medusa product. */
function resolveOptionLabel(
  faceLabel: string,
  region: string | null,
  fazerCategoryId: string,
  optionValues: Set<string>
): string {
  if (!optionValues.has(faceLabel)) return faceLabel

  const regionTag = (region ?? "INTL").toUpperCase()
  const withRegion = `${faceLabel} (${regionTag})`
  if (!optionValues.has(withRegion)) return withRegion

  const categoryTag = fazerCategoryId.split("_").slice(-2).join("-").toUpperCase()
  const withCategory = `${faceLabel} (${categoryTag})`
  if (!optionValues.has(withCategory)) return withCategory

  return `${faceLabel} (${fazerCategoryId})`
}

function newOptionValueId(): string {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  let out = "optval_01"
  const bytes = randomBytes(20)
  for (let i = 0; i < 22; i++) {
    out += alphabet[bytes[i % bytes.length]! % alphabet.length]
  }
  return out
}

async function ensureOptionValue(
  optionId: string,
  value: string,
  existing: Set<string>
): Promise<void> {
  if (existing.has(value)) return
  const id = newOptionValueId()
  await runSql(
    `INSERT INTO product_option_value (id, value, option_id, created_at, updated_at) ` +
      `VALUES ($1, $2, $3, now(), now()) ON CONFLICT DO NOTHING`,
    [id, value, optionId]
  )
  existing.add(value)
}

async function loadProductContext(
  container: MedusaContainer,
  productHandle: string
): Promise<ProductContext | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "options.id", "options.title", "options.values.value"],
    filters: { handle: productHandle },
  })

  const product = data[0] as
    | {
        id: string
        options?: Array<{
          id: string
          title: string
          values?: Array<{ value: string }>
        }>
      }
    | undefined

  if (!product?.options?.[0]) return null

  const option = product.options[0]
  const optionValues = new Set(
    (option.values ?? []).map((v) => v.value).filter(Boolean)
  )

  return {
    productId: product.id,
    optionTitle: option.title,
    optionId: option.id,
    optionValues,
  }
}

async function resolveDefaultStockLocationId(container: MedusaContainer): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
    pagination: { take: 1 },
  })
  return (data[0] as { id: string } | undefined)?.id ?? null
}

async function ensureInventoryLevels(
  container: MedusaContainer,
  variantIds: string[],
  stockLocationId: string
): Promise<void> {
  if (!variantIds.length) return

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory_item_id"],
    filters: { id: variantIds },
  })

  const inventoryItemIds = (variants as Array<{
    inventory_items?: Array<{ inventory_item_id: string }>
  }>)
    .flatMap((v) => v.inventory_items?.map((i) => i.inventory_item_id) ?? [])
    .filter(Boolean)

  if (!inventoryItemIds.length) return

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItemIds.map((inventory_item_id) => ({
        inventory_item_id,
        location_id: stockLocationId,
        stocked_quantity: 1_000_000,
      })),
    },
  })
}

/**
 * Creates Medusa variants + supplier mappings for enabled Fazer offers that are not
 * yet linked to a variant, limited to categories in FAZER_CATEGORY_PRODUCT_MAP.
 */
export async function provisionFazerVariants(
  container: MedusaContainer
): Promise<ProvisionFazerVariantsResult> {
  const logger = container.resolve("logger")
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const config = await getFazerConfig(container)
  const rate = config.usd_cop_rate
  const defaultMargin = config.default_margin_pct
  const stockLocationId = await resolveDefaultStockLocationId(container)

  await ensureFazerCatalogProducts(container)

  const productCache = new Map<string, ProductContext | null>()
  const existingSkus = new Set<string>()

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existingVariants } = await query.graph({
    entity: "product_variant",
    fields: ["sku"],
    pagination: { take: 5000 },
  })
  for (const v of existingVariants as Array<{ sku?: string | null }>) {
    if (v.sku) existingSkus.add(v.sku)
  }

  const offers = await supplier.listFazerOffers({})
  const targets = offers.filter(
    (o) =>
      o.enabled &&
      !o.medusa_variant_id &&
      resolveFazerCategoryProduct(o.fazer_category_id, o.platform) != null
  )

  let variantsCreated = 0
  let mappingsCreated = 0
  let skipped = 0
  let errors = 0
  const createdVariantIds: string[] = []

  for (const offer of targets) {
    const target = resolveFazerCategoryProduct(offer.fazer_category_id, offer.platform)
    if (!target) {
      skipped++
      continue
    }

    const existingMapping = await supplier.listSupplierProductMappings({
      fazer_sku_id: offer.fazer_sku_id,
    })
    if (existingMapping[0]?.medusa_variant_id) {
      await supplier.updateFazerOffers({
        id: offer.id,
        medusa_variant_id: existingMapping[0].medusa_variant_id,
        medusa_product_id: existingMapping[0].medusa_product_id,
      })
      skipped++
      continue
    }

    let productCtx = productCache.get(target.productHandle)
    if (productCtx === undefined) {
      productCtx = await loadProductContext(container, target.productHandle)
      productCache.set(target.productHandle, productCtx)
    }
    if (!productCtx) {
      logger.warn(
        `Fazer provision: product handle ${target.productHandle} not found; skip ${offer.fazer_sku_id}`
      )
      skipped++
      continue
    }

    const sku = buildFazerVariantSku(target.skuPrefix, offer.offer_id)
    if (existingSkus.has(sku)) {
      skipped++
      continue
    }

    const margin = offer.margin_pct ?? defaultMargin
    const cop =
      offer.sale_price_cop ??
      computeCopPrice(offer.wholesale_price_usd, rate, margin)
    const faceLabel = offer.face_value_label || offer.name
    const optionLabel = resolveOptionLabel(
      faceLabel,
      offer.region,
      offer.fazer_category_id,
      productCtx.optionValues
    )
    const title = formatVariantTitle(optionLabel, cop)

    try {
      await ensureOptionValue(productCtx.optionId, optionLabel, productCtx.optionValues)

      const { result } = await createProductVariantsWorkflow(container).run({
        input: {
          product_variants: [
            {
              product_id: productCtx.productId,
              sku,
              title,
              manage_inventory: true,
              options: { [productCtx.optionTitle]: optionLabel },
              prices: [{ amount: Math.round(cop), currency_code: "cop" }],
              metadata: {
                fazer_sku_id: offer.fazer_sku_id,
                fazer_category_id: offer.fazer_category_id,
                face_value_label: faceLabel,
                fazer_region: offer.region ?? null,
                fazer_image_url: offer.image_url ?? null,
              },
              ...(offer.image_url ? { thumbnail: offer.image_url } : {}),
            },
          ],
        },
      })

      const variant = result[0]
      if (!variant?.id) {
        throw new Error("createProductVariantsWorkflow returned no variant")
      }

      existingSkus.add(sku)
      createdVariantIds.push(variant.id)

      const saleUsd =
        offer.sale_price_usd ?? salePriceUsd(offer.wholesale_price_usd, margin)
      const mappingStatus =
        offer.status === "out_of_stock" ? ("out_of_stock" as const) : ("active" as const)

      await supplier.createSupplierProductMappings([
        {
          medusa_product_id: productCtx.productId,
          medusa_variant_id: variant.id,
          fazer_sku_id: offer.fazer_sku_id,
          fazer_category_id: offer.fazer_category_id,
          kind: offer.kind,
          platform: offer.platform,
          region: offer.region,
          face_value_label: faceLabel,
          face_value_amount: offer.face_value_amount,
          face_value_currency: offer.face_value_currency,
          image_url: offer.image_url,
          stock: offer.stock,
          enabled: offer.enabled,
          last_synced_price_usd: offer.wholesale_price_usd,
          last_synced_price_cop: cop,
          sale_price_usd: saleUsd,
          usd_cop_rate: rate,
          margin_pct: margin,
          status: mappingStatus,
          last_synced_at: new Date(),
        },
      ])

      await supplier.updateFazerOffers({
        id: offer.id,
        medusa_variant_id: variant.id,
        medusa_product_id: productCtx.productId,
      })

      await syncMedusaVariantFromFazer(container, {
        variantId: variant.id,
        productId: productCtx.productId,
        faceValueLabel: optionLabel,
        imageUrl: offer.image_url,
        cop,
        fazerSkuId: offer.fazer_sku_id,
      })

      variantsCreated++
      mappingsCreated++
      logger.info(`Fazer provision: ${offer.fazer_sku_id} → ${sku} (${title})`)
    } catch (e) {
      errors++
      logger.error(
        `Fazer provision failed for ${offer.fazer_sku_id}: ${(e as Error).message}`
      )
    }
  }

  if (stockLocationId && createdVariantIds.length) {
    try {
      await ensureInventoryLevels(container, createdVariantIds, stockLocationId)
    } catch (e) {
      logger.warn(`Fazer provision: inventory levels partial: ${(e as Error).message}`)
    }
  }

  logger.info(
    `Fazer provision done: ${variantsCreated} variants, ${mappingsCreated} mappings, ` +
      `${skipped} skipped, ${errors} errors (${targets.length} offers considered).`
  )

  return {
    offers_considered: targets.length,
    variants_created: variantsCreated,
    mappings_created: mappingsCreated,
    skipped,
    errors,
  }
}
