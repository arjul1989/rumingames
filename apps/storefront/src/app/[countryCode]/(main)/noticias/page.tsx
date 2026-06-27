import { Metadata } from "next"

import { listArticles, listArticleCategories } from "@lib/data/cms"
import { localizedAlternates, SITE_NAME } from "@lib/seo"
import ArticleCard from "@modules/gorumin/components/article-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Noticias",
  description:
    `Lo último del mundo gaming: lanzamientos, esports, reviews y guías de la comunidad ${SITE_NAME}.`,
  alternates: localizedAlternates("noticias"),
}

type Props = {
  searchParams: Promise<{ categoria?: string }>
}

// News listing with category filtering (US-7.3 / RUM-47).
export default async function NoticiasPage(props: Props) {
  const { categoria } = await props.searchParams

  const categories = await listArticleCategories()
  const activeCategory = categoria
    ? categories.find((c) => c.slug === categoria)
    : undefined

  const { articles } = await listArticles({
    limit: 24,
    categoryId: activeCategory?.id,
  })

  const chipBase =
    "rounded-full border px-4 py-1.5 font-mono text-label-caps tracking-widest transition-colors"
  const chipActive = "border-primary bg-primary/90 text-on-primary"
  const chipIdle =
    "border-white/10 bg-surface-container/50 text-on-surface-variant hover:border-primary/50"

  return (
    <div className="content-container py-16">
      <header className="mb-10 space-y-2">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">
          COMUNIDAD
        </p>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          Noticias
        </h1>
      </header>

      {categories.length > 0 && (
        <nav
          aria-label="Filtrar por categoría"
          className="mb-12 flex flex-wrap gap-3"
        >
          <LocalizedClientLink
            href="/noticias"
            className={`${chipBase} ${!activeCategory ? chipActive : chipIdle}`}
          >
            TODAS
          </LocalizedClientLink>
          {categories.map((category) => (
            <LocalizedClientLink
              key={category.id}
              href={`/noticias?categoria=${category.slug}`}
              className={`${chipBase} ${
                activeCategory?.id === category.id ? chipActive : chipIdle
              }`}
            >
              {category.name.toUpperCase()}
            </LocalizedClientLink>
          ))}
        </nav>
      )}

      {articles.length ? (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant/70">
          {activeCategory
            ? `No hay noticias en “${activeCategory.name}” por ahora.`
            : "Aún no hay noticias publicadas. Vuelve pronto."}
        </p>
      )}
    </div>
  )
}
