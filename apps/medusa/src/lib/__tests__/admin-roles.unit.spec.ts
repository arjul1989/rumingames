import {
  GoruminAdminRole,
  parseGoruminRole,
  permissionsForRole,
  roleHasPermission,
} from "../admin-roles"

describe("admin roles", () => {
  it("defaults to admin when metadata is missing", () => {
    expect(parseGoruminRole(undefined)).toBe("admin")
    expect(parseGoruminRole({})).toBe("admin")
  })

  it("parses valid roles from metadata", () => {
    expect(parseGoruminRole({ gorumin_role: "editor" })).toBe("editor")
    expect(parseGoruminRole({ gorumin_role: "support" })).toBe("support")
  })

  it("editor can only access cms", () => {
    expect(roleHasPermission("editor", "cms")).toBe(true)
    expect(roleHasPermission("editor", "fazer")).toBe(false)
    expect(roleHasPermission("editor", "refunds")).toBe(false)
    expect(roleHasPermission("editor", "deliveries")).toBe(false)
  })

  it("support can manage deliveries but not refunds or cms", () => {
    expect(roleHasPermission("support", "deliveries")).toBe(true)
    expect(roleHasPermission("support", "refunds")).toBe(false)
    expect(roleHasPermission("support", "cms")).toBe(false)
  })

  it("admin has all permissions", () => {
    const perms = permissionsForRole("admin")
    expect(perms).toEqual(
      expect.arrayContaining(["cms", "fazer", "refunds", "deliveries", "supplier"])
    )
  })
})
