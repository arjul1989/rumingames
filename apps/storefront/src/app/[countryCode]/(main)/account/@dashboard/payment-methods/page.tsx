import { Metadata } from "next"
import { notFound } from "next/navigation"

import PaymentMethodsPanel from "@modules/account/components/payment-methods/payment-methods-panel"
import { listPaymentMethods } from "@lib/data/payment-methods"
import { retrieveCustomer } from "@lib/data/customer"
import { accountLabels } from "@lib/i18n/es-co"

export const metadata: Metadata = {
  title: "Mis métodos de pago",
  description: accountLabels.paymentMethodsDesc,
}

export default async function PaymentMethodsPage() {
  const customer = await retrieveCustomer()
  if (!customer) {
    notFound()
  }

  const data = await listPaymentMethods()

  return (
    <div className="w-full" data-testid="payment-methods-wrapper">
      <div className="mb-8 flex flex-col gap-y-2">
        <h1 className="font-display text-2xl font-extrabold text-primary">
          {accountLabels.paymentMethods}
        </h1>
        <p className="text-base-regular text-on-surface-variant/70">
          {accountLabels.paymentMethodsDesc}
        </p>
      </div>
      <PaymentMethodsPanel
        initialCards={data?.cards ?? []}
        publicKey={data?.public_key ?? null}
      />
    </div>
  )
}
