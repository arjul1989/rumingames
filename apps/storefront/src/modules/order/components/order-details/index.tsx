import { HttpTypes } from "@medusajs/types"
import { orderLabels, translateOrderStatus } from "@lib/i18n/es-co"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  return (
    <div>
      <Text>{orderLabels.confirmationSent(order.email ?? "")}</Text>
      <Text className="mt-2">
        {orderLabels.orderDate}{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        {orderLabels.orderNumber}{" "}
        <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              {orderLabels.orderStatus}{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {translateOrderStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              {orderLabels.paymentStatus}{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {translateOrderStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
