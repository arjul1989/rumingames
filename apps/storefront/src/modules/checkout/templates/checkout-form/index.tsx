import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { getMpPaymentSettings } from "@lib/mp-payment-settings"
import { filterCheckoutPaymentMethods } from "@lib/mp-payment-settings.shared"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
  mpCustomerId,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  mpCustomerId?: string | null
}) {
  if (!cart) {
    return null
  }

  const [shippingMethods, paymentMethods, mpSettings] = await Promise.all([
    listCartShippingMethods(cart.id),
    listCartPaymentMethods(cart.region?.id ?? ""),
    getMpPaymentSettings(),
  ])

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  const visiblePaymentMethods = filterCheckoutPaymentMethods(
    paymentMethods,
    mpSettings
  )

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment cart={cart} availablePaymentMethods={visiblePaymentMethods} />

      <Review cart={cart} mpSettings={mpSettings} mpCustomerId={mpCustomerId} />
    </div>
  )
}
