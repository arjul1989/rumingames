import { Metadata } from "next"

import { listArticles } from "@lib/data/cms"
import ArticleCard from "@modules/gorumin/components/article-card"

export const metadata: Metadata = {
  title: "Noticias — Gorumin",
  description:
    "Lo último del mundo gaming: lanzamientos, esports, reviews y guías de la comunidad Gorumin.",
}

// News listing (US-7.3 / RUM-39). Category filtering is added in a later pass.
export default async function NoticiasPage() {
  const { articles } = await listArticles({ limit: 24 })

  return (
    <div className="content-container py-16">
      <header className="mb-12 space-y-2">
        <p className="font-mono text-label-caps tracking-[0.3em] text-secondary">
          COMUNIDAD
        </p>
        <h1 className="font-display text-4xl font-extrabold text-primary md:text-5xl">
          Noticias
        </h1>
      </header>

      {articles.length ? (
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-on-surface-variant/70">
          Aún no hay noticias publicadas. Vuelve pronto.
        </p>
      )}
    </div>
  )
}
