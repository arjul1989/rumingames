import { model } from "@medusajs/framework/utils"

/** API / email trace for customer support (searchable by email or order). */
const SupportTrace = model
  .define("support_trace", {
    id: model.id().primaryKey(),
    email: model.text().nullable(),
    order_id: model.text().nullable(),
    ref_type: model.text().nullable(),
    ref_id: model.text().nullable(),
    stage: model.enum([
      "storefront",
      "payment",
      "fazer_order",
      "fazer_payment",
      "email",
      "webhook_mp",
      "webhook_fazer",
      "binance",
    ]),
    label: model.text(),
    endpoint: model.text().nullable(),
    method: model.text().nullable(),
    request_json: model.json().nullable(),
    response_json: model.json().nullable(),
    status_code: model.number().nullable(),
    error_message: model.text().nullable(),
  })
  .indexes([{ on: ["email"] }, { on: ["order_id"] }, { on: ["created_at"] }])

export default SupportTrace
