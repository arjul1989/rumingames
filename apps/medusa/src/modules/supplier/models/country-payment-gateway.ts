import { model } from "@medusajs/framework/utils"

// Active payment gateway per country (admin dashboard selector).
const CountryPaymentGateway = model.define("country_payment_gateway", {
  id: model.id().primaryKey(),
  country_code: model.text(),
  active_gateway: model
    .enum(["mercadopago", "wompi"])
    .default("mercadopago"),
})

export default CountryPaymentGateway
