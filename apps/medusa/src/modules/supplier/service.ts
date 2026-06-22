import { MedusaService } from "@medusajs/framework/utils"
import SupplierProductMapping from "./models/supplier-product-mapping"
import PriceSyncLog from "./models/price-sync-log"

// Auto-generates CRUD methods: listSupplierProductMappings,
// createSupplierProductMappings, retrievePriceSyncLog, etc.
class SupplierModuleService extends MedusaService({
  SupplierProductMapping,
  PriceSyncLog,
}) {}

export default SupplierModuleService
