import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text, Badge, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type SyncLog = {
  status: "success" | "partial" | "failed"
  products_synced: number
  prices_updated: number
  errors: number
  message?: string
  finished_at?: string
}

const STATUS_COLOR: Record<SyncLog["status"], "green" | "orange" | "red"> = {
  success: "green",
  partial: "orange",
  failed: "red",
}

const FazerSyncWidget = () => {
  const [last, setLast] = useState<SyncLog | null>(null)
  const [loading, setLoading] = useState(false)

  const loadLast = async () => {
    try {
      const res = await fetch("/admin/fazer/sync-catalog", {
        credentials: "include",
      })
      const data = await res.json()
      setLast(data.last_sync ?? null)
    } catch {
      // No-op: widget is best-effort.
    }
  }

  useEffect(() => {
    loadLast()
  }, [])

  const runSync = async () => {
    setLoading(true)
    try {
      const res = await fetch("/admin/fazer/sync-catalog", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: ["gift-cards", "top-ups"] }),
      })
      const data = (await res.json()) as SyncLog
      setLast(data)
      toast.success(`Sync ${data.status}: ${data.message ?? ""}`)
    } catch (e) {
      toast.error(`Error al sincronizar: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Catálogo Fazer Cards</Heading>
        <Button size="small" onClick={runSync} isLoading={loading}>
          Sincronizar catálogo
        </Button>
      </div>
      <div className="px-6 py-4">
        {last ? (
          <div className="flex flex-col gap-y-2">
            <div className="flex items-center gap-x-2">
              <Text size="small" className="text-ui-fg-subtle">
                Última sincronización:
              </Text>
              <Badge color={STATUS_COLOR[last.status]} size="small">
                {last.status}
              </Badge>
            </div>
            <Text size="small">
              {last.products_synced} mapeos · {last.prices_updated} precios ·{" "}
              {last.errors} errores
            </Text>
            {last.message && (
              <Text size="small" className="text-ui-fg-subtle">
                {last.message}
              </Text>
            )}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Aún no se ha ejecutado ninguna sincronización.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default FazerSyncWidget
