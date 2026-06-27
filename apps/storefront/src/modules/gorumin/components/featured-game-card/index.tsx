"use client"

import { useParams } from "next/navigation"
import { useState, useTransition } from "react"
import Image from "next/image"
import type { FeaturedGameDetail } from "@lib/data/cms"
import { resolveCmsMediaUrl } from "@lib/cms-media"
import { addToCart } from "@lib/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function FeaturedGameCard({
  game,
  featured,
}: {
  game: FeaturedGameDetail
  featured?: boolean
}) {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "co"
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  const primaryProduct = game.related_products?.[0]

  const handleBuy = () => {
    if (!primaryProduct?.variant_id) return
    startTransition(async () => {
      try {
        await addToCart({
          variantId: primaryProduct.variant_id as string,
          quantity: 1,
          countryCode,
        })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      } catch {
        // cart action surfaces its own errors
      }
    })
  }

  const buyHref = primaryProduct
    ? `/products/${primaryProduct.handle}`
    : "/store"

  const coverImage = resolveCmsMediaUrl(game.cover_image)

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container/50 transition-all duration-500 hover:border-primary/50 ${
        featured ? "md:min-h-[28rem]" : ""
      }`}
    >
      <div className="relative aspect-[16/10] min-h-[12rem] w-full overflow-hidden bg-surface-container-low sm:min-h-[14rem]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={game.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={featured}
          />
        ) : (
          <div className="flex h-full min-h-[12rem] w-full items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
              sports_esports
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-secondary/90 px-3 py-1 font-mono text-[10px] tracking-widest text-on-secondary">
          NUEVO
        </span>
      </div>

      <div className="relative flex flex-col gap-3 p-5 md:p-6">
        <div className="space-y-2">
          <h2
            className={`font-display font-extrabold leading-tight text-on-surface ${
              featured ? "text-2xl md:text-3xl" : "text-xl"
            }`}
          >
            {game.title}
          </h2>
          {game.excerpt && (
            <p className="text-sm text-on-surface-variant/80 line-clamp-2 md:line-clamp-3">
              {game.excerpt}
            </p>
          )}
        </div>

        {primaryProduct && (
          <p className="font-mono text-[10px] tracking-widest text-secondary">
            {primaryProduct.title.toUpperCase()}
          </p>
        )}

        <div className="mt-1 flex flex-wrap gap-3">
          {primaryProduct?.variant_id ? (
            <button
              type="button"
              onClick={handleBuy}
              disabled={isPending}
              className="brutalist-button bg-primary px-6 py-3 font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-105 disabled:opacity-60"
            >
              {added ? "AGREGADO ✓" : isPending ? "..." : "COMPRAR"}
            </button>
          ) : (
            <LocalizedClientLink
              href={buyHref}
              className="brutalist-button bg-primary px-6 py-3 font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-105"
            >
              COMPRAR
            </LocalizedClientLink>
          )}
          {primaryProduct && (
            <LocalizedClientLink
              href={buyHref}
              className="inline-flex items-center px-2 font-mono text-label-caps tracking-widest text-on-surface-variant transition-opacity hover:opacity-80"
            >
              VER PRODUCTO
            </LocalizedClientLink>
          )}
        </div>
      </div>
    </article>
  )
}
