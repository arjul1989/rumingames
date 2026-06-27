import type { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

/** Verified unless explicitly opted out (`email_verified: false`). Legacy accounts without the flag stay allowed. */
export function isCustomerEmailVerified(
  customer: { metadata?: Record<string, unknown> | null }
): boolean {
  return customer.metadata?.email_verified !== false
}

export async function getCustomerVerificationStatus(
  container: MedusaContainer,
  customerId: string
): Promise<{ verified: boolean; email: string | null }> {
  const customerService = container.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(customerId, {
    select: ["id", "email", "metadata"],
  })
  return {
    verified: isCustomerEmailVerified(customer),
    email: customer.email ?? null,
  }
}
