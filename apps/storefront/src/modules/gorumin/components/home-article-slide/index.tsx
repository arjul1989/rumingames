import Image from "next/image"
import type { Article } from "@lib/data/cms"
import { resolveCmsMediaUrl } from "@lib/cms-media"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

function formatDate(value: string | null): string {
  if (!value) return ""
  try {
    return new Date(value).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

// Full-width news slide for the home carousel.
export default function HomeArticleSlide({ article }: { article: Article }) {
  const coverImage = resolveCmsMediaUrl(article.cover_image)

  return (
    <LocalizedClientLink
      href={`/noticias/${article.slug}`}
      className="group flex min-h-[20rem] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container/40 transition-all duration-500 hover:border-primary/50 md:min-h-[24rem] md:flex-row"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-container-low md:aspect-auto md:min-h-[24rem] md:w-[55%]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-[12rem] w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
              article
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/30" />
        {article.category?.name && (
          <span className="absolute left-4 top-4 rounded-full bg-primary/90 px-3 py-1 font-mono text-[10px] tracking-widest text-on-primary">
            {article.category.name.toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-3 p-6 md:p-10">
        <h3 className="font-display text-xl font-extrabold leading-snug text-on-surface md:text-3xl line-clamp-3">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-on-surface-variant/75 md:text-base line-clamp-4">
            {article.excerpt}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 font-mono text-[11px] tracking-wide text-on-surface-variant/50">
          {article.author && <span>{article.author}</span>}
          {article.author && article.published_at && <span>·</span>}
          {article.published_at && <span>{formatDate(article.published_at)}</span>}
        </div>
        <span className="mt-2 font-mono text-label-caps tracking-widest text-secondary">
          LEER NOTICIA →
        </span>
      </div>
    </LocalizedClientLink>
  )
}
