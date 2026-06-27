"use client"

import { Payment, initMercadoPago } from "@mercadopago/sdk-react"
import { payWithMercadoPago } from "@lib/data/cart"
import { buildMpBrickPayer } from "@lib/mp-brick-payer"
import {
  buildMpBrickPaymentMethods,
  mpMethodsEnabled,
  type MpPaymentSettings,
} from "@lib/mp-payment-settings.shared"
import { HttpTypes } from "@medusajs/types"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useEffect, useMemo, useState } from "react"
import ErrorMessage from "../error-message"

type MercadoPagoPaymentProps = {
  cart: HttpTypes.StoreCart
  countryCode: string
  mpSettings: MpPaymentSettings
  mpCustomerId?: string | null
  "data-testid"?: string
}

let mpInitPublicKey: string | null = null

function ensureMercadoPago(publicKey: string) {
  if (mpInitPublicKey === publicKey) return
  initMercadoPago(publicKey, { locale: "es-CO" })
  mpInitPublicKey = publicKey
}

// Mercado Pago Payment Brick — tarjetas, PSE y Efecty (Colombia).
const MercadoPagoPayment: React.FC<MercadoPagoPaymentProps> = ({
  cart,
  countryCode,
  mpSettings,
  mpCustomerId,
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
    const cartTotal = Number(cart.total ?? 0)
    return cartTotal > 0 ? cartTotal : 0
  }, [sessionData.amount, cart.total])

  const paymentMethods = useMemo(
    () => buildMpBrickPaymentMethods(mpSettings),
    [mpSettings]
  )

  const payer = useMemo(
    () => buildMpBrickPayer(cart, mpCustomerId),
    [cart, mpCustomerId]
  )

  // Remount when email or document changes so PSE fields pre-fill correctly.
  const brickKey = [
    cart.id,
    cart.email ?? "",
    payer?.identification?.type ?? "",
    payer?.identification?.number ?? "",
  ].join(":")

  useEffect(() => {
    if (publicKey) ensureMercadoPago(publicKey)
  }, [publicKey])

  if (!publicKey) {
    return (
      <p className="text-sm text-error">
        El pago con Mercado Pago no está disponible en este momento. Vuelve a
        intentarlo más tarde.
      </p>
    )
  }

  if (!mpMethodsEnabled(mpSettings)) {
    return (
      <p className="text-sm text-error">
        No hay métodos de Mercado Pago habilitados. Contacta al administrador de
        la tienda.
      </p>
    )
  }

  if (!payer?.email) {
    return (
      <p className="text-sm text-error">
        Falta el correo del checkout. Vuelve al paso de envío y confirma tu
        email antes de pagar.
      </p>
    )
  }

  if (!payer.identification?.number) {
    return (
      <p className="text-sm text-error">
        Falta el documento del comprador. Vuelve al paso de datos de contacto e
        ingresa tu tipo y número de documento.
      </p>
    )
  }

  if (amount <= 0) {
    return (
      <p className="text-sm text-error">
        El total del carrito es inválido. Actualiza el carrito e intenta de
        nuevo.
      </p>
    )
  }

  const onSubmit = async (param: { formData: Record<string, unknown> }) => {
    setSubmitting(true)
    setError(null)
    const fd = param.formData

    try {
      const res = await payWithMercadoPago(countryCode, {
        token: fd.token,
        issuer_id: fd.issuer_id,
        payment_method_id: fd.payment_method_id,
        installments: fd.installments ?? 1,
        payer: fd.payer,
        transaction_details: fd.transaction_details,
        transaction_amount: amount,
        description: `rumin — orden ${cart.id}`,
      })
      if (res?.error) {
        throw new Error(res.error)
      }
    } catch (e) {
      if (isRedirectError(e)) throw e
      const message =
        e instanceof Error ? e.message : "No se pudo procesar el pago."
      setError(message)
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div data-testid={dataTestId} className="min-h-[420px]">
      {!ready && (
        <p className="font-mono text-label-caps tracking-widest text-on-surface-variant/50 mb-4">
          CARGANDO PAGO SEGURO…
        </p>
      )}
      <div className={submitting ? "pointer-events-none opacity-60" : undefined}>
        <Payment
          key={brickKey}
          initialization={{
            amount,
            payer,
          }}
          locale="es-CO"
          customization={{
            paymentMethods,
          }}
          onReady={() => setReady(true)}
          onSubmit={onSubmit}
          onError={(e) =>
            setError(e?.message || "Revisa los datos de pago e intenta de nuevo.")
          }
        />
      </div>
      <ErrorMessage error={error} data-testid="mercadopago-payment-error" />
    </div>
  )
}

export default MercadoPagoPayment
