import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { PLATFORM_LABELS, type Platform } from "@gorumin/types"
import { getProductPrice } from "@lib/util/get-product-price"
import { formatCop } from "@modules/gorumin/lib/product-meta"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Featured "platform" card for the home and store grids (US-7.2 / US-7.5).
export default function ProductCard({
  product,
}: {
  product: HttpTypes.StoreProduct
}) {
  const platform = (product.metadata?.platform as Platform) || undefined
  const platformLabel = platform ? PLATFORM_LABELS[platform] : null

  const { cheapestPrice } = getProductPrice({ product })

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="hyper-glass group relative block overflow-hidden rounded-xl p-6 transition-all duration-500 hover:-translate-y-2 hover:border-secondary"
    >
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-secondary/10 blur-3xl transition-all group-hover:bg-secondary/20" />

      <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-lg bg-surface-container-low">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
              redeem
            </span>
          </div>
        )}
      </div>

      {platformLabel && (
        <span className="font-mono mb-2 block text-[10px] tracking-widest text-secondary">
          {platformLabel.toUpperCase()}
        </span>
      )}
      <h3 className="font-headline text-base font-bold text-on-surface line-clamp-1">
        {product.title}
      </h3>

      <div className="mt-4 flex items-center justify-between">
        {cheapestPrice ? (
          <span className="font-mono text-label-caps tracking-widest text-secondary">
            DESDE{" "}
            {formatCop(
              cheapestPrice.calculated_price_number,
              cheapestPrice.currency_code || "COP"
            )}
          </span>
        ) : (
          <span className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
            VER PRECIO
          </span>
        )}
        <span className="material-symbols-outlined translate-x-4 text-secondary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
          arrow_forward
        </span>
      </div>
    </LocalizedClientLink>
  )
}
