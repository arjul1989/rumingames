import type { FazerSkuKind } from "../modules/fazer/lib/sku"

export const PLATFORM_LABELS: Record<string, string> = {
  steam: "Steam",
  playstation: "PlayStation",
  nintendo: "Nintendo",
  xbox: "Xbox",
  riot: "Riot Games",
  free_fire: "Free Fire",
  other: "Otros",
}

const PLATFORM_RULES: Array<{ platform: string; pattern: RegExp }> = [
  { platform: "steam", pattern: /steam/ },
  { platform: "playstation", pattern: /playstation|psn/ },
  { platform: "nintendo", pattern: /nintendo/ },
  { platform: "xbox", pattern: /xbox/ },
  { platform: "riot", pattern: /valorant|riot|league_of_legends|wild_rift/ },
  { platform: "free_fire", pattern: /free_fire|garena_free_fire/ },
]

/** Regions we sync for the Colombia storefront. */
export const SYNC_REGIONS = new Set([
  "CO",
  "LATAM",
  "US",
  "GLOBAL",
  "BR",
  "MX",
  "EU",
])

export function parseRegion(note?: string | null, categoryId?: string): string | null {
  const fromNote = note?.match(/Region:\s*([A-Za-z0-9/_-]+)/i)?.[1]
  if (fromNote) return fromNote.toUpperCase().replace(/\r/g, "")

  const id = categoryId ?? ""
  const suffix = id.split("_").pop()?.toUpperCase()
  if (suffix && suffix.length <= 6) return suffix
  return null
}

export function parsePlatform(categoryId: string, name?: string): string {
  const haystack = `${categoryId} ${name ?? ""}`.toLowerCase()
  for (const rule of PLATFORM_RULES) {
    if (rule.pattern.test(haystack)) return rule.platform
  }
  return "other"
}

export function shouldSyncCategory(categoryId: string, name: string, region: string | null): boolean {
  const platform = parsePlatform(categoryId, name)
  if (platform === "other") return false
  if (!region) return true
  return SYNC_REGIONS.has(region.toUpperCase())
}

export function parseFaceValue(label: string): {
  amount: number | null
  currency: string | null
} {
  const normalized = label.trim()
  const cop = normalized.match(/^([\d.,]+)\s*COP$/i)
  if (cop) {
    return { amount: Number(cop[1].replace(/,/g, "")), currency: "COP" }
  }
  const usd = normalized.match(/^([\d.,]+)\s*USD$/i)
  if (usd) {
    return { amount: Number(usd[1].replace(/,/g, "")), currency: "USD" }
  }
  const vp = normalized.match(/^([\d.,]+)\s*VP$/i)
  if (vp) {
    return { amount: Number(vp[1].replace(/,/g, "")), currency: "VP" }
  }
  const diamonds = normalized.match(/^([\d.,]+)\s*Diamonds?$/i)
  if (diamonds) {
    return { amount: Number(diamonds[1].replace(/,/g, "")), currency: "DIAMONDS" }
  }
  const rp = normalized.match(/^([\d.,]+)\s*RP$/i)
  if (rp) {
    return { amount: Number(rp[1].replace(/,/g, "")), currency: "RP" }
  }
  return { amount: null, currency: null }
}

export function salePriceUsd(wholesaleUsd: number, marginPct: number): number {
  return wholesaleUsd * (1 + marginPct / 100)
}

export function groupKey(platform: string | null, region: string | null): string {
  return `${platform ?? "other"}::${region ?? "—"}`
}

export function kindLabel(kind: FazerSkuKind): string {
  return kind === "giftcard" ? "Gift card" : "Top-up"
}
