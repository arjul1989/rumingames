import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendCustomerVerificationEmail } from "../../../../lib/send-verification-email"

// Public resend for unverified accounts (rate-limit at edge in production if needed).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { email?: string }
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return res.status(400).json({ message: "Falta el correo electrónico." })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "metadata"],
    filters: { email: [email] },
  })

  const customers = (data ?? []) as Array<{
    id: string
    metadata?: Record<string, unknown> | null
  }>

  if (!customers.length) {
    return res.json({
      message: "Si el correo está registrado y sin verificar, enviamos un nuevo enlace.",
    })
  }

  // Prefer explicitly unverified records when duplicates share the same email.
  const ordered = [
    ...customers.filter((c) => c.metadata?.email_verified === false),
    ...customers,
  ]

  try {
    for (const customer of ordered) {
      const result = await sendCustomerVerificationEmail(req.scope, customer.id)
      if (result.sent) break
    }
  } catch (e) {
    return res.status(502).json({ message: (e as Error).message })
  }

  return res.json({
    message: "Si el correo está registrado y sin verificar, enviamos un nuevo enlace.",
  })
}
