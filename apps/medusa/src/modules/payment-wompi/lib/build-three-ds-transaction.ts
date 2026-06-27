import {
  buildWompiIntegritySignature,
  toWompiAmountInCents,
} from "./integrity"
import type { CreateWompiThreeDsTransactionInput } from "./types"

export function buildWompiThreeDsTransactionBody(
  input: CreateWompiThreeDsTransactionInput,
  integritySecret: string,
  options?: { threeDsAuthType?: string; isSandbox?: boolean }
) {
  const currency = input.currency ?? "COP"
  const amountInCents = toWompiAmountInCents(input.amountPesos)
  const signature = buildWompiIntegritySignature({
    reference: input.reference,
    amountInCents,
    currency,
    integritySecret,
  })

  const body: Record<string, unknown> = {
    acceptance_token: input.acceptanceToken,
    accept_personal_auth: input.acceptPersonalAuth,
    amount_in_cents: amountInCents,
    currency,
    customer_email: input.customerEmail,
    reference: input.reference,
    signature,
    payment_method: {
      type: "CARD",
      token: input.cardToken,
      installments: input.installments ?? 1,
    },
    is_three_ds: true,
    customer_data: {
      ...input.customerData,
      browser_info: input.browserInfo,
    },
  }

  if (input.redirectUrl) {
    body.redirect_url = input.redirectUrl
  }

  if (input.ip) {
    body.ip = input.ip
  }

  if (options?.isSandbox && options.threeDsAuthType) {
    body.three_ds_auth_type = options.threeDsAuthType
  }

  return body
}
