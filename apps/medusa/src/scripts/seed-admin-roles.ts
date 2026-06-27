import { MedusaContainer } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { GORUMIN_ROLE_META_KEY, GoruminAdminRole, ROLE_LABELS } from "../lib/admin-roles"

const ROLE_BY_EMAIL: Record<string, GoruminAdminRole> = {
  "arjul1989@gmail.com": "admin",
  "admin@gorumin.com": "admin",
  "editor@gorumin.com": "editor",
  "support@gorumin.com": "support",
}

// Assigns Gorumin admin roles via user metadata (US-9.3 / RUM-63).
// Run after creating users with `medusa user -e <email> -p <password>`.
export default async function seedAdminRoles({ container }: { container: MedusaContainer }) {
  const logger = container.resolve("logger")
  const userModule = container.resolve(Modules.USER)

  for (const [email, role] of Object.entries(ROLE_BY_EMAIL)) {
    const users = await userModule.listUsers({ email })
    const record = users[0]
    if (!record) {
      logger.warn(
        `User ${email} not found. Create with: medusa user -e ${email} -p <password>`
      )
      continue
    }

    await userModule.updateUsers({
      id: record.id,
      metadata: {
        ...(record.metadata ?? {}),
        [GORUMIN_ROLE_META_KEY]: role,
      },
    })
    logger.info(`✓ ${email} → ${ROLE_LABELS[role]} (${role})`)
  }

  logger.info("Gorumin admin roles assignment finished.")
}
