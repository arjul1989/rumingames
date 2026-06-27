import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendCustomerVerificationEmail } from "../lib/send-verification-email"
import { isCustomerEmailVerified } from "../lib/require-verified-email"

// Send (or resend) the account confirmation email.
//   npx medusa exec ./src/scripts/send-verification-email.ts -- arjul1989@gmail.com
export default async function sendVerificationEmailScript({ container, args }: ExecArgs) {
  const logger = container.resolve("logger")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const target = (args?.[0] as string | undefined)?.trim().toLowerCase()

  if (!target) {
    throw new Error("Usage: npx medusa exec ./src/scripts/send-verification-email.ts -- <email|customer_id>")
  }

  const isCustomerId = target.startsWith("cus_")
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "metadata"],
    filters: isCustomerId ? { id: [target] } : { email: [target] },
  })

  const customers = (data ?? []) as Array<{
    id: string
    email: string
    metadata?: Record<string, unknown> | null
  }>

  if (!customers.length) {
    throw new Error(`No customer found for ${target}`)
  }

  const ordered = [
    ...customers.filter((c) => c.metadata?.email_verified === false),
    ...customers.filter((c) => !isCustomerEmailVerified(c)),
    ...customers,
  ]

  for (const customer of ordered) {
    const result = await sendCustomerVerificationEmail(container, customer.id)
    if (result.sent) {
      logger.info(`Verification email sent to ${customer.email} (${customer.id})`)
      return
    }
    logger.info(`Skipped ${customer.id}: ${result.reason ?? "already verified"}`)
  }

  throw new Error("No unverified customer found to send verification email.")
}
