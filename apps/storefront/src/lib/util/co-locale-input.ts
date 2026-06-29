/** Strip non-digits (for phone / document storage). */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

/** Colombia mobile: 3 3 4 grouping, max 10 digits. */
export function formatCoPhone(value: string): string {
  const d = digitsOnly(value).slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

/** Cédula / NIT: thousands separated with dots. */
export function formatCoIdentification(value: string, type: string): string {
  if (type === "PAS") {
    return value.replace(/\s+/g, " ").trim()
  }
  const d = digitsOnly(value)
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}
