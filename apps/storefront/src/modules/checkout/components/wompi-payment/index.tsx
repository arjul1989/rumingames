"use client"

import { initiatePaymentSession, payWithWompi } from "@lib/data/cart"
import { fetchWompiCheckoutParams } from "@lib/wompi-settings"
import { checkoutLabels } from "@lib/i18n/es-co"
import { Button } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import Script from "next/script"
import { useCallback, useEffect, useMemo, useState } from "react"
import ErrorMessage from "../error-message"

const WOMPI_PROVIDER_ID = "pp_wompi_wompi"
const WOMPI_WIDGET_SRC = "https://checkout.wompi.co/widget.js"

type WidgetCheckoutConfig = {
  currency: string
  amountInCents: number
  reference: string
  publicKey: string
  signature: { integrity: string }
  redirectUrl?: string
  customerData?: Record<string, string>
}

type WidgetCheckoutInstance = {
  open: (
    callback: (result: {
      transaction: { id: string; status: string; reference: string }
    }) => void
  ) => void
}

declare global {
  interface Window {
    WidgetCheckout?: new (config: WidgetCheckoutConfig) => WidgetCheckoutInstance
  }
}

type WompiPaymentProps = {
  cart: HttpTypes.StoreCart
  countryCode: string
  "data-testid"?: string
}

const WompiPayment = ({
  cart,
  countryCode,
  "data-testid": dataTestId,
}: WompiPaymentProps) => {
  const [scriptReady, setScriptReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending" && s.provider_id === WOMPI_PROVIDER_ID
  )

  const amount = useMemo(() => {
    const fromSession = Number(session?.data?.amount)
    if (Number.isFinite(fromSession) && fromSession > 0) return fromSession
    const cartTotal = Number(cart.total ?? 0)
    return cartTotal > 0 ? cartTotal : 0
  }, [session?.data, cart.total])

  const [sessionId, setSessionId] = useState<string | null>(
    (session?.id as string | undefined) ?? null
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (session?.id) {
          if (!cancelled) {
            setSessionId(session.id)
            setSessionReady(true)
          }
          return
        }
        const resp = await initiatePaymentSession(cart, {
          provider_id: WOMPI_PROVIDER_ID,
        })
        const created = resp.payment_collection?.payment_sessions?.find(
          (s) => s.provider_id === WOMPI_PROVIDER_ID && s.status === "pending"
        )
        if (!cancelled) {
          setSessionId(created?.id ?? null)
          setSessionReady(Boolean(created?.id))
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No se pudo iniciar el pago con Wompi."
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cart, session])

  const handlePay = useCallback(async () => {
    if (!window.WidgetCheckout) {
      setError("El widget de Wompi no está disponible.")
      return
    }

    const reference = sessionId ?? session?.id ?? cart.id
    if (!reference) {
      setError("No hay sesión de pago activa.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const metadata = (cart.metadata ?? {}) as Record<string, unknown>
      const idType = (metadata.payer_identification_type as string | undefined) || "CC"
      const idNumber = metadata.payer_identification_number as string | undefined

      const params = await fetchWompiCheckoutParams({
        reference,
        amount,
        customer_email: cart.email ?? undefined,
        customer_data: {
          email: cart.email ?? "",
          "full-name": [
            cart.shipping_address?.first_name,
            cart.shipping_address?.last_name,
          ]
            .filter(Boolean)
            .join(" "),
          "phone-number": cart.shipping_address?.phone ?? "",
          "legal-id": idNumber ?? "",
          "legal-id-type": idType,
        },
        redirect_url: `${window.location.origin}/${countryCode}/checkout/pending`,
      })

      const checkout = new window.WidgetCheckout({
        currency: params.currency,
        amountInCents: params.amount_in_cents,
        reference: params.reference,
        publicKey: params.public_key,
        signature: { integrity: params.signature_integrity },
        redirectUrl: params.redirect_url,
        customerData: params.customer_data,
      })

      checkout.open(async (result) => {
        try {
          const tx = result.transaction
          if (!tx?.id) {
            throw new Error("Wompi no devolvió un ID de transacción.")
          }
          const res = await payWithWompi(countryCode, {
            transaction_id: tx.id,
            session_id: reference,
          })
          if (res?.error) {
            throw new Error(res.error)
          }
        } catch (e) {
          if (isRedirectError(e)) throw e
          setError(e instanceof Error ? e.message : "No se pudo completar el pago.")
        } finally {
          setSubmitting(false)
        }
      })
    } catch (e) {
      if (isRedirectError(e)) throw e
      setError(e instanceof Error ? e.message : "No se pudo abrir Wompi.")
      setSubmitting(false)
    }
  }, [amount, cart, countryCode, session?.id, sessionId])

  if (amount <= 0) {
    return (
      <p className="text-sm text-error">
        El total del carrito es inválido. Actualiza el carrito e intenta de nuevo.
      </p>
    )
  }

  if (!cart.email) {
    return (
      <p className="text-sm text-error">
        Falta el correo del checkout. Vuelve al paso de envío y confirma tu email.
      </p>
    )
  }

  return (
    <div data-testid={dataTestId}>
      <Script
        src={WOMPI_WIDGET_SRC}
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />
      <Button
        size="large"
        className="checkout-cta w-full"
        onClick={handlePay}
        isLoading={submitting}
        disabled={!scriptReady || !sessionReady || submitting}
      >
        {checkoutLabels.placeOrder} con Wompi
      </Button>
      <ErrorMessage error={error} data-testid="wompi-payment-error" />
    </div>
  )
}

export default WompiPayment
