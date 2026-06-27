import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { linkGuestOrdersToCustomer } from "../../../../../lib/link-guest-orders-to-customer"

// POST /store/customers/me/link-orders — attach guest orders with the same email.
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId || req.auth_context?.actor_type !== "customer") {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const body = (req.body ?? {}) as { email?: string }
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(customerId, {
    select: ["email"],
  })

  const targetEmail = (body.email ?? customer.email)?.trim()
  if (!targetEmail) {
    return res.status(400).json({ message: "No email on customer account." })
  }

  const linked = await linkGuestOrdersToCustomer(req.scope, customerId, targetEmail)
  return res.json({ linked })
}
