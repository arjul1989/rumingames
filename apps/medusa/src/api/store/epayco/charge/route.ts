import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { clientIp } from "../../../../lib/rate-limit"
import { resolveMoneyAmount } from "../../../../lib/resolve-money-amount"
import {
  createEpaycoCharge,
  createEpaycoCustomer,
  epaycoConfirmationUrl,
  epaycoRedirectUrl,
  isEpaycoConfigured,
  isEpaycoThreeDsEnabled,
  tokenizeEpaycoCard,
} from "../../../../lib/epayco-checkout"
import {
  getEpaycoThreeDsPayload,
  isEpaycoThreeDsRequired,
} from "../../../../modules/payment-epayco/lib/three-ds"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!isEpaycoConfigured()) {
    return res.status(503).json({ message: "ePayco is not configured" })
  }

  if (!isEpaycoThreeDsEnabled()) {
    return res.status(503).json({ message: "ePayco 3DS is disabled" })
  }

  const body = (req.body ?? {}) as {
    reference?: string
    amountPesos?: number
    customerEmail?: string
    cardNumber?: string
    expMonth?: string
    expYear?: string
    cvc?: string
    docType?: string
    docNumber?: string
    firstName?: string
    lastName?: string
    phone?: string
    city?: string
    address?: string
    countryCode?: string
    redirectUrl?: string
  }

  const required = [
    "reference",
    "amountPesos",
    "customerEmail",
    "cardNumber",
    "expMonth",
    "expYear",
    "cvc",
    "docType",
    "docNumber",
    "firstName",
    "lastName",
  ] as const

  for (const key of required) {
    if (!body[key]) {
      return res.status(400).json({ message: `${key} is required` })
    }
  }

  try {
    const token = await tokenizeEpaycoCard({
      number: String(body.cardNumber).replace(/\s/g, ""),
      exp_month: String(body.expMonth),
      exp_year: String(body.expYear).slice(-2),
      cvc: String(body.cvc),
    })

    const customer = await createEpaycoCustomer({
      tokenCard: token.id,
      email: body.customerEmail!,
      name: body.firstName!,
      lastName: body.lastName!,
    })

    const charge = await createEpaycoCharge({
      reference: body.reference!,
      amountPesos: resolveMoneyAmount(body.amountPesos),
      customerEmail: body.customerEmail!,
      tokenCard: token.id,
      customerId: customer.customerId,
      docType: body.docType!,
      docNumber: body.docNumber!,
      firstName: body.firstName!,
      lastName: body.lastName!,
      phone: body.phone,
      city: body.city,
      address: body.address,
      ip: clientIp(req),
      redirectUrl: body.redirectUrl ?? epaycoRedirectUrl(body.countryCode ?? "co"),
      confirmationUrl: epaycoConfirmationUrl(),
    })

    const tx = charge.data
    res.status(201).json({
      charge,
      transaction: tx ?? null,
      ref_payco: tx?.ref_payco ? String(tx.ref_payco) : null,
      three_ds_required: isEpaycoThreeDsRequired(charge),
      three_ds: getEpaycoThreeDsPayload(charge),
    })
  } catch (e) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      (e as Error).message
    )
  }
}
