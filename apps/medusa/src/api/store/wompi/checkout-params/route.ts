import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { buildWompiCheckoutParams, isWompiConfigured } from "../../../../lib/wompi-checkout"
import { resolveMoneyAmount } from "../../../../lib/resolve-money-amount"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isWompiConfigured()) {
    return res.status(503).json({ message: "Wompi is not configured" })
  }

  const body = (req.body ?? {}) as {
    reference?: string
    amount?: number
    customer_email?: string
    customer_data?: Record<string, string>
    redirect_url?: string
    country_code?: string
  }

  if (!body.reference || body.amount == null) {
    return res.status(400).json({ message: "reference and amount are required" })
  }

  try {
    const params = buildWompiCheckoutParams({
      reference: body.reference,
      amountPesos: resolveMoneyAmount(body.amount),
      customerEmail: body.customer_email,
      customerData: body.customer_data,
      redirectUrl: body.redirect_url,
    })
    res.json(params)
  } catch (e) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      (e as Error).message
    )
  }
}
