import { emailLayout } from "./layout"

export type DigitalCodeDeliveredData = {
  product: string
  display_id: string | number
  code: string
  orders_url: string
  account_url: string
}

export function digitalCodeDeliveredEmail(data: DigitalCodeDeliveredData) {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#dae2fd;">¡Buenas noticias!</p>
    <p style="margin:0 0 16px;">Tu código de <strong>${data.product}</strong> (pedido #${data.display_id}) ya está listo.</p>
    <div style="margin:0 0 20px;padding:16px 18px;background:rgba(76,215,246,0.1);border:1px solid rgba(76,215,246,0.35);border-radius:10px;text-align:center;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#988d9f;">Tu código</p>
      <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:20px;font-weight:700;color:#4cd7f6;word-break:break-all;">${data.code}</p>
    </div>
    <p style="margin:0;font-size:13px;color:#988d9f;">Guárdalo en un lugar seguro. También queda disponible en tu perfil cuando inicies sesión.</p>`

  const html = emailLayout({
    preheader: `Tu código de ${data.product} ya está listo.`,
    title: "Tu código está listo",
    bodyHtml,
    ctaLabel: "Ver en mis compras",
    ctaUrl: data.orders_url,
  })

  const text =
    `Tu código de "${data.product}" (pedido #${data.display_id}):\n\n` +
    `${data.code}\n\n` +
    `Ver pedido: ${data.orders_url}\n` +
    `Mi perfil: ${data.account_url}`

  return {
    subject: `Tu código de ${data.product} está listo`,
    html,
    text,
  }
}
