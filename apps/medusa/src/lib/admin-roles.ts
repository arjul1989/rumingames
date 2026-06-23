// Gorumin admin roles (US-9.3 / RUM-63). Stored on the Medusa user metadata
// field `gorumin_role`. Medusa v2.16 does not ship project-level RBAC wiring
// yet, so we enforce permissions on our custom admin routes and UI extensions.

export type GoruminAdminRole = "admin" | "editor" | "support"

export const GORUMIN_ROLE_META_KEY = "gorumin_role"

export type GoruminPermission = "cms" | "fazer" | "refunds" | "deliveries" | "supplier"

const ROLE_PERMISSIONS: Record<GoruminAdminRole, ReadonlySet<GoruminPermission>> = {
  admin: new Set(["cms", "fazer", "refunds", "deliveries", "supplier"]),
  editor: new Set(["cms"]),
  support: new Set(["deliveries"]),
}

const VALID_ROLES = new Set<string>(["admin", "editor", "support"])

/** Parse role from user metadata; defaults to admin for legacy users without a role. */
export function parseGoruminRole(
  metadata: Record<string, unknown> | null | undefined
): GoruminAdminRole {
  const raw = metadata?.[GORUMIN_ROLE_META_KEY]
  if (typeof raw === "string" && VALID_ROLES.has(raw)) {
    return raw as GoruminAdminRole
  }
  return "admin"
}

export function permissionsForRole(role: GoruminAdminRole): GoruminPermission[] {
  return [...ROLE_PERMISSIONS[role]]
}

export function roleHasPermission(
  role: GoruminAdminRole,
  permission: GoruminPermission
): boolean {
  return ROLE_PERMISSIONS[role].has(permission)
}

export const ROLE_LABELS: Record<GoruminAdminRole, string> = {
  admin: "Administrador",
  editor: "Editor de contenido",
  support: "Soporte",
}
