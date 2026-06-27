import type { ExecArgs } from "@medusajs/framework/types"
import { getCountryPaymentGateway } from "../lib/payment-gateway-config"
import { syncRegionPaymentProviders } from "../lib/sync-region-payment-providers"

// Links the active country payment gateway provider to the matching region.
// Run after configuring Wompi/MP credentials or changing the admin pasarela selector:
//   npx medusa exec ./src/scripts/sync-payment-region.ts
export default async function syncPaymentRegion({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const config = await getCountryPaymentGateway(container, "co")

  await syncRegionPaymentProviders(
    container,
    config.country_code,
    config.active_gateway
  )

  logger.info(
    `Synced region payment providers for ${config.country_code} -> ${config.active_gateway}`
  )
}
