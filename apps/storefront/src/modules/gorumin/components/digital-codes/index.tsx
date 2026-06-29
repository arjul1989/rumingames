"use client"

import { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"
import { fundingLabels } from "@lib/i18n/es-co"
import { isFundingUxEnabled } from "@lib/funding-settings"

type CodeStatus = "pending" | "processing" | "delivered" | "failed" | "refunded"

type DeliveredCode = {
  id?: string
  line_item_id: string | null
  status: CodeStatus
  code: string | null
}

const STATUS = {
  pending: { label: "Preparándose", color: "text-on-surface-variant/70" },
  processing: {
    label: isFundingUxEnabled() ? "Generando código" : "Procesando",
    color: "text-secondary",
  },
  delivered: { label: "Entregado", color: "text-secondary" },
  failed: { label: "Fallido", color: "text-error" },
  refunded: { label: "Reembolsado", color: "text-tertiary" },
} as const

// Reveal digital codes for a paid order (US-7.7 / RUM-19). Calls the BFF, which
// proxies the authenticated Medusa store endpoint that only returns plaintext
// codes for delivered line items.
export default function DigitalCodes({ order }: { order: HttpTypes.StoreOrder }) {
  const [codes, setCodes] = useState<DeliveredCode[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/orders/${order.id}/digital-codes`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          const msg =
            (body as { message?: string }).message ||
            "No se pudieron cargar los códigos."
          throw new Error(msg)
        }
        return r.json()
      })
      .then((data) => {
        if (active) setCodes(data.codes ?? [])
      })
      .catch((e) => active && setError((e as Error).message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [order.id])

  const titleFor = (lineItemId: string | null) =>
    order.items?.find((i) => i.id === lineItemId)?.title ?? "Producto digital"

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      /* noop */
    }
  }

  if (loading) {
    return (
      <p className="font-mono text-label-caps tracking-widest text-on-surface-variant/50">
        CARGANDO CÓDIGOS…
      </p>
    )
  }

  if (error) {
    return <p className="text-sm text-error">{error}</p>
  }

  if (!codes || codes.length === 0) {
    return null
  }

  return (
    <div className="hyper-glass rounded-2xl p-6">
      <h2 className="font-mono mb-4 text-label-caps tracking-widest text-on-surface-variant/60">
        TUS CÓDIGOS
      </h2>
      <div className="flex flex-col gap-3">
        {codes.map((c, idx) => {
          const meta = STATUS[c.status]
          const key = c.id ?? `${c.line_item_id ?? "line"}-${idx}`
          const isRevealed = revealed[key]
          return (
            <div
              key={key}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-surface-container/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-headline font-bold text-on-surface">
                  {titleFor(c.line_item_id)}
                </span>
                <span className={`font-mono text-[11px] tracking-widest ${meta.color}`}>
                  {meta.label.toUpperCase()}
                </span>
              </div>

              {c.status === "delivered" && c.code ? (
                <div className="flex flex-wrap items-center gap-3">
                  <code className="rounded-lg bg-surface-container-lowest px-4 py-2 font-mono text-on-surface tracking-wider">
                    {isRevealed ? c.code : "•".repeat(Math.min(c.code.length, 16))}
                  </code>
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => ({ ...r, [key]: !r[key] }))}
                    className="font-mono text-[11px] tracking-widest text-secondary hover:underline"
                  >
                    {isRevealed ? "OCULTAR" : "REVELAR"}
                  </button>
                  {isRevealed && (
                    <button
                      type="button"
                      onClick={() => copy(c.code!)}
                      className="font-mono text-[11px] tracking-widest text-on-surface-variant/70 hover:text-on-surface"
                    >
                      {copied === c.code ? "COPIADO" : "COPIAR"}
                    </button>
                  )}
                </div>
              ) : c.status === "failed" ? (
                <p className="text-sm text-on-surface-variant/70">
                  Hubo un problema con la entrega. Nuestro equipo lo está
                  revisando; escríbenos si necesitas ayuda.
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant/70">
                  {isFundingUxEnabled()
                    ? fundingLabels.generatingCode
                    : "Tu código se está preparando. Te avisaremos en cuanto esté listo."}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
