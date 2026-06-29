"use client"

import { isCheckoutStepOpen } from "@lib/checkout-steps"
import { checkoutLabels } from "@lib/i18n/es-co"
import type { MpPaymentSettings } from "@lib/mp-payment-settings.shared"
import { Heading, Text, clx } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { useSearchParams } from "next/navigation"
import PaymentButton from "../payment-button"

const Review = ({
  cart,
  mpSettings,
  mpCustomerId,
}: {
  cart: HttpTypes.StoreCart
  mpSettings: MpPaymentSettings
  mpCustomerId?: string | null
}) => {
  const searchParams = useSearchParams()

  const currentStep = searchParams.get("step")
  const isOpen = isCheckoutStepOpen("review", currentStep)

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards &&
    ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])
      ?.length > 0 &&
    cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Revisión
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex flex-col gap-4 w-full mb-6">
            <Text className="txt-medium-plus text-ui-fg-base">
              {checkoutLabels.reviewTerms}
            </Text>
            <div
              className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-4 py-3"
              role="note"
              data-testid="checkout-region-disclaimer"
            >
              <Text className="text-sm leading-relaxed text-amber-100/95">
                {checkoutLabels.reviewRegionWarning}
              </Text>
            </div>
          </div>
          <PaymentButton
            cart={cart}
            mpSettings={mpSettings}
            mpCustomerId={mpCustomerId}
            data-testid="submit-order-button"
          />
        </>
      )}
    </div>
  )
}

export default Review
