"use client"

import { initiatePaymentSession, payWithWompi } from "@lib/data/cart"
import { resolveCartChargeAmount } from "@lib/util/resolve-cart-charge-amount"
import { tokenizeWompiCard } from "@lib/wompi-card-token"
import { collectWompiBrowserInfo } from "@lib/wompi-browser-info"
import {
  createWompiThreeDsTransaction,
  fetchWompiAcceptance,
  fetchWompiTransaction,
  getWompiSettings,
} from "@lib/wompi-settings"
import type { WompiThreeDsAuth } from "@lib/wompi-types"
import { checkoutLabels } from "@lib/i18n/es-co"
import { Button, Input, Label } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useCallback, useEffect, useMemo, useState } from "react"
import ErrorMessage from "../error-message"
import {
  WompiThreeDsBadge,
  WompiThreeDsChallengeFrame,
} from "../wompi-three-ds"

const WOMPI_PROVIDER_ID = "pp_wompi_wompi"
const POLL_MS = 2500
const MAX_POLLS = 120

type WompiCardPaymentProps = {
  cart: HttpTypes.StoreCart
  countryCode: string
  "data-testid"?: string
}

const WompiCardPayment = ({
  cart,
  countryCode,
  "data-testid": dataTestId,
}: WompiCardPaymentProps) => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [termsUrl, setTermsUrl] = useState<string | null>(null)
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null)
  const [acceptanceToken, setAcceptanceToken] = useState<string | null>(null)
  const [personalAuthToken, setPersonalAuthToken] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null)
  const [threeDsAuth, setThreeDsAuth] = useState<WompiThreeDsAuth | null>(null)
  const [polling, setPolling] = useState(false)

  const [cardNumber, setCardNumber] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [expMonth, setExpMonth] = useState("")
  const [expYear, setExpYear] = useState("")
  const [cvc, setCvc] = useState("")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending" && s.provider_id === WOMPI_PROVIDER_ID
  )

  const amount = useMemo(() => resolveCartChargeAmount(cart), [cart])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [settings, acceptance] = await Promise.all([
          getWompiSettings(),
          fetchWompiAcceptance(),
        ])
        if (cancelled) return
        setPublicKey(settings.public_key)
        setApiBaseUrl(settings.api_base_url ?? "https://sandbox.wompi.co/v1")
        setTermsUrl(acceptance.acceptance.permalink)
        setPrivacyUrl(acceptance.personal_data_auth.permalink)
        setAcceptanceToken(acceptance.acceptance.acceptance_token)
        setPersonalAuthToken(acceptance.personal_data_auth.acceptance_token)

        if (session?.id) {
          setSessionId(session.id)
          setSessionReady(true)
          return
        }

        const resp = await initiatePaymentSession(cart, {
          provider_id: WOMPI_PROVIDER_ID,
        })
        const created = resp.payment_collection?.payment_sessions?.find(
          (s) => s.provider_id === WOMPI_PROVIDER_ID && s.status === "pending"
        )
        setSessionId(created?.id ?? null)
        setSessionReady(Boolean(created?.id))
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "No se pudo preparar el pago con Wompi."
          )
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cart, session])

  const completeApproved = useCallback(
    async (transactionId: string, reference: string) => {
      const res = await payWithWompi(countryCode, {
        transaction_id: transactionId,
        session_id: reference,
      })
      if (res?.error) {
        throw new Error(res.error)
      }
    },
    [countryCode]
  )

  const pollTransaction = useCallback(
    async (transactionId: string, reference: string) => {
      setPolling(true)
      try {
        for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
          const { transaction, three_ds_auth: auth } =
            await fetchWompiTransaction(transactionId)
          setThreeDsAuth(auth ?? transaction.payment_method?.extra?.three_ds_auth ?? null)

          if (transaction.status === "APPROVED") {
            await completeApproved(transactionId, reference)
            return
          }

          if (transaction.status === "DECLINED" || transaction.status === "ERROR") {
            throw new Error(
              transaction.status_message ?? "El pago fue rechazado por el banco."
            )
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_MS))
        }
        throw new Error("La autenticación 3D Secure tardó demasiado.")
      } finally {
        setPolling(false)
      }
    },
    [completeApproved]
  )

  const handlePay = useCallback(async () => {
    if (!publicKey || !apiBaseUrl || !acceptanceToken || !personalAuthToken) {
      setError("Wompi no está configurado correctamente.")
      return
    }

    const reference = sessionId ?? session?.id
    if (!reference) {
      setError("No hay sesión de pago activa.")
      return
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      setError("Debes aceptar los términos y la autorización de datos.")
      return
    }

    setSubmitting(true)
    setError(null)
    setThreeDsAuth(null)

    try {
      const metadata = (cart.metadata ?? {}) as Record<string, unknown>
      const idType = (metadata.payer_identification_type as string | undefined) || "CC"
      const idNumber = metadata.payer_identification_number as string | undefined

      const cardToken = await tokenizeWompiCard(apiBaseUrl, publicKey, {
        number: cardNumber.replace(/\s/g, ""),
        cvc,
        exp_month: expMonth.padStart(2, "0"),
        exp_year: expYear.slice(-2),
        card_holder: cardHolder,
      })

      const { transaction } = await createWompiThreeDsTransaction({
        reference,
        amountPesos: amount,
        customerEmail: cart.email!,
        cardToken: cardToken.id,
        acceptanceToken,
        acceptPersonalAuth: personalAuthToken,
        browserInfo: collectWompiBrowserInfo(),
        redirectUrl: `${window.location.origin}/${countryCode}/checkout/pending`,
        customerData: {
          full_name: [cart.shipping_address?.first_name, cart.shipping_address?.last_name]
            .filter(Boolean)
            .join(" "),
          phone_number: cart.shipping_address?.phone ?? "",
          legal_id: idNumber ?? "",
          legal_id_type: idType,
        },
      })

      const auth = transaction.payment_method?.extra?.three_ds_auth ?? null
      setThreeDsAuth(auth)

      if (transaction.status === "APPROVED") {
        await completeApproved(transaction.id, reference)
        return
      }

      if (
        transaction.status === "DECLINED" ||
        transaction.status === "ERROR"
      ) {
        throw new Error(
          transaction.status_message ?? "El pago fue rechazado."
        )
      }

      await pollTransaction(transaction.id, reference)
    } catch (e) {
      if (isRedirectError(e)) throw e
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago.")
    } finally {
      setSubmitting(false)
    }
  }, [
    acceptanceToken,
    amount,
    apiBaseUrl,
    acceptedPrivacy,
    acceptedTerms,
    cardHolder,
    cardNumber,
    cart,
    completeApproved,
    countryCode,
    cvc,
    expMonth,
    expYear,
    personalAuthToken,
    pollTransaction,
    publicKey,
    session?.id,
    sessionId,
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="wompi-card-number">Número de tarjeta</Label>
          <Input
            id="wompi-card-number"
            inputMode="numeric"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="4242 4242 4242 4242"
          />
        </div>
        <div>
          <Label htmlFor="wompi-card-holder">Titular</Label>
          <Input
            id="wompi-card-holder"
            autoComplete="cc-name"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            placeholder="Como aparece en la tarjeta"
          />
        </div>
        <div>
          <Label htmlFor="wompi-exp-month">Mes</Label>
          <Input
            id="wompi-exp-month"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            value={expMonth}
            onChange={(e) => setExpMonth(e.target.value)}
            placeholder="MM"
          />
        </div>
        <div>
          <Label htmlFor="wompi-exp-year">Año</Label>
          <Input
            id="wompi-exp-year"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            value={expYear}
            onChange={(e) => setExpYear(e.target.value)}
            placeholder="AA"
          />
        </div>
        <div>
          <Label htmlFor="wompi-cvc">CVC</Label>
          <Input
            id="wompi-cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            placeholder="123"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-on-surface-variant">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>
            Acepto los{" "}
            {termsUrl ? (
              <a href={termsUrl} target="_blank" rel="noreferrer" className="underline">
                términos y condiciones de Wompi
              </a>
            ) : (
              "términos y condiciones de Wompi"
            )}
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
          />
          <span>
            Autorizo el{" "}
            {privacyUrl ? (
              <a href={privacyUrl} target="_blank" rel="noreferrer" className="underline">
                tratamiento de datos personales
              </a>
            ) : (
              "tratamiento de datos personales"
            )}
          </span>
        </label>
      </div>

      {(threeDsAuth || polling) && <WompiThreeDsBadge />}

      {threeDsAuth?.current_step === "CHALLENGE" &&
        threeDsAuth.three_ds_method_data && (
          <WompiThreeDsChallengeFrame
            escapedHtml={threeDsAuth.three_ds_method_data}
          />
        )}

      <Button
        size="large"
        className="checkout-cta w-full"
        onClick={handlePay}
        isLoading={submitting || polling}
        disabled={!sessionReady || submitting || polling}
      >
        {checkoutLabels.placeOrder} con tarjeta (3DS)
      </Button>

      <ErrorMessage error={error} data-testid="wompi-card-payment-error" />
    </div>
  )
}

export default WompiCardPayment
