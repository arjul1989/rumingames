import { emailLayout } from "./layout"

export type AdminAlertEmailData = {
  title: string
  message: string
  details?: string
}

export function adminAlertEmail(data: AdminAlertEmailData) {
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#ffb4ab;font-weight:700;">${data.title}</p>
    <p style="margin:0 0 16px;">${data.message}</p>
    ${data.details ? `<pre style="margin:0;padding:12px;background:rgba(0,0,0,0.25);border-radius:8px;font-size:12px;color:#cfc2d6;white-space:pre-wrap;">${data.details}</pre>` : ""}`

  const html = emailLayout({
    title: data.title,
    bodyHtml,
    footerNote: "Alerta operativa rumin.",
  })

  return {
    subject: data.title,
    html,
    text: `${data.title}\n\n${data.message}${data.details ? `\n\n${data.details}` : ""}`,
  }
}
