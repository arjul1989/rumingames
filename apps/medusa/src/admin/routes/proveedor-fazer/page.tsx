import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import {
  Container,
  Heading,
  Button,
  Table,
  Badge,
  Input,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import RoleGate from "../../components/role-gate"

type Mapping = {
  id: string
  medusa_product_id: string
  medusa_variant_id: string | null
  product_title: string | null
  variant_title: string | null
  fazer_sku_id: string
  last_synced_price_usd: number | null
  margin_pct: number
  status: "active" | "inactive" | "out_of_stock"
  last_synced_at: string | null
}

type Balance = {
  configured: boolean
  balance_usd?: number
  currency?: string
  threshold?: number
  low?: boolean
  message?: string
}

type SyncLog = {
  status: string
  products_synced: number
  prices_updated: number
  errors: number
  finished_at: string | null
} | null

const STATUS_COLOR = { active: "green", inactive: "grey", out_of_stock: "orange" } as const
const STATUS_LABEL = {
  active: "Activo",
  inactive: "Inactivo",
  out_of_stock: "Sin stock",
} as const

const FazerPage = () => {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [lastSync, setLastSync] = useState<SyncLog>(null)
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [syncing, setSyncing] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, number>>({})

  const load = async () => {
    const [b, s, m] = await Promise.all([
      fetch("/admin/fazer/balance", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/fazer/sync-catalog", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/supplier/mappings?limit=200", { credentials: "include" }).then((r) => r.json()),
    ])
    setBalance(b)
    setLastSync(s.last_sync ?? null)
    setMappings(m.mappings ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const sync = async () => {
    setSyncing(true)
    try {
      const r = await fetch("/admin/fazer/sync-catalog", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: ["gift-cards", "top-ups"] }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.message ?? "Error")
      toast.success(
        `Sync ${json.status}: ${json.products_synced} productos, ${json.prices_updated} precios.`
      )
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  const updateMapping = async (
    id: string,
    payload: { margin_pct?: number; status?: string }
  ) => {
    try {
      const r = await fetch(`/admin/supplier/mappings/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error((await r.json()).message ?? "Error")
      toast.success("Mapeo actualizado.")
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const fmtUsd = (n: number | null | undefined) =>
    n == null ? "—" : `US$ ${n.toFixed(2)}`
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleString("es-CO") : "Nunca"

  return (
    <RoleGate permission="fazer">
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading level="h1">Proveedor Fazer Cards</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Mapeo de SKUs, márgenes y sincronización de catálogo.
          </Text>
        </div>
        <Button onClick={sync} isLoading={syncing}>
          Sincronizar catálogo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <Text size="small" className="text-ui-fg-subtle">
            Balance Fazer Cards
          </Text>
          {balance?.configured ? (
            <div className="mt-1 flex items-center gap-2">
              <Heading level="h2">{fmtUsd(balance.balance_usd)}</Heading>
              {balance.low && (
                <Badge color="red" size="small">
                  Saldo bajo
                </Badge>
              )}
            </div>
          ) : (
            <Text className="mt-1 text-ui-fg-muted" size="small">
              {balance?.message ?? "No configurado (FAZER_API_KEY)."}
            </Text>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <Text size="small" className="text-ui-fg-subtle">
            Última sincronización
          </Text>
          {lastSync ? (
            <div className="mt-1 flex items-center gap-2">
              <Badge
                color={lastSync.status === "success" ? "green" : lastSync.status === "failed" ? "red" : "orange"}
                size="small"
              >
                {lastSync.status}
              </Badge>
              <Text size="small">
                {lastSync.prices_updated} precios · {fmtDate(lastSync.finished_at)}
              </Text>
            </div>
          ) : (
            <Text className="mt-1 text-ui-fg-muted" size="small">
              Sin sincronizaciones aún.
            </Text>
          )}
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Producto / Variante</Table.HeaderCell>
            <Table.HeaderCell>SKU Fazer</Table.HeaderCell>
            <Table.HeaderCell>Precio USD</Table.HeaderCell>
            <Table.HeaderCell>Margen %</Table.HeaderCell>
            <Table.HeaderCell>Estado</Table.HeaderCell>
            <Table.HeaderCell>Última sync</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {mappings.length === 0 && (
            <Table.Row>
              <Table.Cell className="text-ui-fg-muted">
                No hay mapeos. Sincroniza el catálogo para crearlos.
              </Table.Cell>
            </Table.Row>
          )}
          {mappings.map((m) => (
            <Table.Row key={m.id}>
              <Table.Cell>
                <div className="flex flex-col">
                  <span>{m.product_title ?? m.medusa_product_id}</span>
                  {m.variant_title && (
                    <span className="text-ui-fg-subtle text-xs">{m.variant_title}</span>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="font-mono text-xs">{m.fazer_sku_id}</span>
              </Table.Cell>
              <Table.Cell>{fmtUsd(m.last_synced_price_usd)}</Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-20"
                    value={drafts[m.id] ?? m.margin_pct}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [m.id]: Number(e.target.value) }))
                    }
                  />
                  {drafts[m.id] != null && drafts[m.id] !== m.margin_pct && (
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => updateMapping(m.id, { margin_pct: drafts[m.id] })}
                    >
                      Guardar
                    </Button>
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <Select
                  value={m.status}
                  onValueChange={(v) => updateMapping(m.id, { status: v })}
                >
                  <Select.Trigger className="w-32">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {(["active", "inactive", "out_of_stock"] as const).map((s) => (
                      <Select.Item key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Table.Cell>
              <Table.Cell>
                <span className="text-ui-fg-subtle text-xs">
                  {fmtDate(m.last_synced_at)}
                </span>
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
  label: "Proveedor Fazer",
  icon: CurrencyDollar,
})

export default FazerPage
