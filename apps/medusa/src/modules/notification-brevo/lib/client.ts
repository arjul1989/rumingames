export type BrevoSendEmailPayload = {
  sender: { name: string; email: string }
  to: Array<{ email: string; name?: string }>
  replyTo?: { email: string; name?: string }
  subject: string
  htmlContent?: string
  textContent?: string
  templateId?: number
  params?: Record<string, unknown>
}

export class BrevoClient {
  constructor(private readonly apiKey: string) {}

  async sendTransactionalEmail(payload: BrevoSendEmailPayload): Promise<{ messageId?: string }> {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Brevo API ${res.status}: ${body || res.statusText}`)
    }

    const json = (await res.json().catch(() => ({}))) as { messageId?: string }
    return { messageId: json.messageId }
  }
}
