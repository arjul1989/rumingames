import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Public endpoint hit from the verification email link (US-1.5 / RUM-14).
// Validates the token stored in customer metadata and marks the email verified.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { token, id } = req.query as { token?: string; id?: string }
  const storefront = process.env.STOREFRONT_URL || "http://localhost:8000"

  if (!token || !id) {
    return res.redirect(`${storefront}/co?email_verified=invalid`)
  }

  const customerService = req.scope.resolve(Modules.CUSTOMER)

  let customer
  try {
    customer = await customerService.retrieveCustomer(id)
  } catch {
    return res.redirect(`${storefront}/co?email_verified=invalid`)
  }

  const stored = customer.metadata?.email_verification_token
  if (!stored || stored !== token) {
    return res.redirect(`${storefront}/co?email_verified=invalid`)
  }

  // Medusa merges metadata on update, so null (not delete) clears the token.
  await customerService.updateCustomers(customer.id, {
    metadata: {
      ...(customer.metadata ?? {}),
      email_verified: true,
      email_verification_token: null,
    },
  })

  return res.redirect(`${storefront}/co?email_verified=success`)
}
