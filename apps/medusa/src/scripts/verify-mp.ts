import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Confirms the Mercado Pago provider is registered with the Payment module
// (US-3.1 / RUM-23). Run with MP_ACCESS_TOKEN set:
//   export MP_ACCESS_TOKEN=TEST-... && npx medusa exec ./src/scripts/verify-mp.ts
export default async function verifyMp({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const payment = container.resolve(Modules.PAYMENT)
  const providers = await payment.listPaymentProviders({})
  logger.info(`Registered payment providers: ${providers.map((p) => p.id).join(", ")}`)
  const mp = providers.find((p) => p.id.includes("mercadopago"))
  logger.info(mp ? `Mercado Pago provider OK -> ${mp.id}` : "Mercado Pago provider NOT found")
}
