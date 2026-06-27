"use client"

import { initiatePaymentSession, payWithEpayco } from "@lib/data/cart"
import {
  createEpaycoCardCharge,
  fetchEpaycoTransaction,
  getEpaycoSettings,
} from "@lib/epayco-settings"
import {
  pollEpaycoTransaction,
  runEpaycoThreeDsValidation,
} from "@lib/epayco-three-ds"
import { checkoutLabels } from "@lib/i18n/es-co"
import { Button, Input, Label } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import Script from "next/script"
import { useCallback, useEffect, useMemo, useState } from "react"
import ErrorMessage from "../error-message"
import {
  EpaycoThreeDsBadge,
  EpaycoThreeDsContainer,
} from "../epayco-three-ds"

const EPAYCO_PROVIDER_ID = "pp_epayco_epayco"
const EPAYCO_3DS_SCRIPT =
  "https://multimedia.epayco.co/general/3DS/validateThreeds.min.js"

type EpaycoCardPaymentProps = {
  cart: HttpTypes.StoreCart
  countryCode: string
  "data-testid"?: string
}

const EpaycoCardPayment = ({
  cart,
  countryCode,
  "data-testid": dataTestId,
}: EpaycoCardPaymentProps) => {
  const [scriptReady, setScriptReady] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [validating3ds, setValidating3ds] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testMode, setTestMode] = useState(true)

  const [cardNumber, setCardNumber] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [expMonth, setExpMonth] = useState("")
  const [expYear, setExpYear] = useState("")
  const [cvc, setCvc] = useState("")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending" && s.provider_id === EPAYCO_PROVIDER_ID
  )

  const amount = useMemo(() => {
    const fromSession = Number(session?.data?.amount)
    if (Number.isFinite(fromSession) && fromSession > 0) return fromSession
    const cartTotal = Number(cart.total ?? 0)
    return cartTotal > 0 ? cartTotal : 0
  }, [session?.data, cart.total])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const settings = await getEpaycoSettings()
        if (!cancelled) {
          setTestMode(settings.test_mode !== false)
        }

        if (session?.id) {
          setSessionId(session.id)
          setSessionReady(true)
          return
        }

        const resp = await initiatePaymentSession(cart, {
          provider_id: EPAYCO_PROVIDER_ID,
        })
        const created = resp.payment_collection?.payment_sessions?.find(
          (s) => s.provider_id === EPAYCO_PROVIDER_ID && s.status === "pending"
        )
        if (!cancelled) {
          setSessionId(created?.id ?? null)
          setSessionReady(Boolean(created?.id))
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No se pudo preparar el pago con ePayco."
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cart, session])

  const completeApproved = useCallback(
    async (refPayco: string, reference: string) => {
      const res = await payWithEpayco(countryCode, {
        ref_payco: refPayco,
        session_id: reference,
      })
      if (res?.error) {
        throw new Error(res.error)
      }
    },
    [countryCode]
  )

  const handlePay = useCallback(async () => {
    const reference = sessionId ?? session?.id
    if (!reference) {
      setError("No hay sesión de pago activa.")
      return
    }

    if (!scriptReady || !window.validate3ds) {
      setError("El módulo 3D Secure de ePayco no está disponible.")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const metadata = (cart.metadata ?? {}) as Record<string, unknown>
      const idType = (metadata.payer_identification_type as string | undefined) || "CC"
      const idNumber = metadata.payer_identification_number as string | undefined
      const [firstName, ...rest] = cardHolder.trim().split(/\s+/)
      const lastName = rest.join(" ") || firstName

      const chargeResult = await createEpaycoCardCharge({
        reference,
        amountPesos: amount,
        customerEmail: cart.email!,
        cardNumber,
        expMonth,
        expYear,
        cvc,
        docType: idType,
        docNumber: idNumber ?? "1234567890",
        firstName: firstName || "Cliente",
        lastName: lastName || "Gorumin",
        phone: cart.shipping_address?.phone ?? "3000000000",
        city: cart.shipping_address?.city ?? "Bogota",
        address: cart.shipping_address?.address_1 ?? "N/A",
        countryCode,
        redirectUrl: `${window.location.origin}/${countryCode}/checkout/pending`,
      })

      const refPayco = chargeResult.ref_payco
      if (!refPayco) {
        throw new Error("ePayco no devolvió una referencia de transacción.")
      }

      if (chargeResult.transaction?.estado === "Aceptada") {
        await completeApproved(refPayco, reference)
        return
      }

      if (
        chargeResult.transaction?.estado === "Rechazada" ||
        chargeResult.transaction?.estado === "Fallida"
      ) {
        throw new Error("El pago fue rechazado.")
      }

      if (chargeResult.three_ds_required) {
        setValidating3ds(true)
        const threeDs = await runEpaycoThreeDsValidation(chargeResult, testMode)
        setValidating3ds(false)

        if (!threeDs.success) {
          throw new Error(threeDs.message ?? "La autenticación 3D Secure falló.")
        }
      }

      const poll = await pollEpaycoTransaction(refPayco, fetchEpaycoTransaction)
      if (!poll.approved) {
        throw new Error(poll.message ?? "El pago no fue aprobado.")
      }

      await completeApproved(refPayco, reference)
    } catch (e) {
      if (isRedirectError(e)) throw e
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago.")
    } finally {
      setSubmitting(false)
      setValidating3ds(false)
    }
  }, [
    amount,
    cardHolder,
    cardNumber,
    cart,
    completeApproved,
    countryCode,
    cvc,
    expMonth,
    expYear,
    scriptReady,
    session?.id,
    sessionId,
    testMode,
  ])

  if (amount <= 0 || !cart.email) {
    return (
      <p className="text-sm text-error">
        Completa el email y el total del carrito antes de pagar.
      </p>
    )
  }

  return (
    <div data-testid={dataTestId} className="flex flex-col gap-4">
      <Script
        src={EPAYCO_3DS_SCRIPT}
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="epayco-card-number">Número de tarjeta</Label>
          <Input
            id="epayco-card-number"
            inputMode="numeric"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4575 6231 8229 0326"
          />
        </div>
        <div>
          <Label htmlFor="epayco-card-holder">Titular</Label>
          <Input
            id="epayco-card-holder"
            autoComplete="cc-name"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="Como aparece en la tarjeta"
          />
        </div>
        <div>
          <Label htmlFor="epayco-exp-month">Mes</Label>
          <Input
            id="epayco-exp-month"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            value={expMonth}
            onChange={(e) => setExpMonth(e.target.value)}
            placeholder="MM"
          />
        </div>
        <div>
          <Label htmlFor="epayco-exp-year">Año</Label>
          <Input
            id="epayco-exp-year"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            value={expYear}
            onChange={(e) => setExpYear(e.target.value)}
            placeholder="AA"
          />
        </div>
        <div>
          <Label htmlFor="epayco-cvc">CVC</Label>
          <Input
            id="epayco-cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            placeholder="123"
          />
        </div>
      </div>

      {(validating3ds || submitting) && <EpaycoThreeDsBadge />}
      {validating3ds && <EpaycoThreeDsContainer />}

      <Button
        size="large"
        className="checkout-cta w-full"
        onClick={handlePay}
        isLoading={submitting || validating3ds}
        disabled={!scriptReady || !sessionReady}
      >
        {checkoutLabels.placeOrder} con tarjeta (ePayco 3DS)
      </Button>

      <ErrorMessage error={error} data-testid="epayco-card-payment-error" />
    </div>
  )
}

export default EpaycoCardPayment
