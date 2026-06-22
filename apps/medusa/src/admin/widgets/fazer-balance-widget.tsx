import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

type BalanceState = {
  configured: boolean
  balance_usd?: number
  currency?: string
  threshold?: number
  low?: boolean
  message?: string
}

const FazerBalanceWidget = () => {
  const [state, setState] = useState<BalanceState | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/admin/fazer/balance", { credentials: "include" })
      setState(await res.json())
    } catch (e) {
      setState({ configured: true, message: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Balance Fazer Cards</Heading>
        <Button size="small" variant="secondary" onClick={load} isLoading={loading}>
          Actualizar
        </Button>
      </div>
      <div className="px-6 py-4">
        {!state ? (
          <Text size="small" className="text-ui-fg-subtle">
            Cargando…
          </Text>
        ) : state.configured && state.balance_usd != null ? (
          <div className="flex items-center gap-x-3">
            <Text size="large" weight="plus">
              ${state.balance_usd.toFixed(2)} {state.currency ?? "USD"}
            </Text>
            {state.low ? (
              <Badge color="red" size="small">
                Saldo bajo (&lt; ${state.threshold})
              </Badge>
            ) : (
              <Badge color="green" size="small">
                OK
              </Badge>
            )}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            {state.message ?? "Balance no disponible."}
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default FazerBalanceWidget
