import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getWompiAcceptanceTokens, isWompiThreeDsEnabled } from "../../../../lib/wompi-three-ds"
import { isWompiConfigured } from "../../../../lib/wompi-checkout"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  if (!isWompiConfigured()) {
    return res.status(503).json({ message: "Wompi is not configured" })
  }

  const merchant = await getWompiAcceptanceTokens()
  res.json({
    acceptance: merchant.presigned_acceptance,
    personal_data_auth: merchant.presigned_personal_data_auth,
    three_ds_enabled: isWompiThreeDsEnabled(),
  })
}
