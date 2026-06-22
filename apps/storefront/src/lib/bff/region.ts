import "server-only"
import { medusaFetch } from "./medusa"

// Resolves a Medusa region id from a country ISO2 code (e.g. "co"), required
// so /store/products returns prices in the right currency. Cached in-process
// for an hour to avoid hitting /store/regions on every request.

interface StoreRegion {
  id: string
  currency_code: string
  countries?: { iso_2: string }[]
}

let cache: { map: Map<string, string>; at: number } | null = null
const TTL = 60 * 60 * 1000

async function getRegionMap(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.at < TTL) return cache.map
  const res = await medusaFetch<{ regions: StoreRegion[] }>("/store/regions", {
    query: { limit: 100 },
    revalidate: 3600,
  })
  const map = new Map<string, string>()
  for (const region of res.data?.regions ?? []) {
    for (const country of region.countries ?? []) {
      if (country.iso_2) map.set(country.iso_2.toLowerCase(), region.id)
    }
  }
  cache = { map, at: Date.now() }
  return map
}

export async function resolveRegionId(countryCode?: string): Promise<string | undefined> {
  const code = (countryCode || process.env.NEXT_PUBLIC_DEFAULT_REGION || "co").toLowerCase()
  const map = await getRegionMap()
  return map.get(code) ?? map.values().next().value
}
