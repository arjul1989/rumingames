export type EmailLayoutParams = {
  preheader?: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
}

const BRAND = {
  bg: "#0b1326",
  card: "#171f33",
  border: "rgba(255,255,255,0.12)",
  text: "#dae2fd",
  muted: "#cfc2d6",
  primary: "#ddb7ff",
  secondary: "#4cd7f6",
  accent: "#22c55e",
}

export function emailLayout(params: EmailLayoutParams): string {
  const { preheader, title, bodyHtml, ctaLabel, ctaUrl, footerNote } = params
  const year = new Date().getFullYear()

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<tr>
          <td style="padding:28px 32px 8px;text-align:center;">
            <a href="${ctaUrl}" style="display:inline-block;background:${BRAND.accent};color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:4px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>`
      : ""

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;border-bottom:1px solid ${BRAND.border};">
              <div style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;color:${BRAND.secondary};text-transform:uppercase;">RUMIN</div>
              <h1 style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:24px;line-height:1.25;color:${BRAND.text};">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.muted};">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:24px 32px 28px;border-top:1px solid ${BRAND.border};font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};text-align:center;">
              ${footerNote ?? "Tarjetas de regalo y recargas digitales para gamers en Colombia."}<br />
              © ${year} rumin · <a href="https://gorumin.com" style="color:${BRAND.primary};text-decoration:none;">gorumin.com</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
