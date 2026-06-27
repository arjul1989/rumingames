import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import RoleGate from "../../components/role-gate"

type Trace = {
  id: string
  stage: string
  label: string
  endpoint: string | null
  method: string | null
  request_json: unknown
  response_json: unknown
  status_code: number | null
  error_message: string | null
  created_at: string
}

type OrderTimeline = {
  id: string
  display_id: number | null
  created_at: string
  status: string
  email: string | null
  currency_code: string | null
  total: number | null
  storefront: {
    items: Array<{
      id: string
      title: string
      quantity: number
      unit_price: number | null
      variant_sku: string | null
    }>
  }
  payment: {
    payments: Array<{
      id: string
      provider_id: string
      amount: number | null
      captured_at: string | null
      mp_payment_id: string | null
      mp_status: string | null
      mp_snapshot: Record<string, unknown> | null
    }>
  }
  emission: {
    deliveries: Array<{
      id: string
      status: string
      fazer_order_id: string | null
      error_message: string | null
      delivered_at: string | null
    }>
    funding_runs: Array<{
      id: string
      status: string
      wholesale_usd: number
      fazer_payment_id: string | null
      fazer_order_id: string | null
      binance_transfer_id: string | null
      error_message: string | null
    }>
  }
  notifications: Trace[]
  traces: Trace[]
}

const STAGE_LABEL: Record<string, string> = {
  storefront: "Tienda",
  payment: "Pago",
  fazer_order: "Emisión Fazer",
  fazer_payment: "Fondeo Fazer",
  email: "Correo",
  webhook_mp: "Webhook MP",
  webhook_fazer: "Webhook Fazer",
  binance: "Binance",
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—"

const fmtMoney = (amount: number | null, currency: string | null) => {
  if (amount == null) return "—"
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: (currency ?? "COP").toUpperCase(),
    }).format(amount)
  } catch {
    return String(amount)
  }
}

const statusColor = (status: string) => {
  if (["completed", "delivered", "captured"].includes(status)) return "green"
  if (["failed", "canceled", "refunded"].includes(status)) return "red"
  if (["processing", "pending", "created"].includes(status)) return "blue"
  return "grey"
}

function JsonBlock({ data }: { data: unknown }) {
  if (data == null) return <Text size="xsmall" className="text-ui-fg-muted">—</Text>
  return (
    <pre className="max-h-48 overflow-auto rounded bg-ui-bg-subtle p-2 text-[10px] leading-tight">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function TraceList({ traces, technical }: { traces: Trace[]; technical: boolean }) {
  if (!traces.length) {
    return <Text size="xsmall" className="text-ui-fg-muted">Sin trazas registradas.</Text>
  }
  return (
    <div className="space-y-2">
      {traces.map((t) => (
        <div key={t.id} className="rounded border border-ui-border-base px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge size="2xsmall" color="grey">{STAGE_LABEL[t.stage] ?? t.stage}</Badge>
            <Text size="xsmall" weight="plus">{t.label}</Text>
            <Text size="xsmall" className="text-ui-fg-muted">{fmtDate(t.created_at)}</Text>
            {t.error_message && (
              <Text size="xsmall" className="text-ui-fg-error">{t.error_message}</Text>
            )}
          </div>
          {technical && (
            <div className="mt-1.5 grid gap-1.5 md:grid-cols-2">
              <div>
                <Text size="xsmall" className="text-ui-fg-subtle mb-0.5">
                  {t.method ?? "—"} {t.endpoint ?? ""}
                </Text>
                <JsonBlock data={t.request_json} />
              </div>
              <div>
                <Text size="xsmall" className="text-ui-fg-subtle mb-0.5">Response</Text>
                <JsonBlock data={t.response_json} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function OrderCard({ order, technical }: { order: OrderTimeline; technical: boolean }) {
  const [open, setOpen] = useState(false)
  const pay = order.payment.payments[0]

  return (
    <div className="rounded-lg border border-ui-border-base">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-ui-bg-subtle"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Text weight="plus" size="small">
            #{order.display_id ?? "—"}
          </Text>
          <Badge size="2xsmall" color={statusColor(order.status)}>{order.status}</Badge>
          <Text size="xsmall" className="text-ui-fg-muted">{fmtDate(order.created_at)}</Text>
          <Text size="xsmall">{fmtMoney(order.total, order.currency_code)}</Text>
          {pay?.mp_status && (
            <Badge size="2xsmall" color={statusColor(pay.mp_status)}>MP: {pay.mp_status}</Badge>
          )}
          {order.emission.deliveries[0]?.status && (
            <Badge size="2xsmall" color={statusColor(order.emission.deliveries[0].status)}>
              {order.emission.deliveries[0].status}
            </Badge>
          )}
        </div>
        <Text size="xsmall" className="text-ui-fg-muted shrink-0">{open ? "▲" : "▼"}</Text>
      </button>

      {open && (
        <div className="divide-y border-t border-ui-border-base text-sm">
          <Section title="Tienda (storefront)">
            <div className="space-y-1">
              {order.storefront.items.map((item) => (
                <div key={item.id} className="flex flex-wrap gap-x-2 text-xs">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-ui-fg-muted">×{item.quantity}</span>
                  {item.variant_sku && <span className="text-ui-fg-muted">SKU {item.variant_sku}</span>}
                </div>
              ))}
            </div>
            {technical && (
              <div className="mt-2">
                <TraceList traces={order.traces.filter((t) => t.stage === "storefront")} technical />
              </div>
            )}
          </Section>

          <Section title="Pago">
            {order.payment.payments.length === 0 ? (
              <Text size="xsmall" className="text-ui-fg-muted">Sin pagos.</Text>
            ) : (
              order.payment.payments.map((p) => (
                <div key={p.id} className="space-y-1 text-xs">
                  <div className="flex flex-wrap gap-2">
                    <span>MP ID: <code>{p.mp_payment_id ?? "—"}</code></span>
                    <span>Estado: {p.mp_status ?? "—"}</span>
                    <span>Captura: {fmtDate(p.captured_at)}</span>
                  </div>
                  {p.mp_snapshot && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-ui-fg-subtle">
                      <span>Monto: {String(p.mp_snapshot.mp_transaction_amount ?? "—")}</span>
                      <span>Reembolsado: {String(p.mp_snapshot.mp_transaction_amount_refunded ?? 0)}</span>
                      <span>Método: {String(p.mp_snapshot.mp_payment_method_id ?? "—")}</span>
                      <span>Aprobado: {fmtDate(p.mp_snapshot.mp_date_approved as string)}</span>
                    </div>
                  )}
                  {technical && p.mp_snapshot && <JsonBlock data={p.mp_snapshot} />}
                </div>
              ))
            )}
            {technical && (
              <div className="mt-2">
                <TraceList
                  traces={order.traces.filter((t) =>
                    ["payment", "webhook_mp"].includes(t.stage)
                  )}
                  technical
                />
              </div>
            )}
          </Section>

          <Section title="Emisión (tarjeta / código)">
            {order.emission.deliveries.map((d) => (
              <div key={d.id} className="mb-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  <Badge size="2xsmall" color={statusColor(d.status)}>{d.status}</Badge>
                  <span>Fazer: <code>{d.fazer_order_id ?? "—"}</code></span>
                  <span>{fmtDate(d.delivered_at)}</span>
                </div>
                {d.error_message && (
                  <Text size="xsmall" className="text-ui-fg-error">{d.error_message}</Text>
                )}
              </div>
            ))}
            {order.emission.funding_runs.map((r) => (
              <div key={r.id} className="text-xs text-ui-fg-subtle">
                Fondeo {r.status} · ${r.wholesale_usd.toFixed(2)} USD
                {r.fazer_payment_id && <> · pago {r.fazer_payment_id}</>}
                {r.binance_transfer_id && <> · Binance {r.binance_transfer_id}</>}
              </div>
            ))}
            {technical && (
              <div className="mt-2">
                <TraceList
                  traces={order.traces.filter((t) =>
                    ["fazer_order", "fazer_payment", "binance", "webhook_fazer"].includes(t.stage)
                  )}
                  technical
                />
              </div>
            )}
          </Section>

          <Section title="Notificaciones y correos">
            {order.notifications.length === 0 ? (
              <Text size="xsmall" className="text-ui-fg-muted">Sin correos registrados en trazas.</Text>
            ) : (
              <TraceList traces={order.notifications} technical={technical} />
            )}
          </Section>

          {technical && (
            <Section title="Todas las trazas técnicas">
              <TraceList traces={order.traces} technical />
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2">
      <Text size="xsmall" weight="plus" className="text-ui-fg-subtle mb-1.5 uppercase tracking-wide">
        {title}
      </Text>
      {children}
    </div>
  )
}

const SoportePage = () => {
  const [email, setEmail] = useState("")
  const [query, setQuery] = useState("")
  const [orders, setOrders] = useState<OrderTimeline[]>([])
  const [loading, setLoading] = useState(false)
  const [technical, setTechnical] = useState(false)

  const search = async () => {
    const q = email.trim()
    if (!q) {
      toast.error("Ingresa un correo electrónico.")
      return
    }
    setLoading(true)
    try {
      const r = await fetch(
        `/admin/support/timeline?email=${encodeURIComponent(q)}`,
        { credentials: "include" }
      )
      const json = await r.json()
      if (!r.ok) throw new Error(json.message ?? "Error")
      setQuery(json.email ?? q)
      setOrders(json.orders ?? [])
      if (!json.orders?.length) toast.info("No se encontraron órdenes para este correo.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGate permission="support">
      <Container className="divide-y p-0">
        <div className="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Heading level="h1">Soporte — Logs</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Busca por correo para ver transacciones, pagos, emisión y notificaciones.
            </Text>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={technical}
              onChange={(e) => setTechnical(e.target.checked)}
            />
            Vista técnica (request/response)
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-2 px-6 py-4">
          <div className="min-w-[240px] flex-1">
            <Text size="xsmall" className="text-ui-fg-subtle mb-1">Correo del cliente</Text>
            <Input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <Button onClick={search} isLoading={loading}>
            <MagnifyingGlass />
            Buscar
          </Button>
        </div>

        {query && (
          <div className="px-6 py-3">
            <Text size="small" className="text-ui-fg-subtle">
              {orders.length} orden(es) para <strong>{query}</strong>
            </Text>
          </div>
        )}

        <div className="space-y-2 px-6 pb-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} technical={technical} />
          ))}
        </div>
      </Container>
    </RoleGate>
  )
}

export const config = defineRouteConfig({
  label: "Soporte",
  icon: MagnifyingGlass,
})

export default SoportePage
