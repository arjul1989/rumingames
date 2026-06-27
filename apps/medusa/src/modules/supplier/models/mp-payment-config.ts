import { model } from "@medusajs/framework/utils"

// Admin toggles for Mercado Pago payment methods (Colombia storefront).
const MpPaymentConfig = model.define("mp_payment_config", {
  id: model.id().primaryKey(),
  enable_cards: model.boolean().default(true),
  enable_pse: model.boolean().default(true),
  enable_efecty: model.boolean().default(true),
  enable_manual_test: model.boolean().default(false),
})

export default MpPaymentConfig
