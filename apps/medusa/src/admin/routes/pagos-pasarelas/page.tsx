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
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import RoleGate from "../../components/role-gate"

type GatewayAvailability = {
  configured: boolean
  mock: boolean
}

type CountryGateway = {
  country_code: string
  active_gateway: "mercadopago" | "wompi"
  available_gateways: Record<
    "mercadopago" | "wompi",
    GatewayAvailability
  >
}

const GATEWAY_LABELS: Record<"mercadopago" | "wompi", string> = {
  mercadopago: "Mercado Pago",
  wompi: "Wompi",
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
  const [saving, setSaving] = useState<string | null>(null)

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

  return (
    <RoleGate permission="supplier">
      <Container className="p-6">
        <div className="mb-8 flex flex-col gap-2">
          <Heading level="h1">Pagos — Pasarelas por país</Heading>
          <Text className="text-ui-fg-subtle">
            Selecciona qué procesador de pagos usa cada país. El checkout del
            storefront carga la pasarela activa (Mercado Pago o Wompi).
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
                      {(["mercadopago", "wompi"] as const).map((gateway) => {
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

                <div className="flex flex-wrap gap-2">
                  {(["mercadopago", "wompi"] as const).map((gateway) => {
                    const availability = country.available_gateways[gateway]
                    return (
                      <Badge
                        key={gateway}
                        color={availability.configured || availability.mock ? "green" : "grey"}
                        size="small"
                      >
                        {GATEWAY_LABELS[gateway]}: {availabilityLabel(availability)}
                      </Badge>
                    )
                  })}
                </div>

                <Button
                  onClick={() => save(country.country_code)}
                  isLoading={saving === country.country_code}
                  disabled={!canSave}
                >
                  Guardar {COUNTRY_LABELS[country.country_code] ?? country.country_code}
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
