import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isWompiConfigured } from "../../../../lib/wompi-checkout"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    configured: isWompiConfigured(),
    public_key: process.env.WOMPI_PUBLIC_KEY ?? null,
  })
}
