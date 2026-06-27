import { emailLogoHtml } from "../logo"

export type EmailLayoutVariant = "minimal" | "card" | "stripe"

export type EmailLayoutParams = {
  preheader?: string
  title: string
  bodyHtml: string
  ctaLabel?: string
  ctaUrl?: string
  footerNote?: string
  variant?: EmailLayoutVariant
}

const LIGHT = {
  bg: "#ffffff",
  outer: "#f3f4f8",
  card: "#ffffff",
  border: "#e5e7ef",
  text: "#1c1c28",
  muted: "#5f6478",
  purple: "#7c3aed",
  cyan: "#0891b2",
  cta: "#7c3aed",
  ctaText: "#ffffff",
}

function ctaBlock(label: string, url: string): string {
  return `<tr>
    <td style="padding:8px 32px 28px;text-align:center;">
      <a href="${url}" style="display:inline-block;background:${LIGHT.cta};color:${LIGHT.ctaText};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.04em;text-decoration:none;padding:14px 32px;border-radius:8px;">
        ${label}
      </a>
    </td>
  </tr>`
}

function footerBlock(footerNote: string | undefined, year: number): string {
  return `<tr>
    <td style="padding:20px 32px 28px;border-top:1px solid ${LIGHT.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${LIGHT.muted};text-align:center;">
      ${footerNote ?? "Tarjetas de regalo y recargas digitales para gamers en Colombia."}<br />
      © ${year} rumin · <a href="https://gorumin.com" style="color:${LIGHT.purple};text-decoration:none;">gorumin.com</a>
    </td>
  </tr>`
}

function headerMinimal(title: string): string {
  return `<tr>
    <td style="padding:32px 32px 8px;text-align:center;">
      ${emailLogoHtml(168)}
      <h1 style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:${LIGHT.text};">${title}</h1>
    </td>
  </tr>`
}

function headerCard(title: string): string {
  return `<tr>
    <td style="padding:28px 32px 16px;text-align:center;background:${LIGHT.card};border-bottom:1px solid ${LIGHT.border};">
      ${emailLogoHtml(152)}
      <h1 style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:21px;line-height:1.3;font-weight:700;color:${LIGHT.text};">${title}</h1>
    </td>
  </tr>`
}

function headerStripe(title: string): string {
  return `<tr>
    <td style="padding:0;background:linear-gradient(90deg,${LIGHT.purple} 0%,${LIGHT.cyan} 100%);height:4px;line-height:4px;font-size:0;">&nbsp;</td>
  </tr>
  <tr>
    <td style="padding:28px 32px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="width:120px;vertical-align:middle;">${emailLogoHtml(120, "left")}</td>
          <td style="vertical-align:middle;padding-left:12px;">
            <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.3;font-weight:700;color:${LIGHT.text};">${title}</h1>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

export function emailLayoutLight(params: EmailLayoutParams): string {
  const {
    preheader,
    title,
    bodyHtml,
    ctaLabel,
    ctaUrl,
    footerNote,
    variant = "stripe",
  } = params
  const year = new Date().getFullYear()

  const header =
    variant === "minimal"
      ? headerMinimal(title)
      : variant === "stripe"
        ? headerStripe(title)
        : headerCard(title)

  const outerBg = variant === "minimal" ? LIGHT.bg : LIGHT.outer
  const cardStyle =
    variant === "card"
      ? `max-width:560px;background:${LIGHT.card};border:1px solid ${LIGHT.border};border-radius:12px;box-shadow:0 4px 24px rgba(28,28,40,0.08);overflow:hidden;`
      : variant === "stripe"
        ? `max-width:560px;background:${LIGHT.card};border:1px solid ${LIGHT.border};border-radius:12px;overflow:hidden;`
        : `max-width:560px;background:${LIGHT.bg};overflow:hidden;`

  const bodyCellStyle =
    variant === "minimal"
      ? `padding:8px 32px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${LIGHT.muted};`
      : `padding:20px 32px 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${LIGHT.muted};`

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${outerBg};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${outerBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="${cardStyle}">
          ${header}
          <tr>
            <td style="${bodyCellStyle}">
              ${bodyHtml}
            </td>
          </tr>
          ${ctaLabel && ctaUrl ? ctaBlock(ctaLabel, ctaUrl) : ""}
          ${footerBlock(footerNote, year)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
