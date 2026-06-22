import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { runCatalogSync } from "../../../../lib/catalog-sync"
import { SUPPLIER_MODULE } from "../../../../modules/supplier"
import type SupplierModuleService from "../../../../modules/supplier/service"

// Trigger a catalog sync (US-2.2 / RUM-17). Admin-authenticated by middleware.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { categories?: string[] }
  const result = await runCatalogSync(req.scope, {
    categories: body.categories,
  })
  res.json(result)
}

// Return the most recent sync log so the admin can show last-run status.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const logs = await supplier.listPriceSyncLogs(
    {},
    { order: { started_at: "DESC" }, take: 1 }
  )
  res.json({ last_sync: logs[0] ?? null })
}
