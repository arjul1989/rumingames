import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath } from "@medusajs/icons"
import { Container, Heading, Button, Table, Badge, Select, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import RoleGate from "../../components/role-gate"

type Delivery = {
  id: string
  order_id: string
  display_id: number | null
  email: string | null
  fazer_order_id: string | null
  status: "pending" | "processing" | "delivered" | "failed" | "refunded"
  error_message: string | null
  delivered_at: string | null
  created_at: string
}

const STATUS_COLOR = {
  pending: "grey",
  processing: "blue",
  delivered: "green",
  failed: "red",
  refunded: "orange",
} as const

const STATUS_LABEL = {
  pending: "Pendiente",
  processing: "Procesando",
  delivered: "Entregado",
  failed: "Fallido",
  refunded: "Reembolsado",
} as const

const EntregasPage = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [retrying, setRetrying] = useState<string | null>(null)

  const load = async () => {
    const qs = filter === "all" ? "" : `?status=${filter}`
    const r = await fetch(`/admin/digital-delivery${qs}`, { credentials: "include" }).then((r) =>
      r.json()
    )
    setDeliveries(r.deliveries ?? [])
  }

  useEffect(() => {
    load()
  }, [filter])

  const retry = async (orderId: string) => {
    setRetrying(orderId)
    try {
      const r = await fetch(`/admin/orders/${orderId}/retry-fulfillment`, {
        method: "POST",
        credentials: "include",
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.message ?? "Error")
      toast.success(
        `Reintento: ${json.delivered} entregadas, ${json.failed} fallidas, ${json.skipped} omitidas.`
      )
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setRetrying(null)
    }
  }

  const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString("es-CO") : "—")

  return (
    <RoleGate permission="deliveries">
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading level="h1">Entregas digitales</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Estado de fulfillment de códigos y recargas vía Fazer Cards.
          </Text>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <Select.Trigger className="w-48">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">Todos los estados</Select.Item>
            {(["pending", "processing", "delivered", "failed", "refunded"] as const).map((s) => (
              <Select.Item key={s} value={s}>
                {STATUS_LABEL[s]}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Orden</Table.HeaderCell>
            <Table.HeaderCell>Cliente</Table.HeaderCell>
            <Table.HeaderCell>Estado</Table.HeaderCell>
            <Table.HeaderCell>Nº Fazer</Table.HeaderCell>
            <Table.HeaderCell>Entregado</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {deliveries.length === 0 && (
            <Table.Row>
              <Table.Cell className="text-ui-fg-muted">Sin entregas.</Table.Cell>
            </Table.Row>
          )}
          {deliveries.map((d) => (
            <Table.Row key={d.id}>
              <Table.Cell>{d.display_id ? `#${d.display_id}` : d.order_id}</Table.Cell>
              <Table.Cell>
                <span className="text-ui-fg-subtle text-xs">{d.email ?? "—"}</span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-col gap-1">
                  <Badge color={STATUS_COLOR[d.status]} size="small">
                    {STATUS_LABEL[d.status]}
                  </Badge>
                  {d.error_message && (
                    <span className="text-ui-fg-error text-xs">{d.error_message}</span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="font-mono text-xs">{d.fazer_order_id ?? "—"}</span>
              </Table.Cell>
              <Table.Cell>
                <span className="text-ui-fg-subtle text-xs">{fmtDate(d.delivered_at)}</span>
              </Table.Cell>
              <Table.Cell>
                {(d.status === "failed" || d.status === "pending") && (
                  <Button
                    size="small"
                    variant="secondary"
                    isLoading={retrying === d.order_id}
                    onClick={() => retry(d.order_id)}
                  >
                    Reintentar
                  </Button>
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
    </RoleGate>
  )
}

export const config = defineRouteConfig({
  label: "Entregas digitales",
  icon: ArrowPath,
})

export default EntregasPage
