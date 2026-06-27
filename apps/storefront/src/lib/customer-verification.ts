/** Matches backend `isCustomerEmailVerified` — only `email_verified: false` blocks access. */
export function isCustomerEmailVerified(
  customer: { metadata?: Record<string, unknown> | null } | null
): boolean {
  if (!customer) return false
  return customer.metadata?.email_verified !== false
}
