/**
 * CMS media paths are stored as site-relative URLs (/articles/…) so they work
 * on any environment. Legacy rows may still have http://localhost:8000/… from
 * older seeds — rewrite those to relative paths at render time.
 */
export function resolveCmsMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith("/")) return url

  try {
    const parsed = new URL(url)
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return parsed.pathname + parsed.search
    }
  } catch {
    return url
  }

  return url
}
