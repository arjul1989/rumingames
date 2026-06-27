export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      maximumFractionDigits: currencyCode.toLowerCase() === "cop" ? 0 : 2,
    }).format(amount)
  } catch {
    return `${amount} ${currencyCode.toUpperCase()}`
  }
}
