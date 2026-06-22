import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"
import { runCatalogSync } from "../lib/catalog-sync"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { computeCopPrice } from "../lib/pricing"

// Verifies the catalog sync engine end to end against the local DB using an
// injected catalog (no network). Run:
//   npx medusa exec ./src/scripts/verify-catalog-sync.ts
export default async function verifyCatalogSync({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  // Find a real seeded variant to link.
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku"],
    filters: { sku: "STEAM-CO-20000" },
  })
  const variant = variants[0]
  if (!variant) {
    logger.error("Seed variant STEAM-CO-20000 not found; run db:migrate first.")
    return
  }

  // Mapping that exists in the injected catalog, plus one that does not.
  const [linked, orphan] = await supplier.createSupplierProductMappings([
    {
      medusa_product_id: "prod_x",
      medusa_variant_id: variant.id,
      fazer_sku_id: "steam-co-20000-fazer",
      margin_pct: 15,
      status: "active",
    },
    {
      medusa_product_id: "prod_y",
      medusa_variant_id: null,
      fazer_sku_id: "gone-sku",
      status: "active",
    },
  ])

  const rate = 4000
  const result = await runCatalogSync(container, {
    rate,
    catalog: [
      { id: "steam-co-20000-fazer", name: "Steam $5", price_usd: 5, in_stock: true },
    ],
  })
  logger.info(`Sync result: ${JSON.stringify(result)}`)

  const updatedLinked = await supplier.retrieveSupplierProductMapping(linked.id)
  const updatedOrphan = await supplier.retrieveSupplierProductMapping(orphan.id)

  const { data: pricedVariant } = await query.graph({
    entity: "product_variant",
    fields: ["id", "prices.amount", "prices.currency_code"],
    filters: { id: variant.id },
  })
  const copPrice = pricedVariant[0]?.prices?.find(
    (p: { currency_code: string }) => p.currency_code === "cop"
  )?.amount
  const expected = computeCopPrice(5, rate, 15)

  logger.info(`Linked mapping -> status=${updatedLinked.status}, last_usd=${updatedLinked.last_synced_price_usd}`)
  logger.info(`Orphan mapping -> status=${updatedOrphan.status} (expected inactive)`)
  logger.info(`Variant COP price=${copPrice}, expected=${expected}, match=${copPrice === expected}`)

  // Cleanup: remove test mappings and restore the seed price (20.000 COP).
  await supplier.deleteSupplierProductMappings([linked.id, orphan.id])
  await updateProductVariantsWorkflow(container).run({
    input: {
      product_variants: [
        { id: variant.id, prices: [{ amount: 20000, currency_code: "cop" }] },
      ],
    },
  })
  logger.info("Verification cleanup done (seed price restored).")
}
