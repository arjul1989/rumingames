import { Metadata } from "next"

import { listProducts } from "@lib/data/products"
import { listArticles, listStreamers } from "@lib/data/cms"
import { absoluteUrl, localizedAlternates, SITE_NAME } from "@lib/seo"
import HomeTemplate from "@modules/gorumin/templates/home"
import JsonLd from "@modules/common/components/json-ld"

const TITLE = "Gorumin — Gift cards y recargas de videojuegos en Colombia"
const DESCRIPTION =
  "Compra gift cards y recargas de Steam, PlayStation, Riot, Xbox y más con entrega digital inmediata. Noticias y streamers de la comunidad gamer colombiana."

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: localizedAlternates(),
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: absoluteUrl("co"),
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const [productsResult, articlesResult, featuredStreamers] = await Promise.all(
    [
      listProducts({
        countryCode,
        queryParams: { limit: 8 },
      }).catch(() => ({ response: { products: [], count: 0 } })),
      listArticles({ limit: 6 }),
      listStreamers({ featured: true, limit: 12 }),
    ]
  )

  // Fall back to all streamers if none are flagged as featured yet.
  const streamers = featuredStreamers.streamers.length
    ? featuredStreamers.streamers
    : (await listStreamers({ limit: 12 })).streamers

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl(countryCode),
    logo: absoluteUrl("logo.png"),
    sameAs: [
      "https://www.twitch.tv/",
      "https://www.youtube.com/",
      "https://www.instagram.com/",
    ],
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl(countryCode),
    inLanguage: "es-CO",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl(`${countryCode}/store`)}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <>
      <JsonLd data={[organization, website]} id="ld-home" />
      <HomeTemplate
        products={productsResult.response.products}
        articles={articlesResult.articles}
        streamers={streamers}
      />
    </>
  )
}
