import { ExecArgs } from "@medusajs/framework/types"
import { DIGITAL_DELIVERY_MODULE } from "../modules/digital-delivery"
import type DigitalDeliveryModuleService from "../modules/digital-delivery/service"

// Verifies encrypt-at-rest + reveal flow for digital codes.
// Run with: npx medusa exec ./src/scripts/verify-digital-delivery.ts
export default async function verifyDigitalDelivery({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const service = container.resolve<DigitalDeliveryModuleService>(
    DIGITAL_DELIVERY_MODULE
  )

  const secretCode = "STEAM-XXXX-YYYY-ZZZZ"

  const [delivery] = await service.createDigitalDeliveries([
    {
      order_id: "order_demo",
      line_item_id: "item_demo",
      status: "pending",
    },
  ])
  logger.info(`Created delivery ${delivery.id} (status=${delivery.status})`)

  await service.storeCode(delivery.id, secretCode, "fazer_demo_123")

  const stored = await service.retrieveDigitalDelivery(delivery.id)
  const isEncrypted =
    !!stored.code_encrypted && !stored.code_encrypted.includes(secretCode)
  logger.info(
    `Stored: status=${stored.status}, encrypted_at_rest=${isEncrypted}, fazer_order=${stored.fazer_order_id}`
  )

  const revealed = await service.revealCode(delivery.id)
  logger.info(
    `Reveal matches original: ${revealed === secretCode} (decrypted="${revealed}")`
  )

  await service.deleteDigitalDeliveries([delivery.id])
  logger.info("Verification cleanup done.")
}
