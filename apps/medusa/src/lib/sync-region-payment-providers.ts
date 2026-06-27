import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import type { PaymentGatewayId } from "./payment-gateway-types"
import { PAYMENT_GATEWAY_PROVIDER_IDS } from "./payment-gateway-types"

const COUNTRY_REGION_CURRENCY: Record<string, string> = {
  co: "cop",
}

export async function syncRegionPaymentProviders(
  container: MedusaContainer,
  countryCode: string,
  gateway: PaymentGatewayId
): Promise<void> {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const providerId = PAYMENT_GATEWAY_PROVIDER_IDS[gateway]
  const currency = COUNTRY_REGION_CURRENCY[countryCode.toLowerCase()]

  if (!currency) {
    logger.warn(`No region currency mapping for country ${countryCode}`)
    return
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "payment_providers.id"],
  })

  for (const region of regions) {
    if (region.currency_code !== currency) continue

    const current = (region.payment_providers ?? [])
      .map((p) => p?.id)
      .filter((id): id is string => Boolean(id))

    if (current.length === 1 && current[0] === providerId) {
      logger.info(`Region ${region.name} already uses ${providerId}.`)
      continue
    }

    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: [providerId] },
      },
    })

    logger.info(
      `Region ${region.name} payment provider set to ${providerId} (${gateway}).`
    )
  }
}
