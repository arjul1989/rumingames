"use client"

import { MP_CO_TEST_CARDS } from "@lib/mp-test-cards"
import { useEffect, useState } from "react"

/** Dev-only guidance for MP Colombia sandbox card testing. */
export default function MercadoPagoTestHint() {
  const [insecure, setInsecure] = useState(false)

  useEffect(() => {
    setInsecure(window.location.protocol === "http:")
  }, [])

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div
      className="mb-4 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95"
      role="note"
      data-testid="mp-checkout-test-hint"
    >
      <p className="font-mono text-[11px] uppercase tracking-widest text-amber-200/80 mb-2">
        Pruebas locales · Mercado Pago
      </p>
      <ul className="list-disc space-y-1 pl-5 leading-relaxed">
        <li>
          <strong>{MP_CO_TEST_CARDS.credit.label}:</strong> Visa{" "}
          {MP_CO_TEST_CARDS.credit.visa}
        </li>
        <li>
          <strong>{MP_CO_TEST_CARDS.debit.label}:</strong> Visa{" "}
          {MP_CO_TEST_CARDS.debit.visa}
        </li>
        <li>
          CVV {MP_CO_TEST_CARDS.shared.cvv}, vencimiento{" "}
          {MP_CO_TEST_CARDS.shared.expiry}, titular {MP_CO_TEST_CARDS.shared.name}
        </li>
        <li>El tipo de tarjeta debe coincidir con la pestaña (crédito vs débito).</li>
        {insecure ? (
          <li>
            Estás en HTTP: si el brick falla al tokenizar, usa{" "}
            <code className="rounded bg-black/20 px-1">pnpm dev:https</code> en el
            storefront o activa <code className="rounded bg-black/20 px-1">MOCK_MP=true</code>{" "}
            en Medusa.
          </li>
        ) : null}
      </ul>
    </div>
  )
}
