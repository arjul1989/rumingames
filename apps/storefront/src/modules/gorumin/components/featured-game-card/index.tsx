import Image from "next/image"
import type { FeaturedGameDetail } from "@lib/data/cms"
import { resolveCmsMediaUrl } from "@lib/cms-media"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function FeaturedGameCard({
  game,
  priority,
}: {
  game: FeaturedGameDetail
  priority?: boolean
}) {
  const primaryProduct = game.related_products?.[0]
  const buyHref = primaryProduct
    ? `/products/${primaryProduct.handle}`
    : "/store"

  const coverImage = resolveCmsMediaUrl(game.cover_image)

  return (
    <article className="group relative flex min-h-[22rem] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container/50 md:min-h-[28rem] md:flex-row">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-low md:aspect-auto md:min-h-[28rem] md:w-[58%]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={game.title}
            fill
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full min-h-[14rem] w-full items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
              sports_esports
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-background/40" />
        <span className="absolute left-4 top-4 rounded-full bg-secondary/90 px-3 py-1 font-mono text-[10px] tracking-widest text-on-secondary">
          NUEVO
        </span>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-4 p-6 md:p-10">
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold leading-tight text-on-surface md:text-4xl">
            {game.title}
          </h2>
          {game.excerpt && (
            <p className="max-w-xl text-sm text-on-surface-variant/80 md:text-base md:line-clamp-4">
              {game.excerpt}
            </p>
          )}
        </div>

        {primaryProduct && (
          <p className="font-mono text-[10px] tracking-widest text-secondary">
            {primaryProduct.title.toUpperCase()}
          </p>
        )}

        <div className="mt-2">
          <LocalizedClientLink
            href={buyHref}
            className="brutalist-button inline-block bg-primary px-8 py-4 font-mono text-label-caps tracking-widest text-on-primary transition-transform hover:scale-105"
          >
            COMPRAR
          </LocalizedClientLink>
        </div>
      </div>
    </article>
  )
}
