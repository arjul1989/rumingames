import { listCartShippingMethods } from "@lib/data/fulfillment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Shipping from "@modules/checkout/components/shipping"

export default async function WompiCheckoutForm({
  cart,
}: {
  cart: HttpTypes.StoreCart
}) {
  const shippingMethods = await listCartShippingMethods(cart.id)

  if (!shippingMethods) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={null} />
      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <div className="rounded-xl border border-dashed border-white/20 p-6">
        <p className="font-display text-lg font-bold text-primary">Wompi</p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Checkout encapsulado para Wompi. El widget y la captura de pago se
          integrarán en la épica de pagos; esta ruta ya está aislada del flujo
          de Mercado Pago.
        </p>
      </div>
    </div>
  )
}
