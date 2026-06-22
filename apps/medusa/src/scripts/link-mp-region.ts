import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

const MP_PROVIDER_ID = "pp_mercadopago_mercadopago"

// Associates the Mercado Pago payment provider with the Colombia region
// (US-3.2 / RUM-24) so it shows up as a checkout option. Existing installs
// were seeded before MP was registered; run once after configuring
// MP_ACCESS_TOKEN:
//   npx medusa exec ./src/scripts/link-mp-region.ts
export default async function linkMpRegion({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const payment = container.resolve(Modules.PAYMENT)

  const providers = await payment.listPaymentProviders({})
  const hasMp = providers.some((p) => p.id === MP_PROVIDER_ID)
  if (!hasMp) {
    logger.warn(
      `Mercado Pago provider not registered (is MP_ACCESS_TOKEN set?). Found: ${providers
        .map((p) => p.id)
        .join(", ")}`
    )
    return
  }

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "payment_providers.id"],
  })

  for (const region of regions) {
    if (region.currency_code !== "cop") continue

    const current = (region.payment_providers ?? []).map(
      (p: { id: string }) => p.id
    )
    if (current.includes(MP_PROVIDER_ID)) {
      logger.info(`Region ${region.name} already linked to Mercado Pago.`)
      continue
    }

    const next = Array.from(new Set([...current, MP_PROVIDER_ID]))
    await updateRegionsWorkflow(container).run({
      input: { selector: { id: region.id }, update: { payment_providers: next } },
    })
    logger.info(
      `Linked Mercado Pago to region ${region.name}: ${next.join(", ")}`
    )
  }
}
