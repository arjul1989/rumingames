import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getWompiThreeDsAuth } from "../../../../../modules/payment-wompi/lib/three-ds"
import { isWompiConfigured } from "../../../../../lib/wompi-checkout"
import { getWompiTransaction } from "../../../../../lib/wompi-three-ds"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isWompiConfigured()) {
    return res.status(503).json({ message: "Wompi is not configured" })
  }

  const id = req.params.id
  if (!id) {
    return res.status(400).json({ message: "Transaction id is required" })
  }

  const tx = await getWompiTransaction(id)
  res.json({
    transaction: tx,
    three_ds_auth: getWompiThreeDsAuth(tx),
  })
}
