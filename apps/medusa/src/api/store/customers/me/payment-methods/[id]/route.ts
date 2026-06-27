import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getAuthActorId } from "../../../../../../lib/auth-context"
import { getCustomerVerificationStatus } from "../../../../../../lib/require-verified-email"
import { deleteSavedCard } from "../../../../../../lib/mp-saved-cards"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getAuthActorId(req)
  if (!customerId) {
    return res.status(401).json({ message: "No autenticado." })
  }

  const { verified } = await getCustomerVerificationStatus(req.scope, customerId)
  if (!verified) {
    return res.status(403).json({
      message: "Confirma tu correo electrónico para gestionar métodos de pago.",
      code: "email_not_verified",
    })
  }

  const cardId = req.params.id
  if (!cardId) {
    return res.status(400).json({ message: "Falta id de tarjeta." })
  }

  try {
    await deleteSavedCard(req.scope, customerId, cardId)
    res.status(204).send()
  } catch (e) {
    res.status(502).json({ message: (e as Error).message })
  }
}
