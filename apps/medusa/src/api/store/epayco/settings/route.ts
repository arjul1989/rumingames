import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  epaycoConfirmationUrl,
  epaycoRedirectUrl,
  isEpaycoConfigured,
  isEpaycoTestMode,
  isEpaycoThreeDsEnabled,
} from "../../../../lib/epayco-checkout"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    configured: isEpaycoConfigured(),
    public_key: process.env.EPAYCO_PUBLIC_KEY ?? null,
    test_mode: isEpaycoTestMode(),
    three_ds_enabled: isEpaycoThreeDsEnabled(),
    confirmation_url: epaycoConfirmationUrl(),
    redirect_url: epaycoRedirectUrl(),
  })
}
