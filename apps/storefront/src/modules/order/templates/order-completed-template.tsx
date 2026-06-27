import { orderLabels } from "@lib/i18n/es-co"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import DigitalCodes from "@modules/gorumin/components/digital-codes"
import Help from "@modules/order/components/help"
import OrderCompletedActions from "@modules/order/components/completed-actions"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import PaymentDetails from "@modules/order/components/payment-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="content-container py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        {isOnboarding && <OnboardingCta orderId={order.id} />}

        <div
          className="hyper-glass rounded-2xl p-6 md:p-10 text-on-surface [&_.text-ui-fg-base]:text-on-surface [&_.text-ui-fg-subtle]:text-on-surface-variant/85 [&_.text-ui-fg-muted]:text-on-surface-variant/70 [&_.text-ui-fg-interactive]:text-secondary"
          data-testid="order-complete-container"
        >
          <div className="mb-8 flex flex-col gap-2">
            <span className="font-mono text-label-caps tracking-widest text-secondary">
              PEDIDO CONFIRMADO
            </span>
            <h1 className="font-display text-3xl font-bold text-on-surface">
              {orderLabels.thankYou}
            </h1>
            <p className="text-on-surface-variant/85">{orderLabels.orderPlaced}</p>
          </div>

          <OrderDetails order={order} />

          <DigitalCodes order={order} />

          <h2 className="mt-8 font-display text-2xl font-bold text-on-surface">
            {orderLabels.summary}
          </h2>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
          <OrderCompletedActions orderId={order.id} />
        </div>
      </div>
    </div>
  )
}
