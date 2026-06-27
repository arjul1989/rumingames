"use client"

import { useCallback, useEffect, useState } from "react"
import {
  listPaymentMethods,
  removePaymentMethod,
  type SavedPaymentMethod,
} from "@lib/data/payment-methods"
import { accountLabels } from "@lib/i18n/es-co"
import { Button } from "@modules/common/components/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import AddPaymentMethodForm from "./add-payment-method-form"

export default function PaymentMethodsPanel({
  initialCards,
  publicKey,
}: {
  initialCards: SavedPaymentMethod[]
  publicKey: string | null
}) {
  const [cards, setCards] = useState(initialCards)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const data = await listPaymentMethods()
    if (data?.cards) {
      setCards(data.cards)
    }
  }, [])

  useEffect(() => {
    setCards(initialCards)
  }, [initialCards])

  const handleRemove = async (cardId: string) => {
    setRemovingId(cardId)
    setError(null)
    const res = await removePaymentMethod(cardId)
    if (res.error) {
      setError(res.error)
    } else {
      setCards((prev) => prev.filter((c) => c.id !== cardId))
    }
    setRemovingId(null)
  }

  return (
    <div data-testid="payment-methods-page">
      {cards.length === 0 ? (
        <div className="hyper-glass rounded-2xl p-8 text-center">
          <p className="font-display text-lg font-bold text-on-surface">
            {accountLabels.noPaymentMethods}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant/70">
            {accountLabels.noPaymentMethodsHint}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {cards.map((card) => (
            <li
              key={card.id}
              className="hyper-glass flex items-center justify-between rounded-2xl p-5"
              data-testid="saved-card-item"
            >
              <div>
                <p className="font-semibold text-on-surface">
                  {card.brand} · {accountLabels.cardEnding(card.last_four)}
                </p>
                <p className="text-sm text-on-surface-variant/70">
                  {card.exp_month && card.exp_year
                    ? `Vence ${String(card.exp_month).padStart(2, "0")}/${card.exp_year}`
                    : "—"}
                  {card.holder_name ? ` · ${card.holder_name}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                isLoading={removingId === card.id}
                onClick={() => handleRemove(card.id)}
                data-testid="remove-card-button"
              >
                {accountLabels.removeCard}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ErrorMessage error={error} />

      {publicKey ? (
        <AddPaymentMethodForm publicKey={publicKey} onSaved={refresh} />
      ) : (
        <p className="mt-6 text-sm text-error">
          Mercado Pago no está configurado. No puedes guardar tarjetas por ahora.
        </p>
      )}
    </div>
  )
}
