import { model } from "@medusajs/framework/utils"

/** Default gateway commission per country (e.g. Wompi 3% + $800 COP). */
const PaymentGatewayFee = model.define("payment_gateway_fee", {
  id: model.id().primaryKey(),
  country_code: model.text(),
  gateway: model.enum(["mercadopago", "wompi", "epayco"]),
  commission_pct: model.float().default(0),
  commission_fixed_local: model.float().default(0),
})

export default PaymentGatewayFee
