import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { assertAdminPermission } from "./require-admin-role"
import type { GoruminPermission } from "./admin-roles"

// Express-style middleware factory for Gorumin admin permissions (US-9.3 / RUM-63).
export function requireGoruminPermission(permission: GoruminPermission) {
  return async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const denied = await assertAdminPermission(req, res, permission)
    if (denied) return
    next()
  }
}
