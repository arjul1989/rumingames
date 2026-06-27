import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  getEpaycoTransaction,
  isEpaycoConfigured,
} from "../../../../../lib/epayco-checkout"
import {
  getEpaycoThreeDsPayload,
  isEpaycoThreeDsRequired,
} from "../../../../../modules/payment-epayco/lib/three-ds"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!isEpaycoConfigured()) {
    return res.status(503).json({ message: "ePayco is not configured" })
  }

  const ref = req.params.ref
  if (!ref) {
    return res.status(400).json({ message: "Transaction ref is required" })
  }

  const tx = await getEpaycoTransaction(ref)
  res.json({
    transaction: tx,
    three_ds_required: isEpaycoThreeDsRequired({
      "3DS": tx["3DS"],
      cc_network_response: tx.cc_network_response,
    }),
    three_ds: getEpaycoThreeDsPayload({ data: tx, "3DS": tx["3DS"] }),
  })
}
