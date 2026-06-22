import type { MetadataRoute } from "next"
import { ACTIVE_COUNTRIES, absoluteUrl } from "@lib/seo"
import { listArticles, listStreamers } from "@lib/data/cms"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"

// Dynamic sitemap.xml (Epic 8 / US-8.4 / RUM-56). Lists home, community and
// store pages plus every published article, streamer, product and category,
// for each active country. Regenerated hourly.
export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  for (const cc of ACTIVE_COUNTRIES) {
    const url = (path = "") => absoluteUrl(path ? `${cc}/${path}` : cc)

    entries.push(
      { url: url(), changeFrequency: "daily", priority: 1 },
      { url: url("noticias"), changeFrequency: "daily", priority: 0.8 },
      { url: url("streamers"), changeFrequency: "weekly", priority: 0.6 },
      { url: url("store"), changeFrequency: "daily", priority: 0.9 }
    )

    const [articles, streamers, categories, products] = await Promise.all([
      listArticles({ limit: 200 })
        .then((r) => r.articles)
        .catch(() => []),
      listStreamers({ limit: 200 })
        .then((r) => r.streamers)
        .catch(() => []),
      listCategories().catch(() => []),
      listProducts({ countryCode: cc, queryParams: { limit: 200 } })
        .then((r) => r.response.products)
        .catch(() => []),
    ])

    for (const a of articles) {
      entries.push({
        url: url(`noticias/${a.slug}`),
        lastModified: a.published_at ? new Date(a.published_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      } as Entry)
    }
    for (const s of streamers) {
      entries.push({
        url: url(`streamers/${s.slug}`),
        changeFrequency: "weekly",
        priority: 0.5,
      })
    }
    for (const c of categories) {
      if (!c.handle) continue
      entries.push({
        url: url(`categories/${c.handle}`),
        changeFrequency: "weekly",
        priority: 0.6,
      })
    }
    for (const p of products) {
      if (!p.handle) continue
      entries.push({
        url: url(`products/${p.handle}`),
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      } as Entry)
    }
  }

  return entries
}
