import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getMpPaymentConfig } from "../../../../lib/mp-payment-config"

// Public storefront config for Mercado Pago Checkout Brick (enabled methods only).
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!process.env.MP_ACCESS_TOKEN) {
    res.json({
      configured: false,
      enable_cards: false,
      enable_pse: false,
      enable_efecty: false,
      enable_manual_test: true,
    })
    return
  }
  const config = await getMpPaymentConfig(req.scope)
  res.json({
    configured: true,
    enable_cards: config.enable_cards,
    enable_pse: config.enable_pse,
    enable_efecty: config.enable_efecty,
    enable_manual_test: config.enable_manual_test,
  })
}
