import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text, toast } from "@medusajs/ui"
import { useState } from "react"

type OrderDetail = { id: string; payment_status?: string }

// Adds a "Reembolsar (MP)" action to the order details page (US-3.5 / RUM-27).
const OrderRefundWidget = ({ data }: { data: OrderDetail }) => {
  const [loading, setLoading] = useState(false)

  const refund = async () => {
    if (!window.confirm("¿Reembolsar el pago de esta orden vía Mercado Pago?")) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/admin/orders/${data.id}/refund-mp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.message ?? "Error desconocido")
      }
      toast.success("Reembolso iniciado en Mercado Pago.")
    } catch (e) {
      toast.error(`No se pudo reembolsar: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Mercado Pago</Heading>
        <Button size="small" variant="danger" onClick={refund} isLoading={loading}>
          Reembolsar (MP)
        </Button>
      </div>
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          Devuelve el pago al cliente vía Mercado Pago y marca las entregas
          digitales de la orden como reembolsadas.
        </Text>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderRefundWidget
