/** Normalizes Medusa graph money fields (number, string, or { value }). */
export function resolveMoneyAmount(value: unknown): number {
  if (value == null) return 0
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  if (typeof value === "object" && value !== null && "value" in value) {
    return resolveMoneyAmount((value as { value: unknown }).value)
  }
  return 0
}
