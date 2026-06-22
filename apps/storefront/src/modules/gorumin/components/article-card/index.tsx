import Image from "next/image"
import type { Article } from "@lib/data/cms"
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

// News article preview card (US-7.2 / US-7.3).
export default function ArticleCard({ article }: { article: Article }) {
  return (
    <LocalizedClientLink
      href={`/noticias/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-surface-container/40 transition-all duration-500 hover:-translate-y-1 hover:border-primary/50"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-surface-container-low">
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">
              article
            </span>
          </div>
        )}
        {article.category?.name && (
          <span className="absolute left-3 top-3 rounded-full bg-primary/90 px-3 py-1 font-mono text-[10px] tracking-widest text-on-primary">
            {article.category.name.toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-headline text-lg font-bold leading-snug text-on-surface line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-sm text-on-surface-variant/70 line-clamp-2">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2 font-mono text-[11px] tracking-wide text-on-surface-variant/50">
          {article.author && <span>{article.author}</span>}
          {article.author && article.published_at && <span>·</span>}
          {article.published_at && <span>{formatDate(article.published_at)}</span>}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
