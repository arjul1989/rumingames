import { Metadata } from "next"

import { listProducts } from "@lib/data/products"
import { listArticles, listStreamers } from "@lib/data/cms"
import HomeTemplate from "@modules/gorumin/templates/home"

export const metadata: Metadata = {
  title: "Gorumin — Gift cards y recargas de videojuegos en Colombia",
  description:
    "Compra gift cards y recargas de Steam, PlayStation, Riot, Xbox y más con entrega digital inmediata. Noticias y streamers de la comunidad gamer colombiana.",
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

  return (
    <HomeTemplate
      products={productsResult.response.products}
      articles={articlesResult.articles}
      streamers={streamers}
    />
  )
}
