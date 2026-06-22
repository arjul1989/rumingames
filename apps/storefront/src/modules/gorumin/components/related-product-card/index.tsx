"use client"

import { useParams } from "next/navigation"
import { useState, useTransition } from "react"
import Image from "next/image"
import type { RelatedProduct } from "@lib/data/cms"
import { addToCart } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Related-product card with add-to-cart (US-7.3 / RUM-47). The thumbnail and
// title link to the product page; the button adds the default variant to the
// storefront cart. Falls back to a plain link when no variant is available.
export default function RelatedProductCard({
  product,
}: {
  product: RelatedProduct
}) {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "co"
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (!product.variant_id) return
    startTransition(async () => {
      try {
        await addToCart({
          variantId: product.variant_id as string,
          quantity: 1,
          countryCode,
        })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      } catch {
        // swallow; the cart action surfaces its own errors
      }
    })
  }

  return (
    <div className="hyper-glass group flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:border-secondary">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/40">
                redeem
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-headline truncate text-sm font-bold text-on-surface">
            {product.title}
          </h3>
          <span className="font-mono text-[10px] tracking-widest text-secondary">
            VER PRODUCTO
          </span>
        </div>
      </LocalizedClientLink>

      {product.variant_id ? (
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          aria-label={`Agregar ${product.title} al carrito`}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-mono text-[10px] font-bold tracking-widest text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-base">
            {added ? "check" : "add_shopping_cart"}
          </span>
          {added ? "AGREGADO" : isPending ? "..." : "AGREGAR"}
        </button>
      ) : (
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="flex-shrink-0"
          aria-label={`Ver ${product.title}`}
        >
          <span className="material-symbols-outlined text-secondary">
            arrow_forward
          </span>
        </LocalizedClientLink>
      )}
    </div>
  )
}
