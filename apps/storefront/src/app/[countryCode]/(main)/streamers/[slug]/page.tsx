import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getStreamer } from "@lib/data/cms"
import { absoluteUrl, localizedAlternates, SITE_NAME } from "@lib/seo"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ArticleCard from "@modules/gorumin/components/article-card"
import JsonLd from "@modules/common/components/json-ld"
import StreamerProfile from "@modules/gorumin/components/streamer-profile"

type Props = {
  params: Promise<{ countryCode: string; slug: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params
  const streamer = await getStreamer(slug)

  if (!streamer) return { title: "Streamer no encontrado" }

  const description = streamer.bio ?? `Perfil de ${streamer.name} en ${SITE_NAME}`
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

      <StreamerProfile streamer={streamer} />

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
