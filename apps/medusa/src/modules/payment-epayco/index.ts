import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import EpaycoProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [EpaycoProviderService],
})
