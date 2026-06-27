import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendCustomerVerificationEmail } from "../lib/send-verification-email"

// On customer registration, send the confirmation email (US-1.5 / RUM-14).
export default async function customerEmailVerificationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")

  try {
    const result = await sendCustomerVerificationEmail(container, event.data.id)
    if (result.sent) {
      logger.info(`Verification email queued for customer ${event.data.id}`)
    }
  } catch (e) {
    logger.error(`Failed to send verification email: ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
