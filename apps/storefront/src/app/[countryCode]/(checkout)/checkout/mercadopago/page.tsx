import { checkoutLabels } from "@lib/i18n/es-co"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getMpCustomerId } from "@lib/data/payment-methods"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: checkoutLabels.title,
}

export default async function MercadoPagoCheckoutPage() {
  const cart = await retrieveCart(
    undefined,
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name, *shipping_address, *billing_address, *payment_collection, *payment_collection.payment_sessions, email, metadata"
  )

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()
  const mpCustomerId = customer ? await getMpCustomerId() : null

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-12 gap-y-8 py-12">
      <div className="hyper-glass rounded-2xl p-6 md:p-8">
        <PaymentWrapper cart={cart}>
          <CheckoutForm
            cart={cart}
            customer={customer}
            mpCustomerId={mpCustomerId}
          />
        </PaymentWrapper>
      </div>
      <div className="hyper-glass h-fit rounded-2xl p-6 md:sticky md:top-24">
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
