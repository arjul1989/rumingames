import { MedusaService } from "@medusajs/framework/utils"
import DigitalDelivery from "./models/digital-delivery"
import { encryptCode, decryptCode } from "./lib/crypto"

class DigitalDeliveryModuleService extends MedusaService({
  DigitalDelivery,
}) {
  // Store a delivered code encrypted at rest and mark the row delivered.
  async storeCode(id: string, plaintextCode: string, fazerOrderId?: string) {
    return await this.updateDigitalDeliveries({
      id,
      code_encrypted: encryptCode(plaintextCode),
      fazer_order_id: fazerOrderId ?? null,
      status: "delivered",
      delivered_at: new Date(),
      error_message: null,
    })
  }

  // Decrypt and return the code for an owner-authorized read.
  async revealCode(id: string): Promise<string | null> {
    const delivery = await this.retrieveDigitalDelivery(id)
    if (!delivery?.code_encrypted) {
      return null
    }
    return decryptCode(delivery.code_encrypted)
  }

  // Mark all deliveries of an order as refunded (US-3.5 / RUM-27).
  async markOrderRefunded(orderId: string): Promise<number> {
    const deliveries = await this.listDigitalDeliveries({ order_id: orderId })
    if (!deliveries.length) {
      return 0
    }
    await this.updateDigitalDeliveries(
      deliveries.map((d) => ({ id: d.id, status: "refunded" as const }))
    )
    return deliveries.length
  }
}

export default DigitalDeliveryModuleService
