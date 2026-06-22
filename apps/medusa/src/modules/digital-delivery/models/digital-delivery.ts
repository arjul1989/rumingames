import { model } from "@medusajs/framework/utils"

// One row per delivered unit of a digital order line (US-1.4 / RUM-13).
// `code_encrypted` holds an AES-256-GCM payload; never store codes in plaintext.
const DigitalDelivery = model
  .define("digital_delivery", {
    id: model.id().primaryKey(),
    order_id: model.text(),
    line_item_id: model.text().nullable(),
    // Supplier order reference once fulfilled against Fazer Cards.
    fazer_order_id: model.text().nullable(),
    code_encrypted: model.text().nullable(),
    status: model
      .enum(["pending", "processing", "delivered", "failed", "refunded"])
      .default("pending"),
    error_message: model.text().nullable(),
    delivered_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["order_id"] }, { on: ["status"] }])

export default DigitalDelivery
