import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getAuthActorId } from "../../../../../lib/auth-context"
import {
  getCustomerVerificationStatus,
} from "../../../../../lib/require-verified-email"
import {
  listSavedCards,
  mpPublicKey,
  saveCard,
} from "../../../../../lib/mp-saved-cards"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
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

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(503).json({ message: "Mercado Pago no configurado." })
  }

  try {
    const cards = await listSavedCards(req.scope, customerId)
    res.json({
      cards,
      public_key: mpPublicKey(),
    })
  } catch (e) {
    res.status(502).json({ message: (e as Error).message })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = getAuthActorId(req)
  if (!customerId) {
    return res.status(401).json({ message: "No autenticado." })
  }

  const body = (req.body ?? {}) as { token?: string }
  if (!body.token) {
    return res.status(400).json({ message: "Falta token de tarjeta." })
  }

  try {
    const card = await saveCard(req.scope, customerId, body.token)
    res.status(201).json({ card })
  } catch (e) {
    res.status(502).json({ message: (e as Error).message })
  }
}
