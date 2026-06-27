import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { clientIp } from "../../../../../lib/rate-limit"
import { resolveMoneyAmount } from "../../../../../lib/resolve-money-amount"
import { isWompiConfigured } from "../../../../../lib/wompi-checkout"
import {
  createWompiThreeDsTransaction,
  isWompiThreeDsEnabled,
} from "../../../../../lib/wompi-three-ds"
import type {
  CreateWompiThreeDsTransactionInput,
  WompiBrowserInfo,
} from "../../../../../modules/payment-wompi/lib/types"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isWompiConfigured()) {
    return res.status(503).json({ message: "Wompi is not configured" })
  }

  if (!isWompiThreeDsEnabled()) {
    return res.status(503).json({ message: "Wompi 3DS is disabled" })
  }

  const body = (req.body ?? {}) as Partial<
    CreateWompiThreeDsTransactionInput & {
      card_token: string
      accept_personal_auth: string
    }
  >

  const required = [
    "reference",
    "amountPesos",
    "customerEmail",
    "cardToken",
    "acceptanceToken",
    "acceptPersonalAuth",
    "browserInfo",
  ] as const

  for (const key of required) {
    const value = key === "cardToken" ? body.cardToken ?? body.card_token : body[key]
    if (value == null || value === "") {
      return res.status(400).json({ message: `${key} is required` })
    }
  }

  try {
    const tx = await createWompiThreeDsTransaction({
      reference: body.reference!,
      amountPesos: resolveMoneyAmount(body.amountPesos),
      currency: body.currency,
      customerEmail: body.customerEmail!,
      cardToken: body.cardToken ?? body.card_token!,
      installments: body.installments,
      acceptanceToken: body.acceptanceToken!,
      acceptPersonalAuth: body.acceptPersonalAuth ?? body.accept_personal_auth!,
      redirectUrl: body.redirectUrl,
      customerData: body.customerData,
      browserInfo: body.browserInfo as WompiBrowserInfo,
      ip: body.ip ?? clientIp(req),
    })

    res.status(201).json({ transaction: tx })
  } catch (e) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      (e as Error).message
    )
  }
}
