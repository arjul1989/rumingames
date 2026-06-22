import { ExecArgs } from "@medusajs/framework/types"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"

// One-off check that the supplier module + models work end to end.
// Run with: npx medusa exec ./src/scripts/verify-supplier.ts
export default async function verifySupplier({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const supplier = container.resolve<SupplierModuleService>(SUPPLIER_MODULE)

  const [mapping] = await supplier.createSupplierProductMappings([
    {
      medusa_product_id: "prod_demo",
      medusa_variant_id: "variant_demo",
      fazer_sku_id: "steam-co-20000",
      last_synced_price_usd: 5,
      margin_pct: 15,
      status: "active",
    },
  ])
  logger.info(`Created mapping ${mapping.id} (status=${mapping.status})`)

  const [log] = await supplier.createPriceSyncLogs([
    {
      status: "success",
      products_synced: 1,
      prices_updated: 1,
      errors: 0,
      message: "verification run",
      started_at: new Date(),
      finished_at: new Date(),
    },
  ])
  logger.info(`Created price sync log ${log.id} (status=${log.status})`)

  const mappings = await supplier.listSupplierProductMappings({})
  const logs = await supplier.listPriceSyncLogs({})
  logger.info(
    `Totals -> mappings: ${mappings.length}, sync logs: ${logs.length}`
  )

  // Clean up so the verification is idempotent.
  await supplier.deleteSupplierProductMappings([mapping.id])
  await supplier.deletePriceSyncLogs([log.id])
  logger.info("Verification cleanup done.")
}
