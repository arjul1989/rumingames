import { useEffect, useState } from "react"
import type { GoruminAdminRole, GoruminPermission } from "../../../lib/admin-roles"

type RolePayload = {
  role: GoruminAdminRole
  permissions: GoruminPermission[]
}

let cache: RolePayload | null = null
let inflight: Promise<RolePayload> | null = null

async function fetchRole(): Promise<RolePayload> {
  if (cache) return cache
  if (inflight) return inflight
  inflight = fetch("/admin/gorumin/me", { credentials: "include" })
    .then((r) => r.json())
    .then((data: RolePayload) => {
      cache = data
      return data
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Loads the current admin's Gorumin role (US-9.3 / RUM-63). */
export function useGoruminRole() {
  const [state, setState] = useState<RolePayload | null>(cache)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    fetchRole()
      .then(setState)
      .finally(() => setLoading(false))
  }, [])

  const can = (permission: GoruminPermission) =>
    Boolean(state?.permissions.includes(permission))

  return { ...state, loading, can }
}

export function clearGoruminRoleCache() {
  cache = null
}
