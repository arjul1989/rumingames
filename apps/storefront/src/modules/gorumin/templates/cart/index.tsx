import { HttpTypes } from "@medusajs/types"
import { formatCop } from "@modules/gorumin/lib/product-meta"
import CartItem from "@modules/gorumin/components/cart-item"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Gorumin cart (US-7.5 / RUM-41). Item list + order summary, dark themed.
export default function CartTemplate({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  const items = cart?.items
    ?.slice()
    .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
  const currencyCode = cart?.currency_code ?? "COP"

  return (
    <div className="content-container py-16">
      <h1 className="mb-10 font-display text-4xl font-extrabold text-primary md:text-5xl">
        Tu carrito
      </h1>

      {items?.length ? (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
          <div className="hyper-glass rounded-2xl px-6 py-2">
            {items.map((item) => (
              <CartItem key={item.id} item={item} currencyCode={currencyCode} />
            ))}
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="hyper-glass space-y-4 rounded-2xl p-6">
              <h2 className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
                RESUMEN
              </h2>
              <div className="space-y-2 border-b border-white/10 pb-4 text-sm">
                <div className="flex justify-between text-on-surface-variant/80">
                  <span>Subtotal</span>
                  <span>{formatCop(cart?.subtotal ?? 0, currencyCode)}</span>
                </div>
                {(cart?.tax_total ?? 0) > 0 && (
                  <div className="flex justify-between text-on-surface-variant/80">
                    <span>Impuestos</span>
                    <span>{formatCop(cart?.tax_total ?? 0, currencyCode)}</span>
                  </div>
                )}
                {(cart?.discount_total ?? 0) > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>Descuento</span>
                    <span>
                      -{formatCop(cart?.discount_total ?? 0, currencyCode)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
                  TOTAL
                </span>
                <span className="font-display text-2xl font-extrabold text-on-surface">
                  {formatCop(cart?.total ?? 0, currencyCode)}
                </span>
              </div>
              <LocalizedClientLink
                href="/checkout?step=address"
                className="brutalist-button block bg-primary px-8 py-4 text-center font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-[1.02]"
              >
                IR A PAGAR
              </LocalizedClientLink>
              <p className="text-center text-xs text-on-surface-variant/50">
                Entrega digital inmediata tras el pago.
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="hyper-glass flex flex-col items-center gap-6 rounded-2xl px-8 py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">
            shopping_cart
          </span>
          <p className="text-on-surface-variant/70">
            Tu carrito está vacío.
          </p>
          <LocalizedClientLink
            href="/store"
            className="brutalist-button bg-secondary px-8 py-4 font-mono text-label-caps tracking-widest text-on-secondary transition-transform hover:scale-105"
          >
            EXPLORAR TIENDA
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}
