import { Badge, Button, Input, Select, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Topup = {
  id: string
  amount_usd: number
  method: string
  status: string
  fazer_payment_id: string | null
  fazer_pay_to: string | null
  fazer_pay_url: string | null
  binance_transfer_id: string | null
  binance_tx_id: string | null
  error_message: string | null
  confirmed_at: string | null
}

type PaymentMethod = { code: string; label: string }

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  payment_created: "Pago Fazer creado",
  binance_sent: "Binance enviado",
  awaiting_confirmation: "Esperando confirmación",
  completed: "Completado",
  failed: "Fallido",
}

type Props = {
  onBalanceRefresh?: () => void
}

export default function WalletTopupPanel({ onBalanceRefresh }: Props) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("binancepay")
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [active, setActive] = useState<Topup | null>(null)
  const [instructions, setInstructions] = useState<{
    network?: string
    pay_to?: string | null
    pay_url?: string | null
  } | null>(null)
  const [txId, setTxId] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    fetch("/admin/fazer/payment-methods", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        const list = (j.methods ?? []) as PaymentMethod[]
        setMethods(list)
        if (list.length && !list.find((m) => m.code === method)) {
          setMethod(list[0].code)
        }
      })
      .catch(() => {})
  }, [])

  const createTopup = async () => {
    const n = Number(amount)
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Ingresa un monto USD válido.")
      return
    }
    setLoading(true)
    try {
      const r = await fetch("/admin/fazer/wallet-topup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: n, method }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.message ?? "Error")
      setActive(json.topup)
      setInstructions(json.instructions ?? null)
      setTxId("")
      toast.success("Orden de recarga creada en Fazer.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const sendBinance = async () => {
    if (!active) return
    setSending(true)
    try {
      const r = await fetch(
        `/admin/fazer/wallet-topup/${active.id}?action=send-binance`,
        { method: "POST", credentials: "include" }
      )
      const json = await r.json()
      if (!r.ok) throw new Error(json.message ?? "Error")
      setActive(json.topup)
      toast.success("Transferencia Binance iniciada.")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const confirmTopup = async () => {
    if (!active) return
    setConfirming(true)
    try {
      const r = await fetch(
        `/admin/fazer/wallet-topup/${active.id}?action=confirm`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ binance_tx_id: txId }),
        }
      )
      const json = await r.json()
      if (!r.ok) throw new Error(json.message ?? "Error")
      setActive(json.topup)
      toast.success("Saldo acreditado en Fazer.")
      onBalanceRefresh?.()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="col-span-full rounded-lg border border-dashed border-ui-border-strong p-4">
      <Text size="small" weight="plus">Recargar saldo Fazer vía Binance</Text>
      <Text size="xsmall" className="text-ui-fg-subtle mt-0.5 mb-3">
        Crea un pago en Fazer, envía fondos con Binance y confirma con el ID de transacción.
      </Text>

      {!active ? (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Text size="xsmall" className="text-ui-fg-subtle mb-1">Monto USD</Text>
            <Input
              type="number"
              min="1"
              step="0.01"
              className="w-28"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
            />
          </div>
          {methods.length > 0 ? (
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle mb-1">Método</Text>
              <Select value={method} onValueChange={setMethod}>
                <Select.Trigger className="w-40">
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {methods.map((m) => (
                    <Select.Item key={m.code} value={m.code}>
                      {m.label || m.code}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          ) : (
            <Text size="xsmall" className="text-ui-fg-muted pb-2">Método: {method}</Text>
          )}
          <Button size="small" onClick={createTopup} isLoading={loading}>
            Crear orden de recarga
          </Button>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="small">{STATUS_LABEL[active.status] ?? active.status}</Badge>
            <span>${active.amount_usd.toFixed(2)} USD · {active.method}</span>
            {active.fazer_payment_id && (
              <span className="text-ui-fg-muted">Fazer {active.fazer_payment_id}</span>
            )}
          </div>

          {instructions && (
            <div className="rounded bg-ui-bg-subtle p-2 space-y-1">
              <div><strong>Red:</strong> {instructions.network ?? active.method}</div>
              <div><strong>Monto a enviar:</strong> ${active.amount_usd.toFixed(2)} USDT</div>
              {active.fazer_pay_to && (
                <div className="break-all"><strong>Dirección / pay_to:</strong> {active.fazer_pay_to}</div>
              )}
              {active.fazer_pay_url && (
                <div className="break-all"><strong>URL:</strong> {active.fazer_pay_url}</div>
              )}
            </div>
          )}

          {active.error_message && (
            <Text size="xsmall" className="text-ui-fg-error">{active.error_message}</Text>
          )}

          <div className="flex flex-wrap gap-2">
            {active.status === "payment_created" && (
              <Button size="small" onClick={sendBinance} isLoading={sending}>
                Enviar con Binance API
              </Button>
            )}
            {(active.status === "binance_sent" ||
              active.status === "awaiting_confirmation" ||
              active.status === "payment_created") &&
              active.status !== "completed" && (
                <>
                  <Input
                    className="w-56"
                    placeholder="ID transacción Binance"
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                  />
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={confirmTopup}
                    isLoading={confirming}
                  >
                    Confirmar en Fazer
                  </Button>
                </>
              )}
            {active.status === "completed" && (
              <Button size="small" variant="transparent" onClick={() => { setActive(null); setInstructions(null) }}>
                Nueva recarga
              </Button>
            )}
          </div>

          {active.binance_transfer_id && (
            <Text size="xsmall" className="text-ui-fg-muted">
              Binance transfer: {active.binance_transfer_id}
            </Text>
          )}
        </div>
      )}
    </div>
  )
}
