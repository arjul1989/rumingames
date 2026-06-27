"use client"

import { useEffect, useState } from "react"
import {
  CardNumber,
  ExpirationDate,
  SecurityCode,
  createCardToken,
  initMercadoPago,
} from "@mercadopago/sdk-react"
import { addPaymentMethod } from "@lib/data/payment-methods"
import { accountLabels } from "@lib/i18n/es-co"
import Input from "@modules/common/components/input"
import { Button } from "@modules/common/components/ui"
import ErrorMessage from "@modules/checkout/components/error-message"

type AddPaymentMethodFormProps = {
  publicKey: string
  onSaved: () => void
}

let mpReady = false

export default function AddPaymentMethodForm({
  publicKey,
  onSaved,
}: AddPaymentMethodFormProps) {
  const [holderName, setHolderName] = useState("")
  const [identificationNumber, setIdentificationNumber] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (publicKey && !mpReady) {
      initMercadoPago(publicKey, { locale: "es-CO" })
      mpReady = true
    }
  }, [publicKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const tokenResult = await createCardToken({
        cardholderName: holderName,
        identificationType: "CC",
        identificationNumber,
      })

      if (!tokenResult?.id) {
        throw new Error("No se pudo tokenizar la tarjeta.")
      }

      const res = await addPaymentMethod(tokenResult.id)
      if (res.error) {
        setError(res.error)
        return
      }

      setOpen(false)
      setHolderName("")
      setIdentificationNumber("")
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : accountLabels.errorRetry)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        data-testid="add-payment-method-button"
      >
        {accountLabels.addPaymentMethod}
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hyper-glass mt-6 flex flex-col gap-4 rounded-2xl p-6"
      data-testid="add-payment-method-form"
    >
      <h3 className="font-display text-lg font-bold text-on-surface">
        {accountLabels.addPaymentMethod}
      </h3>

      <Input
        label="Nombre en la tarjeta"
        name="cardholderName"
        value={holderName}
        onChange={(e) => setHolderName(e.target.value)}
        required
        autoComplete="cc-name"
      />
      <Input
        label="Documento (CC)"
        name="identificationNumber"
        value={identificationNumber}
        onChange={(e) => setIdentificationNumber(e.target.value)}
        required
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-mono uppercase tracking-widest text-on-surface-variant/60">
          Número de tarjeta
        </label>
        <div className="rounded-lg border border-white/10 bg-surface px-3 py-2">
          <CardNumber placeholder="Número de tarjeta" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-on-surface-variant/60">
            Vencimiento
          </label>
          <div className="rounded-lg border border-white/10 bg-surface px-3 py-2">
            <ExpirationDate placeholder="MM/AA" mode="short" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono uppercase tracking-widest text-on-surface-variant/60">
            CVV
          </label>
          <div className="rounded-lg border border-white/10 bg-surface px-3 py-2">
            <SecurityCode placeholder="CVV" />
          </div>
        </div>
      </div>

      <ErrorMessage error={error} />

      <div className="flex gap-3">
        <Button type="submit" isLoading={submitting} className="flex-1">
          Guardar tarjeta
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          {accountLabels.cancel}
        </Button>
      </div>
    </form>
  )
}
