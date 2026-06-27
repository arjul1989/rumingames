import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  getRequestAuthContext,
  linkGoogleAuthToExistingCustomer,
} from "../../../../../lib/link-google-auth-customer"

// POST /store/auth/google/link — attach Google OAuth to an existing customer account.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const authContext = getRequestAuthContext(
    req as Parameters<typeof getRequestAuthContext>[0]
  )
  const body = (req.body ?? {}) as { email?: string }

  if (authContext.auth_provider !== "google") {
    return res.status(401).json({
      message: "La sesión no proviene de Google.",
    })
  }

  if (authContext.actor_id) {
    const email = body.email?.trim().toLowerCase()
    const authIdentityId = authContext.auth_identity_id

    if (email && authIdentityId) {
      try {
        await linkGoogleAuthToExistingCustomer(req.scope, {
          authIdentityId,
          email,
        })
      } catch {
        // Profile sync is best-effort when the account is already linked.
      }
    }

    return res.json({ linked: false, customer_id: authContext.actor_id })
  }

  const email = body.email?.trim().toLowerCase()
  const authIdentityId = authContext.auth_identity_id

  if (!email || !authIdentityId) {
    return res.status(400).json({
      message: "Faltan datos para vincular la cuenta de Google.",
    })
  }

  try {
    const { customerId } = await linkGoogleAuthToExistingCustomer(req.scope, {
      authIdentityId,
      email,
    })

    return res.json({ linked: true, customer_id: customerId })
  } catch (error) {
    if (error instanceof MedusaError) {
      const status =
        error.type === MedusaError.Types.NOT_FOUND
          ? 404
          : error.type === MedusaError.Types.UNAUTHORIZED
            ? 401
            : 400

      return res.status(status).json({ message: error.message })
    }

    return res.status(500).json({
      message: (error as Error).message || "No se pudo vincular la cuenta.",
    })
  }
}
