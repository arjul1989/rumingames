import { model } from "@medusajs/framework/utils"

/** Per line-item funding pipeline: Fazer payment → Binance → Fazer order (US-13.1). */
const FundingRun = model
  .define("funding_run", {
    id: model.id().primaryKey(),
    order_id: model.text(),
    line_item_id: model.text(),
    digital_delivery_id: model.text().nullable(),
    fazer_sku_id: model.text(),
    wholesale_usd: model.float(),
    idempotency_key: model.text(),
    fazer_payment_id: model.text().nullable(),
    fazer_payment_method: model.text().nullable(),
    fazer_pay_to: model.text().nullable(),
    fazer_pay_url: model.text().nullable(),
    binance_transfer_id: model.text().nullable(),
    fazer_order_id: model.text().nullable(),
    status: model
      .enum([
        "pending",
        "fazer_payment_created",
        "binance_sent",
        "fazer_payment_confirmed",
        "fazer_order_placed",
        "completed",
        "failed",
      ])
      .default("pending"),
    error_message: model.text().nullable(),
    completed_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["order_id"] },
    { on: ["idempotency_key"], unique: true },
    { on: ["status"] },
  ])

export default FundingRun
