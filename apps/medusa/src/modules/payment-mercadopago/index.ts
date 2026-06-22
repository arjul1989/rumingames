import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import MercadoPagoProviderService from "./service"

// Registers Mercado Pago as a provider of the core Payment module (US-3.1 / RUM-23).
export default ModuleProvider(Modules.PAYMENT, {
  services: [MercadoPagoProviderService],
})
