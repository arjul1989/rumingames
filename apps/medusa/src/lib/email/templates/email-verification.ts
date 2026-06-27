import {
  emailLayoutLight,
  type EmailLayoutVariant,
} from "./layout-light"

export type EmailVerificationData = {
  first_name?: string
  link: string
  layoutVariant?: EmailLayoutVariant
}

const VARIANT_LABELS: Record<EmailLayoutVariant, string> = {
  minimal: "Minimal",
  card: "Tarjeta",
  stripe: "Franja",
}

function resolveVariant(data: EmailVerificationData): EmailLayoutVariant {
  if (data.layoutVariant) return data.layoutVariant
  const env = process.env.EMAIL_VERIFICATION_LAYOUT as EmailLayoutVariant | undefined
  if (env === "minimal" || env === "card" || env === "stripe") return env
  return "stripe"
}

export function emailVerificationEmail(data: EmailVerificationData) {
  const name = data.first_name?.trim() || "gamer"
  const variant = resolveVariant(data)
  const variantLabel = VARIANT_LABELS[variant]

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#1c1c28;">Hola <strong>${name}</strong>,</p>
    <p style="margin:0 0 16px;">Gracias por registrarte en rumin. Confirma tu correo para activar tu cuenta y acceder a tus compras y códigos digitales.</p>
    <p style="margin:0;font-size:13px;color:#8b8fa3;">Si no creaste esta cuenta, puedes ignorar este mensaje.</p>`

  const html = emailLayoutLight({
    preheader: "Confirma tu correo para activar tu cuenta en rumin.",
    title: "Confirma tu correo",
    bodyHtml,
    ctaLabel: "Confirmar correo",
    ctaUrl: data.link,
    variant,
  })

  const text =
    `Hola ${name},\n\n` +
    `Confirma tu correo en rumin:\n${data.link}\n\n` +
    `Si no creaste esta cuenta, ignora este mensaje.`

  const subject =
    data.layoutVariant != null
      ? `Confirma tu correo en rumin [${variantLabel}]`
      : "Confirma tu correo en rumin"

  return { subject, html, text }
}
