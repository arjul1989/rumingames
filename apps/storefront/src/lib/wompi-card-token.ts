import type { WompiCardToken, WompiCardTokenInput } from "./wompi-types"

export async function tokenizeWompiCard(
  apiBaseUrl: string,
  publicKey: string,
  input: WompiCardTokenInput
): Promise<WompiCardToken> {
  const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/tokens/cards`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publicKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const message =
      (json as { error?: { reason?: string } })?.error?.reason ??
      "No se pudo tokenizar la tarjeta."
    throw new Error(message)
  }

  return (json as { data: WompiCardToken }).data
}
