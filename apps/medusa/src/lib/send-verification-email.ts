import type { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import crypto from "crypto"
import { sendEmail } from "./email/send-email"
import { isCustomerEmailVerified } from "./require-verified-email"

export async function issueVerificationLink(
  container: MedusaContainer,
  customerId: string
): Promise<
  | { ok: true; link: string; email: string; first_name: string }
  | { ok: false; reason: string }
> {
  const customerService = container.resolve(Modules.CUSTOMER)
  const customer = await customerService.retrieveCustomer(customerId, {
    select: ["id", "email", "first_name", "metadata"],
  })

  if (!customer.email) {
    return { ok: false, reason: "Cliente sin correo." }
  }

  if (isCustomerEmailVerified(customer)) {
    return { ok: false, reason: "El correo ya está verificado." }
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

  return {
    ok: true,
    link,
    email: customer.email,
    first_name: customer.first_name ?? "",
  }
}

export async function sendCustomerVerificationEmail(
  container: MedusaContainer,
  customerId: string
): Promise<{ sent: boolean; reason?: string }> {
  const issued = await issueVerificationLink(container, customerId)
  if (!issued.ok) {
    return { sent: false, reason: issued.reason }
  }

  await sendEmail(container, {
    to: issued.email,
    template: "email-verification",
    data: { link: issued.link, first_name: issued.first_name },
  })

  return { sent: true }
}
