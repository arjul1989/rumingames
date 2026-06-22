import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Select, Label, Badge, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type ProductDetail = { id: string; metadata?: Record<string, unknown> | null }

const PLATFORMS = [
  ["steam", "Steam"],
  ["playstation", "PlayStation"],
  ["nintendo", "Nintendo"],
  ["xbox", "Xbox"],
  ["riot", "Riot Games"],
  ["free_fire", "Free Fire"],
] as const

const PRODUCT_TYPES = [
  ["gift_card", "Gift Card"],
  ["game_topup", "Recarga de juego"],
  ["subscription", "Suscripción"],
] as const

const DELIVERY_TYPES = [
  ["digital_code", "Código digital"],
  ["topup_id", "Recarga por ID de jugador"],
] as const

type Meta = {
  platform?: string
  product_type?: string
  delivery_type?: string
  region?: string
}

// Gorumin attributes editor injected into the native product page (US-1.2 /
// product admin §2.2). Persists to product.metadata.
const ProductGoruminMetadata = ({ data }: { data: ProductDetail }) => {
  const initial = (data.metadata ?? {}) as Meta
  const [meta, setMeta] = useState<Meta>(initial)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMeta((data.metadata ?? {}) as Meta)
  }, [data.id])

  const dirty = JSON.stringify(meta) !== JSON.stringify(initial)

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { ...(data.metadata ?? {}), ...meta, region: meta.region || "co" },
        }),
      })
      if (!r.ok) throw new Error((await r.json()).message ?? "Error")
      toast.success("Atributos Gorumin guardados.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const field = (
    label: string,
    key: keyof Meta,
    options: readonly (readonly [string, string])[]
  ) => (
    <div className="flex flex-col gap-y-1">
      <Label size="small">{label}</Label>
      <Select
        value={meta[key] ?? ""}
        onValueChange={(v) => setMeta((m) => ({ ...m, [key]: v }))}
      >
        <Select.Trigger>
          <Select.Value placeholder="Selecciona" />
        </Select.Trigger>
        <Select.Content>
          {options.map(([value, text]) => (
            <Select.Item key={value} value={value}>
              {text}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Heading level="h2">Atributos Gorumin</Heading>
          <Badge size="2xsmall" color="purple">
            CO
          </Badge>
        </div>
        <Button size="small" onClick={save} isLoading={saving} disabled={!dirty}>
          Guardar
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-3">
        {field("Plataforma", "platform", PLATFORMS)}
        {field("Tipo de producto", "product_type", PRODUCT_TYPES)}
        {field("Tipo de entrega", "delivery_type", DELIVERY_TYPES)}
      </div>
      <div className="px-6 py-3">
        <Text size="small" className="text-ui-fg-subtle">
          La recarga por ID de jugador solicita el ID en la tienda; el código
          digital se entrega por correo.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductGoruminMetadata
