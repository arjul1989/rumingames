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
  Tabs,
  Switch,
} from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"
import RoleGate from "../../components/role-gate"
import WalletTopupPanel from "../../components/wallet-topup-panel"

type FazerOffer = {
  id: string
  fazer_sku_id: string
  fazer_category_id: string
  kind: "giftcard" | "topup"
  name: string
  face_value_label: string
  wholesale_price_usd: number
  retail_price_usd: number | null
  sale_price_usd: number | null
  sale_price_cop: number | null
  margin_pct: number
  commission_fixed_local: number | null
  stock: number | null
  enabled: boolean
  status: string
  image_url: string | null
  medusa_variant_id: string | null
}

type CountryTaxRule = { name: string; rate_pct: number }

type CountryPricing = {
  country_code: string
  fx_rate: number
  local_currency_code: string
  taxes: CountryTaxRule[]
}

type CatalogGroup = {
  platform: string
  platform_label: string
  region: string | null
  categories: Array<{
    category: {
      id: string
      fazer_category_id: string
      name: string
      kind: string
      enabled: boolean
      image_url: string | null
      offer_count: number
    }
    offers: FazerOffer[]
  }>
}

type Mapping = {
  id: string
  medusa_product_id: string
  medusa_variant_id: string | null
  product_title: string | null
  variant_title: string | null
  fazer_sku_id: string
  platform: string | null
  region: string | null
  face_value_label: string | null
  image_url: string | null
  last_synced_price_usd: number | null
  last_synced_price_cop: number | null
  sale_price_usd: number | null
  usd_cop_rate: number | null
  margin_pct: number
  enabled: boolean
  stock: number | null
  status: "active" | "inactive" | "out_of_stock"
  last_synced_at: string | null
}

type Settings = {
  usd_cop_rate: number
  default_margin_pct: number
  last_full_sync_at: string | null
}

type Balance = {
  configured: boolean
  balance_usd?: number
  low?: boolean
  message?: string
}

type SyncLog = {
  status: string
  products_synced: number
  prices_updated: number
  errors: number
  usd_cop_rate?: number
  finished_at: string | null
  message?: string
} | null

const fmtUsd = (n: number | null | undefined) =>
  n == null ? "—" : `US$ ${n.toFixed(2)}`
const fmtCop = (n: number | null | undefined) =>
  n == null ? "—" : `$ ${Math.round(n).toLocaleString("es-CO")}`
const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("es-CO") : "Nunca"

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  out_of_stock: "Sin stock",
}

const OfferThumb = ({ url, alt }: { url: string | null; alt: string }) =>
  url ? (
    <img src={url} alt={alt} className="h-10 w-10 rounded object-cover" />
  ) : (
    <div className="bg-ui-bg-subtle flex h-10 w-10 items-center justify-center rounded text-xs text-ui-fg-muted">
      —
    </div>
  )

const FazerPage = () => {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [lastSync, setLastSync] = useState<SyncLog>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<Partial<Settings>>({})
  const [groups, setGroups] = useState<CatalogGroup[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [syncing, setSyncing] = useState(false)
  const [marginDrafts, setMarginDrafts] = useState<Record<string, number>>({})
  const [retailDrafts, setRetailDrafts] = useState<Record<string, number>>({})
  const [countryPricing, setCountryPricing] = useState<CountryPricing | null>(null)
  const [taxDraft, setTaxDraft] = useState<CountryTaxRule>({ name: "IVA", rate_pct: 0 })
  const [platformFilter, setPlatformFilter] = useState("all")

  const load = async () => {
    const [b, s, cfg, cat, m, pricing] = await Promise.all([
      fetch("/admin/fazer/balance", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/fazer/sync-catalog", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/fazer/settings", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/fazer/catalog", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/supplier/mappings?limit=200", { credentials: "include" }).then((r) => r.json()),
      fetch("/admin/pricing/country?country=co", { credentials: "include" }).then((r) => r.json()),
    ])
    setBalance(b)
    setLastSync(s.last_sync ?? null)
    setSettings(cfg)
    setGroups(cat.groups ?? [])
    setMappings(m.mappings ?? [])
    setCountryPricing(pricing.config ?? null)
  }

  useEffect(() => {
    load()
  }, [])

  const platforms = useMemo(() => {
    const set = new Set(groups.map((g) => g.platform))
    return ["all", ...Array.from(set).sort()]
  }, [groups])

  const filteredGroups = useMemo(() => {
    if (platformFilter === "all") return groups
    return groups.filter((g) => g.platform === platformFilter)
  }, [groups, platformFilter])

  const sync = async () => {
    setSyncing(true)
    try {
      const r = await fetch("/admin/fazer/sync-catalog", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.message ?? "Error")
      if (json.status === "failed") {
        toast.error(json.message ?? "La sincronización falló.")
      } else {
        toast.success(json.message ?? `Sync ${json.status}`)
      }
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  const saveSettings = async () => {
    try {
      const r = await fetch("/admin/fazer/settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      })
      if (!r.ok) throw new Error((await r.json()).message ?? "Error")
      toast.success("Configuración guardada.")
      setSettingsDraft({})
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const updateOffer = async (
    id: string,
    payload: {
      margin_pct?: number
      retail_price_usd?: number | null
      commission_fixed_local?: number | null
      enabled?: boolean
    }
  ) => {
    try {
      const r = await fetch(`/admin/fazer/offers/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error((await r.json()).message ?? "Error")
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const updateMapping = async (
    id: string,
    payload: { margin_pct?: number; status?: string; enabled?: boolean }
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

  const saveCountryPricing = async () => {
    if (!countryPricing) return
    try {
      const r = await fetch("/admin/pricing/country", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_code: "co",
          fx_rate: countryPricing.fx_rate,
          taxes: countryPricing.taxes,
        }),
      })
      if (!r.ok) throw new Error((await r.json()).message ?? "Error")
      toast.success("Impuestos y tasa guardados.")
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const addTax = () => {
    if (!countryPricing || !taxDraft.name.trim() || taxDraft.rate_pct <= 0) return
    setCountryPricing({
      ...countryPricing,
      taxes: [...countryPricing.taxes, taxDraft],
    })
    setTaxDraft({ name: "IVA", rate_pct: 0 })
  }

  const removeTax = (index: number) => {
    if (!countryPricing) return
    setCountryPricing({
      ...countryPricing,
      taxes: countryPricing.taxes.filter((_, i) => i !== index),
    })
  }

  const rate = countryPricing?.fx_rate ?? settings?.usd_cop_rate ?? 4000

  return (
    <RoleGate permission="fazer">
      <Container className="divide-y p-0">
        <div className="flex flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level="h1">Proveedor Fazer Cards</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              Catálogo sincronizado, precios USD/COP, márgenes y mapeos a la tienda.
            </Text>
          </div>
          <Button onClick={sync} isLoading={syncing}>
            Sincronizar catálogo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-4 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <Text size="small" className="text-ui-fg-subtle">Balance</Text>
            {balance?.configured ? (
              <div className="mt-1 flex items-center gap-2">
                <Heading level="h2">{fmtUsd(balance.balance_usd)}</Heading>
                {balance.low && <Badge color="red" size="small">Saldo bajo</Badge>}
              </div>
            ) : (
              <Text className="mt-1 text-ui-fg-muted" size="small">
                {balance?.message ?? "No configurado"}
              </Text>
            )}
          </div>
          <div className="rounded-lg border p-4">
            <Text size="small" className="text-ui-fg-subtle">TRM USD → COP</Text>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="number"
                className="w-28"
                value={settingsDraft.usd_cop_rate ?? settings?.usd_cop_rate ?? ""}
                onChange={(e) =>
                  setSettingsDraft((d) => ({ ...d, usd_cop_rate: Number(e.target.value) }))
                }
              />
              {(settingsDraft.usd_cop_rate != null ||
                settingsDraft.default_margin_pct != null) && (
                <Button size="small" variant="secondary" onClick={saveSettings}>
                  Guardar
                </Button>
              )}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <Text size="small" className="text-ui-fg-subtle">Margen default %</Text>
            <Input
              type="number"
              className="mt-1 w-28"
              value={settingsDraft.default_margin_pct ?? settings?.default_margin_pct ?? ""}
              onChange={(e) =>
                setSettingsDraft((d) => ({
                  ...d,
                  default_margin_pct: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="rounded-lg border p-4">
            <Text size="small" className="text-ui-fg-subtle">Última sincronización</Text>
            {lastSync ? (
              <div className="mt-1">
                <Badge
                  color={
                    lastSync.status === "success"
                      ? "green"
                      : lastSync.status === "failed"
                        ? "red"
                        : "orange"
                  }
                  size="small"
                >
                  {lastSync.status}
                </Badge>
                <Text size="small" className="mt-1 block">
                  {lastSync.prices_updated} precios · TRM {lastSync.usd_cop_rate ?? rate}
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {fmtDate(lastSync.finished_at)}
                </Text>
              </div>
            ) : (
              <Text className="mt-1 text-ui-fg-muted" size="small">Sin sync aún</Text>
            )}
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="rounded-lg border p-4">
            <Heading level="h2" className="mb-3 text-base">
              Pricing Colombia (USD → COP)
            </Heading>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Impuesto
                </Text>
                <Input
                  className="w-28"
                  value={taxDraft.name}
                  onChange={(e) => setTaxDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  %
                </Text>
                <Input
                  type="number"
                  className="w-24"
                  value={taxDraft.rate_pct}
                  onChange={(e) =>
                    setTaxDraft((d) => ({ ...d, rate_pct: Number(e.target.value) }))
                  }
                />
              </div>
              <Button size="small" variant="secondary" onClick={addTax}>
                Agregar impuesto
              </Button>
              <Button size="small" onClick={saveCountryPricing}>
                Guardar país
              </Button>
            </div>
            {countryPricing?.taxes.length ? (
              <div className="flex flex-wrap gap-2">
                {countryPricing.taxes.map((tax, index) => (
                  <Badge key={`${tax.name}-${index}`} size="small">
                    {tax.name} {tax.rate_pct}%
                    <button
                      type="button"
                      className="ml-2"
                      onClick={() => removeTax(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <Text size="small" className="text-ui-fg-subtle">
                Sin impuestos configurados (no se muestran en checkout).
              </Text>
            )}
          </div>
        </div>

        <div className="px-6 pb-4">
          <WalletTopupPanel
            onBalanceRefresh={() => {
              fetch("/admin/fazer/balance", { credentials: "include" })
                .then((r) => r.json())
                .then(setBalance)
                .catch(() => {})
            }}
          />
        </div>

        <div className="px-6 py-4">
          <Tabs defaultValue="catalog">
            <Tabs.List>
              <Tabs.Trigger value="catalog">Catálogo por plataforma</Tabs.Trigger>
              <Tabs.Trigger value="mappings">Mapeos tienda ({mappings.length})</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="catalog" className="mt-4">
              <div className="mb-4 flex items-center gap-3">
                <Text size="small" className="text-ui-fg-subtle">Filtrar plataforma</Text>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <Select.Trigger className="w-48">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {platforms.map((p) => (
                      <Select.Item key={p} value={p}>
                        {p === "all" ? "Todas" : p}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              {filteredGroups.length === 0 && (
                <Text className="text-ui-fg-muted">
                  Sin catálogo sincronizado. Pulsa &quot;Sincronizar catálogo&quot;.
                </Text>
              )}

              <div className="flex flex-col gap-6">
                {filteredGroups.map((group) => (
                  <div key={`${group.platform}-${group.region}`} className="rounded-lg border">
                    <div className="border-b bg-ui-bg-subtle px-4 py-3">
                      <Heading level="h2" className="text-base">
                        {group.platform_label}
                        {group.region && (
                          <Badge className="ml-2" size="small" color="grey">
                            {group.region}
                          </Badge>
                        )}
                      </Heading>
                    </div>
                    {group.categories.map(({ category, offers }) => (
                      <div key={category.id} className="border-b last:border-b-0">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <OfferThumb url={category.image_url} alt={category.name} />
                          <div className="flex-1">
                            <Text weight="plus">{category.name}</Text>
                            <Text size="xsmall" className="text-ui-fg-subtle font-mono">
                              {category.fazer_category_id} · {category.kind} · {offers.length} ofertas
                            </Text>
                          </div>
                          <Switch
                            checked={category.enabled}
                            onCheckedChange={(checked) =>
                              fetch(`/admin/fazer/categories/${category.id}`, {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ enabled: checked }),
                              }).then(load)
                            }
                          />
                        </div>
                        {offers.length > 0 && (
                          <Table>
                            <Table.Header>
                              <Table.Row>
                                <Table.HeaderCell>Valor</Table.HeaderCell>
                                <Table.HeaderCell>Costo USD</Table.HeaderCell>
                                <Table.HeaderCell>Precio USD</Table.HeaderCell>
                                <Table.HeaderCell>Venta USD</Table.HeaderCell>
                                <Table.HeaderCell>Venta COP</Table.HeaderCell>
                                <Table.HeaderCell>Stock</Table.HeaderCell>
                                <Table.HeaderCell>Margen %</Table.HeaderCell>
                                <Table.HeaderCell>Activo</Table.HeaderCell>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {offers.map((o) => (
                                <Table.Row key={o.id}>
                                  <Table.Cell>
                                    <div className="flex items-center gap-2">
                                      <OfferThumb url={o.image_url} alt={o.name} />
                                      <div>
                                        <span>{o.face_value_label}</span>
                                        <div className="font-mono text-xs text-ui-fg-subtle">
                                          {o.fazer_sku_id}
                                        </div>
                                      </div>
                                    </div>
                                  </Table.Cell>
                                  <Table.Cell>{fmtUsd(o.wholesale_price_usd)}</Table.Cell>
                                  <Table.Cell>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        className="w-24"
                                        value={retailDrafts[o.id] ?? o.retail_price_usd ?? ""}
                                        placeholder={o.sale_price_usd?.toFixed(2) ?? ""}
                                        onChange={(e) =>
                                          setRetailDrafts((d) => ({
                                            ...d,
                                            [o.id]: Number(e.target.value),
                                          }))
                                        }
                                      />
                                      {retailDrafts[o.id] != null &&
                                        retailDrafts[o.id] !== (o.retail_price_usd ?? 0) && (
                                          <Button
                                            size="small"
                                            variant="secondary"
                                            onClick={() =>
                                              updateOffer(o.id, {
                                                retail_price_usd: retailDrafts[o.id],
                                              })
                                            }
                                          >
                                            OK
                                          </Button>
                                        )}
                                    </div>
                                  </Table.Cell>
                                  <Table.Cell>{fmtUsd(o.sale_price_usd)}</Table.Cell>
                                  <Table.Cell>{fmtCop(o.sale_price_cop)}</Table.Cell>
                                  <Table.Cell>{o.stock ?? "∞"}</Table.Cell>
                                  <Table.Cell>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        className="w-16"
                                        value={marginDrafts[o.id] ?? o.margin_pct}
                                        onChange={(e) =>
                                          setMarginDrafts((d) => ({
                                            ...d,
                                            [o.id]: Number(e.target.value),
                                          }))
                                        }
                                      />
                                      {marginDrafts[o.id] != null &&
                                        marginDrafts[o.id] !== o.margin_pct && (
                                          <Button
                                            size="small"
                                            variant="secondary"
                                            onClick={() =>
                                              updateOffer(o.id, {
                                                margin_pct: marginDrafts[o.id],
                                              })
                                            }
                                          >
                                            OK
                                          </Button>
                                        )}
                                    </div>
                                  </Table.Cell>
                                  <Table.Cell>
                                    <Switch
                                      checked={o.enabled}
                                      onCheckedChange={(checked) =>
                                        updateOffer(o.id, { enabled: checked })
                                      }
                                    />
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Tabs.Content>

            <Tabs.Content value="mappings" className="mt-4">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Producto</Table.HeaderCell>
                    <Table.HeaderCell>Plataforma</Table.HeaderCell>
                    <Table.HeaderCell>Valor original</Table.HeaderCell>
                    <Table.HeaderCell>Costo USD</Table.HeaderCell>
                    <Table.HeaderCell>Venta USD</Table.HeaderCell>
                    <Table.HeaderCell>Venta COP</Table.HeaderCell>
                    <Table.HeaderCell>Margen %</Table.HeaderCell>
                    <Table.HeaderCell>Estado</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {mappings.map((m) => (
                    <Table.Row key={m.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <OfferThumb url={m.image_url} alt={m.variant_title ?? ""} />
                          <div>
                            <span>{m.product_title}</span>
                            <div className="text-xs text-ui-fg-subtle">{m.variant_title}</div>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {m.platform}
                        {m.region && (
                          <Badge size="small" color="grey" className="ml-1">
                            {m.region}
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>{m.face_value_label ?? "—"}</Table.Cell>
                      <Table.Cell>{fmtUsd(m.last_synced_price_usd)}</Table.Cell>
                      <Table.Cell>{fmtUsd(m.sale_price_usd)}</Table.Cell>
                      <Table.Cell>{fmtCop(m.last_synced_price_cop)}</Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            className="w-16"
                            value={marginDrafts[m.id] ?? m.margin_pct}
                            onChange={(e) =>
                              setMarginDrafts((d) => ({
                                ...d,
                                [m.id]: Number(e.target.value),
                              }))
                            }
                          />
                          {marginDrafts[m.id] != null && marginDrafts[m.id] !== m.margin_pct && (
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={() =>
                                updateMapping(m.id, { margin_pct: marginDrafts[m.id] })
                              }
                            >
                              OK
                            </Button>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Select
                          value={m.status}
                          onValueChange={(v) => updateMapping(m.id, { status: v })}
                        >
                          <Select.Trigger className="w-28">
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {Object.entries(STATUS_LABEL).map(([k, label]) => (
                              <Select.Item key={k} value={k}>
                                {label}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Tabs.Content>
          </Tabs>
        </div>
      </Container>
    </RoleGate>
  )
}

export const config = defineRouteConfig({
  label: "Proveedor Fazer",
  icon: CurrencyDollar,
})

export default FazerPage
