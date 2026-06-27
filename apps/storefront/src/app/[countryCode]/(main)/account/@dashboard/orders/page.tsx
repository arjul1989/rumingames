import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import { accountLabels } from "@lib/i18n/es-co"

export const metadata: Metadata = {
  title: "Mis compras",
  description: accountLabels.ordersDesc,
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-2">
        <h1 className="font-display text-2xl font-extrabold text-primary">
          {accountLabels.myPurchases}
        </h1>
        <p className="text-base-regular text-on-surface-variant/70">
          {accountLabels.ordersDesc}
        </p>
      </div>
      <OrderOverview orders={orders} />
    </div>
  )
}
