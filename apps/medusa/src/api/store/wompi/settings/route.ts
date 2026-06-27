import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isWompiConfigured } from "../../../../lib/wompi-checkout"
import { isWompiThreeDsEnabled } from "../../../../lib/wompi-three-ds"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    configured: isWompiConfigured(),
    public_key: process.env.WOMPI_PUBLIC_KEY ?? null,
    api_base_url: process.env.WOMPI_API_BASE_URL ?? "https://sandbox.wompi.co/v1",
    three_ds_enabled: isWompiThreeDsEnabled(),
  })
}
