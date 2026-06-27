import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail } from "../lib/email/send-email"
import type { EmailLayoutVariant } from "../lib/email/templates/layout-light"
import { issueVerificationLink } from "../lib/send-verification-email"
import { isCustomerEmailVerified } from "../lib/require-verified-email"

const PREVIEW_VARIANTS: EmailLayoutVariant[] = ["minimal", "card", "stripe"]

async function findUnverifiedCustomer(
  container: ExecArgs["container"],
  target: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const isCustomerId = target.startsWith("cus_")
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "metadata"],
    filters: isCustomerId ? { id: [target] } : { email: [target] },
  })

  const customers = (data ?? []) as Array<{
    id: string
    email: string
    first_name?: string | null
    metadata?: Record<string, unknown> | null
  }>

  if (!customers.length) return null

  return (
    customers.find((c) => c.metadata?.email_verified === false) ??
    customers.find((c) => !isCustomerEmailVerified(c)) ??
    customers[0]
  )
}

// Send 3 white-layout preview emails (minimal / card / stripe).
//   npx medusa exec ./src/scripts/send-verification-email-previews.ts arjul1989@gmail.com
export default async function sendVerificationEmailPreviews({
  container,
  args,
}: ExecArgs) {
  const logger = container.resolve("logger")
  const target = (args?.[0] as string | undefined)?.trim().toLowerCase()

  if (!target) {
    throw new Error(
      "Usage: npx medusa exec ./src/scripts/send-verification-email-previews.ts <email|customer_id>"
    )
  }

  const customer = await findUnverifiedCustomer(container, target)
  if (!customer) {
    throw new Error(`No customer found for ${target}`)
  }

  const issued = await issueVerificationLink(container, customer.id)
  if (!issued.ok) {
    throw new Error(issued.reason)
  }

  for (const variant of PREVIEW_VARIANTS) {
    await sendEmail(container, {
      to: issued.email,
      template: "email-verification",
      data: {
        link: issued.link,
        first_name: issued.first_name,
        layoutVariant: variant,
      },
    })
    logger.info(`Preview [${variant}] sent to ${issued.email}`)
  }

  logger.info(`Sent ${PREVIEW_VARIANTS.length} layout previews to ${issued.email}`)
}
