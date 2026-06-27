import type { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { renderEmail, type EmailTemplate } from "./render"
import { logSupportTrace } from "../support/log-support-trace"

export async function sendEmail(
  container: MedusaContainer,
  params: {
    to: string
    template: EmailTemplate
    data: Record<string, unknown>
    order_id?: string | null
  }
): Promise<void> {
  if (!params.to) return

  const notification = container.resolve(Modules.NOTIFICATION)
  const { subject, html, text } = renderEmail(params.template, params.data)

  await notification.createNotifications({
    to: params.to,
    channel: "email",
    template: params.template,
    content: { subject, html, text } as Record<string, unknown>,
    data: params.data,
  })

  await logSupportTrace(container, {
    email: params.to,
    order_id: params.order_id ?? (params.data.order_id as string | undefined) ?? null,
    stage: "email",
    label: `Correo: ${params.template}`,
    endpoint: "notification.createNotifications",
    method: "POST",
    request: { to: params.to, template: params.template, subject },
    response: { sent: true },
  })
}
