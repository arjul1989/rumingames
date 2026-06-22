import { HttpTypes } from "@medusajs/types"
import type { Article, Streamer } from "@lib/data/cms"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import HomeHero from "@modules/gorumin/components/home-hero"
import ProductCard from "@modules/gorumin/components/product-card"
import ArticleCard from "@modules/gorumin/components/article-card"
import StreamerRail from "@modules/gorumin/components/streamer-rail"

function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string
  subtitle?: string
  href?: string
}) {
  return (
    <div className="flex items-end justify-between border-b border-white/10 pb-4">
      <div className="space-y-1">
        <h2 className="font-display text-2xl font-extrabold text-primary md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
            {subtitle}
          </p>
        )}
      </div>
      {href && (
        <LocalizedClientLink
          href={href}
          className="font-mono flex items-center text-label-caps tracking-widest text-secondary transition-opacity hover:opacity-80"
        >
          VER TODOS
          <span className="material-symbols-outlined ml-1 text-base">
            chevron_right
          </span>
        </LocalizedClientLink>
      )}
    </div>
  )
}

// Community-first home (US-7.2 / RUM-38). Hero, popular cards, recent news and
// the streamer feed, all wired to live data.
export default function HomeTemplate({
  products,
  articles,
  streamers,
}: {
  products: HttpTypes.StoreProduct[]
  articles: Article[]
  streamers: Streamer[]
}) {
  return (
    <div className="flex flex-col">
      <HomeHero />

      <div className="content-container flex flex-col gap-24 py-24">
        {products.length > 0 && (
          <section className="space-y-8">
            <SectionHeading
              title="Cards populares"
              subtitle="GIFT CARDS Y RECARGAS DESTACADAS"
              href="/store"
            />
            <div className="grid grid-cols-2 gap-gutter md:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {articles.length > 0 && (
          <section className="space-y-8">
            <SectionHeading
              title="Noticias"
              subtitle="LO ÚLTIMO DEL MUNDO GAMER"
              href="/noticias"
            />
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
              {articles.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {streamers.length > 0 && (
          <section className="space-y-8">
            <SectionHeading
              title="Streamer feed"
              subtitle="ACTIVIDAD DE LA COMUNIDAD"
              href="/streamers"
            />
            <StreamerRail streamers={streamers} />
          </section>
        )}

        <section className="hyper-glass relative overflow-hidden rounded-2xl px-8 py-16 text-center">
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative space-y-6">
            <h2 className="font-display text-3xl font-extrabold text-on-surface md:text-4xl">
              ¿Listo para subir de nivel?
            </h2>
            <p className="mx-auto max-w-lg text-on-surface-variant/80">
              Explora todo el catálogo de gift cards y recargas con entrega
              digital inmediata.
            </p>
            <LocalizedClientLink
              href="/store"
              className="brutalist-button inline-block bg-secondary px-10 py-4 font-mono text-label-caps tracking-widest text-on-secondary transition-transform hover:scale-105"
            >
              IR A LA TIENDA
            </LocalizedClientLink>
          </div>
        </section>
      </div>
    </div>
  )
}
