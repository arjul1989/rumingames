import { MedusaService } from "@medusajs/framework/utils"
import FundingRun from "./models/funding-run"

class FundingModuleService extends MedusaService({
  FundingRun,
}) {}

export default FundingModuleService
