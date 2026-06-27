import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCard } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  toast,
  Select,
  Badge,
  Input,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import RoleGate from "../../components/role-gate"

type GatewayAvailability = {
  configured: boolean
  mock: boolean
}

type GatewayFee = {
  country_code: string
  gateway: "mercadopago" | "wompi" | "epayco"
  commission_pct: number
  commission_fixed_local: number
}

type CountryGateway = {
  country_code: string
  active_gateway: "mercadopago" | "wompi" | "epayco"
  available_gateways: Record<"mercadopago" | "wompi" | "epayco", GatewayAvailability>
  gateway_fees?: GatewayFee[]
}

const GATEWAY_LABELS: Record<"mercadopago" | "wompi" | "epayco", string> = {
  mercadopago: "Mercado Pago",
  wompi: "Wompi",
  epayco: "ePayco",
}

const COUNTRY_LABELS: Record<string, string> = {
  co: "Colombia",
}

function availabilityLabel(gateway: GatewayAvailability): string {
  if (gateway.configured) return "Configurado"
  if (gateway.mock) return "Mock (dev)"
  return "Sin credenciales"
}

const PagosPasarelasPage = () => {
  const [countries, setCountries] = useState<CountryGateway[]>([])
  const [draft, setDraft] = useState<Record<string, CountryGateway["active_gateway"]>>({})
  const [feeDrafts, setFeeDrafts] = useState<
    Record<string, { commission_pct: number; commission_fixed_local: number }>
  >({})
  const [saving, setSaving] = useState<string | null>(null)
  const [savingFee, setSavingFee] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch("/admin/payments/gateways", { credentials: "include" })
    if (!res.ok) throw new Error("No se pudo cargar la configuración")
    const data = (await res.json()) as { countries: CountryGateway[] }
    setCountries(data.countries)
    setDraft(
      Object.fromEntries(
        data.countries.map((c) => [c.country_code, c.active_gateway])
      )
    )
    const fees: Record<string, { commission_pct: number; commission_fixed_local: number }> =
      {}
    for (const country of data.countries) {
      for (const fee of country.gateway_fees ?? []) {
        fees[`${country.country_code}:${fee.gateway}`] = {
          commission_pct: fee.commission_pct,
          commission_fixed_local: fee.commission_fixed_local,
        }
      }
    }
    setFeeDrafts(fees)
  }

  useEffect(() => {
    load().catch((e) => toast.error((e as Error).message))
  }, [])

  const save = async (countryCode: string) => {
    const activeGateway = draft[countryCode]
    if (!activeGateway) return

    setSaving(countryCode)
    try {
      const res = await fetch("/admin/payments/gateways", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country_code: countryCode, active_gateway: activeGateway }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(err.message ?? "No se pudo guardar")
      }
      toast.success(
        `${COUNTRY_LABELS[countryCode] ?? countryCode.toUpperCase()}: pasarela actualizada.`
      )
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(null)
    }
  }

  const saveFee = async (
    countryCode: string,
    gateway: "mercadopago" | "wompi" | "epayco"
  ) => {
    const key = `${countryCode}:${gateway}`
    const fee = feeDrafts[key]
    if (!fee) return

    setSavingFee(key)
    try {
      const res = await fetch("/admin/pricing/gateway-fees", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_code: countryCode,
          gateway,
          commission_pct: fee.commission_pct,
          commission_fixed_local: fee.commission_fixed_local,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(err.message ?? "No se pudo guardar la comisión")
      }
      toast.success(`Comisión ${GATEWAY_LABELS[gateway]} actualizada.`)
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSavingFee(null)
    }
  }

  return (
    <RoleGate permission="supplier">
      <Container className="p-6">
        <div className="mb-8 flex flex-col gap-2">
          <Heading level="h1">Pagos — Pasarelas por país</Heading>
          <Text className="text-ui-fg-subtle">
            Selecciona la pasarela activa y configura la comisión por defecto que se muestra en
            checkout (porcentaje + valor fijo en moneda local).
          </Text>
        </div>

        <div className="flex max-w-2xl flex-col gap-6">
          {countries.map((country) => {
            const selected = draft[country.country_code] ?? country.active_gateway
            const selectedAvailability = country.available_gateways[selected]
            const canSave =
              selected !== country.active_gateway &&
              (selectedAvailability.configured || selectedAvailability.mock)

            return (
              <div
                key={country.country_code}
                className="flex flex-col gap-4 rounded-lg border p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Text weight="plus">
                      {COUNTRY_LABELS[country.country_code] ??
                        country.country_code.toUpperCase()}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      Código: {country.country_code}
                    </Text>
                  </div>
                  <Badge size="small">
                    Activa: {GATEWAY_LABELS[country.active_gateway]}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2">
                  <Text size="small" weight="plus">
                    Pasarela activa
                  </Text>
                  <Select
                    value={selected}
                    onValueChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        [country.country_code]: value as CountryGateway["active_gateway"],
                      }))
                    }
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {(["mercadopago", "wompi", "epayco"] as const).map((gateway) => {
                        const availability = country.available_gateways[gateway]
                        const disabled =
                          !availability.configured && !availability.mock
                        return (
                          <Select.Item
                            key={gateway}
                            value={gateway}
                            disabled={disabled}
                          >
                            {GATEWAY_LABELS[gateway]} —{" "}
                            {availabilityLabel(availability)}
                          </Select.Item>
                        )
                      })}
                    </Select.Content>
                  </Select>
                </div>

                <div className="flex flex-col gap-4 border-t pt-4">
                  <Text size="small" weight="plus">
                    Comisiones por pasarela
                  </Text>
                  {(["mercadopago", "wompi", "epayco"] as const).map((gateway) => {
                    const key = `${country.country_code}:${gateway}`
                    const fee = feeDrafts[key] ?? {
                      commission_pct: gateway === "epayco" ? 2.5 : gateway === "wompi" ? 3 : 0,
                      commission_fixed_local:
                        gateway === "epayco" ? 600 : gateway === "wompi" ? 800 : 0,
                    }

                    return (
                      <div
                        key={gateway}
                        className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]"
                      >
                        <div>
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            {GATEWAY_LABELS[gateway]} — %
                          </Text>
                          <Input
                            type="number"
                            value={fee.commission_pct}
                            onChange={(e) =>
                              setFeeDrafts((prev) => ({
                                ...prev,
                                [key]: {
                                  ...fee,
                                  commission_pct: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            Fijo (COP)
                          </Text>
                          <Input
                            type="number"
                            value={fee.commission_fixed_local}
                            onChange={(e) =>
                              setFeeDrafts((prev) => ({
                                ...prev,
                                [key]: {
                                  ...fee,
                                  commission_fixed_local: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => saveFee(country.country_code, gateway)}
                            isLoading={savingFee === key}
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Button
                  onClick={() => save(country.country_code)}
                  isLoading={saving === country.country_code}
                  disabled={!canSave}
                >
                  Guardar pasarela activa
                </Button>
              </div>
            )
          })}
        </div>
      </Container>
    </RoleGate>
  )
}

export default PagosPasarelasPage

export const config = defineRouteConfig({
  label: "Pasarelas",
  icon: CreditCard,
})
