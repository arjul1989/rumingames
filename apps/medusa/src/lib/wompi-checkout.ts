import { MedusaContainer } from "@medusajs/framework"
import {
  buildWompiIntegritySignature,
  toWompiAmountInCents,
} from "../modules/payment-wompi/lib/integrity"

export interface WompiCheckoutParams {
  public_key: string
  currency: string
  amount_in_cents: number
  reference: string
  signature_integrity: string
  redirect_url: string
  customer_email?: string
  customer_data?: Record<string, string>
}

export function buildWompiCheckoutParams(input: {
  reference: string
  amountPesos: number
  currency?: string
  customerEmail?: string
  customerData?: Record<string, string>
  redirectUrl?: string
}): WompiCheckoutParams {
  const publicKey = process.env.WOMPI_PUBLIC_KEY
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET
  if (!publicKey || !integritySecret) {
    throw new Error("Wompi is not configured (missing public or integrity key).")
  }

  const currency = input.currency ?? "COP"
  const amountInCents = toWompiAmountInCents(input.amountPesos)
  const storefront = (process.env.STOREFRONT_URL ?? "http://localhost:8000").replace(
    /\/$/,
    ""
  )
  const redirectUrl =
    input.redirectUrl ?? `${storefront}/co/checkout/pending`

  return {
    public_key: publicKey,
    currency,
    amount_in_cents: amountInCents,
    reference: input.reference,
    signature_integrity: buildWompiIntegritySignature({
      reference: input.reference,
      amountInCents,
      currency,
      integritySecret,
    }),
    redirect_url: redirectUrl,
    customer_email: input.customerEmail,
    customer_data: input.customerData,
  }
}

export function isWompiConfigured(): boolean {
  return Boolean(
    process.env.WOMPI_PUBLIC_KEY &&
      process.env.WOMPI_PRIVATE_KEY &&
      process.env.WOMPI_INTEGRITY_SECRET
  )
}
