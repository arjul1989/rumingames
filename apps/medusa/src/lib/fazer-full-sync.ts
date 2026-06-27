import { MedusaContainer } from "@medusajs/framework"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { FAZER_MODULE } from "../modules/fazer"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type FazerModuleService from "../modules/fazer/service"
import type SupplierModuleService from "../modules/supplier/service"
import { formatFazerSku } from "../modules/fazer/lib/sku"
import {
  parseFaceValue,
  parsePlatform,
  parseRegion,
  salePriceUsd,
  shouldSyncCategory,
} from "./fazer-meta"
import { getFazerConfig, touchFazerFullSync } from "./fazer-config"
import { computeCopPrice } from "./pricing"
import { provisionFazerVariants } from "./provision-fazer-variants"
import { applyFazerOfferVisibility } from "./apply-fazer-offer-visibility"
import { syncMedusaVariantFromFazer } from "./sync-medusa-variant"

const DETAIL_DELAY_MS = 1200

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface FullCatalogSyncResult {
  categories_synced: number
  offers_synced: number
  mappings_updated: number
  prices_updated: number
  images_updated: number
  variants_provisioned: number
  errors: number
}

async function listAllCategories(
  fazer: FazerModuleService,
  kind: "giftcard" | "topup"
) {
  const items: Array<{ category_id: string; name: string; note?: string; imageurl?: string | null }> = []
  let cursor: string | undefined
  do {
    const page =
      kind === "giftcard"
        ? await fazer.listGiftCardCategories(cursor)
        : await fazer.listTopupCategories(cursor)
    items.push(...page.items)
    cursor = page.meta.has_more ? page.meta.next_cursor ?? undefined : undefined
    if (cursor) await sleep(300)
  } while (cursor)
  return items
}

export async function runFullFazerCatalogSync(
  container: MedusaContainer
): Promise<FullCatalogSyncResult> {
  const logger = container.resolve("logger")
  const fazer = container.resolve<FazerModuleService>(FAZER_MODULE)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const config = await getFazerConfig(container)
  const rate = config.usd_cop_rate
  const defaultMargin = config.default_margin_pct

  const mappings = await supplier.listSupplierProductMappings({})
  const mappingBySku = new Map(mappings.map((m) => [m.fazer_sku_id, m]))

  let categoriesSynced = 0
  let offersSynced = 0
  let mappingsUpdated = 0
  let pricesUpdated = 0
  let imagesUpdated = 0
  let errors = 0

  const giftCategories = await listAllCategories(fazer, "giftcard")
  const topupCategories = await listAllCategories(fazer, "topup")

  const targets = [
    ...giftCategories.map((c) => ({ ...c, kind: "giftcard" as const })),
    ...topupCategories.map((c) => ({ ...c, kind: "topup" as const })),
  ].filter((c) => {
    const region = parseRegion(c.note, c.category_id)
    return shouldSyncCategory(c.category_id, c.name, region)
  })

  logger.info(`Fazer full sync: ${targets.length} categories to fetch.`)

  for (const summary of targets) {
    try {
      const region = parseRegion(summary.note, summary.category_id)
      const platform = parsePlatform(summary.category_id, summary.name)

      const detail =
        summary.kind === "giftcard"
          ? await fazer.getGiftCardCategoryDetail(summary.category_id)
          : await fazer.getTopupCategoryDetail(summary.category_id)

      const existingCats = await supplier.listFazerCategories({
        fazer_category_id: summary.category_id,
      })
      const catPayload = {
        fazer_category_id: summary.category_id,
        kind: summary.kind,
        name: detail.name,
        note: detail.note ?? null,
        region,
        platform,
        image_url: detail.imageurl ?? summary.imageurl ?? null,
        offer_count: detail.offers.length,
        last_synced_at: new Date(),
      }

      if (existingCats[0]) {
        await supplier.updateFazerCategories({ id: existingCats[0].id, ...catPayload })
      } else {
        await supplier.createFazerCategories([catPayload])
      }
      categoriesSynced++

      for (const offer of detail.offers) {
        const offerId =
          summary.kind === "giftcard"
            ? (offer as { card_id: string }).card_id
            : (offer as { offer_id: string }).offer_id
        const fazerSkuId = formatFazerSku(summary.kind, summary.category_id, offerId)
        const face = parseFaceValue(offer.name)
        const wholesale = Number(offer.price_usd)
        const stock =
          summary.kind === "giftcard"
            ? (offer as { stock?: number }).stock ?? null
            : null
        const marginPct = defaultMargin
        const saleUsd = salePriceUsd(wholesale, marginPct)
        const saleCop = computeCopPrice(wholesale, rate, marginPct)
        const inStock = summary.kind === "topup" ? true : (stock ?? 0) > 0
        const status = inStock ? ("active" as const) : ("out_of_stock" as const)
        const mapping = mappingBySku.get(fazerSkuId)

        const offerPayload = {
          fazer_sku_id: fazerSkuId,
          fazer_category_id: summary.category_id,
          kind: summary.kind,
          offer_id: offerId,
          name: offer.name,
          wholesale_price_usd: wholesale,
          face_value_label: offer.name,
          face_value_amount: face.amount,
          face_value_currency: face.currency,
          stock,
          min_order_quantity:
            summary.kind === "giftcard"
              ? (offer as { min_order_quantity?: number }).min_order_quantity ?? null
              : null,
          max_order_quantity:
            summary.kind === "giftcard"
              ? (offer as { max_order_quantity?: number }).max_order_quantity ?? null
              : null,
          field_schema: (summary.kind === "topup" && "fields" in detail
            ? (detail as { fields?: unknown }).fields ?? null
            : null) as Record<string, unknown> | null,
          platform,
          region,
          image_url: detail.imageurl ?? summary.imageurl ?? null,
          margin_pct: mapping?.margin_pct ?? marginPct,
          enabled: mapping?.enabled ?? true,
          status: mapping?.enabled === false ? ("inactive" as const) : status,
          sale_price_cop: saleCop,
          sale_price_usd: saleUsd,
          usd_cop_rate: rate,
          medusa_variant_id: mapping?.medusa_variant_id ?? null,
          medusa_product_id: mapping?.medusa_product_id ?? null,
          last_synced_at: new Date(),
        }

        const existingOffers = await supplier.listFazerOffers({ fazer_sku_id: fazerSkuId })
        if (existingOffers[0]) {
          await supplier.updateFazerOffers([
            {
              id: existingOffers[0].id,
              ...offerPayload,
              margin_pct: existingOffers[0].margin_pct ?? offerPayload.margin_pct,
              enabled: existingOffers[0].enabled,
            },
          ])
        } else {
          await supplier.createFazerOffers([offerPayload])
        }
        offersSynced++

        if (mapping) {
          const effectiveStatus =
            mapping.enabled === false || offerPayload.enabled === false
              ? "inactive"
              : status
          await supplier.updateSupplierProductMappings({
            id: mapping.id,
            fazer_category_id: summary.category_id,
            kind: summary.kind,
            platform,
            region,
            face_value_label: offer.name,
            face_value_amount: face.amount,
            face_value_currency: face.currency,
            image_url: detail.imageurl ?? summary.imageurl ?? null,
            stock,
            last_synced_price_usd: wholesale,
            last_synced_price_cop: saleCop,
            sale_price_usd: salePriceUsd(wholesale, mapping.margin_pct ?? marginPct),
            usd_cop_rate: rate,
            status: effectiveStatus,
            last_synced_at: new Date(),
          })
          mappingsUpdated++

          if (mapping.medusa_variant_id) {
            const mappingEnabled =
              mapping.enabled !== false && offerPayload.enabled !== false
            await applyFazerOfferVisibility(container, {
              variantId: mapping.medusa_variant_id,
              enabled: mappingEnabled,
              status: effectiveStatus as "active" | "inactive" | "out_of_stock",
            })
          }

          if (mapping.medusa_variant_id && effectiveStatus === "active") {
            const margin = mapping.margin_pct ?? marginPct
            const cop = computeCopPrice(wholesale, rate, margin)
            const imageUrl = detail.imageurl ?? summary.imageurl ?? null
            await syncMedusaVariantFromFazer(container, {
              variantId: mapping.medusa_variant_id,
              productId: mapping.medusa_product_id,
              faceValueLabel: offer.name,
              imageUrl,
              cop,
              fazerSkuId,
            })
            pricesUpdated++
            if (imageUrl) imagesUpdated++
          } else if (mapping.medusa_product_id && detail.imageurl) {
            await updateProductsWorkflow(container).run({
              input: {
                products: [
                  {
                    id: mapping.medusa_product_id,
                    thumbnail: detail.imageurl,
                    metadata: {
                      fazer_image_url: detail.imageurl,
                      fazer_category_id: summary.category_id,
                    },
                  },
                ],
              },
            })
            imagesUpdated++
          }
        }
      }

      await sleep(DETAIL_DELAY_MS)
    } catch (e) {
      errors++
      logger.error(
        `Fazer category sync failed for ${summary.category_id}: ${(e as Error).message}`
      )
    }
  }

  await touchFazerFullSync(container)

  let variantsProvisioned = 0
  try {
    const provision = await provisionFazerVariants(container)
    variantsProvisioned = provision.variants_created
    errors += provision.errors
  } catch (e) {
    errors++
    logger.error(`Fazer variant provisioning failed: ${(e as Error).message}`)
  }

  // Storefront push + revalidate runs at end of runCatalogSync.

  logger.info(
    `Fazer full sync done: ${categoriesSynced} categories, ${offersSynced} offers, ` +
      `${mappingsUpdated} mappings, ${pricesUpdated} prices, ${imagesUpdated} images, ` +
      `${variantsProvisioned} variants provisioned, ${errors} errors.`
  )

  return {
    categories_synced: categoriesSynced,
    offers_synced: offersSynced,
    mappings_updated: mappingsUpdated,
    prices_updated: pricesUpdated,
    images_updated: imagesUpdated,
    variants_provisioned: variantsProvisioned,
    errors,
  }
}
