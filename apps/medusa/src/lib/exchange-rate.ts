import { getUsdCopRate } from "./pricing"

// Resolves the current USD->COP exchange rate (US-5.5 / RUM-39).
// If EXCHANGE_RATE_API_URL is configured we fetch a live rate; otherwise we
// fall back to the static EXCHANGE_RATE_USD_COP env value. The fetch is
// defensive: any failure falls back to the env rate so pricing never breaks.
//
// The endpoint is expected to return JSON containing the COP rate. We probe a
// few common shapes (e.g. exchangerate.host / open.er-api.com style payloads).
export async function getLiveUsdCopRate(
  fetchImpl: typeof fetch = fetch
): Promise<{ rate: number; source: "live" | "env" }> {
  const url = process.env.EXCHANGE_RATE_API_URL
  if (!url) {
    return { rate: getUsdCopRate(), source: "env" }
  }
  try {
    const res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as Record<string, any>
    const rate = extractCopRate(data)
    if (rate && Number.isFinite(rate) && rate > 0) {
      return { rate, source: "live" }
    }
    throw new Error("COP rate not found in response")
  } catch {
    return { rate: getUsdCopRate(), source: "env" }
  }
}

function extractCopRate(data: Record<string, any>): number | undefined {
  // exchangerate.host / open.er-api.com: { rates: { COP: 4000 } }
  if (data?.rates?.COP != null) return Number(data.rates.COP)
  // some APIs: { conversion_rates: { COP: 4000 } }
  if (data?.conversion_rates?.COP != null) return Number(data.conversion_rates.COP)
  // flat shapes
  if (data?.COP != null) return Number(data.COP)
  if (data?.rate != null) return Number(data.rate)
  return undefined
}
