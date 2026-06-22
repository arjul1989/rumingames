import Image from "next/image"
import type { RelatedProduct } from "@lib/data/cms"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Compact related-product link used in article detail (US-7.3 / US-4.3).
// These come without pricing, so we link to the product page for details.
export default function RelatedProductCard({
  product,
}: {
  product: RelatedProduct
}) {
  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="hyper-glass group flex items-center gap-4 rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-secondary"
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
      <span className="material-symbols-outlined text-secondary opacity-0 transition-opacity group-hover:opacity-100">
        arrow_forward
      </span>
    </LocalizedClientLink>
  )
}
