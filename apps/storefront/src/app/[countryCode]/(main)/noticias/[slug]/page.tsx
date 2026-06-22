import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { getArticle } from "@lib/data/cms"
import { absoluteUrl, localizedAlternates, SITE_NAME } from "@lib/seo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShareButtons from "@modules/gorumin/components/share-buttons"
import RelatedProductCard from "@modules/gorumin/components/related-product-card"
import JsonLd from "@modules/common/components/json-ld"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

function formatDate(value: string | null): string {
  if (!value) return ""
  try {
    return new Date(value).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const article = await getArticle(slug)

  if (!article) return { title: "Noticia no encontrada" }

  const title = article.seo_title ?? article.title
  const description =
    article.seo_description ?? article.excerpt ?? `${article.title} — Gorumin`
  const ogImage = article.og_image ?? article.cover_image
  return {
    title,
    description,
    alternates: localizedAlternates(`noticias/${slug}`),
    openGraph: {
      title,
      description,
      type: "article",
      url: absoluteUrl(`co/noticias/${slug}`),
      publishedTime: article.published_at ?? undefined,
      authors: article.author ? [article.author] : undefined,
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export default async function ArticlePage(props: Props) {
  const { countryCode, slug } = await props.params
  const article = await getArticle(slug)

  if (!article) notFound()

  const articleUrl = absoluteUrl(`${countryCode}/noticias/${slug}`)
  const newsLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seo_description ?? article.excerpt ?? undefined,
    image: article.og_image ?? article.cover_image ?? undefined,
    datePublished: article.published_at ?? undefined,
    author: article.author
      ? { "@type": "Person", name: article.author }
      : { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("logo.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
    inLanguage: "es-CO",
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Noticias",
        item: absoluteUrl(`${countryCode}/noticias`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.title,
        item: articleUrl,
      },
    ],
  }

  return (
    <article className="content-container py-12">
      <JsonLd data={[newsLd, breadcrumbLd]} id="ld-article" />
      <nav className="mb-8 flex flex-wrap items-center gap-2 font-mono text-label-caps tracking-widest text-on-surface-variant/60">
        <LocalizedClientLink href="/noticias" className="hover:text-secondary">
          NOTICIAS
        </LocalizedClientLink>
        {article.category?.name && (
          <>
            <span>/</span>
            <span className="text-on-surface-variant">
              {article.category.name.toUpperCase()}
            </span>
          </>
        )}
      </nav>

      <header className="mx-auto max-w-3xl space-y-6">
        {article.category?.name && (
          <span className="inline-block rounded-full bg-primary/90 px-3 py-1 font-mono text-[10px] tracking-widest text-on-primary">
            {article.category.name.toUpperCase()}
          </span>
        )}
        <h1 className="font-display text-4xl font-extrabold leading-tight text-on-surface md:text-5xl">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 font-mono text-sm text-on-surface-variant/60">
            {article.author && <span>{article.author}</span>}
            {article.author && article.published_at && <span>·</span>}
            {article.published_at && <span>{formatDate(article.published_at)}</span>}
          </div>
          <ShareButtons title={article.title} />
        </div>
      </header>

      {article.cover_image && (
        <div className="mx-auto my-10 max-w-4xl">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl">
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-10">
        {article.excerpt && (
          <p className="text-body-lg text-on-surface-variant">
            {article.excerpt}
          </p>
        )}

        <div className="whitespace-pre-line text-body-md leading-relaxed text-on-surface-variant/90">
          {article.body}
        </div>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-6">
            {article.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-white/10 bg-surface-container/50 px-3 py-1 font-mono text-[10px] tracking-widest text-on-surface-variant"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {article.streamer && (
          <LocalizedClientLink
            href={`/streamers/${article.streamer.slug}`}
            className="hyper-glass flex items-center gap-4 rounded-xl p-5 transition-colors hover:border-primary/50"
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-white/10">
              {article.streamer.avatar ? (
                <Image
                  src={article.streamer.avatar}
                  alt={article.streamer.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-container">
                  <span className="material-symbols-outlined text-on-surface-variant/50">
                    person
                  </span>
                </div>
              )}
            </div>
            <div>
              <span className="font-mono text-[10px] tracking-widest text-secondary">
                STREAMER
              </span>
              <p className="font-headline text-lg font-bold text-on-surface">
                {article.streamer.name}
              </p>
            </div>
          </LocalizedClientLink>
        )}

        {article.related_products?.length > 0 && (
          <section className="space-y-4 border-t border-white/10 pt-8">
            <h2 className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
              PRODUCTOS RELACIONADOS
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {article.related_products.map((product) => (
                <RelatedProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
