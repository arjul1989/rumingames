import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { getStreamer } from "@lib/data/cms"
import { absoluteUrl, localizedAlternates } from "@lib/seo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArticleCard from "@modules/gorumin/components/article-card"
import JsonLd from "@modules/common/components/json-ld"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const streamer = await getStreamer(slug)

  if (!streamer) return { title: "Streamer no encontrado" }

  const description = streamer.bio ?? `Perfil de ${streamer.name} en Gorumin`
  return {
    title: streamer.name,
    description,
    alternates: localizedAlternates(`streamers/${slug}`),
    openGraph: {
      title: streamer.name,
      description,
      type: "profile",
      url: absoluteUrl(`co/streamers/${slug}`),
      images: streamer.avatar ? [streamer.avatar] : [],
    },
  }
}

export default async function StreamerPage(props: Props) {
  const { countryCode, slug } = await props.params
  const streamer = await getStreamer(slug)

  if (!streamer) notFound()

  const streamerUrl = absoluteUrl(`${countryCode}/streamers/${slug}`)
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: streamer.name,
    description: streamer.bio ?? undefined,
    image: streamer.avatar ?? undefined,
    url: streamerUrl,
    sameAs: [streamer.twitch_url, streamer.youtube_url].filter(
      Boolean
    ) as string[],
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Streamers",
        item: absoluteUrl(`${countryCode}/streamers`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: streamer.name,
        item: streamerUrl,
      },
    ],
  }

  return (
    <div className="content-container py-12">
      <JsonLd data={[personLd, breadcrumbLd]} id="ld-streamer" />
      <nav className="mb-8 flex flex-wrap items-center gap-2 font-mono text-label-caps tracking-widest text-on-surface-variant/60">
        <LocalizedClientLink href="/streamers" className="hover:text-secondary">
          STREAMERS
        </LocalizedClientLink>
        <span>/</span>
        <span className="text-on-surface-variant">
          {streamer.name.toUpperCase()}
        </span>
      </nav>

      <header className="hyper-glass relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl p-8 text-center md:flex-row md:text-left">
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/10">
          {streamer.avatar ? (
            <Image
              src={streamer.avatar}
              alt={streamer.name}
              fill
              sizes="128px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-container">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">
                person
              </span>
            </div>
          )}
        </div>

        <div className="relative flex-1 space-y-3">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <h1 className="font-display text-3xl font-extrabold text-on-surface md:text-4xl">
              {streamer.name}
            </h1>
            {streamer.is_featured && (
              <span className="rounded-full bg-primary/90 px-2 py-0.5 font-mono text-[9px] tracking-widest text-on-primary">
                DESTACADO
              </span>
            )}
          </div>
          {streamer.bio && (
            <p className="text-on-surface-variant/80">{streamer.bio}</p>
          )}
          <div className="flex items-center justify-center gap-3 md:justify-start">
            {streamer.twitch_url && (
              <a
                href={streamer.twitch_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono inline-flex items-center gap-1 rounded-lg border border-white/10 bg-surface-container/50 px-4 py-2 text-label-caps tracking-widest text-on-surface transition-colors hover:border-secondary hover:text-secondary"
              >
                TWITCH
              </a>
            )}
            {streamer.youtube_url && (
              <a
                href={streamer.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono inline-flex items-center gap-1 rounded-lg border border-white/10 bg-surface-container/50 px-4 py-2 text-label-caps tracking-widest text-on-surface transition-colors hover:border-secondary hover:text-secondary"
              >
                YOUTUBE
              </a>
            )}
          </div>
        </div>
      </header>

      {streamer.articles?.length > 0 && (
        <section className="mt-12 space-y-6">
          <h2 className="font-mono text-label-caps tracking-widest text-on-surface-variant/60">
            ARTÍCULOS RELACIONADOS
          </h2>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
            {streamer.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
