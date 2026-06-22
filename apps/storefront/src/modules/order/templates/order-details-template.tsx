"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import DigitalCodes from "@modules/gorumin/components/digital-codes"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="flex flex-col justify-center gap-y-4">
      <div className="flex gap-2 justify-between items-center">
        <h1 className="font-display text-2xl font-extrabold text-primary">
          Detalle de orden
        </h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-on-surface-variant/70 hover:text-on-surface"
          data-testid="back-to-overview-button"
        >
          <XMark /> Volver a mis órdenes
        </LocalizedClientLink>
      </div>
      <div
        className="flex flex-col gap-6 h-full w-full"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <DigitalCodes order={order} />
        <Items order={order} />
        <OrderSummary order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
