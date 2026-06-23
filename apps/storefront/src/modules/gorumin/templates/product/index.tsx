import Image from "next/image"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductActions from "@modules/gorumin/components/product-actions"
import { imageForProduct } from "@lib/platform-assets"
import {
  getDeliveryType,
  getPlatformLabel,
  getProductTypeLabel,
} from "@modules/gorumin/lib/product-meta"

// Product detail with the Gorumin design system (US-7.5 / RUM-41).
export default function ProductTemplate({
  product,
}: {
  product: HttpTypes.StoreProduct
  countryCode: string
}) {
  if (!product || !product.id) return notFound()

  const platformLabel = getPlatformLabel(product)
  const typeLabel = getProductTypeLabel(product)
  const deliveryType = getDeliveryType(product)
  const image = imageForProduct(product)

  return (
    <div className="content-container py-12">
      <nav className="mb-8 flex flex-wrap items-center gap-2 font-mono text-label-caps tracking-widest text-on-surface-variant/60">
        <LocalizedClientLink href="/store" className="hover:text-secondary">
          TIENDA
        </LocalizedClientLink>
        {platformLabel && (
          <>
            <span>/</span>
            <span className="text-on-surface-variant">
              {platformLabel.toUpperCase()}
            </span>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Visual */}
        <div className="relative">
          <div className="hyper-glass relative aspect-square w-full overflow-hidden rounded-2xl">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
            {image ? (
              <Image
                src={image}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-contain p-10"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="material-symbols-outlined text-7xl text-on-surface-variant/30">
                  redeem
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info + actions */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {platformLabel && (
              <span className="rounded-full bg-secondary/15 px-3 py-1 font-mono text-[10px] tracking-widest text-secondary">
                {platformLabel.toUpperCase()}
              </span>
            )}
            {typeLabel && (
              <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-[10px] tracking-widest text-primary">
                {typeLabel.toUpperCase()}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl font-extrabold leading-tight text-on-surface md:text-4xl">
            {product.title}
          </h1>

          {product.description && (
            <p className="whitespace-pre-line text-on-surface-variant/80">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-container/40 px-4 py-3 text-sm text-on-surface-variant/80">
            <span className="material-symbols-outlined text-secondary">
              {deliveryType === "topup_id" ? "person" : "bolt"}
            </span>
            {deliveryType === "topup_id"
              ? "Recarga directa a tu cuenta. Ingresa tu ID de jugador al comprar."
              : "Entrega digital inmediata. Recibirás tu código por correo y en tu cuenta."}
          </div>

          <ProductActions product={product} />
        </div>
      </div>
    </div>
  )
}
