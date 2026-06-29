import { emailLayout } from "./layout"

export type DigitalCodeDeliveredData = {
  product: string
  display_id: string | number
  code: string
  codes?: Array<{ product: string; code: string }>
  orders_url: string
  account_url: string
}

export function digitalCodeDeliveredEmail(data: DigitalCodeDeliveredData) {
  const entries =
    data.codes && data.codes.length > 0
      ? data.codes
      : [{ product: data.product, code: data.code }]

  const codesHtml = entries
    .map(
      (entry) => `
    <div style="margin:0 0 16px;padding:16px 18px;background:rgba(76,215,246,0.1);border:1px solid rgba(76,215,246,0.35);border-radius:10px;text-align:center;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#988d9f;">${entry.product}</p>
      <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:20px;font-weight:700;color:#4cd7f6;word-break:break-all;">${entry.code}</p>
    </div>`
    )
    .join("")

  const intro =
    entries.length === 1
      ? `Tu código de <strong>${entries[0].product}</strong> (pedido #${data.display_id}) ya está listo.`
      : `Tus <strong>${entries.length} códigos</strong> del pedido #${data.display_id} ya están listos.`

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#dae2fd;">¡Buenas noticias!</p>
    <p style="margin:0 0 16px;">${intro}</p>
    ${codesHtml}
    <p style="margin:0;font-size:13px;color:#988d9f;">Guárdalos en un lugar seguro. También quedan disponibles en tu perfil cuando inicies sesión.</p>`

  const html = emailLayout({
    preheader:
      entries.length === 1
        ? `Tu código de ${entries[0].product} ya está listo.`
        : `Tus códigos del pedido #${data.display_id} ya están listos.`,
    title: entries.length === 1 ? "Tu código está listo" : "Tus códigos están listos",
    bodyHtml,
    ctaLabel: "Ver en mis compras",
    ctaUrl: data.orders_url,
  })

  const text =
    (entries.length === 1
      ? `Tu código de "${entries[0].product}" (pedido #${data.display_id}):\n\n${entries[0].code}`
      : `Tus códigos del pedido #${data.display_id}:\n\n` +
        entries.map((e) => `${e.product}: ${e.code}`).join("\n\n")) +
    `\n\nVer pedido: ${data.orders_url}\n` +
    `Mi perfil: ${data.account_url}`

  const subject =
    entries.length === 1
      ? `Tu código de ${entries[0].product} está listo`
      : `Tus códigos del pedido #${data.display_id} están listos`

  return { subject, html, text }
}
