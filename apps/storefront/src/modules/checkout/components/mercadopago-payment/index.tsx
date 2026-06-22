"use client"

import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react"
import { payWithMercadoPago } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useMemo, useState } from "react"
import ErrorMessage from "../error-message"

type MercadoPagoPaymentProps = {
  cart: HttpTypes.StoreCart
  countryCode: string
  "data-testid"?: string
}

let mpInitialized = false

// Mercado Pago Checkout Brick for card payments (US-3.2 / RUM-24).
//
// The active MP payment session carries the public key + amount handed over by
// the backend `initiatePayment`. The Brick tokenizes the card client-side and
// `payWithMercadoPago` injects that token into the session before completing
// the cart, so the card data never touches our servers.
const MercadoPagoPayment: React.FC<MercadoPagoPaymentProps> = ({
  cart,
  countryCode,
  "data-testid": dataTestId,
}) => {
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  const sessionData = (session?.data ?? {}) as Record<string, unknown>
  const publicKey = sessionData.mp_public_key as string | undefined
  const amount = useMemo(() => {
    const fromSession = Number(sessionData.amount)
    if (Number.isFinite(fromSession) && fromSession > 0) return fromSession
    return Number(cart.total ?? 0)
  }, [sessionData.amount, cart.total])

  useEffect(() => {
    if (publicKey && !mpInitialized) {
      initMercadoPago(publicKey, { locale: "es-CO" })
      mpInitialized = true
    }
  }, [publicKey])

  if (!publicKey) {
    return (
      <p className="text-sm text-error">
        El pago con Mercado Pago no está disponible en este momento. Vuelve a
        intentarlo más tarde.
      </p>
    )
  }

  const onSubmit = async (formData: {
    token: string
    issuer_id?: string
    payment_method_id?: string
    installments?: number
    payer?: unknown
  }) => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await payWithMercadoPago(countryCode, {
        token: formData.token,
        issuer_id: formData.issuer_id,
        payment_method_id: formData.payment_method_id,
        installments: formData.installments ?? 1,
        payer: formData.payer,
        amount,
        description: `Gorumin — orden ${cart.id}`,
      })
      // A successful flow redirects server-side; reaching here means an error.
      if (res?.error) {
        setError(res.error)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div data-testid={dataTestId}>
      {!ready && (
        <p className="font-mono text-label-caps tracking-widest text-on-surface-variant/50 mb-4">
          CARGANDO PAGO SEGURO…
        </p>
      )}
      <div className={submitting ? "pointer-events-none opacity-60" : undefined}>
        <CardPayment
          initialization={{
            amount,
            payer: cart.email ? { email: cart.email } : undefined,
          }}
          locale="es-CO"
          customization={{
            visual: { style: { theme: "dark" } },
            paymentMethods: { maxInstallments: 36 },
          }}
          onReady={() => setReady(true)}
          onSubmit={onSubmit}
          onError={(e) =>
            setError(e?.message || "Revisa los datos de tu tarjeta.")
          }
        />
      </div>
      <ErrorMessage error={error} data-testid="mercadopago-payment-error" />
    </div>
  )
}

export default MercadoPagoPayment
