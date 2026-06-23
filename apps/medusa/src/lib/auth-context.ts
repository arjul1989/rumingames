import type { MedusaRequest } from "@medusajs/framework/http"

/** Medusa v2 request auth payload (not on the base MedusaRequest type). */
export function getAuthActorId(req: MedusaRequest): string | undefined {
  return (
    req as MedusaRequest & { auth_context?: { actor_id?: string } }
  ).auth_context?.actor_id
}
