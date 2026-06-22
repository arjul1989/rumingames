import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"

const STATUSES = ["active", "inactive", "out_of_stock"] as const

// Update a supplier mapping's margin or status (US-2.3 / RUM-17). The new margin
// is applied to the COP price on the next catalog sync.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const supplier = req.scope.resolve<SupplierModuleService>(SUPPLIER_MODULE)
  const body = (req.body ?? {}) as { margin_pct?: number; status?: string }

  const update: Record<string, unknown> = { id: req.params.id }
  if (typeof body.margin_pct === "number" && !Number.isNaN(body.margin_pct)) {
    update.margin_pct = body.margin_pct
  }
  if (body.status) {
    if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return res.status(400).json({ message: "Estado inválido." })
    }
    update.status = body.status
  }

  const [mapping] = await supplier.updateSupplierProductMappings([update])
  res.json({ mapping })
}
