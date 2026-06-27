import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCard } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Switch,
  Button,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import RoleGate from "../../components/role-gate"

type MpSettings = {
  enable_cards: boolean
  enable_pse: boolean
  enable_efecty: boolean
  enable_manual_test: boolean
  mercadopago_configured?: boolean
}

const PagosMercadoPagoPage = () => {
  const [settings, setSettings] = useState<MpSettings | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const res = await fetch("/admin/payments/mercadopago", { credentials: "include" })
    if (!res.ok) throw new Error("No se pudo cargar la configuración")
    setSettings(await res.json())
  }

  useEffect(() => {
    load().catch((e) => toast.error((e as Error).message))
  }, [])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/admin/payments/mercadopago", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("No se pudo guardar")
      setSettings(await res.json())
      toast.success("Métodos de pago actualizados.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key: keyof MpSettings) => {
    if (!settings || typeof settings[key] !== "boolean") return
    setSettings({ ...settings, [key]: !settings[key] })
  }

  return (
    <RoleGate permission="supplier">
      <Container className="p-6">
        <div className="mb-8 flex flex-col gap-2">
          <Heading level="h1">Pagos — Mercado Pago</Heading>
          <Text className="text-ui-fg-subtle">
            Activa o desactiva los métodos disponibles en el checkout de Colombia.
          </Text>
          {settings?.mercadopago_configured === false && (
            <Text className="text-ui-fg-error">
              MP_ACCESS_TOKEN no está configurado. Solo el pago manual de prueba puede
              usarse en local.
            </Text>
          )}
        </div>

        {settings ? (
          <div className="flex max-w-lg flex-col gap-6">
            <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Text weight="plus">Tarjetas crédito / débito</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Visa, Mastercard, Amex y otras vía Checkout Brick.
                </Text>
              </div>
              <Switch
                checked={settings.enable_cards}
                onCheckedChange={() => toggle("enable_cards")}
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Text weight="plus">PSE</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Débito bancario en línea (transferencia PSE).
                </Text>
              </div>
              <Switch
                checked={settings.enable_pse}
                onCheckedChange={() => toggle("enable_pse")}
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Text weight="plus">Efecty</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Pago en efectivo con cupón / referencia Efecty.
                </Text>
              </div>
              <Switch
                checked={settings.enable_efecty}
                onCheckedChange={() => toggle("enable_efecty")}
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <Text weight="plus">Pago manual (solo pruebas)</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Provider del sistema Medusa — ocúltalo en producción.
                </Text>
              </div>
              <Switch
                checked={settings.enable_manual_test}
                onCheckedChange={() => toggle("enable_manual_test")}
              />
            </label>

            <Button onClick={save} isLoading={saving}>
              Guardar cambios
            </Button>
          </div>
        ) : (
          <Text>Cargando…</Text>
        )}
      </Container>
    </RoleGate>
  )
}

export default PagosMercadoPagoPage

export const config = defineRouteConfig({
  label: "Pagos MP",
  icon: CreditCard,
})
