import { retrieveCustomer } from "@lib/data/customer"
import { retrieveOrder } from "@lib/data/orders"
import { fundingLabels } from "@lib/i18n/es-co"
import { isFundingUxEnabled } from "@lib/funding-settings"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DigitalCodes from "@modules/gorumin/components/digital-codes"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pago confirmado",
  description: "Tu compra se realizó con éxito.",
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams
  const [order, customer] = await Promise.all([
    orderId ? retrieveOrder(orderId).catch(() => null) : null,
    retrieveCustomer().catch(() => null),
  ])
  const fundingUx = isFundingUxEnabled()
  const isLoggedIn = Boolean(customer)

  const successBody = fundingUx
    ? isLoggedIn
      ? fundingLabels.checkoutSuccessLoggedInBody
      : fundingLabels.checkoutSuccessGuestBody
    : fundingLabels.checkoutSuccessLegacyBody

  return (
    <div className="content-container flex flex-col gap-8 py-12">
      <div className="hyper-glass flex flex-col items-center gap-4 rounded-2xl px-8 py-12 text-center">
        <span className="font-mono text-label-caps tracking-widest text-secondary">
          PAGO APROBADO
        </span>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          {fundingLabels.checkoutSuccessTitle}
        </h1>
        <p className="max-w-lg text-on-surface-variant/80">{successBody}</p>
        {!isLoggedIn && order?.email && (
          <p className="max-w-lg text-sm text-on-surface-variant/70">
            {fundingLabels.checkoutSuccessGuestAccountHint}
          </p>
        )}
        {order && (
          <div className="mt-2 flex items-center gap-6 font-mono text-label-caps tracking-widest text-on-surface-variant/70">
            <span>ORDEN #{order.display_id}</span>
            <span>
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
          </div>
        )}
      </div>

      {order && <DigitalCodes order={order} />}

      <div className="flex flex-col gap-3 small:flex-row">
        {order &&
          (isLoggedIn ? (
            <LocalizedClientLink
              href={`/account/orders/details/${order.id}`}
              className="brutalist-button flex-1 bg-secondary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-secondary transition-transform hover:scale-[1.02]"
            >
              {fundingLabels.checkoutSuccessViewOrders}
            </LocalizedClientLink>
          ) : (
            <LocalizedClientLink
              href="/account"
              className="brutalist-button flex-1 bg-secondary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-secondary transition-transform hover:scale-[1.02]"
            >
              {fundingLabels.checkoutSuccessGuestCta}
            </LocalizedClientLink>
          ))}
        <LocalizedClientLink
          href="/store"
          className="brutalist-button flex-1 bg-primary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
        >
          SEGUIR COMPRANDO
        </LocalizedClientLink>
      </div>
    </div>
  )
}
