import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { orderLabels } from "@lib/i18n/es-co"

type Props = {
  orderId: string
}

export default function OrderCompletedActions({ orderId }: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-8 small:flex-row">
      <LocalizedClientLink
        href={`/account/orders/details/${orderId}`}
        className="brutalist-button flex-1 bg-secondary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-secondary transition-transform hover:scale-[1.02]"
        data-testid="go-to-my-orders-button"
      >
        {orderLabels.viewMyOrders}
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/"
        className="brutalist-button flex-1 bg-primary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
        data-testid="go-home-button"
      >
        {orderLabels.goHome}
      </LocalizedClientLink>
    </div>
  )
}
