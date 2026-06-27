import { accountLabels } from "@lib/i18n/es-co"

function clean(value?: string | null): string {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return ""
  }
  return trimmed
}

export function displayCustomerName(
  firstName?: string | null,
  lastName?: string | null,
  emptyLabel = accountLabels.completeName
): string {
  const fullName = [clean(firstName), clean(lastName)].filter(Boolean).join(" ")
  return fullName || emptyLabel
}

export function displayCustomerField(
  value?: string | null,
  emptyLabel = accountLabels.completeField
): string {
  return clean(value) || emptyLabel
}

export function displayCustomerGreeting(firstName?: string | null): string {
  const name = clean(firstName)
  return name ? accountLabels.hello(name) : accountLabels.helloGuest
}
