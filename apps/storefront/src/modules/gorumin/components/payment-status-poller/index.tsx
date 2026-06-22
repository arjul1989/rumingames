"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type PaymentStatus = "pending" | "approved" | "rejected" | "refunded"

// Polls the normalized payment status after a pending Mercado Pago checkout
// (US-3.4 / RUM-26). When the payment resolves it forwards the buyer to the
// matching result screen (US-7.6 / RUM-42).
export default function PaymentStatusPoller({
  orderId,
  countryCode,
  intervalMs = 4000,
  maxAttempts = 45,
}: {
  orderId: string
  countryCode: string
  intervalMs?: number
  maxAttempts?: number
}) {
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus>("pending")
  const [exhausted, setExhausted] = useState(false)
  const attempts = useRef(0)

  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/payment-status`, {
          credentials: "include",
          cache: "no-store",
        })
        if (res.ok) {
          const data = (await res.json()) as { status?: PaymentStatus }
          if (!active) return
          if (data.status && data.status !== "pending") {
            setStatus(data.status)
            if (data.status === "approved") {
              router.replace(
                `/${countryCode}/checkout/success?order=${orderId}`
              )
            } else {
              router.replace(
                `/${countryCode}/checkout/failure?order=${orderId}`
              )
            }
            return
          }
        }
      } catch {
        /* transient — keep polling */
      }

      attempts.current += 1
      if (attempts.current >= maxAttempts) {
        if (active) setExhausted(true)
        return
      }
      timer = setTimeout(poll, intervalMs)
    }

    timer = setTimeout(poll, intervalMs)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [orderId, countryCode, intervalMs, maxAttempts, router])

  if (exhausted) {
    return (
      <p className="text-sm text-on-surface-variant/70">
        El pago sigue procesándose. Te enviaremos un correo cuando se confirme;
        también puedes revisar el estado en{" "}
        <span className="text-secondary">Mis pedidos</span>.
      </p>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3 text-on-surface-variant/80">
      <span className="h-3 w-3 animate-ping rounded-full bg-secondary" />
      <span className="font-mono text-label-caps tracking-widest">
        {status === "pending"
          ? "VERIFICANDO TU PAGO…"
          : "ACTUALIZANDO ESTADO…"}
      </span>
    </div>
  )
}
