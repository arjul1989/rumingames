import { adminAlertEmail } from "./templates/admin-alert"
import { digitalCodeDeliveredEmail } from "./templates/digital-code-delivered"
import { emailVerificationEmail } from "./templates/email-verification"
import { orderPlacedEmail } from "./templates/order-placed"

export type EmailTemplate =
  | "order-placed"
  | "email-verification"
  | "digital-code-delivered"
  | "fulfillment-failed"
  | "monitor-alert"

export function renderEmail(
  template: EmailTemplate,
  data: Record<string, unknown>
): { subject: string; html: string; text: string } {
  switch (template) {
    case "order-placed":
      return orderPlacedEmail(data as Parameters<typeof orderPlacedEmail>[0])
    case "email-verification":
      return emailVerificationEmail(data as Parameters<typeof emailVerificationEmail>[0])
    case "digital-code-delivered":
      return digitalCodeDeliveredEmail(
        data as Parameters<typeof digitalCodeDeliveredEmail>[0]
      )
    case "fulfillment-failed":
    case "monitor-alert":
      return adminAlertEmail({
        title: String(data.subject ?? data.title ?? "Alerta rumin"),
        message: String(data.message ?? data.text ?? ""),
        details: data.details ? String(data.details) : undefined,
      })
    default:
      return {
        subject: String(data.subject ?? "rumin"),
        html: `<p>${String(data.message ?? "")}</p>`,
        text: String(data.message ?? ""),
      }
  }
}
