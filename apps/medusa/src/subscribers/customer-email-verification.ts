import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import crypto from "crypto"

// On customer registration, issue an email-verification token and send the
// confirmation email (US-1.5 / RUM-14). The token lives in customer metadata.
export default async function customerEmailVerificationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const customerService = container.resolve(Modules.CUSTOMER)
  const notificationService = container.resolve(Modules.NOTIFICATION)

  const customer = await customerService.retrieveCustomer(event.data.id)

  // Skip if already verified (e.g. social login that returns verified emails).
  if (customer.metadata?.email_verified === true) {
    return
  }

  const token = crypto.randomBytes(32).toString("hex")
  await customerService.updateCustomers(customer.id, {
    metadata: {
      ...(customer.metadata ?? {}),
      email_verified: false,
      email_verification_token: token,
    },
  })

  const backend = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  const link = `${backend}/verify-email?token=${token}&id=${customer.id}`

  try {
    await notificationService.createNotifications({
      to: customer.email,
      channel: "email",
      template: "email-verification",
      content: {
        subject: "Confirma tu correo en Gorumin",
        text: `Hola ${customer.first_name ?? ""}, confirma tu correo: ${link}`,
      } as unknown as Record<string, unknown>,
      data: { link, first_name: customer.first_name ?? "" },
    })
    logger.info(`Verification email queued for ${customer.email}`)
  } catch (e) {
    logger.error(`Failed to send verification email: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
