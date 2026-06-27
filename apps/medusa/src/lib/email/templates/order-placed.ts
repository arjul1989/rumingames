import { formatMoney } from "../format-money"
import { emailLayout } from "./layout"

export type OrderPlacedEmailData = {
  first_name?: string
  display_id: string | number
  order_id: string
  email: string
  total: number
  currency_code: string
  items: Array<{ title: string; quantity: number; total: number }>
  order_url: string
  account_url: string
}

export function orderPlacedEmail(data: OrderPlacedEmailData) {
  const name = data.first_name?.trim() || "gamer"
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);color:#dae2fd;">${item.title}</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);text-align:center;color:#cfc2d6;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);text-align:right;color:#4cd7f6;">${formatMoney(item.total, data.currency_code)}</td>
        </tr>`
    )
    .join("")

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#dae2fd;">Hola <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;">Recibimos tu pedido <strong>#${data.display_id}</strong> y tu pago fue confirmado.</p>
    <p style="margin:0 0 20px;">Estamos generando tu código digital. En cuanto esté listo te enviaremos <strong>otro correo con el código</strong>. También podrás verlo en tu perfil si inicias sesión con el correo de esta compra (<strong>${data.email}</strong>).</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
      <tr>
        <th align="left" style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#988d9f;padding-bottom:8px;">Producto</th>
        <th align="center" style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#988d9f;padding-bottom:8px;">Cant.</th>
        <th align="right" style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#988d9f;padding-bottom:8px;">Total</th>
      </tr>
      ${itemsHtml}
    </table>
    <p style="margin:0 0 12px;text-align:right;font-size:16px;color:#dae2fd;">
      Total pagado: <strong style="color:#22c55e;">${formatMoney(data.total, data.currency_code)}</strong>
    </p>
    <p style="margin:16px 0 0;padding:12px 14px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);border-radius:8px;font-size:13px;color:#fde68a;">
      Verifica que la región de cada producto coincida con tu consola o dispositivo. Los códigos digitales no admiten devolución una vez generados.
    </p>`

  const html = emailLayout({
    preheader: `Tu pedido #${data.display_id} en rumin fue confirmado.`,
    title: "¡Compra confirmada!",
    bodyHtml,
    ctaLabel: "Ver mi pedido",
    ctaUrl: data.order_url,
  })

  const text =
    `Hola ${name},\n\n` +
    `Tu pedido #${data.display_id} fue confirmado.\n` +
    `Total: ${formatMoney(data.total, data.currency_code)}\n\n` +
    `Te enviaremos otro correo con tu código digital en cuanto esté listo.\n` +
    `Ver pedido: ${data.order_url}\n` +
    `Mi perfil: ${data.account_url}\n\n` +
    `Verifica que la región del producto coincida con tu dispositivo. No hay devoluciones en códigos generados.`

  return {
    subject: `rumin — pedido #${data.display_id} confirmado`,
    html,
    text,
  }
}
