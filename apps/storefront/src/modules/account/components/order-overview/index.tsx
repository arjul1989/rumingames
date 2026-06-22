"use client"

import { Button } from "@modules/common/components/ui"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-6 w-full">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="hyper-glass w-full flex flex-col items-center gap-y-4 rounded-2xl py-16"
      data-testid="no-orders-container"
    >
      <h2 className="font-display text-xl font-bold text-on-surface">
        Aún no tienes órdenes
      </h2>
      <p className="text-on-surface-variant/70">
        Cuando compres, tus órdenes y códigos aparecerán aquí.
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/store" passHref>
          <Button data-testid="continue-shopping-button">
            Explorar tienda
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
