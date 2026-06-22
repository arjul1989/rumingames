import { retrieveOrder } from "@lib/data/orders"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DigitalCodes from "@modules/gorumin/components/digital-codes"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pago confirmado",
  description: "Tu compra se realizó con éxito.",
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ order?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams
  const order = orderId ? await retrieveOrder(orderId).catch(() => null) : null

  return (
    <div className="content-container flex flex-col gap-8 py-12">
      <div className="hyper-glass flex flex-col items-center gap-4 rounded-2xl px-8 py-12 text-center">
        <span className="font-mono text-label-caps tracking-widest text-secondary">
          PAGO APROBADO
        </span>
        <h1 className="font-display text-3xl font-bold text-on-surface">
          ¡Gracias por tu compra!
        </h1>
        <p className="max-w-lg text-on-surface-variant/80">
          Tu pago fue aprobado. Tus códigos digitales aparecen abajo y también
          quedan disponibles en cualquier momento desde tus pedidos.
        </p>
        {order && (
          <div className="mt-2 flex items-center gap-6 font-mono text-label-caps tracking-widest text-on-surface-variant/70">
            <span>ORDEN #{order.display_id}</span>
            <span>
              {convertToLocale({
                amount: order.total,
                currency_code: order.currency_code,
              })}
            </span>
          </div>
        )}
      </div>

      {order && <DigitalCodes order={order} />}

      <div className="flex flex-col gap-3 small:flex-row">
        {order && (
          <LocalizedClientLink
            href={`/account/orders/details/${order.id}`}
            className="brutalist-button flex-1 bg-secondary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-secondary transition-transform hover:scale-[1.02]"
          >
            VER MIS PEDIDOS
          </LocalizedClientLink>
        )}
        <LocalizedClientLink
          href="/store"
          className="brutalist-button flex-1 bg-primary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
        >
          SEGUIR COMPRANDO
        </LocalizedClientLink>
      </div>
    </div>
  )
}
