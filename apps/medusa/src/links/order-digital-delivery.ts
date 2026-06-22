import OrderModule from "@medusajs/medusa/order"
import { defineLink } from "@medusajs/framework/utils"
import DigitalDeliveryModule from "../modules/digital-delivery"

// Associates an order with its digital deliveries, keeping modules isolated.
export default defineLink(
  OrderModule.linkable.order,
  {
    linkable: DigitalDeliveryModule.linkable.digitalDelivery,
    isList: true,
  }
)
