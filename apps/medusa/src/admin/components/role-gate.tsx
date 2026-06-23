import { Container, Heading, Text } from "@medusajs/ui"
import type { ReactNode } from "react"
import type { GoruminPermission } from "../../../lib/admin-roles"
import { useGoruminRole } from "../lib/use-gorumin-role"

type Props = {
  permission: GoruminPermission
  children: ReactNode
  title?: string
}

// Hides admin UI when the user lacks the required Gorumin permission (RUM-63).
export default function RoleGate({ permission, children, title = "Acceso restringido" }: Props) {
  const { loading, can, role } = useGoruminRole()

  if (loading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Cargando permisos…</Text>
      </Container>
    )
  }

  if (!can(permission)) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-8">
          <Heading level="h2">{title}</Heading>
          <Text className="text-ui-fg-subtle mt-2">
            Tu rol ({role}) no tiene permiso para esta sección.
          </Text>
        </div>
      </Container>
    )
  }

  return <>{children}</>
}
