import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  GoruminAdminRole,
  GoruminPermission,
  parseGoruminRole,
  permissionsForRole,
  roleHasPermission,
} from "./admin-roles"

// Resolves the Gorumin role for the authenticated admin user (US-9.3 / RUM-63).
export async function getGoruminRole(req: MedusaRequest): Promise<GoruminAdminRole> {
  const actorId = req.auth_context?.actor_id
  if (!actorId) return "admin"

  try {
    const user = req.scope.resolve(Modules.USER)
    const record = await user.retrieveUser(actorId, { select: ["id", "metadata"] })
    return parseGoruminRole(record.metadata as Record<string, unknown> | undefined)
  } catch {
    return "admin"
  }
}

/** Returns 403 JSON if the caller lacks the permission; otherwise null (ok). */
export async function assertAdminPermission(
  req: MedusaRequest,
  res: MedusaResponse,
  permission: GoruminPermission
): Promise<null | MedusaResponse> {
  const role = await getGoruminRole(req)
  if (!roleHasPermission(role, permission)) {
    return res.status(403).json({
      message: "No tienes permiso para esta acción.",
      required: permission,
      role,
    })
  }
  return null
}

export async function getGoruminRolePayload(req: MedusaRequest) {
  const role = await getGoruminRole(req)
  return {
    role,
    permissions: permissionsForRole(role),
  }
}
