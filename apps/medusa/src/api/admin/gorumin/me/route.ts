import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGoruminRolePayload } from "../../../../lib/require-admin-role"

// Returns the Gorumin role + permissions for the logged-in admin user
// (US-9.3 / RUM-63). Used by custom Admin UI extensions to hide routes/widgets.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const payload = await getGoruminRolePayload(req)
  res.json(payload)
}
