import { model } from "@medusajs/framework/utils"

/** Manual admin wallet top-up: Fazer payment → Binance → balance credit. */
const FazerWalletTopup = model
  .define("fazer_wallet_topup", {
    id: model.id().primaryKey(),
    amount_usd: model.float(),
    method: model.text(),
    status: model
      .enum([
        "draft",
        "payment_created",
        "binance_sent",
        "awaiting_confirmation",
        "completed",
        "failed",
      ])
      .default("draft"),
    idempotency_key: model.text(),
    fazer_payment_id: model.text().nullable(),
    fazer_pay_to: model.text().nullable(),
    fazer_pay_url: model.text().nullable(),
    binance_transfer_id: model.text().nullable(),
    binance_tx_id: model.text().nullable(),
    error_message: model.text().nullable(),
    created_by: model.text().nullable(),
    confirmed_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["idempotency_key"], unique: true }, { on: ["status"] }])

export default FazerWalletTopup
