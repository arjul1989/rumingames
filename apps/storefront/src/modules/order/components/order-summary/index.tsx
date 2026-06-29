import { convertToLocale } from "@lib/util/money"
import { cartLabels, orderLabels } from "@lib/i18n/es-co"
import { HttpTypes } from "@medusajs/types"

type GoruminPricingMeta = {
  subtotal_local?: number
  tax_total_local?: number
  commission_local?: number
  total_local?: number
}

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const pricing = (order.metadata as { gorumin_pricing?: GoruminPricingMeta } | null)
    ?.gorumin_pricing

  const getAmount = (amount?: number | null) => {
    if (amount == null) {
      return
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  const subtotalBeforeCommission =
    pricing?.subtotal_local != null && pricing.tax_total_local != null
      ? pricing.subtotal_local + pricing.tax_total_local
      : order.subtotal

  return (
    <div>
      <h2 className="text-base-semi">{orderLabels.orderSummary}</h2>
      <div className="text-small-regular text-ui-fg-base my-2">
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>{cartLabels.subtotal}</span>
          <span>{getAmount(subtotalBeforeCommission)}</span>
        </div>
        {pricing?.commission_local != null && pricing.commission_local > 0 && (
          <div className="flex items-center justify-between">
            <span>{cartLabels.pricingCommission}</span>
            <span>{getAmount(pricing.commission_local)}</span>
          </div>
        )}
        <div className="flex flex-col gap-y-1">
          {order.discount_total > 0 && (
            <div className="flex items-center justify-between">
              <span>{cartLabels.discount}</span>
              <span>- {getAmount(order.discount_total)}</span>
            </div>
          )}
          {order.gift_card_total > 0 && (
            <div className="flex items-center justify-between">
              <span>{cartLabels.discount}</span>
              <span>- {getAmount(order.gift_card_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>{cartLabels.shipping}</span>
            <span>{getAmount(order.shipping_total)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{cartLabels.taxes}</span>
            <span>{getAmount(order.tax_total)}</span>
          </div>
        </div>
        <div className="h-px w-full border-b border-gray-200 border-dashed my-4" />
        <div className="flex items-center justify-between text-base-regular text-ui-fg-base mb-2">
          <span>{cartLabels.total}</span>
          <span>{getAmount(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary
