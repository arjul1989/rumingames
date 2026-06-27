import type { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { runSql } from "./run-sql"

/**
 * Reassigns guest-checkout orders (same email, different customer_id) to the
 * authenticated account customer so they appear under Mis compras.
 */
export async function linkGuestOrdersToCustomer(
  container: MedusaContainer,
  accountCustomerId: string,
  email: string
): Promise<number> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !accountCustomerId) return 0

  const customerService = container.resolve(Modules.CUSTOMER)
  const account = await customerService.retrieveCustomer(accountCustomerId, {
    select: ["id", "email", "has_account"],
  })

  if (!account.has_account) return 0
  if (account.email?.trim().toLowerCase() !== normalizedEmail) return 0

  const result = await runSql(
    `UPDATE "order"
     SET customer_id = $1, updated_at = NOW()
     WHERE deleted_at IS NULL
       AND LOWER(email) = LOWER($2)
       AND (customer_id IS NULL OR customer_id <> $1)`,
    [accountCustomerId, normalizedEmail]
  )

  return result.rowCount ?? 0
}
