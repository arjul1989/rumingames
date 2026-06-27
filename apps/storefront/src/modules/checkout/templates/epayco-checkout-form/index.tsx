import { listCartShippingMethods } from "@lib/data/fulfillment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Shipping from "@modules/checkout/components/shipping"
import EpaycoReview from "@modules/checkout/components/epayco-review"

export default async function EpaycoCheckoutForm({
  cart,
  customer,
  countryCode,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  countryCode: string
}) {
  const shippingMethods = await listCartShippingMethods(cart.id)

  if (!shippingMethods) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />
      <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      <EpaycoReview cart={cart} countryCode={countryCode} />
    </div>
  )
}
