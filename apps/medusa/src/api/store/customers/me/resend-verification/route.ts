import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getAuthActorId } from "../../../../../lib/auth-context"
import { sendCustomerVerificationEmail } from "../../../../../lib/send-verification-email"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getAuthActorId(req)
  if (!customerId) {
    return res.status(401).json({ message: "No autenticado." })
  }

  try {
    const result = await sendCustomerVerificationEmail(req.scope, customerId)
    if (!result.sent) {
      return res.status(400).json({ message: result.reason ?? "No se pudo reenviar." })
    }
    return res.json({ message: "Enviamos un nuevo enlace de confirmación a tu correo." })
  } catch (e) {
    return res.status(502).json({ message: (e as Error).message })
  }
}
