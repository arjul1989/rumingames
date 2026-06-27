import { retrieveCustomer } from "@lib/data/customer"
import { retrieveOrder } from "@lib/data/orders"
import { fundingLabels } from "@lib/i18n/es-co"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PaymentStatusPoller from "@modules/gorumin/components/payment-status-poller"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pago en proceso",
  description: "Estamos confirmando tu pago.",
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutPendingPage({
  params,
  searchParams,
}: Props) {
  const { countryCode } = await params
  const { order: orderId } = await searchParams
  const [order, customer] = await Promise.all([
    orderId ? retrieveOrder(orderId).catch(() => null) : null,
    retrieveCustomer().catch(() => null),
  ])
  const isLoggedIn = Boolean(customer)

  return (
    <div className="content-container flex flex-col gap-8 py-12">
      <div className="hyper-glass flex flex-col items-center gap-5 rounded-2xl px-8 py-14 text-center">
        <span className="font-mono text-label-caps tracking-widest text-tertiary">
          PAGO EN PROCESO
        </span>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Estamos confirmando tu pago
        </h1>
        <p className="max-w-lg text-on-surface-variant/80">
          Mercado Pago aún está procesando la transacción. Esto puede tardar
          unos instantes; no cierres esta ventana.
        </p>
        {!isLoggedIn && (
          <p className="max-w-lg text-sm text-on-surface-variant/70">
            {fundingLabels.checkoutPendingGuestHint}
          </p>
        )}
        {order && (
          <div className="flex items-center gap-6 font-mono text-label-caps tracking-widest text-on-surface-variant/70">
            <span>ORDEN #{order.display_id}</span>
            <span>
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
          </div>
        )}
        {orderId && (
          <PaymentStatusPoller
            orderId={orderId}
            countryCode={countryCode}
            isLoggedIn={isLoggedIn}
          />
        )}
      </div>

      {isLoggedIn ? (
        <LocalizedClientLink
          href="/account/orders"
          className="brutalist-button bg-primary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
        >
          {fundingLabels.checkoutSuccessViewOrders}
        </LocalizedClientLink>
      ) : (
        <LocalizedClientLink
          href="/account"
          className="brutalist-button bg-primary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
        >
          {fundingLabels.checkoutSuccessGuestCta}
        </LocalizedClientLink>
      )}
    </div>
  )
}
