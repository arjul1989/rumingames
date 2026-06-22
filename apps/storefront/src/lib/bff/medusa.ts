import "server-only"

// Server-side fetch client for the Medusa backend, used by the BFF route
// handlers (US-5.1 / RUM-35). It runs only on the server so the publishable
// key and any forwarded customer JWT never reach the browser bundle.

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export interface MedusaFetchOptions {
  method?: string
  /** Query params; arrays are repeated, undefined/null are skipped. */
  query?: Record<string, unknown>
  body?: unknown
  /** Customer JWT to forward as `Authorization: Bearer` for /store auth routes. */
  token?: string
  /** Admin secret/cookie passthrough for admin proxying (rarely used by BFF). */
  headers?: Record<string, string>
  /** Next.js fetch caching hint. */
  cache?: RequestCache
  revalidate?: number
}

export interface MedusaResult<T> {
  ok: boolean
  status: number
  data: T | null
  error?: string
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const url = new URL(path.replace(/^\//, ""), BACKEND_URL.replace(/\/?$/, "/"))
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v))
      } else {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

export async function medusaFetch<T = unknown>(
  path: string,
  options: MedusaFetchOptions = {}
): Promise<MedusaResult<T>> {
  const headers: Record<string, string> = {
    "x-publishable-api-key": PUBLISHABLE_KEY,
    ...options.headers,
  }
  if (options.token) headers["authorization"] = `Bearer ${options.token}`
  if (options.body !== undefined) headers["content-type"] = "application/json"

  const init: RequestInit & { next?: { revalidate?: number } } = {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  }
  if (options.cache) init.cache = options.cache
  if (options.revalidate !== undefined) init.next = { revalidate: options.revalidate }

  try {
    const res = await fetch(buildUrl(path, options.query), init)
    const text = await res.text()
    const data = text ? safeJson(text) : null
    if (!res.ok) {
      const error =
        (data &&
          typeof data === "object" &&
          (data as { message?: string }).message) ||
        `Medusa request failed (${res.status})`
      return { ok: false, status: res.status, data: null, error }
    }
    return { ok: true, status: res.status, data: data as T }
  } catch (e) {
    return { ok: false, status: 502, data: null, error: (e as Error).message }
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
