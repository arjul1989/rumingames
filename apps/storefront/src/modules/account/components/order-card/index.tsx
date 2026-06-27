import { Button } from "@modules/common/components/ui"
import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { formatOrderDate, resolveOrderTotal } from "@lib/resolve-order-total"
import { fundingLabels } from "@lib/i18n/es-co"
import { isFundingUxEnabled } from "@lib/funding-settings"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  const showInProgress =
    isFundingUxEnabled() &&
    order.payment_status === "captured" &&
    order.fulfillment_status !== "fulfilled"

  return (
    <div className="hyper-glass flex flex-col rounded-2xl p-6" data-testid="order-card">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="font-display text-lg font-bold text-on-surface">
          #<span data-testid="order-display-id">{order.display_id}</span>
        </div>
        {showInProgress && (
          <span className="rounded-full bg-secondary/15 px-3 py-0.5 font-mono text-[10px] tracking-widest text-secondary">
            {fundingLabels.orderInProgress.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex items-center divide-x divide-white/10 text-small-regular text-on-surface-variant/80">
        <span className="pr-2" data-testid="order-created-at">
          {formatOrderDate(order.created_at)}
        </span>
        <span className="px-2" data-testid="order-amount">
          {convertToLocale({
            amount: resolveOrderTotal(order),
            currency_code: order.currency_code || "cop",
            locale: "es-CO",
          })}
        </span>
        <span className="pl-2">{`${numberOfLines} ${
          numberOfLines > 1 ? "ítems" : "ítem"
        }`}</span>
      </div>
      <div className="my-4 flex flex-col gap-3">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex items-center gap-3"
              data-testid="order-item"
            >
              <Thumbnail
                thumbnail={i.thumbnail}
                images={[]}
                size="square"
                className="!w-14 !min-w-14 shrink-0 !p-1"
              />
              <div className="flex min-w-0 flex-1 items-center gap-2 text-small-regular text-on-surface-variant/80">
                <span
                  className="truncate font-semibold text-on-surface"
                  data-testid="item-title"
                >
                  {i.title}
                </span>
                <span className="shrink-0">×</span>
                <span className="shrink-0" data-testid="item-quantity">
                  {i.quantity}
                </span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="text-small-regular text-on-surface-variant/80">
              + {numberOfLines - 4}
            </span>
            <span className="text-small-regular text-on-surface-variant/80">más</span>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button data-testid="order-details-link" variant="secondary">
            Ver detalle
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
